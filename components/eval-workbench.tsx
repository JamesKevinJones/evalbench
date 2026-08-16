"use client";

import { FormEvent, useMemo, useState } from "react";

type Candidate = { id: string; label: string; output: string };
type Criterion = { name: string; weight: number; description: string };
type Result = { candidateId: string; score: number; rationale: string; criteria: Record<string, number> };

const initialCandidates: Candidate[] = [
  { id: "claude", label: "Claude 3.5 Sonnet", output: "I’d start by identifying the root cause, then suggest a short, reversible fix and explain the trade-off clearly." },
  { id: "gpt", label: "GPT-4.1", output: "First, inspect the evidence. Then propose the smallest change that addresses the issue, including risks and verification steps." },
  { id: "gemini", label: "Gemini 2.0 Flash", output: "Use a simple step-by-step fix. Check the logs, make the change, and test it." },
];

const initialRubric: Criterion[] = [
  { name: "Correctness", weight: 50, description: "Technically sound and addresses the request." },
  { name: "Grounding", weight: 30, description: "Makes claims supported by the given context." },
  { name: "Clarity", weight: 20, description: "Specific, concise, and actionable." },
];

export function EvalWorkbench() {
  const [prompt, setPrompt] = useState("How should an AI assistant propose a production fix when evidence is incomplete?");
  const [judgeModel, setJudgeModel] = useState("gpt-4.1-mini");
  const [candidates, setCandidates] = useState(initialCandidates);
  const [rubric, setRubric] = useState(initialRubric);
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState("Ready to evaluate 3 candidate outputs.");
  const [running, setRunning] = useState(false);
  const ranked = useMemo(() => [...results].sort((a, b) => b.score - a.score), [results]);

  const updateCandidate = (id: string, output: string) => setCandidates((items) => items.map((item) => item.id === id ? { ...item, output } : item));
  const updateRubric = (index: number, field: keyof Criterion, value: string) => setRubric((items) => items.map((item, i) => i === index ? { ...item, [field]: field === "weight" ? Number(value) : value } : item));

  async function evaluate(event: FormEvent) {
    event.preventDefault(); setRunning(true); setStatus("Judge is scoring each candidate against the pinned rubric…");
    try {
      const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, rubric, candidates, judgeModel }) });
      const payload = await response.json() as { error?: string; mode?: string; warning?: string; results?: Result[] };
      if (!response.ok) throw new Error(payload.error ?? "Evaluation failed.");
      setResults(payload.results ?? []); setStatus(payload.warning ?? `Judge run complete using ${judgeModel}. Every score retains its rationale.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Evaluation failed."); }
    finally { setRunning(false); }
  }

  return <div className="shell">
    <header><div><p className="eyebrow">Evaluation operations</p><h1>EvalBench<span>.</span></h1></div><p className="header-note">Provider-agnostic, rubric-pinned<br />LLM-as-judge harness</p></header>
    <section className="intro"><p className="eyebrow">Run 014 · draft</p><h2>Score the answers.<br /><em>Keep the evidence.</em></h2><p>A judge can be useful without becoming an oracle. EvalBench records the rubric, candidate output, score, and reason for every decision.</p></section>
    <form onSubmit={evaluate}>
      <section className="panel setup"><div className="section-heading"><p className="eyebrow">01 / Configure</p><p>All fields are editable. The demo falls back to deterministic sample scores until you add an OpenAI key.</p></div>
        <label>Evaluation prompt<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} /></label>
        <label className="judge">Judge model<input value={judgeModel} onChange={(event) => setJudgeModel(event.target.value)} /><small>Uses OpenAI chat completions when <code>OPENAI_API_KEY</code> is set.</small></label>
      </section>
      <section className="panel"><div className="section-heading"><p className="eyebrow">02 / Rubric</p><p>Weights should total 100. The judge receives these exact criteria.</p></div>
        <div className="rubric-head"><span>Criterion</span><span>Weight</span><span>What good looks like</span></div>{rubric.map((criterion, index) => <div className="rubric-row" key={criterion.name}><input aria-label={`Criterion ${index + 1}`} value={criterion.name} onChange={(e) => updateRubric(index, "name", e.target.value)} /><input aria-label={`${criterion.name} weight`} type="number" min="0" max="100" value={criterion.weight} onChange={(e) => updateRubric(index, "weight", e.target.value)} /><input aria-label={`${criterion.name} description`} value={criterion.description} onChange={(e) => updateRubric(index, "description", e.target.value)} /></div>)}</section>
      <section className="panel"><div className="section-heading"><p className="eyebrow">03 / Candidates</p><p>Paste outputs from any provider or prompt variant.</p></div>
        <div className="candidates">{candidates.map((candidate) => <label key={candidate.id}><span>{candidate.label}</span><textarea value={candidate.output} rows={4} onChange={(event) => updateCandidate(candidate.id, event.target.value)} /></label>)}</div>
      </section>
      <button className="run" disabled={running}>{running ? "Running Judge…" : "Run Evaluation"}<span aria-hidden>↗</span></button><p className="status" aria-live="polite">{status}</p>
    </form>
    <section className="results" aria-labelledby="leaderboard"><div className="results-title"><div><p className="eyebrow">04 / Results</p><h2 id="leaderboard">Leaderboard</h2></div><p>Scores are comparable only within the same rubric and judge version.</p></div>
      {ranked.length === 0 ? <div className="empty"><strong>No run yet.</strong><span>Run the configured evaluation to see ranked candidates and per-criterion evidence.</span></div> : <ol>{ranked.map((result, index) => { const candidate = candidates.find((item) => item.id === result.candidateId); return <li key={result.candidateId}><div className="rank">0{index + 1}</div><div className="result-main"><strong>{candidate?.label}</strong><p>{result.rationale}</p><div className="criteria">{Object.entries(result.criteria).map(([name, score]) => <span key={name}>{name} <b>{score}</b></span>)}</div></div><div className="score">{result.score}<small>/100</small></div></li>; })}</ol>}
    </section>
    <footer><strong>EvalBench</strong><span>One score is a signal, not truth.</span><span>Keep a human review path for high-impact decisions.</span></footer>
  </div>;
}
