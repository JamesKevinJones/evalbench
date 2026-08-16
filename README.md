# EvalBench

**Compare LLM outputs against a rubric — and keep the evidence behind every score.**

EvalBench is a lightweight LLM-as-judge harness for evaluating answers from any
model, provider, or prompt variant. Paste candidate outputs, define the criteria
that matter, and run an independent judge to produce a ranked leaderboard with
per-criterion scores and short rationales.

It is built for the evaluation question that matters after a demo works:
**which answer is actually better, by a standard you can inspect?**

![Next.js](https://img.shields.io/badge/Next.js-16-111111?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-6A5ACD)

## Why EvalBench

Model quality is not a single benchmark number. It depends on your prompt,
your task, and what you decide counts as a good answer. EvalBench keeps those
inputs visible:

- **Compare anything.** Candidate outputs can come from any provider, model,
  prompt version, or manual experiment.
- **Pin the rubric.** Give criteria a name, weight, and concrete definition of
  what good looks like before running the judge.
- **Keep the reasoning.** Every result includes an overall score, a
  per-criterion breakdown, and the judge's rationale.
- **Stay usable without credentials.** A clearly labelled deterministic demo
  mode makes the interface explorable without an API key.

## The constraint

> **EvalBench will not treat one judge score as ground truth.**

Scores only have meaning within the same evaluation prompt, rubric, and judge
model. A single LLM judge is a useful signal, not an objective measurement.
For high-impact decisions, run multiple judge passes, inspect disagreements,
and retain a human review path.

This constraint is a product decision, not fine print: the UI labels score
comparability explicitly and preserves the rationale needed to challenge a
result.

## What it does

1. Write the task prompt being evaluated.
2. Define a weighted rubric — for example Correctness (50), Grounding (30),
   and Clarity (20).
3. Paste outputs from competing models or prompt variants.
4. Send each candidate to a separate judge model with temperature pinned to 0.
5. Review the leaderboard, rationale, and criterion-level evidence.

```text
Candidate outputs ─┐
Prompt + rubric ──┼──> judge adapter ──> score + rationale ──> leaderboard
Judge model ──────┘
```

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer

```bash
git clone https://github.com/JamesKevinJones/evalbench.git
cd evalbench
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo mode

EvalBench works out of the box with deterministic sample scores. This is useful
for testing the workflow and viewing the result layout. The page makes it clear
that these are demo scores — they are not LLM judgments.

### Run a live judge

The current server-side adapter uses the OpenAI Chat Completions API. Set an
API key before starting the server:

```powershell
$env:OPENAI_API_KEY="your-key" # PowerShell
npm run dev
```

Then enter an available model name in the **Judge model** field, such as
`gpt-4.1-mini`. The key stays on the server: it is never sent to the browser.

> Never commit `.env` files or API keys. `.gitignore` already excludes them.

## Evaluation contract

For every candidate, the judge receives:

- the evaluation prompt;
- the exact rubric criteria, their definitions, and their weights;
- the candidate's label and full output; and
- a strict JSON response contract containing an overall `score`, `rationale`,
  and `criteria` map.

The judge is instructed to return a 0–100 score and evidence-based rationale,
without rewarding style over correctness. The model's response is parsed on the
server and returned to the UI as one record per candidate.

### Score interpretation

Only compare results produced with the same:

| Keep constant | Why it matters |
| --- | --- |
| Evaluation prompt | A different task changes what is being measured. |
| Rubric and weights | Changing the definition of good invalidates a direct comparison. |
| Judge model | Different judges have different preferences and calibration. |
| Candidate set and context | Order and available context can affect an LLM judge. |

The rubric weights are part of the judge's instructions. This first release
does not independently recompute a weighted aggregate, so the judge's returned
overall score remains visible as a judgment rather than a falsely precise
calculation.

## Architecture

```text
app/page.tsx                         Product entry point
components/eval-workbench.tsx        Editable setup + results interface
app/api/evaluate/route.ts            Server-side judge adapter and JSON parsing
app/globals.css                      Responsive, accessible product UI
```

`app/api/evaluate/route.ts` is the adapter boundary. The UI does not know which
provider supplied a candidate output, and future Anthropic, Gemini, or local
model adapters can be added there without changing the evaluation workflow.

## Current scope

- Editable evaluation prompt, rubric, weights, and candidate outputs
- Candidate comparison across providers and prompt variants
- Auditable leaderboard with rationales and per-criterion scores
- OpenAI judge adapter with `temperature: 0`
- Deterministic zero-credential demo mode
- Responsive layout, keyboard-focus states, and status announcements

## Roadmap

- [ ] Anthropic, Gemini, and OpenAI-compatible judge adapters
- [ ] Saved runs with rubric and judge-model versioning
- [ ] Multi-judge consensus and variance reporting
- [ ] Pairwise judging and blind candidate labels
- [ ] JSON/CSV export and CI-friendly CLI mode
- [ ] Human adjudication queue for disputed results

## Development

```bash
npm run lint
npm run build
```

Both commands pass on the initial release.

## Limitations

LLM-as-judge can be biased toward verbosity, its own writing style, and certain
answer orders. Temperature 0 improves repeatability but does not remove those
limitations. Treat EvalBench as an evaluation aid, validate it against human
labels, and do not use a single automated score as the sole basis for a
high-stakes decision.

## License

MIT
