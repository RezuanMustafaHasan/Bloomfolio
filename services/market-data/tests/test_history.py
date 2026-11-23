import json
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import requests
from fastapi import HTTPException
import provider
from main import history, stock, upstream

class MarketDataTests(unittest.TestCase):
    def test_history_is_unique_sorted_and_numeric(self):
        row={'date':'2026-10-01','open':10,'high':14,'low':9,'close':12,'volume':'1,200'}
        rows=provider.normalize_history([row,{**row,'date':'2026-10-02'},row])
        self.assertEqual([r['date'] for r in rows],['2026-10-01','2026-10-02'])
        self.assertEqual(rows[0]['volume'],1200)
    def test_invalid_candles_are_not_returned(self):
        self.assertEqual(provider.normalize_history([{'date':'2026-10-01','open':10,'high':5,'low':9,'close':12,'volume':100}]),[])
    def test_missing_numbers_stay_missing(self):
        self.assertIsNone(provider.number('N/A'))
        self.assertEqual(provider.number('0.0 mn tk'),0)
    def test_price_table(self):
        html='<tr data-symbol="GP"><td>GP</td><td>Grameenphone</td><td>Telecommunication</td><td data-field="close" data-sort="227.1"></td><td data-sort="2026-11-23">2026-11-23</td></tr>'
        self.assertEqual(provider.parse_quotes('<table>'+html+'</table>')[0]['fields']['close'],227.1)
    def test_missing_table_fails(self):
        with self.assertRaises(ValueError):provider.parse_quotes('Access denied')
    def test_ownership_ignores_change_annotations(self):
        html='<section id="sec-company"><table><tr><th>As on</th><th>Sponsor / director</th></tr><tr><td>Oct 31, 2026</td><td>90%</td><td>0%</td><td>6.86% <span>+0.01</span></td><td>0.11%</td><td>3.03%</td></tr></table></section>'
        _,rows=provider.parse_company(html)
        self.assertEqual(rows[0]['institute'],6.86)
    @patch('provider.requests.get')
    def test_successful_source_is_cached(self,get):
        get.return_value=Mock(text='source data')
        with tempfile.TemporaryDirectory() as tmp,patch('provider.CACHE_DIR',Path(tmp)):
            self.assertEqual(provider.cached_get('/test'),('source data',False))
            self.assertEqual(provider.cached_get('/test'),('source data',False))
            self.assertEqual(get.call_count,1)
    @patch('provider.requests.get')
    def test_saved_response_is_marked_stale_after_upstream_failure(self,get):
        get.return_value=Mock(text='source data')
        with tempfile.TemporaryDirectory() as tmp,patch('provider.CACHE_DIR',Path(tmp)):
            provider.cached_get('/test');get.side_effect=requests.ConnectionError()
            self.assertEqual(provider.cached_get('/test',ttl=-1),('source data',True))
    def test_timeout_status(self):
        with self.assertRaises(HTTPException) as error:upstream(lambda:(_ for _ in ()).throw(requests.Timeout()))
        self.assertEqual(error.exception.status_code,504)
    @patch('main.history_rows',return_value=([],{}))
    def test_empty_history_404(self,_):
        with self.assertRaises(HTTPException) as error:history('GP',6)
        self.assertEqual(error.exception.status_code,404)
    def test_invalid_symbol_422(self):
        with self.assertRaises(HTTPException) as error:stock('<script>')
        self.assertEqual(error.exception.status_code,422)
if __name__=='__main__':unittest.main()
