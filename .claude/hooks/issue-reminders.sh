#!/bin/sh
# Hook that reminds the agent to read the issue-log skill. It reads the hook input on stdin
# and answers by its event: a failed tool call, a new user message (which also resets the
# read count), or a read call, which counts and reminds once when a turn reaches READ_LIMIT.
SKILL=core/skills/issue-log/SKILL.md
READ_LIMIT=15

input=$(cat)
field() {
  printf '%s' "$input" | grep -o "\"$1\" *: *\"[^\"]*\"" | head -n 1 | sed 's/.*"\([^"]*\)"$/\1/'
}
event=$(field hook_event_name)
count_file="${TMPDIR:-/tmp}/claude-read-count-$(field session_id)"

# Joins a reminder written across lines into one line, and prints it as hook output.
remind() {
  text=$(printf '%s' "$1" | tr -s '\n ' '  ')
  printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}\n' \
    "$event" "$text"
}

case "$event" in
  PostToolUseFailure)
    remind "A tool call failed. If an instruction or the code in this repo caused it, read
      $SKILL before moving on."
    ;;
  UserPromptSubmit)
    rm -f "$count_file"
    remind "Read $SKILL if this message corrects you or tells you something no instruction
      states, or if your last turn had two sources that disagreed, a surprising result, or
      anything you had to guess, work around, or work out."
    ;;
  PostToolUse)
    count=$(( $(cat "$count_file" 2>/dev/null || echo 0) + 1 ))
    echo "$count" > "$count_file"
    if [ "$count" -eq "$READ_LIMIT" ]; then
      remind "You have made $READ_LIMIT read calls for this task. If the code took more
        reading than the task should need, read $SKILL and consider a \`scattered\` entry
        before moving on."
    fi
    ;;
esac
exit 0
