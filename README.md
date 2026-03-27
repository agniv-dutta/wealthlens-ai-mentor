# WealthLens AI Mentor

![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-009688?logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b--versatile-F55036)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)

WealthLens AI Mentor is a practical AI-assisted portfolio intelligence app for Indian mutual fund users.

It combines deterministic financial calculations (XIRR, ROI, fees, overlap, asset allocation) with LLM-generated recommendations so users can move from raw holdings to actionable decisions quickly.

## What Problem We Are Solving

Retail investors often struggle with:

- Understanding real performance beyond simple returns.
- Detecting portfolio concentration and category overlap.
- Estimating tax implications and harvesting opportunities.
- Getting practical rebalancing suggestions in plain language.
- Combining two portfolios (for couples/families) into a coherent strategy.

This project solves that by exposing a backend API that computes reliable metrics and then enriches them with Groq-powered advisory summaries.

## What This App Does

- Portfolio X-Ray:
	- Computes deterministic metrics from holdings and purchase dates.
	- Generates AI insights, health grade, and rebalancing plan.
- Tax Wizard:
	- Estimates STCG and LTCG.
	- Flags potential tax harvesting ideas.
	- Produces AI tax insights and tax efficiency grade.
- Couple's Planner:
	- Merges two portfolios.
	- Computes combined metrics and overlap.
	- Produces AI merger strategy and joint grade.
- Money Health Score:
	- Produces a holistic score and supporting insights.

## Architecture Overview

- Backend: FastAPI service in `backend/`.
- LLM provider: Groq API using `llama-3.3-70b-versatile`.
- Frontend: Next.js UI in `frontend/`.

Request flow:

1. Frontend requests demo portfolio from backend.
2. Frontend sends portfolio to analysis endpoints.
3. Backend computes deterministic metrics.
4. Backend calls Groq for narrative recommendations.
5. Backend normalizes/fallbacks malformed model output for robustness.
6. Frontend renders cards, charts, and insight panels.

## Repository Structure

```text
wealthlens-ai-mentor/
	backend/                # FastAPI + Groq logic
	frontend/               # Next.js app
	README.md
```

## Quick Start

### 1) Backend (FastAPI)

```bash
cd backend
python -m venv .venv
```

Activate venv:

```bash
# Windows PowerShell
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

Install and run:

```bash
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### 2) Next.js Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
```

Run:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Environment Variables

### Backend

Create `backend/.env`:

```env
GROQ_API_KEY=your_real_groq_api_key
```

Notes:

- Do not commit real secrets.
- `.env` and local env files are gitignored.

### Frontend (Next.js)

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
```

## API Documentation

Base URL (local):

`http://127.0.0.1:8001`

### Health

#### GET `/health`

Purpose:
- Liveness check for backend.

Response:

```json
{
	"ok": true
}
```

---

### Demo Data Endpoints

#### GET `/api/demo-portfolio`

Purpose:
- Returns primary demo holdings and computed deterministic metrics.

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
			"purchase_date": "YYYY-MM-DD"
		}
	],
	"metrics": {
		"total_current_value": 0,
		"total_invested_value": 0,
		"absolute_gain": 0,
		"roi_pct": 0,
		"annual_fees": 0,
		"xirr_pct": 0,
		"asset_allocation": [
			{ "name": "string", "value": 0, "weight_pct": 0 }
		],
		"overlap_categories": ["string"]
	}
}
```

#### GET `/api/demo-secondary-portfolio`

Purpose:
- Returns secondary demo portfolio used by Couple's Planner.

Response:
- Same shape as `/api/demo-portfolio`.

---

### Portfolio X-Ray

#### POST `/api/portfolio/analyze`

Purpose:
- Computes deterministic metrics and AI advisory output.

Request body:

```json
{
	"portfolio": [
		{
			"scheme": "Parag Parikh Flexi Cap",
			"current_value": 125000,
			"invested": 100000,
			"units": 1500,
			"nav": 83.33,
			"expense_ratio": 1.2,
			"category": "Flexi Cap",
			"purchase_date": "2022-01-15"
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

- `200`: success.
- `400`: invalid payload or empty portfolio.
- `500`: missing/placeholder API key.
- `502`: Groq call failure.

---

### Tax Wizard

#### POST `/api/tax/analyze`

Purpose:
- Returns tax estimates, harvesting suggestions, and AI tax guidance.

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
			"purchase_date": "YYYY-MM-DD"
		}
	]
}
```

Response body:

```json
{
	"stcg_estimated_inr": 0,
	"ltcg_estimated_inr": 0,
	"tax_harvesting_suggestions": [
		{
			"scheme": "string",
			"harvestable_loss_inr": 0,
			"reason": "string"
		}
	],
	"tax_efficiency_grade": "B",
	"key_tax_insights": ["string"]
}
```

---

### Couple's Planner

#### POST `/api/couples-planner/analyze`

Purpose:
- Combines two portfolios and returns strategy + insights.

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
			"purchase_date": "YYYY-MM-DD"
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
			"purchase_date": "YYYY-MM-DD"
		}
	]
}
```

Response body:

```json
{
	"combined_metrics": {
		"total_current_value": 0,
		"combined_xirr_pct": 0,
		"overlap_count": 0,
		"top_categories": ["string"]
	},
	"merging_strategy": "string",
	"key_combined_insights": ["string"],
	"joint_health_grade": "B"
}
```

---

### Money Health Score

#### POST `/api/health-score/analyze`

Purpose:
- Returns a consolidated health score and readiness indicators.

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
			"purchase_date": "YYYY-MM-DD"
		}
	]
}
```

Response body:

```json
{
	"overall_health_score": 72,
	"emergency_fund_status": "Partial",
	"insurance_coverage_score": 60,
	"retirement_readiness_pct": 45.0,
	"health_insights": ["string", "string", "string"]
}
```

## cURL Examples

### Demo Portfolio

```bash
curl http://127.0.0.1:8001/api/demo-portfolio
```

### Portfolio Analysis

```bash
curl -X POST http://127.0.0.1:8001/api/portfolio/analyze \
	-H "Content-Type: application/json" \
	-d '{"portfolio":[{"scheme":"Test Fund","current_value":100000,"invested":90000,"units":1000,"nav":100,"expense_ratio":1.0,"category":"Large Cap","purchase_date":"2023-01-01"}]}'
```

## Notes on Reliability

- The backend uses deterministic math for core metrics.
- LLM output is normalized before validation to handle schema drift.
- If model JSON is malformed, a fallback analysis is generated to avoid frontend breakage.

## Current Scope and Future Extensions

Current scope:

- Demo-data-driven workflow.
- Portfolio/tax/couples/health analysis APIs.
- Two frontend surfaces (Next and Vite).

Future extensions:

- CAS PDF parser ingestion pipeline.
- User auth and portfolio persistence.
- Historical trend charts and alerts.
- Backtesting and benchmark comparison.