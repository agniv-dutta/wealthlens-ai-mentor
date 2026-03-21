from __future__ import annotations

from typing import Any


def get_demo_portfolio() -> list[dict[str, Any]]:
    """Return deterministic demo portfolio holdings for live demos."""
    return [
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
