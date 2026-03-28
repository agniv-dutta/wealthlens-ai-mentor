from __future__ import annotations

import calendar
from datetime import date, datetime
from typing import Any


_DEMO_TARGET_XIRR_PCT = {
    "Mirae Asset Large Cap Fund - Regular Growth": 14.2,
    "Axis Bluechip Fund - Regular Growth": 9.8,
    "Parag Parikh Flexi Cap Fund - Regular Growth": 16.1,
    "HDFC Mid-Cap Opportunities Fund - Growth": 18.4,
    "Nippon India Small Cap Fund - Growth": 12.6,
    "SBI Nifty Index Fund - Regular Growth": 11.9,
}


def _next_month(dt: date) -> date:
    year = dt.year + (1 if dt.month == 12 else 0)
    month = 1 if dt.month == 12 else dt.month + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _monthly_sip_dates(start: date, end: date) -> list[date]:
    dates: list[date] = []
    cursor = start
    while cursor < end:
        dates.append(cursor)
        cursor = _next_month(cursor)
    return dates or [start]


def _build_synthetic_sip_cashflows(
    *,
    invested: float,
    current_value: float,
    purchase_date: str,
    target_xirr_pct: float,
    as_of: date | None = None,
) -> list[dict[str, Any]]:
    valuation_date = as_of or date.today()
    start_date = datetime.strptime(purchase_date, "%Y-%m-%d").date()
    sip_dates = _monthly_sip_dates(start_date, valuation_date)
    target_rate = target_xirr_pct / 100

    growth_weights = [
        (1 + target_rate) ** ((valuation_date - sip_date).days / 365.0)
        for sip_date in sip_dates
    ]
    n = len(sip_dates)
    weight_sum = sum(growth_weights)
    installments: list[float] | None = None

    # Solve using one anchor installment (first or last) plus equal baseline
    # across all months; choose the first all-positive solution.
    for anchor_index in (0, n - 1):
        anchor_weight = growth_weights[anchor_index]
        denominator = (n * anchor_weight) - weight_sum
        if abs(denominator) < 1e-9:
            continue
        base = ((invested * anchor_weight) - current_value) / denominator
        anchor_extra = invested - (n * base)
        candidate = [base for _ in sip_dates]
        candidate[anchor_index] = candidate[anchor_index] + anchor_extra
        if min(candidate) > 0:
            installments = candidate
            break

    if installments is None:
        base = invested / n
        installments = [base for _ in sip_dates]

    rounded_installments = [round(value, 2) for value in installments]
    drift = round(invested - sum(rounded_installments), 2)
    rounded_installments[-1] = round(rounded_installments[-1] + drift, 2)

    return [
        {"date": sip_date.isoformat(), "amount": amount}
        for sip_date, amount in zip(sip_dates, rounded_installments)
    ]


def get_demo_portfolio() -> list[dict[str, Any]]:
    """Return deterministic demo portfolio holdings for live demos."""
    holdings = [
        {
            "scheme": "Mirae Asset Large Cap Fund - Regular Growth",
            "current_value": 285000,
            "invested": 200000,
            "units": 4823,
            "nav": 59.1,
            "expense_ratio": 1.55,
            "category": "Large Cap",
            "purchase_date": "2021-08-14",
        },
        {
            "scheme": "Axis Bluechip Fund - Regular Growth",
            "current_value": 142000,
            "invested": 120000,
            "units": 3241,
            "nav": 43.8,
            "expense_ratio": 1.68,
            "category": "Large Cap",
            "purchase_date": "2022-05-10",
        },
        {
            "scheme": "Parag Parikh Flexi Cap Fund - Regular Growth",
            "current_value": 310000,
            "invested": 240000,
            "units": 6102,
            "nav": 50.8,
            "expense_ratio": 0.74,
            "category": "Flexi Cap",
            "purchase_date": "2020-11-20",
        },
        {
            "scheme": "HDFC Mid-Cap Opportunities Fund - Growth",
            "current_value": 198000,
            "invested": 150000,
            "units": 5840,
            "nav": 33.9,
            "expense_ratio": 1.62,
            "category": "Mid Cap",
            "purchase_date": "2021-03-12",
        },
        {
            "scheme": "Nippon India Small Cap Fund - Growth",
            "current_value": 89000,
            "invested": 80000,
            "units": 2210,
            "nav": 40.3,
            "expense_ratio": 1.55,
            "category": "Small Cap",
            "purchase_date": "2022-09-01",
        },
        {
            "scheme": "SBI Nifty Index Fund - Regular Growth",
            "current_value": 176000,
            "invested": 150000,
            "units": 9800,
            "nav": 17.96,
            "expense_ratio": 0.50,
            "category": "Index",
            "purchase_date": "2020-02-27",
        },
    ]

    for holding in holdings:
        target_xirr_pct = _DEMO_TARGET_XIRR_PCT.get(holding["scheme"])
        if target_xirr_pct is None:
            continue
        holding["sip_cashflows"] = _build_synthetic_sip_cashflows(
            invested=float(holding["invested"]),
            current_value=float(holding["current_value"]),
            purchase_date=str(holding["purchase_date"]),
            target_xirr_pct=target_xirr_pct,
        )

    return holdings


def get_demo_secondary_portfolio() -> list[dict[str, Any]]:
    """Return a spouse's demo portfolio for the Couple's Planner."""
    return [
        {
            "scheme": "Canara Robeco Bluechip Equity Fund - Growth",
            "current_value": 150000,
            "invested": 100000,
            "units": 3450,
            "nav": 43.47,
            "expense_ratio": 1.62,
            "category": "Large Cap",
            "purchase_date": "2021-01-10",
        },
        {
            "scheme": "Quant Active Fund - Growth",
            "current_value": 220000,
            "invested": 120000,
            "units": 4120,
            "nav": 53.4,
            "expense_ratio": 0.75,
            "category": "Multi Cap",
            "purchase_date": "2020-05-15",
        },
        {
            "scheme": "ICICI Prudential Technology Fund - Growth",
            "current_value": 95000,
            "invested": 85000,
            "units": 1240,
            "nav": 76.6,
            "expense_ratio": 1.85,
            "category": "Sectoral/Thematic",
            "purchase_date": "2022-03-22",
        },
    ]
