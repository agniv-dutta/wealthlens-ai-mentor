from __future__ import annotations

import json
import math
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
    sip_cashflows: list[dict[str, float | str]] | None = None


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
        "http://127.0.0.1:3001",
        "http://localhost:3001",
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


def _holding_outflow_cashflows(holding: Holding) -> list[tuple[date, float]]:
    if holding.sip_cashflows:
        outflows: list[tuple[date, float]] = []
        for flow in holding.sip_cashflows:
            flow_date_raw = flow.get("date")
            flow_amount_raw = flow.get("amount")
            if not isinstance(flow_date_raw, str):
                continue
            try:
                flow_amount = float(flow_amount_raw) if flow_amount_raw is not None else 0.0
            except (TypeError, ValueError):
                continue
            if flow_amount <= 0:
                continue
            outflows.append((_parse_iso_date(flow_date_raw), -flow_amount))
        if outflows:
            return outflows

    return [(_parse_iso_date(holding.purchase_date), -holding.invested)]


def _safe_xirr_pct(cashflows: list[tuple[date, float]]) -> float:
    if not cashflows:
        return 0.0
    has_negative = any(amount < 0 for _, amount in cashflows)
    has_positive = any(amount > 0 for _, amount in cashflows)
    if not (has_negative and has_positive):
        return 0.0
    try:
        xirr_rate = _xirr(cashflows)
    except Exception:
        return 0.0
    if not math.isfinite(xirr_rate):
        return 0.0
    return xirr_rate * 100


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

    valuation_date = date.today()

    cashflows: list[tuple[date, float]] = []
    fund_xirr_pct: dict[str, float] = {}
    for item in portfolio:
        holding_outflows = _holding_outflow_cashflows(item)
        cashflows.extend(holding_outflows)
        holding_cashflows = [*holding_outflows, (valuation_date, item.current_value)]
        holding_cashflows.sort(key=lambda entry: entry[0])
        fund_xirr_pct[item.scheme] = _safe_xirr_pct(holding_cashflows)

    cashflows.append((valuation_date, total_current_value))
    cashflows.sort(key=lambda entry: entry[0])

    xirr_pct = _safe_xirr_pct(cashflows)

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
        "fund_xirr_pct": fund_xirr_pct,
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


def _normalize_analysis_payload(parsed: dict) -> dict:
    normalized = dict(parsed)

    plan = normalized.get("rebalancing_plan")
    if isinstance(plan, str):
        normalized["rebalancing_plan"] = []
    elif isinstance(plan, list):
        # Filter to only valid RebalancingAction objects (dicts with required fields)
        # If items are strings, skip them (can't parse without structure)
        valid_actions = []
        for item in plan:
            if isinstance(item, dict) and "action" in item and "scheme" in item:
                valid_actions.append(item)
            # Skip strings or incomplete dicts
        normalized["rebalancing_plan"] = valid_actions
    else:
        normalized["rebalancing_plan"] = []

    insights = normalized.get("key_insights")
    if isinstance(insights, str):
        items = [line.strip(" -\t") for line in insights.split("\n") if line.strip()]
        normalized["key_insights"] = items[:5]
    elif isinstance(insights, list):
        # Handle case where insights are objects with "insight" or "text" field
        extracted = []
        for item in insights:
            if isinstance(item, dict):
                # Try to extract text from common field names
                text = item.get("insight") or item.get("text") or item.get("content") or str(item)
                if isinstance(text, str):
                    extracted.append(text.strip())
            elif isinstance(item, str):
                extracted.append(item.strip())
        normalized["key_insights"] = extracted[:5] if extracted else []
    else:
        normalized["key_insights"] = []

    risk = str(normalized.get("risk_assessment", "")).strip().lower()
    if risk not in {"conservative", "moderate", "aggressive"}:
        if "conserv" in risk:
            risk = "conservative"
        elif "aggress" in risk:
            risk = "aggressive"
        else:
            risk = "moderate"
    normalized["risk_assessment"] = risk

    grade = str(normalized.get("health_grade", "")).strip().upper()
    grade = grade[:1] if grade else "B"
    if grade not in {"A", "B", "C", "D"}:
        grade = "B"
    normalized["health_grade"] = grade

    summary = normalized.get("one_line_summary")
    if not isinstance(summary, str) or not summary.strip():
        normalized["one_line_summary"] = "Portfolio reviewed. See insights for action items."

    return normalized


def _fallback_analysis(metrics: dict) -> AnalysisPayload:
    roi_pct = float(metrics.get("roi_pct", 0.0))
    xirr_pct = float(metrics.get("xirr_pct", 0.0))
    annual_fees = float(metrics.get("annual_fees", 0.0))
    total_current_value = float(metrics.get("total_current_value", 0.0))
    allocation = metrics.get("asset_allocation", [])

    top_bucket = "current allocation"
    if isinstance(allocation, list) and allocation:
        top = max(allocation, key=lambda item: float(item.get("weight_pct", 0.0)))
        top_name = str(top.get("name", "current allocation"))
        top_weight = float(top.get("weight_pct", 0.0))
        top_bucket = f"{top_name} ({top_weight:.1f}%)"

    insights = [
        f"Portfolio ROI is {roi_pct:.2f}% with XIRR at {xirr_pct:.2f}% based on dated cashflows.",
        f"Highest concentration is in {top_bucket}; consider diversification if this exceeds your risk preference.",
        f"Estimated annual fees are INR {annual_fees:,.0f} on INR {total_current_value:,.0f} current value.",
    ]

    return AnalysisPayload(
        rebalancing_plan=[],
        key_insights=insights,
        risk_assessment="moderate",
        health_grade="B",
        one_line_summary="Automated fallback analysis generated because AI response format was invalid.",
    )


def _generate_ai_analysis(portfolio: list[Holding], metrics: dict) -> AnalysisPayload:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured on backend",
        )
    if api_key.startswith("PASTE_") or api_key.startswith("your_"):
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is still a placeholder. Set a real Groq key in backend/.env",
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

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_completion_tokens=1200,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Groq API call failed: {exc}") from exc

    raw_text = (response.choices[0].message.content or "").strip()

    try:
        parsed = _extract_json(raw_text)
        normalized = _normalize_analysis_payload(parsed)
        return AnalysisPayload.model_validate(normalized)
    except Exception:
        # Keep endpoint stable even when model output shape drifts.
        return _fallback_analysis(metrics)


class TaxHarvestingSuggestion(BaseModel):
    scheme: str
    harvestable_loss_inr: float
    reason: str


class TaxAnalysisPayload(BaseModel):
    stcg_estimated_inr: float
    ltcg_estimated_inr: float
    tax_harvesting_suggestions: list[TaxHarvestingSuggestion]
    tax_efficiency_grade: Literal["A", "B", "C", "D"]
    key_tax_insights: list[str]


class CombinedPortfolioMetrics(BaseModel):
    total_current_value: float
    combined_xirr_pct: float
    overlap_count: int
    top_categories: list[str]


class CouplesAnalysisPayload(BaseModel):
    combined_metrics: CombinedPortfolioMetrics
    merging_strategy: str
    key_combined_insights: list[str]
    action_items: list[str] = []
    joint_health_grade: Literal["A", "B", "C", "D"]


class HealthScorePayload(BaseModel):
    overall_health_score: int = Field(ge=0, le=100)
    emergency_fund_status: Literal["Adequate", "Partial", "Critical"]
    insurance_coverage_score: int
    retirement_readiness_pct: float
    health_insights: list[str]


class CouplesAnalyzeRequest(BaseModel):
    portfolio_1: list[Holding]
    portfolio_2: list[Holding]
    partner_1_name: str = "Partner 1"
    partner_2_name: str = "Partner 2"
    partner_1_tax_slab_pct: float | None = Field(default=None, ge=0, le=50)
    partner_2_tax_slab_pct: float | None = Field(default=None, ge=0, le=50)


def _scheme_key(scheme: str) -> str:
    base = scheme.split(" - ")[0].strip().lower()
    return " ".join(base.replace("fund", "").split())


def _target_allocation_from_current(asset_allocation: list[dict]) -> list[tuple[str, float, float]]:
    preferred_targets = {
        "Large Cap": 35.0,
        "Flexi Cap": 20.0,
        "Index": 15.0,
        "Mid Cap": 15.0,
        "Small Cap": 10.0,
        "Debt": 5.0,
        "Multi Cap": 10.0,
        "Sectoral/Thematic": 5.0,
    }

    categories = [str(item.get("name", "Other")) for item in asset_allocation]
    if not categories:
        categories = ["Large Cap", "Flexi Cap", "Mid Cap", "Small Cap", "Debt"]

    raw_targets: dict[str, float] = {}
    for category in categories:
        raw_targets[category] = preferred_targets.get(category, 5.0)

    total_target = sum(raw_targets.values()) or 100.0
    current_map = {str(item.get("name", "Other")): float(item.get("weight_pct", 0.0)) for item in asset_allocation}

    return [
        (category, (target / total_target) * 100.0, current_map.get(category, 0.0))
        for category, target in raw_targets.items()
    ]


def _build_structured_couples_strategy(
    *,
    portfolio_1: list[Holding],
    portfolio_2: list[Holding],
    combined_metrics: dict,
    partner_1_name: str,
    partner_2_name: str,
    partner_1_tax_slab_pct: float | None,
    partner_2_tax_slab_pct: float | None,
) -> tuple[str, list[str], str]:
    p1_by_key = {_scheme_key(item.scheme): item for item in portfolio_1}
    p2_by_key = {_scheme_key(item.scheme): item for item in portfolio_2}
    duplicate_keys = sorted(set(p1_by_key).intersection(p2_by_key))

    duplicate_lines: list[str] = []
    for key in duplicate_keys:
        p1_item = p1_by_key[key]
        p2_item = p2_by_key[key]
        keep = p1_item
        keep_owner = partner_1_name
        if (p2_item.expense_ratio < p1_item.expense_ratio) or (
            p2_item.expense_ratio == p1_item.expense_ratio and p2_item.current_value > p1_item.current_value
        ):
            keep = p2_item
            keep_owner = partner_2_name
        duplicate_lines.append(
            f"- {p1_item.scheme}: keep in {keep_owner}'s folio (lower cost/stronger base), and stop fresh SIP in the other folio."
        )

    if not duplicate_lines:
        duplicate_lines.append(
            "- No exact duplicate schemes detected; avoid adding a second scheme in the same style box unless expense and mandate are clearly superior."
        )

    if partner_1_tax_slab_pct is not None and partner_2_tax_slab_pct is not None:
        higher_name = partner_1_name if partner_1_tax_slab_pct >= partner_2_tax_slab_pct else partner_2_name
        lower_name = partner_2_name if higher_name == partner_1_name else partner_1_name
        slab_line = (
            f"- Tax slab lens: {higher_name} is in the higher slab ({max(partner_1_tax_slab_pct, partner_2_tax_slab_pct):.0f}%), "
            f"{lower_name} is in the lower slab ({min(partner_1_tax_slab_pct, partner_2_tax_slab_pct):.0f}%)."
        )
    else:
        higher_name = partner_1_name
        lower_name = partner_2_name
        slab_line = (
            "- Tax slab inputs not provided; apply this rule: lower slab partner should own debt/high-turnover funds, "
            "higher slab partner should own long-horizon equity/index holdings."
        )

    tax_split_lines = [
        slab_line,
        f"- Hold Debt and tactical high-churn funds in {lower_name}'s folio to reduce post-tax drag.",
        f"- Keep long-term core equity (Index/Large/Flexi) in {higher_name}'s folio and minimize unnecessary switches.",
    ]

    target_alloc = _target_allocation_from_current(combined_metrics.get("asset_allocation", []))
    rebalancing_lines = [
        f"- {category}: target {target:.0f}% (current {current:.1f}%)"
        for category, target, current in target_alloc
    ]

    action_items = [
        "Consolidate duplicate schemes this month by redirecting new SIPs into the chosen keeper fund.",
        "Map each fund to the lower- or higher-slab partner based on expected churn before the next SIP date.",
        "Set SIP split to move combined allocation toward target weights over the next 3 cycles.",
    ]

    strategy = "\n".join(
        [
            "Duplicate Fund Consolidation",
            *duplicate_lines,
            "",
            "Tax-Efficient Ownership Split",
            *tax_split_lines,
            "",
            "Rebalancing Recommendation (Target Allocation)",
            *rebalancing_lines,
            "",
            "Action Items",
            *[f"- {item}" for item in action_items],
        ]
    )

    overlap_count = len(combined_metrics.get("overlap_categories", []))
    joint_grade = "A" if overlap_count == 0 else "B" if overlap_count <= 1 else "C"
    return strategy, action_items, joint_grade


def _is_structured_couples_strategy(value: str) -> bool:
    required_headers = [
        "Duplicate Fund Consolidation",
        "Tax-Efficient Ownership Split",
        "Rebalancing Recommendation",
        "Action Items",
    ]
    return all(header in value for header in required_headers)


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


@app.get("/api/demo-secondary-portfolio")
def demo_secondary_portfolio() -> dict:
    from demo_data import get_demo_secondary_portfolio
    demo = [Holding.model_validate(item) for item in get_demo_secondary_portfolio()]
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


@app.post("/api/tax/analyze")
def analyze_tax(payload: AnalyzeRequest) -> dict:
    # Deterministic Tax Estimation (Simplified)
    portfolio = payload.portfolio
    stcg = 0.0
    ltcg = 0.0
    suggestions = []

    for item in portfolio:
        gain = item.current_value - item.invested
        # Rules: Equity > 1yr = LTCG, < 1yr = STCG (Simplification)
        days_owned = (date.today() - _parse_iso_date(item.purchase_date)).days
        if "Debt" in item.category:
            stcg += max(0, gain) # Debt is STCG (Simplified)
        elif days_owned > 365:
            ltcg += max(0, gain)
        else:
            stcg += max(0, gain)
        
        if gain < -5000:
            suggestions.append(TaxHarvestingSuggestion(
                scheme=item.scheme,
                harvestable_loss_inr=abs(gain),
                reason=f"Unrealized loss in {item.category} can offset other gains."
            ))

    # AI Analysis for Tax
    api_key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=api_key)
    
    user_prompt = (
        "Analyze these Indian mutual fund tax metrics. "
        "Return JSON with keys: tax_efficiency_grade (A/B/C/D), key_tax_insights (list of 3 strings).\n\n"
        f"STCG: {stcg}, LTCG: {ltcg}, Suggestions: {json.dumps([s.model_dump() for s in suggestions])}"
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": user_prompt}],
        )
        parsed = _extract_json(response.choices[0].message.content)
    except:
        parsed = {"tax_efficiency_grade": "B", "key_tax_insights": ["Review LTCG limits", "Harvest losses where active"]}

    return {
        "stcg_estimated_inr": stcg,
        "ltcg_estimated_inr": ltcg,
        "tax_harvesting_suggestions": [s.model_dump() for s in suggestions],
        **parsed
    }


@app.post("/api/couples-planner/analyze")
def analyze_couples(payload: CouplesAnalyzeRequest) -> dict:
    total_port = payload.portfolio_1 + payload.portfolio_2
    combined_metrics = _compute_metrics(total_port)

    fallback_strategy, fallback_action_items, fallback_grade = _build_structured_couples_strategy(
        portfolio_1=payload.portfolio_1,
        portfolio_2=payload.portfolio_2,
        combined_metrics=combined_metrics,
        partner_1_name=payload.partner_1_name,
        partner_2_name=payload.partner_2_name,
        partner_1_tax_slab_pct=payload.partner_1_tax_slab_pct,
        partner_2_tax_slab_pct=payload.partner_2_tax_slab_pct,
    )
    
    # AI Analysis for Couples
    api_key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=api_key)
    
    user_prompt = (
        "Given two partners' mutual fund portfolios with holdings, SIP cashflows, and XIRR signals, "
        "generate a structured merging strategy. "
        "Return ONLY JSON with keys: merging_strategy, key_combined_insights (list), joint_health_grade (A/B/C/D), action_items (list). "
        "The merging_strategy must include these section headers exactly: "
        "Duplicate Fund Consolidation, Tax-Efficient Ownership Split, Rebalancing Recommendation (Target Allocation), Action Items. "
        "Do not return single-word or one-line output.\n\n"
        f"Partner 1 Name: {payload.partner_1_name}, Tax Slab: {payload.partner_1_tax_slab_pct}\n"
        f"Partner 2 Name: {payload.partner_2_name}, Tax Slab: {payload.partner_2_tax_slab_pct}\n"
        f"Portfolio 1: {json.dumps([item.model_dump() for item in payload.portfolio_1], ensure_ascii=True)}\n"
        f"Portfolio 2: {json.dumps([item.model_dump() for item in payload.portfolio_2], ensure_ascii=True)}\n"
        f"Combined Metrics: {json.dumps(combined_metrics, ensure_ascii=True)}"
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": user_prompt}],
        )
        parsed = _extract_json(response.choices[0].message.content)
    except Exception:
        parsed = {}

    raw_strategy = parsed.get("merging_strategy")
    merging_strategy = raw_strategy.strip() if isinstance(raw_strategy, str) else ""
    if not merging_strategy or not _is_structured_couples_strategy(merging_strategy):
        merging_strategy = fallback_strategy

    raw_insights = parsed.get("key_combined_insights")
    key_combined_insights = fallback_action_items
    if isinstance(raw_insights, list):
        normalized_insights = [str(item).strip() for item in raw_insights if str(item).strip()]
        if normalized_insights:
            key_combined_insights = normalized_insights[:5]

    raw_action_items = parsed.get("action_items")
    action_items = fallback_action_items[:3]
    if isinstance(raw_action_items, list):
        normalized_actions = [str(item).strip() for item in raw_action_items if str(item).strip()]
        if len(normalized_actions) >= 2:
            action_items = normalized_actions[:3]

    grade = str(parsed.get("joint_health_grade", fallback_grade)).strip().upper()[:1]
    if grade not in {"A", "B", "C", "D"}:
        grade = fallback_grade

    return {
        "combined_metrics": {
            "total_current_value": combined_metrics["total_current_value"],
            "combined_xirr_pct": combined_metrics["xirr_pct"],
            "overlap_count": len(combined_metrics["overlap_categories"]),
            "top_categories": [a["name"] for a in combined_metrics["asset_allocation"][:3]]
        },
        "merging_strategy": merging_strategy,
        "key_combined_insights": key_combined_insights,
        "action_items": action_items,
        "joint_health_grade": grade,
    }


@app.post("/api/health-score/analyze")
def analyze_health(payload: AnalyzeRequest) -> dict:
    metrics = _compute_metrics(payload.portfolio)
    
    # AI Analysis for Health Score
    api_key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=api_key)
    
    user_prompt = (
        "Based on this portfolio, calculate a hollistic financial health score (0-100). "
        "Return ONLY JSON with keys: overall_health_score, emergency_fund_status (Adequate/Partial/Critical), "
        "insurance_coverage_score (0-100), retirement_readiness_pct (0-100), health_insights (list of 3).\n\n"
        f"Metrics: {json.dumps(metrics)}"
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": user_prompt}],
        )
        parsed = _extract_json(response.choices[0].message.content)
    except:
        parsed = {
            "overall_health_score": 72,
            "emergency_fund_status": "Partial",
            "insurance_coverage_score": 60,
            "retirement_readiness_pct": 45.0,
            "health_insights": ["Increase term insurance coverage", "Build 6-month buffer", "Diversify equity exposure"]
        }

    return parsed
