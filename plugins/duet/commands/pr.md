---
description: Review code with Gemini, commit, and create a Pull Request
---

# Duet PR

Review pending git changes with Gemini AI, apply selected feedback, commit, and create a GitHub Pull Request.

## Steps

### 1-10. Review and Commit

Follow the same steps as `/duet:review`:
1. Check for changes
2. Stage all changes (excluding noise files)
3. Check diff size (warn if > 500 lines)
4. Send to Gemini for review (3-phase: Intent → Critical → Quality)
5. Parse and present feedback by priority
6. Ask user for selection
7. Apply selected changes
8. Offer another review cycle
9. Create commit (match existing commit style)
10. Confirm success

### 11. Check Branch Status

```bash
git branch --show-current
git log origin/main..HEAD --oneline
```

Ensure we're not on main/master branch. If we are:

```markdown
You're on the main branch. Would you like me to:
1. Create a new branch for this PR
2. Cancel the PR creation

Enter your choice:
```

If user chooses option 1:
```bash
git checkout -b feature/code-review-improvements
```

### 12. Push to Remote

```bash
git push -u origin $(git branch --show-current)
```

If push fails due to no upstream:
```bash
git push --set-upstream origin $(git branch --show-current)
```

### 13. Create Pull Request

Use GitHub CLI to create the PR:

```bash
gh pr create --title "refactor: apply code review feedback" --body "$(cat <<'EOF'
## Summary

This PR includes code improvements identified through AI-assisted code review.

## Changes

- Add null check to process function
- Use const for immutable variables
- [other changes...]

## Review Process

- Reviewed by: Gemini AI
- Feedback applied: 3/5 suggestions
- Review cycles: 2

## Checklist

- [x] Code reviewed by AI
- [x] Changes tested locally
- [ ] Documentation updated (if needed)

---
Generated with [Duet](https://github.com/bokuhe/claude-duet) - AI Code Review
EOF
)"
```

### 14. Confirm Success

```markdown
## Pull Request Created

**PR:** #123
**URL:** https://github.com/owner/repo/pull/123
**Title:** refactor: apply code review feedback
**Branch:** feature/code-review-improvements -> main

### Summary
- Files changed: 3
- Additions: +25
- Deletions: -10

The PR is ready for human review!
```

## Error Handling

### GitHub CLI not found
```markdown
GitHub CLI (`gh`) is not installed.

Please install it first:
\`\`\`bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
sudo apt install gh
\`\`\`

Then authenticate:
\`\`\`bash
gh auth login
\`\`\`

Alternatively, create the PR manually:
1. Go to: https://github.com/owner/repo/compare/branch-name
2. Click "Create Pull Request"
```

### Not authenticated
```markdown
GitHub CLI is not authenticated.

Please run:
\`\`\`bash
gh auth login
\`\`\`

And follow the prompts to authenticate.
```

### Push rejected
```markdown
Push was rejected. Possible reasons:

1. **Branch exists on remote**
   \`\`\`bash
   git pull --rebase origin branch-name
   git push
   \`\`\`

2. **No permission**
   Check your repository access permissions.

3. **Protected branch**
   You may need to push to a different branch.
```

### PR already exists
```markdown
A PR already exists for this branch.

**Existing PR:** #120
**URL:** https://github.com/owner/repo/pull/120

Would you like to:
1. Update the existing PR (push new commits)
2. View the existing PR
3. Cancel

Enter your choice:
```
