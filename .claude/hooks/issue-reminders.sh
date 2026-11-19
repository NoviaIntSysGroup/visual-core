#!/bin/sh
# Hook that keeps the issue-log skill in play. At session start it prints the skill into
# context. During a turn it records each tool call and failure; a new user message clears the
# record. At the end of a turn that used tools, unless the closing message already holds an
# "Issue check:" line, it stops the turn once and asks the agent to sweep it for anything to log.
dir=${CLAUDE_PROJECT_DIR:-.}
SKILL=core/skills/issue-log/SKILL.md
[ -f "$dir/$SKILL" ] || SKILL=skills/issue-log/SKILL.md

input=$(cat)
field() {
  printf '%s' "$input" | grep -o "\"$1\" *: *\"[^\"]*\"" | head -n 1 | sed 's/.*"\([^"]*\)"$/\1/'
}
event=$(field hook_event_name)
calls="${TMPDIR:-/tmp}/claude-turn-calls-$(field session_id)"

case "$event" in
  SessionStart)
    printf 'The issue-log skill (%s), loaded by a hook:\n\n' "$SKILL"
    cat "$dir/$SKILL"
    ;;
  UserPromptSubmit)
    rm -f "$calls"
    ;;
  PostToolUse)
    echo "$(field tool_name)" >> "$calls"
    ;;
  PostToolUseFailure)
    echo FAILED >> "$calls"
    ;;
  Stop)
    # Already continuing from this hook's stop: let the turn end, so it stops at most once.
    printf '%s' "$input" | grep -q '"stop_hook_active" *: *true' && exit 0
    [ -s "$calls" ] || exit 0
    # The closing message already reports the sweep (in the input, or the transcript tail).
    printf '%s' "$input" | grep -q 'Issue check:' && exit 0
    transcript=$(field transcript_path)
    [ -f "$transcript" ] && tail -n 3 "$transcript" | grep -q 'Issue check:' && exit 0
    total=$(grep -c . "$calls")
    reads=$(grep -cxE 'Read|Grep|Glob' "$calls")
    failed=$(grep -cx FAILED "$calls")
    reason="This turn made $total tool calls ($reads Read/Grep/Glob, $failed failed). Before
      finishing, go back through the turn, including the message that started it, and list
      every point where you guessed, worked something out or around, read more than the task
      needed, saw two sources disagree, or were corrected or told something no instruction
      states. Log each with the issue-log skill; for any you skip, give the reason in one
      clause. Then end with one line, Issue check: <what you logged, or nothing>."
    printf '{"decision":"block","reason":"%s"}\n' "$(printf '%s' "$reason" | tr -s '\n ' '  ')"
    ;;
esac
exit 0
