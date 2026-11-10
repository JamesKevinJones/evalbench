# Evaluation plan

EvalBench has a deterministic demo and a live judge adapter, but no measured
judge-quality dataset. Demo scores are fixtures and must never be reported as
model accuracy.

Before adding a results table, record a fixed prompt/rubric/candidate set,
model ID and version, date, commit SHA, API cost and run command. Measure:

1. **Agreement with human labels:** have two reviewers score the same answers
   blind, then compare the judge's rank order and criterion scores to their
   adjudicated labels. Report sample size and disagreements.
2. **Order stability:** rerun each candidate set in several shuffled orders and
   report how often the winner or rank order changes.
3. **Latency and cost:** log p50/p95 request latency and billed input/output
   tokens per candidate for the exact judge model and dataset.

Live API runs require paid quota and Kevin's own key. Until these measurements
exist, the README should make no judge-quality claim.
