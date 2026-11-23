"""Bloomfolio market snapshots, company research and daily OHLCV history."""
import os
from datetime import datetime
from zoneinfo import ZoneInfo
from dateutil.relativedelta import relativedelta
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from provider import history_rows, snapshots, stock_details, get_json

app = FastAPI(title='Bloomfolio Market Data API', version='1.1.0')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('FRONTEND_ORIGINS','http://localhost:5173,http://localhost:5174').split(','),allow_methods=['GET'],allow_headers=['*'])
SYMBOL = r'^[A-Za-z0-9&_-]{1,30}$'

def upstream(call):
    try:
        return call()
    except requests.Timeout as exc:
        raise HTTPException(504, 'Market-data provider timed out. Retry shortly.') from exc
    except (requests.RequestException, ValueError, KeyError) as exc:
        raise HTTPException(502, 'Market-data provider is unavailable and no saved response exists.') from exc

@app.get('/api/health')
def health():
    return {'status':'OK','service':'market-data'}

@app.get('/api/stocks')
def stocks():
    data = upstream(snapshots)
    return {'success':True,'count':len(data),'data':data}

@app.get('/api/stocks/{symbol}')
def stock(symbol: str):
    import re
    if not re.fullmatch(SYMBOL,symbol):
        raise HTTPException(422,'Invalid symbol')
    data = upstream(lambda:stock_details(symbol.upper()))
    if data is None:
        raise HTTPException(404,'Stock not found')
    return {'success':True,'data':data}

@app.get('/api/market')
def market():
    return upstream(lambda:get_json('endpoint=market',300)[0])

@app.get('/api/history')
def history(symbol: str = Query(...,pattern=SYMBOL),months: int = Query(24,ge=1,le=120)):
    end = datetime.now(ZoneInfo('Asia/Dhaka')).date()
    start = end-relativedelta(months=months)
    rows,source = upstream(lambda:history_rows(symbol.upper()))
    data = [r for r in rows if str(start)<=r['date']<=str(end)]
    if not data:
        raise HTTPException(404,'No history in this range')
    return {'symbol':symbol.upper(),'start':str(start),'end':str(end),'count':len(data),'data':data,'source':source,'availableStart':rows[0]['date'],'availableEnd':rows[-1]['date']}
