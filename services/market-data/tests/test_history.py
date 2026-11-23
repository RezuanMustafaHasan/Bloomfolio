import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi import HTTPException
import requests
from main import history, parse_history


def archive_row(date, close='12.5'):
    values = ['1', date, 'CITYBANK', '0', '14', '10', '11', close, '0', '0', '0', '1,200']
    return '<tr>' + ''.join(f'<td>{v}</td>' for v in values) + '</tr>'


class HistoryTests(unittest.TestCase):
    def test_unique_sorted_numeric_history(self):
        html = '<table class="shares-table">' + archive_row('2025-10-02') + archive_row('2025-10-01') * 2 + '</table>'
        data = parse_history(html)
        self.assertEqual([r['date'] for r in data], ['2025-10-01', '2025-10-02'])
        self.assertEqual(data[0]['volume'], 1200)
        self.assertEqual(data[0]['close'], 12.5)

    def test_bad_upstream_markup(self):
        with self.assertRaises(ValueError):
            parse_history('<html>Access denied</html>')

    @patch('main.requests.get')
    def test_success_contract(self, get):
        get.return_value = Mock(text='<table class="shares-table">' + archive_row('2025-10-01') + '</table>')
        result = history('citybank', 6)
        self.assertEqual(result['symbol'], 'CITYBANK')
        self.assertEqual(result['count'], len(result['data']))
        self.assertEqual(get.call_args.kwargs['timeout'], 20)

    @patch('main.requests.get')
    def test_empty_history_preserves_404(self, get):
        get.return_value = Mock(text='<table class="shares-table"></table>')
        with self.assertRaises(HTTPException) as error:
            history('CITYBANK', 6)
        self.assertEqual(error.exception.status_code, 404)

    @patch('main.requests.get', side_effect=requests.Timeout)
    def test_timeout_is_504(self, get):
        with self.assertRaises(HTTPException) as error:
            history('CITYBANK', 6)
        self.assertEqual(error.exception.status_code, 504)

    @patch('main.requests.get', side_effect=requests.HTTPError('403'))
    def test_upstream_failure_is_502(self, get):
        with self.assertRaises(HTTPException) as error:
            history('CITYBANK', 6)
        self.assertEqual(error.exception.status_code, 502)


if __name__ == '__main__':
    unittest.main()
