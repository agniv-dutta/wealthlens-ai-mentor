# WealthLens AI Mentor

![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-009688?logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b--versatile-F55036)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)

WealthLens AI Mentor is an AI-assisted portfolio intelligence application for Indian mutual fund investors.

It combines deterministic calculations (ROI, XIRR, fees, overlap, allocation) with LLM-generated guidance so users can move from holdings data to practical action.

## Latest Enhancements

### Platform and Architecture

- Consolidated to a single frontend surface: Next.js in frontend/.
- Root scripts now orchestrate frontend from the repository root.
- API base configuration aligned to backend on 127.0.0.1:8001.

### Metrics and Reliability

- Added per-fund XIRR computation using fund-level synthetic SIP cashflows.
- Exposed per-fund XIRR in response payload as metrics.fund_xirr_pct.
- Added optional sip_cashflows on holdings to support dated installment modeling.
- Hardened XIRR calculation with safeguards for invalid flow combinations and non-finite results.
- Kept robust AI normalization and deterministic fallback behavior to avoid endpoint breakage on malformed LLM output.

### Fund Intelligence UX

- Portfolio Heatmap XIRR is now fund-specific instead of one portfolio-wide value.
- Overlap matrix headers were redesigned to fixed horizontal short labels:
  - Mirae LC
  - Axis BC
  - Parag FC
  - HDFC MC
  - Nippon SC
  - SBI Index
- Performance vs Benchmarks card now uses var(--bg-surface) background.
- Recharts benchmark chart area is transparent to inherit card background.

### Reporting and Print Export

- Added Export Report button in the topbar.
- Click action triggers browser print (window.print()).
- Added print stylesheet in frontend/app/layout.tsx (style media="print") with:
  - A4 portrait format
  - hidden topbar buttons, sidebar, and tab bars
  - print-focused WealthLens report header plus date
  - print footer: Confidential - for educational purposes only
  - var(--bg-base) page background
- Added a print-only report composition for Portfolio X-Ray sections:
  - stats
  - allocation
  - AI summary
  - holdings table

## What Problem This Solves

Retail investors commonly struggle with:

- Measuring performance beyond simple gain/loss.
- Identifying overlap and concentration risk.
- Estimating tax impact and identifying harvesting options.
- Getting concise rebalancing suggestions.
- Combining two portfolios into one coherent strategy.

WealthLens addresses this with deterministic metrics plus AI-assisted recommendations.

## Current Feature Set

- Portfolio X-Ray:
  - deterministic portfolio metrics
  - AI summary, risk posture, health grade, rebalancing plan
- Fund Intelligence:
  - heatmap, overlap matrix, expense drag, benchmark comparison, simulator
- Tax Wizard:
  - STCG/LTCG estimation and harvesting suggestions
- Couple's Planner:
  - combined metrics and joint strategy insights
- Money Health Score:
  - overall score and category-specific health insights

## Architecture Overview

- Backend: FastAPI service in backend/
- LLM: Groq model llama-3.3-70b-versatile
- Frontend: Next.js app in frontend/

Request flow:

1. Frontend requests demo portfolio from backend.
2. Frontend submits holdings to analysis endpoints.
3. Backend computes deterministic metrics.
4. Backend requests narrative output from Groq.
5. Backend normalizes AI output and falls back safely if needed.
6. Frontend renders analytics views and report UI.

## Repository Structure

```text
wealthlens-ai-mentor/
  backend/                # FastAPI + deterministic + AI orchestration
  frontend/               # Next.js app UI
  package.json            # root orchestration scripts
  README.md
```

## Quick Start

### Option A: Run from root (frontend only)

```bash
npm install
npm run dev
```

This starts frontend at http://127.0.0.1:3000.

### Option B: Run backend and frontend separately

Backend:

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Environment Variables

### Backend (backend/.env)

```env
GROQ_API_KEY=your_real_groq_api_key
```

### Frontend (frontend/.env.local)

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
```

Notes:

- Never commit real API keys.
- Local env and build artifacts are gitignored.

## API Reference

Base URL (local): http://127.0.0.1:8001

### GET /health

Returns backend liveness.

```json
{ "ok": true }
```

### GET /api/demo-portfolio

Returns demo holdings and computed metrics.

Response shape:

```json
{
  "portfolio": [
    {
      "scheme": "string",
      "current_value": 0,
      "invested": 0,
      "units": 0,
      "nav": 0,
      "expense_ratio": 0,
      "category": "string",
      "purchase_date": "YYYY-MM-DD",
      "sip_cashflows": [
        { "date": "YYYY-MM-DD", "amount": 0 }
      ]
    }
  ],
  "metrics": {
    "total_current_value": 0,
    "total_invested_value": 0,
    "absolute_gain": 0,
    "roi_pct": 0,
    "annual_fees": 0,
    "xirr_pct": 0,
    "fund_xirr_pct": {
      "Fund Name": 0
    },
    "asset_allocation": [
      { "name": "string", "value": 0, "weight_pct": 0 }
    ],
    "overlap_categories": ["string"]
  }
}
```

### GET /api/demo-secondary-portfolio

Returns spouse/secondary demo portfolio and metrics.

### POST /api/portfolio/analyze

Returns deterministic metrics plus AI analysis.

Request body:

```json
{
  "portfolio": [
    {
      "scheme": "string",
      "current_value": 0,
      "invested": 0,
      "units": 0,
      "nav": 0,
      "expense_ratio": 0,
      "category": "string",
      "purchase_date": "YYYY-MM-DD",
      "sip_cashflows": [
        { "date": "YYYY-MM-DD", "amount": 0 }
      ]
    }
  ]
}
```

Response body:

```json
{
  "portfolio": [],
  "metrics": {
    "total_current_value": 0,
    "total_invested_value": 0,
    "absolute_gain": 0,
    "roi_pct": 0,
    "annual_fees": 0,
    "xirr_pct": 0,
    "fund_xirr_pct": {},
    "asset_allocation": [],
    "overlap_categories": []
  },
  "analysis": {
    "rebalancing_plan": [
      {
        "action": "buy",
        "scheme": "string",
        "reason": "string",
        "amount_inr": 0
      }
    ],
    "key_insights": ["string"],
    "risk_assessment": "moderate",
    "health_grade": "B",
    "one_line_summary": "string"
  }
}
```

Status codes:

- 200 success
- 400 invalid payload or empty portfolio
- 500 backend configuration issue (for example missing or placeholder key)
- 502 Groq call failure

### POST /api/tax/analyze

Returns STCG/LTCG estimates, harvesting suggestions, and tax insights.

### POST /api/couples-planner/analyze

Returns combined metrics plus a structured merging strategy.

Request body:

```json
{
  "portfolio_1": [
    {
      "scheme": "string",
      "current_value": 0,
      "invested": 0,
      "units": 0,
      "nav": 0,
      "expense_ratio": 0,
      "category": "string",
      "purchase_date": "YYYY-MM-DD",
      "sip_cashflows": [
        { "date": "YYYY-MM-DD", "amount": 0 }
      ]
    }
  ],
  "portfolio_2": [
    {
      "scheme": "string",
      "current_value": 0,
      "invested": 0,
      "units": 0,
      "nav": 0,
      "expense_ratio": 0,
      "category": "string",
      "purchase_date": "YYYY-MM-DD",
      "sip_cashflows": [
        { "date": "YYYY-MM-DD", "amount": 0 }
      ]
    }
  ],
  "partner_1_name": "Partner 1",
  "partner_2_name": "Partner 2",
  "partner_1_tax_slab_pct": 30,
  "partner_2_tax_slab_pct": 20
}
```

Notes:

- partner_1_name, partner_2_name, partner_1_tax_slab_pct, and partner_2_tax_slab_pct are optional.
- If tax slabs are omitted, backend applies default tax-efficient ownership rules.

Response body:

```json
{
  "combined_metrics": {
    "total_current_value": 0,
    "combined_xirr_pct": 0,
    "overlap_count": 0,
    "top_categories": ["string"]
  },
  "merging_strategy": "Duplicate Fund Consolidation\\n- ...\\n\\nTax-Efficient Ownership Split\\n- ...\\n\\nRebalancing Recommendation (Target Allocation)\\n- ...\\n\\nAction Items\\n- ...",
  "key_combined_insights": ["string"],
  "action_items": ["string", "string", "string"],
  "joint_health_grade": "B"
}
```

merging_strategy is returned as sectioned text with clear headers, including:

- Duplicate Fund Consolidation
- Tax-Efficient Ownership Split
- Rebalancing Recommendation (Target Allocation)
- Action Items

### POST /api/health-score/analyze

Returns overall score and health insights.

## cURL Examples

Demo portfolio:

```bash
curl http://127.0.0.1:8001/api/demo-portfolio
```

Portfolio analyze:

```bash
curl -X POST http://127.0.0.1:8001/api/portfolio/analyze \
  -H "Content-Type: application/json" \
  -d '{"portfolio":[{"scheme":"Test Fund","current_value":100000,"invested":90000,"units":1000,"nav":100,"expense_ratio":1.0,"category":"Large Cap","purchase_date":"2023-01-01"}]}'
```

Couples planner analyze:

```bash
curl -X POST http://127.0.0.1:8001/api/couples-planner/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio_1": [{"scheme":"Fund A","current_value":150000,"invested":120000,"units":1000,"nav":150,"expense_ratio":1.2,"category":"Large Cap","purchase_date":"2021-01-01"}],
    "portfolio_2": [{"scheme":"Fund B","current_value":180000,"invested":140000,"units":1200,"nav":150,"expense_ratio":1.0,"category":"Flexi Cap","purchase_date":"2020-06-01"}],
    "partner_1_name": "A",
    "partner_2_name": "B",
    "partner_1_tax_slab_pct": 30,
    "partner_2_tax_slab_pct": 20
  }'
```

## Demo Video

https://youtu.be/KceDwBIOipk

## Reliability Notes

- Core portfolio math is deterministic and does not depend on LLM output.
- AI output is normalized before schema validation.
- Fallback analysis is returned when AI payload shape is invalid.
- Fund-level XIRR is computed from dated per-fund cashflows where provided.

## Scope and Next Steps

Current scope:

- demo-data-driven workflow
- portfolio/tax/couples/health API endpoints
- single Next.js frontend experience
- print/export support for Portfolio X-Ray report

Potential next steps:

- CAS PDF ingestion
- authentication and persistence
- historical trends and alerting
- benchmark/backtesting modules

## Disclaimer

This application is for educational purposes only and is not SEBI-registered investment advice.

## Contributors

[Agniv Dutta](https://github.com/agniv-dutta)

[Aditya Choudhuri](https://github.com/AdityaC-07)

[Ankit Datta](https://github.com/ankit-281)

[Aditya Gupta](https://github.com/adi-1080)
