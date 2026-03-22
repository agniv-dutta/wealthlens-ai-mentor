# WealthLens AI Mentor

This repo now contains:

- `frontend/` - Next.js app
- `backend/` - FastAPI app with Groq-backed portfolio analysis
- Existing Vite app at root (`src/`) kept for backward compatibility during migration

## Backend Setup (FastAPI)

1. Go to backend folder:

```bash
cd backend
```

2. Create and activate virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate     # Windows PowerShell
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variable:

```bash
# backend/.env
GROQ_API_KEY=your_key_here
```

5. Start API server:

```bash
uvicorn main:app --reload
```

## Frontend Setup (Next.js)

1. Go to frontend folder:

```bash
cd frontend
```

2. Install dependencies and run:

```bash
npm install
npm run dev
```

3. Optional env for frontend:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Required Commands (as requested)

```bash
pip install -r requirements.txt
uvicorn main:app --reload
npm install
npm run dev
```

## Demo Data

Pre-loaded hackathon portfolio is in:

- `backend/demo_data.py`

Use the frontend button `Load Demo & Analyze` to execute end-to-end flow:

1. Fetch demo portfolio from backend
2. Compute deterministic metrics (XIRR, ROI, fees, allocation)
3. Call Groq LLM API on backend for recommendations
4. Render results in UI