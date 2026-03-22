from __future__ import annotations

import json
import os
from datetime import date, datetime
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

from demo_data import get_demo_portfolio

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)
if not os.getenv("GROQ_API_KEY"):
    load_dotenv(os.path.join(BASE_DIR, ".env.example"), override=True)


def _parse_iso_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"Invalid date '{value}', expected YYYY-MM-DD") from exc


class Holding(BaseModel):
    scheme: str
    current_value: float = Field(gt=0)
    invested: float = Field(gt=0)
    units: float = Field(gt=0)
    nav: float = Field(gt=0)
    expense_ratio: float = Field(ge=0)
    category: str
    purchase_date: str


class RebalancingAction(BaseModel):
    action: Literal["buy", "sell", "switch"]
    scheme: str
    reason: str
    amount_inr: float = Field(ge=0)


class AnalysisPayload(BaseModel):
    rebalancing_plan: list[RebalancingAction]
    key_insights: list[str]
    risk_assessment: Literal["conservative", "moderate", "aggressive"]
    health_grade: Literal["A", "B", "C", "D"]
    one_line_summary: str


class AnalyzeRequest(BaseModel):
    portfolio: list[Holding]


app = FastAPI(title="WealthLens Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _xnpv(rate: float, cashflows: list[tuple[date, float]]) -> float:
    first_date = cashflows[0][0]
    return sum(
        amount / ((1 + rate) ** ((flow_date - first_date).days / 365.0))
        for flow_date, amount in cashflows
    )


def _xirr(cashflows: list[tuple[date, float]]) -> float:
    low = -0.9999
    high = 10.0

    for _ in range(200):
        mid = (low + high) / 2
        npv = _xnpv(mid, cashflows)
        if abs(npv) < 1e-5:
            return mid

        if npv > 0:
            low = mid
        else:
            high = mid

    return (low + high) / 2


def _compute_metrics(portfolio: list[Holding]) -> dict:
    if not portfolio:
        raise ValueError("Portfolio cannot be empty")

    total_current_value = sum(item.current_value for item in portfolio)
    total_invested_value = sum(item.invested for item in portfolio)
    absolute_gain = total_current_value - total_invested_value
    roi_pct = (absolute_gain / total_invested_value) * 100 if total_invested_value else 0.0
    annual_fees = sum(item.current_value * item.expense_ratio / 100 for item in portfolio)

    allocation_by_category: dict[str, float] = {}
    category_counts: dict[str, int] = {}
    for item in portfolio:
        allocation_by_category[item.category] = allocation_by_category.get(item.category, 0.0) + item.current_value
        category_counts[item.category] = category_counts.get(item.category, 0) + 1

    overlap_categories = sorted([name for name, count in category_counts.items() if count > 2])

    cashflows: list[tuple[date, float]] = []
    for item in portfolio:
        cashflows.append((_parse_iso_date(item.purchase_date), -item.invested))
    cashflows.append((date.today(), total_current_value))
    cashflows.sort(key=lambda entry: entry[0])

    xirr_rate = _xirr(cashflows)
    xirr_pct = xirr_rate * 100

    asset_allocation = [
        {
            "name": category,
            "value": value,
            "weight_pct": (value / total_current_value) * 100 if total_current_value else 0.0,
        }
        for category, value in sorted(allocation_by_category.items())
    ]

    return {
        "total_current_value": total_current_value,
        "total_invested_value": total_invested_value,
        "absolute_gain": absolute_gain,
        "roi_pct": roi_pct,
        "annual_fees": annual_fees,
        "xirr_pct": xirr_pct,
        "asset_allocation": asset_allocation,
        "overlap_categories": overlap_categories,
    }


def _extract_json(raw_text: str) -> dict:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Model response did not contain a JSON object")
    candidate = raw_text[start : end + 1]
    return json.loads(candidate)


def _generate_ai_analysis(portfolio: list[Holding], metrics: dict) -> AnalysisPayload:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured on backend",
        )

    client = Groq(api_key=api_key)

    system_prompt = (
        "You are an Indian mutual fund advisor assistant. "
        "Your response must be strictly valid JSON matching the required schema. "
        "Do not include markdown."
    )

    user_prompt = (
        "Analyze this investor portfolio and computed metrics. "
        "Return ONLY JSON with keys: rebalancing_plan, key_insights, risk_assessment, health_grade, one_line_summary. "
        "Use INR amounts and concrete actions.\n\n"
        f"Portfolio: {json.dumps([item.model_dump() for item in portfolio], ensure_ascii=True)}\n"
        f"Metrics: {json.dumps(metrics, ensure_ascii=True)}"
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_completion_tokens=1200,
        temperature=0.2,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw_text = (response.choices[0].message.content or "").strip()

    try:
        parsed = _extract_json(raw_text)
        return AnalysisPayload.model_validate(parsed)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Invalid Groq response: {exc}") from exc


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/demo-portfolio")
def demo_portfolio() -> dict:
    demo = [Holding.model_validate(item) for item in get_demo_portfolio()]
    metrics = _compute_metrics(demo)
    return {
        "portfolio": [item.model_dump() for item in demo],
        "metrics": metrics,
    }


@app.post("/api/portfolio/analyze")
def analyze_portfolio(payload: AnalyzeRequest) -> dict:
    if not payload.portfolio:
        raise HTTPException(status_code=400, detail="Portfolio cannot be empty")

    try:
        metrics = _compute_metrics(payload.portfolio)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    analysis = _generate_ai_analysis(payload.portfolio, metrics)
    return {
        "portfolio": [item.model_dump() for item in payload.portfolio],
        "metrics": metrics,
        "analysis": analysis.model_dump(),
    }
