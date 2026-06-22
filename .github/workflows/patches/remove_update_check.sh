#!/bin/bash
js="simpliplay/main.js"

# last ditch effort to remove update check in main.js
# it won't change too often anyway
sed -i '169,186d' "$js"

echo "Tried to remove update check (lines 169-186 as of latest edit)."
echo "Also note that if the line numbers are wrong, this patch needs to be edited"
cat "$js"
