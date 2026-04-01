#!/bin/bash
# Save a local snapshot of all current content before editing.
# Usage: ./scripts/snapshot.sh
# Or with a note: ./scripts/snapshot.sh "before rewriting Bamberg intro"

NOTE=${1:-"manual snapshot"}
git add -A
git commit -m "snapshot: $(date '+%Y-%m-%d %H:%M') — $NOTE"
echo ""
echo "Snapshot saved. To restore a file later:"
echo "  git log --oneline                          # find the commit hash"
echo "  git checkout <hash> -- docs/<file>.html    # restore that file"
