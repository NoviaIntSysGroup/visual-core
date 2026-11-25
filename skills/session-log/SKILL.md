---
name: session-log
description: >-
  Loaded by a hook at session start. Every turn ends with a `Task:` line saying which task the
  turn worked on and what type it is. The Stop hook stores it, with the repo files the turn
  read, in `sessions/`, so later analysis can compare the docs each type of task reads with
  the docs it should.
---

# Logging Tasks

You see the whole session; whoever analyses it later sees only its records. So the decisions
that need that context are yours: which task a turn belongs to, and what type it is. The hook
records the files you read; never list them yourself.

End every turn with one line, before the `Observations:` line:

`Task: <n> · <type> · <goal>`

- **n** numbers the session's tasks from 1. A turn that continues or returns to an earlier
  task reuses its number; a turn that starts a new task takes the next one.
- **type** is the folder name of the skill that governs the task, from the skill table in
  AGENTS.md (`figures`, `slide-decks`, …), whether the turn plans the work or does it. When
  two skills govern it, name the one whose work dominates; `other` when none does.
- **goal** is what the task is trying to achieve, in one sentence a reader who saw nothing
  else would understand. Restate it every turn, sharper as the task becomes clear. Use no
  double quotes or backslashes.

For example: `Task: 2 · figures · Redraw the AI-vision timeline with evenly spaced slots`.
