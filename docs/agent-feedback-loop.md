# Observation Logging And Review

Agents working in this repo learn things the instructions do not say: a rule that misled them,
code that took a workaround, a fact they had to work out. This note describes how the core
keeps that knowledge, and why it is split the way it is.

## Three ways to capture what an agent learned

| Mechanism | When knowledge is captured | Cost |
|---|---|---|
| Online observation capture | During ordinary task execution | Very low marginal cost |
| End-of-trajectory distillation | By the executing agent, before it finishes | Reuses the context it already holds |
| Retrospective trajectory mining | By another agent, after execution | Retrieves and reprocesses old context |

The executing agent already knows the task, the decisions it made, what was hard, and what the
results meant. While that is still in its context, a short structured record costs little. A
later agent reconstructing the same from a transcript pays for all of it again, and still
guesses at what mattered.

## How the core uses them

- **Online capture.** On any signal (a correction, a failed call, a guess, a workaround, far
  more reading than the task needed) the agent writes one entry to `observations/` with the
  `observation-log` skill, then keeps working.
- **Distillation, per turn.** A hook stops each turn once, unless its reply already ends with an
  `Observations:` line, and asks the agent to sweep the turn, and what it made clear about
  earlier turns, for anything it did not log. Per turn, not per session: sessions rarely end
  cleanly, and compaction drops the detail first.
- **Review, not mining.** The `observation-review` skill works on the log, not on transcripts.
  The distilled entries are its input, so it spends its effort checking claims against the
  code and finding shared causes, not re-reading old sessions.

## Design choices

- **Logging never fixes.** Patching a doc on the spot grows it one special case at a time.
  Capture and fix are separate; the fix is made in a batch, at the cause, by rewriting.
- **Recurrence is evidence.** An entry is logged even when it is already logged; how often a
  problem recurs is what the review weighs.
- **The file name is the index.** `<utc>--<subject>--<kind>.md`, so `ls` sorts and groups.
- **Hints wait.** `memory` and `opportunity` entries are acted on only when they recur or
  cluster; until then they stay in the log.
- **The archives are the test set.** Applied and dismissed entries are kept, so the logger can
  be judged against what proved worth logging.

## Open ideas

- The sweep fires on every turn, quiet ones too, since feedback often arrives in a turn with no
  tool calls. It asks an open question rather than pointing at counted events, so the agent
  looks across the task instead of at one turn's calls; whether that misses what a measured
  prompt would catch is for the archives to show.
- Mining still has a role as an occasional audit: sample transcripts to find what the logger
  missed, as a measure of its recall rather than as the main source.
