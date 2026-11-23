"""DSE daily OHLCV history for Bloomfolio's line and candlestick charts."""
import logging
import math
import os
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup
from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Bloomfolio Market Data API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:5174").split(","),
    allow_methods=["GET"],
    allow_headers=["*"],
)
logger = logging.getLogger(__name__)
ARCHIVE_URL = "https://www.dsebd.org/day_end_archive.php"


def parse_history(html: str) -> list[dict]:
    """Read the DSE archive table; return unique, ascending, JSON-safe OHLCV rows."""
    table = BeautifulSoup(html, "html.parser").select_one("table.shares-table")
    if table is None:
        raise ValueError("The DSE archive table is missing")
    rows = {}
    for row in table.select("tr"):
        cells = [cell.get_text(strip=True).replace(",", "") for cell in row.select("td")]
        if len(cells) < 12:
            continue
        date = datetime.strptime(cells[1], "%Y-%m-%d").date().isoformat()
        record = {"date": date, "open": float(cells[6]), "high": float(cells[4]),
                  "low": float(cells[5]), "close": float(cells[7]), "volume": int(cells[11])}
        # Reject non-finite values instead of generating invalid JSON or broken charts.
        if all(math.isfinite(record[k]) for k in ("open", "high", "low", "close", "volume")):
            rows[date] = record
    return [rows[key] for key in sorted(rows)]


@app.get("/api/health")
def health():
    return {"status": "OK", "service": "market-data"}


@app.get("/api/history")
def history(
    symbol: str = Query(..., pattern=r"^[A-Za-z0-9&_-]{1,30}$", description="DSE trading code, e.g. CITYBANK"),
    months: int = Query(24, ge=1, le=120),
):
    end = datetime.now(ZoneInfo("Asia/Dhaka")).date()
    start = end - relativedelta(months=months)
    code = symbol.upper()
    try:
        response = requests.get(
            ARCHIVE_URL,
            params={"startDate": str(start), "endDate": str(end), "inst": code, "archive": "data"},
            headers={"User-Agent": "Bloomfolio/1.0"},
            timeout=20,
        )
        response.raise_for_status()
        data = parse_history(response.text)
    except requests.Timeout as exc:
        raise HTTPException(504, "DSE history request timed out; try again later.") from exc
    except (requests.RequestException, ValueError) as exc:
        logger.warning("DSE history unavailable: %s", exc)
        raise HTTPException(502, "DSE history is unavailable from the upstream source; try again later.") from exc
    if not data:
        raise HTTPException(404, f"No history for {code} in this range")
    return {"symbol": code, "start": str(start), "end": str(end), "count": len(data), "data": data}
