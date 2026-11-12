---
name: issue-log
description: >-
  Read on any signal while working in this repo, before deciding it was nothing: a user
  correction, a failed call, a guess, a workaround, two sources that disagree, a result that
  surprised you, reading far more than the task needed, or something you had to work out or be
  told that no instruction states. Decides whether to log it to `issues/`, and how. Logging
  never fixes; the fix happens later, in a batch, with the `issue-fix` skill.
---

# Logging Problems

Patching a doc or code on the spot makes it grow one special case at a time, so it becomes
long and hard to follow. Instead, write the problem down here and keep working, unless the
user asks you to fix it.

## Is it worth logging?

You are here on one of the signals in the description. Re-read the instruction or code once,
then log it when it cost you something and the next agent would likely pay the same cost. Do
not log your own slip where the text was clear, a one-off preference, or problems in tools
outside this repo.

The cost need not come from a fault. When no instruction covers what you learned, whether you
worked it out or were told by the user or the system, log it as `memory`; when the gap is in an
instruction you were following, it is `missing`. A `memory` entry is only a hint; `issue-fix`
weighs it with the others and decides whether anything is worth consolidating, and how.

When in doubt, always log it: `issue-fix` checks every entry and decides what deserves a fix.

## The kind

| Kind | The subject… |
|---|---|
| `wrong` | states something false, or out of date |
| `missing` | does not cover what you needed |
| `unclear` | can be read more than one way, or is too dense to follow |
| `conflict` | disagrees with another instruction, or with the code |
| `misplaced` | exists, but not where you were sent to look |
| `bug` | is code that fails, or does what no instruction says it does |
| `friction` | is code that works, but only with a workaround |
| `scattered` | is code that works, but takes far more reading to understand than it should |
| `memory` | is knowledge you worked out or were told that a note would have handed you |

Pick the closest; the kind sorts entries, it does not decide the fix.

## The entry

One Markdown file per problem in `issues/` at the repo root. The name carries the facts, so
`ls` is the index: `<utc>--<subject-slug>--<kind>.md`, for example
`2026-11-09T1412Z--figures-skill--wrong.md` or `2026-11-09T1530Z--blog-mdx--memory.md`. Get the
time from `date -u +%Y-%m-%dT%H%MZ`.

```markdown
subject: <path> › "<section heading, or function>"   (memory: the area the knowledge is about)
kind: <kind>
surfaced: user (you were corrected) | error (something failed) | silent (you worked around it)
task: <what you were doing>
expected: <what the instruction said or implied, or what you expected the code to do>
actual: <what happened: observed facts only>
workaround: <what you did instead, or "blocked">
guess: <optional: why you think it happened, and a fix if one is obvious>
```

A `memory` entry replaces `expected`, `actual` and `workaround` with:

```markdown
cost: <what not knowing it cost: files read, calls made, dead ends, a correction, a failure>
learned: <what you learned, in a sentence or two>
```

Before writing, `ls issues/` and skip a problem that is already logged. Log a `memory` entry
even when a similar one exists: how often it recurs is what `issue-fix` weighs. At the end of
the turn, tell the user in one line what you logged.
