import { NextResponse } from "next/server";

type Candidate = { id: string; label: string; output: string };
type Criterion = { name: string; weight: number; description: string };

function parseJson(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? value;
  return JSON.parse(fenced.trim()) as { score: number; rationale: string; criteria?: Record<string, number> };
}

export async function POST(request: Request) {
  const body = await request.json() as {
    prompt: string; rubric: Criterion[]; candidates: Candidate[]; judgeModel: string;
  };

  if (!body.prompt || !body.rubric?.length || !body.candidates?.length) {
    return NextResponse.json({ error: "Add a prompt, at least one rubric criterion, and one candidate output." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      mode: "demo",
      warning: "No OPENAI_API_KEY found. Scores are deterministic demo data; add a key to run a real judge.",
      results: body.candidates.map((candidate, index) => ({
        candidateId: candidate.id,
        score: Math.max(54, 91 - index * 7),
        rationale: "Demo result — configure OPENAI_API_KEY to generate an auditable judge rationale.",
        criteria: Object.fromEntries(body.rubric.map((criterion, criterionIndex) => [criterion.name, Math.max(50, 92 - index * 7 - criterionIndex * 3)])),
      })),
    });
  }

  const rubric = body.rubric.map((criterion) => `- ${criterion.name} (weight ${criterion.weight}): ${criterion.description}`).join("\n");
  const results = await Promise.all(body.candidates.map(async (candidate) => {
    const judgePrompt = `You are an exacting LLM evaluator. Score the candidate answer to the user prompt against this rubric.\n\nUSER PROMPT:\n${body.prompt}\n\nRUBRIC:\n${rubric}\n\nCANDIDATE (${candidate.label}):\n${candidate.output}\n\nReturn JSON only: {"score": number from 0 to 100, "rationale": "brief evidence-based rationale", "criteria": {"criterion name": number from 0 to 100}}. Do not reward style over correctness.`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: body.judgeModel, temperature: 0, messages: [{ role: "user", content: judgePrompt }], response_format: { type: "json_object" } }),
    });
    if (!response.ok) throw new Error(`Judge request failed (${response.status}).`);
    const payload = await response.json() as { choices: Array<{ message: { content: string } }> };
    const judge = parseJson(payload.choices[0]?.message.content ?? "");
    return { candidateId: candidate.id, score: judge.score, rationale: judge.rationale, criteria: judge.criteria ?? {} };
  }));

  return NextResponse.json({ mode: "live", results });
}
