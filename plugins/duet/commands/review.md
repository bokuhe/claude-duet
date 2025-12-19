---
description: Review code with Gemini and commit
---

# Duet Review

Review pending git changes with Gemini AI, apply selected feedback, and create a commit.

## Steps

### 1. Check for Changes

```bash
git status
```

If no changes exist (no modified or untracked files), inform the user and stop.

### 2. Stage All Changes

Stage all changes including new files to capture everything:

```bash
git add -A
git diff --cached
```

This ensures both modified files AND new files are included in the review.

### 3. Send to Gemini for Review

Call Gemini CLI with the staged diff:

```bash
gemini -p "Please review this git diff. For each issue found, specify:
- Type: Bug, Improvement, Security, Performance, or Style
- Description: What the issue is
- Suggestion: How to fix it

Git diff:
$(git diff --cached)"
```

### 4. Parse and Present Feedback

Organize Gemini's response into a structured format:

```markdown
## Gemini Review Results

### #1. [Bug] Missing null check

**Gemini says:** The function doesn't handle null input

**Current code:**
\`\`\`typescript
function process(data) {
    return data.value;
}
\`\`\`

**Suggested fix:**
\`\`\`typescript
function process(data) {
    if (!data) return null;
    return data.value;
}
\`\`\`

> Assessment: Valid - recommended. This prevents runtime errors.

---

### #2. [Improvement] Use const instead of let

**Gemini says:** Variable is never reassigned

**Current code:**
\`\`\`typescript
let result = calculate();
\`\`\`

**Suggested fix:**
\`\`\`typescript
const result = calculate();
\`\`\`

> Assessment: Valid. Minor improvement for code clarity.
```

### 5. Ask User for Selection

```markdown
## Which items would you like to apply?

| # | Type | Description |
|---|------|-------------|
| 1 | Bug | Missing null check |
| 2 | Improvement | Use const instead of let |

Enter your selection (e.g., "1, 2", "all", or "none"):
```

Wait for user input before proceeding.

### 6. Apply Selected Changes

For each selected item:
1. Read the relevant file
2. Apply the fix using Edit tool
3. Confirm the change was made

### 7. Offer Another Review Cycle

```markdown
Changes applied. Would you like to:
1. Run another Gemini review (recommended after changes)
2. Proceed to commit

Enter your choice:
```

If user wants another review, go back to Step 2 with context:
```bash
gemini -p "I've applied these changes based on your previous review:
- Fixed null check in process()
- Changed let to const

Please review the updated code for any remaining issues:
$(git diff HEAD)"
```

### 8. Create Commit

First, check the existing commit style:

```bash
git log --oneline -10
```

- If commits exist: Match the tone and format of existing commits
- If no commits: Use conventional commit format (feat:, fix:, refactor:, etc.)

Generate a commit message that:
1. Follows the project's existing commit style
2. Summarizes the applied changes
3. Credits the AI review process

Example:
```bash
git add -A
git commit -m "refactor: apply code review feedback

- Add null check to process function
- Use const for immutable variables

Reviewed-by: Gemini AI"
```

### 9. Confirm Success

```markdown
## Commit Created

\`\`\`
[branch-name abc1234] refactor: apply code review feedback
 2 files changed, 10 insertions(+), 5 deletions(-)
\`\`\`

Review cycle complete. Your changes have been committed.
```

## Error Handling

### Gemini CLI not found
```markdown
Gemini CLI is not installed or not in PATH.

Please install it first (requires Node.js 20+):
\`\`\`bash
npm install -g @google/gemini-cli
\`\`\`

Or try with npx:
\`\`\`bash
npx @google/gemini-cli
\`\`\`
```

### No changes to review
```markdown
No pending changes found.

Make some code changes first, then run `/duet:review` again.
```

### Commit fails
```markdown
Commit failed. Common reasons:
- Pre-commit hooks rejected the changes
- Git configuration issue

Please check the error above and try again.
```
