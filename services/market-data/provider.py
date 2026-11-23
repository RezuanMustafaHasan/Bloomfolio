"""Public DSE Intelligence adapter, with bounded requests and persistent source caching."""
import csv
import hashlib
import io
import json
import math
import os
import re
import threading
import time
from datetime import datetime, timezone
from urllib.parse import quote
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE = 'https://www.stockchartbd.com'
SOURCE = 'DSE Intelligence'
CACHE_DIR = Path(os.getenv('MARKET_CACHE_DIR', Path(__file__).parent / '.cache'))
_lock = threading.RLock()


def number(value):
    if value is None:
        return None
    match = re.search(r'-?\d+(?:\.\d+)?', str(value).replace(',', ''))
    value = float(match[0]) if match else None
    return value if value is not None and math.isfinite(value) else None


def cached_get(path, ttl=3600):
    """One fetch per cache key; retain successful source payloads across restarts."""
    url = BASE + path
    key = hashlib.sha256(url.encode()).hexdigest()
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    file = CACHE_DIR / (key + '.json')
    with _lock:
        saved = json.loads(file.read_text()) if file.exists() else None
        if saved and time.time() - saved['fetched'] < ttl:
            return saved['text'], False
        try:
            # The publisher allows 120 requests/hour. Reserve headroom for other clients.
            budget_file = CACHE_DIR / 'requests.json'
            budget = json.loads(budget_file.read_text()) if budget_file.exists() else []
            budget = [t for t in budget if time.time() - t < 3600]
            if len(budget) >= 100:
                raise requests.RequestException('Provider request budget reached; using saved data')
            budget.append(time.time())
            budget_file.write_text(json.dumps(budget))
            response = requests.get(url, timeout=20, headers={'User-Agent': 'Bloomfolio/1.1 (educational market research)'})
            response.raise_for_status()
            if not response.text.strip():
                raise requests.RequestException('Empty provider response')
            # Never persist an API error as a successful response.
            if path.startswith('/api/v1') and not response.json().get('ok'):
                raise requests.RequestException('Provider could not fulfill this query')
            temp = file.with_suffix('.tmp')
            temp.write_text(json.dumps({'text': response.text, 'fetched': time.time()}))
            temp.replace(file)
            return response.text, False
        except (requests.RequestException, ValueError):
            if saved:
                return saved['text'], True
            raise


def metadata(as_of=None, stale=False):
    return {'name': SOURCE, 'url': BASE + '/developers.php', 'upstream': 'dsebd.org',
            'asOf': as_of, 'stale': stale, 'retrievedAt': datetime.now(timezone.utc).isoformat()}


def get_json(path, ttl=3600):
    text, stale = cached_get('/api/v1.php?' + path, ttl)
    return json.loads(text), stale


def normalize_history(items):
    rows = {}
    for item in items:
        date = datetime.strptime(item['date'], '%Y-%m-%d').date().isoformat()
        row = {'date': date, **{k: number(item.get(k)) for k in ['open', 'high', 'low', 'close', 'volume']}}
        if any(row[k] is None for k in ['open', 'high', 'low', 'close', 'volume']):
            continue
        if row['high'] < max(row['open'], row['close'], row['low']) or row['low'] > min(row['open'], row['close']):
            continue
        row['volume'] = int(row['volume'])
        rows[date] = row
    return [rows[k] for k in sorted(rows)]


def history_rows(symbol):
    payload, stale = get_json(f'endpoint=history&symbol={quote(symbol, safe="")}&limit=1000')
    rows = normalize_history(payload.get('history', []))
    return rows, metadata(rows[-1]['date'] if rows else None, stale)


def parse_quotes(html):
    soup = BeautifulSoup(html, 'html.parser')
    rows = []
    for tr in soup.select('tr[data-symbol]'):
        cells = tr.select('td')
        fields = {td['data-field']: number(td.get('data-sort')) for td in tr.select('td[data-field]')}
        if len(cells) < 4 or fields.get('close') is None:
            continue
        date = cells[-1].get('data-sort', '')
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
            continue
        rows.append({'tradingCode': tr['data-symbol'], 'companyName': cells[1].get_text(strip=True),
                     'sector': cells[2].get_text(strip=True), 'fields': fields, 'date': date})
    if not rows:
        raise ValueError('Provider price table is missing or empty')
    return rows


def snapshots():
    html, stale = cached_get('/live.php', 300)
    companies, cs = get_json('endpoint=companies', 86400)
    text, fs = cached_get('/api/export.php?type=fundamentals', 3600)
    facts = {r['symbol']: r for r in csv.DictReader(io.StringIO(text.lstrip('\ufeff')))}
    catalogue = {r['symbol']: r for r in companies['companies']}
    stocks = []
    for row in parse_quotes(html):
        code = row['tradingCode']; q = row['fields']; company = catalogue.get(code, {}); f = facts.get(code, {})
        stocks.append({'tradingCode': code, 'companyName': row['companyName'], 'sector': row['sector'],
            'scripCode': code,
            'marketInformation': {'asOfDate': row['date'], 'lastTradingPrice': q['close'], 'closingPrice': q['close'],
                'change': q.get('change'), 'changePercentage': q.get('pct'), 'openingPrice': q.get('open'),
                'yesterdaysClosingPrice': q.get('ycp'), 'daysRange': {'low': q.get('low'), 'high': q.get('high')},
                'daysValue': q.get('value', 0) * 1e6, 'daysVolume': q.get('volume'), 'daysTradeCount': q.get('trades'),
                'marketCapitalization': (company.get('market_cap_mn') or 0) * 1e6},
            'basicInformation': {'marketCategory': company.get('category'), 'typeOfInstrument': 'Mutual Fund' if 'Fund' in row['sector'] else 'Equity'},
            'fundamentals': {k: number(f.get(k)) for k in ['eps','nav_per_share','pe','roe_pct','dividend_pct','dividend_yield_pct','reported_year']},
            'dataSource': metadata(row['date'], stale or cs or fs)})
    return stocks


def parse_company(html):
    soup = BeautifulSoup(html, 'html.parser')
    section = soup.select_one('#sec-company')
    if section is None:
        raise ValueError('Company facts section is missing')
    facts = {}; holdings = []
    for table in section.select('table'):
        if 'Sponsor / director' in table.get_text():
            for tr in table.select('tr')[1:]:
                cells = tr.select('td')
                if len(cells) != 6:
                    continue
                day = cells[0].get_text(strip=True).split(' (')[0]
                try:
                    date = datetime.strptime(day, '%b %d, %Y').date().isoformat()
                except ValueError:
                    continue
                holdings.append({'asOn': date, **{k: number(c.get_text(' ', strip=True)) for k,c in zip(['sponsorDirector','government','institute','foreign','public'],cells[1:])}})
        else:
            for tr in table.select('tr'):
                cells = tr.select('td')
                if len(cells) == 2:
                    facts[cells[0].get_text(' ', strip=True)] = cells[1].get_text(' ', strip=True)
    return facts, sorted(holdings, key=lambda r:r['asOn'])


def stock_details(symbol):
    stock = next((s for s in snapshots() if s['tradingCode'] == symbol), None)
    if stock is None:
        return None
    payload, stale = get_json(f'endpoint=financials&symbol={quote(symbol, safe="")}', 21600)
    html, hs = cached_get(f'/analysis.php?symbol={quote(symbol, safe="")}', 86400)
    facts, holdings = parse_company(html)
    rows, history_source = history_rows(symbol)
    last_year = [r for r in rows if r['date'] >= str(datetime.now().year-1) + datetime.now().strftime('-%m-%d')]
    stock['marketInformation']['fiftyTwoWeeksMovingRange'] = {'low': min((r['low'] for r in last_year), default=None), 'high': max((r['high'] for r in last_year), default=None)}
    stock['basicInformation'].update({'faceValue': number(facts.get('Face value')), 'listingYear': number(facts.get('Listed since')),
        'paidUpCapital': (number(facts.get('Paid-up capital')) or 0)*1e6,
        'totalOutstandingSecurities': number(facts.get('Shares outstanding'))})
    stock['financialHighlights'] = {'yearEnd': facts.get('Financial year end'), 'loanStatus': {
        'shortTermLoan': (number(facts.get('Short-term loans')) or 0)*1e6, 'longTermLoan': (number(facts.get('Long-term loans')) or 0)*1e6}}
    stock['shareholding'] = holdings
    yearly = payload.get('yearly', [])
    interim = [r for r in payload.get('interim', []) if r.get('eps') is not None and r.get('ends_on')]
    stock['financialPerformance'] = {'interimEPS':[{'year':int(r['ends_on'][:4]),'period':r['period'],'basic':r['eps']} for r in interim], 'yearly': yearly}
    agm = facts.get('Last AGM held')
    try:
        agm = datetime.strptime(agm, '%d-%m-%Y').date().isoformat()
    except (ValueError, TypeError):
        agm = None
    stock['corporateActions'] = {'lastAGMDate': agm, 'cashDividends':[{'year':r['year'],'percentage':r['dividend_percent']} for r in yearly if r.get('dividend_percent') is not None], 'bonusIssues': [], 'rightIssues': []}
    stock['dataSource']['stale'] |= stale or hs or history_source['stale']
    return stock
