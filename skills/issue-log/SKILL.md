---
name: issue-log
description: >-
  Read as soon as you suspect a problem in this repo's instructions (a skill, AGENTS.md, the
  README, a code comment, a kit's doc header) or code (a kit, tool, or template), before you
  are sure it is one. Decides whether to log it to `issues/`, and how. Logging never fixes;
  the fix happens later, in a batch, with the `issue-fix` skill.
---

# Logging Problems

Patching a doc or a kit on the spot makes it grow one special case at a time, so it becomes
long and hard to follow. Instead, write the problem down here and keep working. `issue-fix`
later reads all entries on one doc or one piece of code together and fixes the cause.

## Is it worth logging?

You are here because something looked off. Re-read the instruction or code once, then log it
when it cost you something (a correction, a failure, a guess, a workaround) and the next agent
would likely hit it too. Do not log your own slip where the text was clear, a one-off
preference, things that work but could be nicer, or problems in tools outside this repo.

When in doubt, log it: `issue-fix` checks every entry, so a false one costs a minute, while a
missed one is lost. Do not edit the instruction or code while doing other work, unless the
user asks you to.

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

Pick the closest; the kind sorts entries, it does not decide the fix.

## The entry

One Markdown file per problem in `issues/` at the working root (the project root, or the
core's root when working on the core alone). The name carries the facts, so `ls` is the index:
`<utc>--<subject-slug>--<kind>.md`, for example `2026-11-09T1412Z--figures-skill--wrong.md` or
`2026-11-09T1530Z--diagram-js--friction.md`. Get the time from `date -u +%Y-%m-%dT%H%MZ`.

```markdown
subject: <path> › "<section heading, or function>"
kind: <kind>
surfaced: user (you were corrected) | error (something failed) | silent (you worked around it)
task: <what you were doing>
expected: <what the instruction said or implied, or what you expected the code to do>
actual: <what happened: observed facts only>
workaround: <what you did instead, or "blocked">
guess: <optional: why you think it happened, and a fix if one is obvious>
```

Before writing, `ls issues/` and skip a problem that is already logged. At the end of the
turn, tell the user in one line what you logged.
