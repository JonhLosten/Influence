#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  if [ "$HUSKY" = "0" ]; then
    return
  fi
  export husky_skip_init=1
  . "$0" "$@"
  exit $?
fi

if [ -f "$(dirname "$0")/husky.sh" ]; then
  . "$(dirname "$0")/husky.sh"
fi
