import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as pause } from 'node:timers/promises';
import test from 'node:test';

test('the evaluate API validates inputs and labels deterministic demo scores', async () => {
  const socket = createServer();
  await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));

  const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    env: { ...process.env, OPENAI_API_KEY: '' },
    stdio: 'ignore',
  });
  const url = `http://127.0.0.1:${port}/api/evaluate`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (app.exitCode !== null) throw new Error(`Next.js exited with code ${app.exitCode}`);
      try {
        await fetch(url);
        ready = true;
        break;
      } catch {
        await pause(500);
      }
    }
    assert.ok(ready, 'Next.js did not start within 30 seconds');

    const post = (body) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const invalid = await post({ prompt: '', rubric: [], candidates: [] });
    assert.equal(invalid.status, 400);
    assert.match((await invalid.json()).error, /prompt/);

    const rubric = [{ name: 'Correctness', weight: 100, description: 'Accurate' }];
    const candidates = ['a', 'b', 'c'].map((id) => ({ id, label: id, output: id }));
    const response = await post({ prompt: 'Test', rubric, candidates, judgeModel: 'unused' });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.mode, 'demo');
    assert.match(result.warning, /deterministic demo data/);
    assert.deepEqual(result.results.map(({ candidateId, score }) => [candidateId, score]), [
      ['a', 91], ['b', 84], ['c', 77],
    ]);
    assert.deepEqual(result.results.map(({ criteria }) => criteria.Correctness), [92, 85, 78]);
    assert.ok(result.results.every(({ rationale }) => rationale.includes('Demo result')));
  } finally {
    app.kill();
  }
});
