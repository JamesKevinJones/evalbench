# EvalBench

A provider-agnostic LLM-as-judge harness for comparing model or prompt outputs against a pinned rubric. It ranks candidates while preserving the rationale and per-criterion evidence behind every score.

## What it refuses

**EvalBench does not treat one judge score as ground truth.** Scores are explicitly scoped to the same prompt, rubric, and judge model. For consequential decisions, use multiple judge runs and retain a human-review path.

## Run locally

```bash
npm install
npm run dev
```

Without a key, the product runs in clearly marked deterministic demo mode. To call a real judge, set `OPENAI_API_KEY` and select an available OpenAI chat-completions model.

```bash
$env:OPENAI_API_KEY="your-key" # PowerShell
npm run dev
```

## Current scope

- Editable evaluation prompt, rubric, weights, and candidate outputs
- Auditable ranked results with per-criterion scores and judge rationales
- A server-side OpenAI judge adapter, temperature pinned to 0
- Deterministic demo mode for a useful zero-credential walkthrough

Provider adapters are intentionally isolated in `app/api/evaluate/route.ts`; the next extension is adapters for Anthropic and Gemini, plus persistent run history and multi-judge variance.
