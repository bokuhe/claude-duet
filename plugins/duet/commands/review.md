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

Stage all changes including new files, excluding noise files:

```bash
git add -A
git diff --cached -- . \
  ':(exclude)package-lock.json' \
  ':(exclude)yarn.lock' \
  ':(exclude)pnpm-lock.yaml' \
  ':(exclude)*.min.js' \
  ':(exclude)*.min.css' \
  ':(exclude)dist/' \
  ':(exclude)build/' \
  ':(exclude)*.generated.*'
```

This ensures meaningful code is reviewed while excluding noise files.

### 3. Check Diff Size

Check the diff size before sending to Gemini:

```bash
git diff --cached | wc -l
```

**Size Limits (due to OS command line restrictions):**

| Lines | Status | Action |
|-------|--------|--------|
| < 500 | ✅ OK | Proceed normally |
| 500-1000 | ⚠️ Warning | Windows users may experience issues |
| > 1000 | 🔴 Too Large | Recommend splitting or reviewing by file |

If diff is too large, inform the user:
```markdown
⚠️ Diff is [X] lines. This may exceed command line limits on some systems.

Options:
1. Review specific files only: `git diff --cached -- path/to/file.js`
2. Split changes into smaller commits
3. Continue anyway (may fail on Windows)
```

### 4. Send to Gemini for Review

Call Gemini CLI with the staged diff using a structured prompt:

```bash
gemini -p "Role: You are a Senior Principal Software Engineer doing a code review.

Instructions:
Perform the review in three distinct phases.

Phase 1: Intent & Risk Analysis
- Summarize what these changes are trying to achieve
- Identify the most complex/risky parts of this diff
- Rate overall risk: Low, Medium, or High

Phase 2: Critical Audit (Priority: High)
Scan strictly for:
- Security vulnerabilities (injection, auth bypass, exposed secrets)
- Logic errors (null pointer, off-by-one, incorrect state handling)
- Performance regressions (N+1 queries, memory leaks)
- Breaking changes or side effects

Phase 3: Code Quality (Priority: Low)
- Naming conventions
- Code duplication
- Style improvements

Output Format:
For each issue, specify:
- Severity: Critical, Warning, or Nitpick
- Category: Security, Logic, Performance, or Style
- File and description
- Suggested fix with code

Git Diff:
$(git diff --cached -- . ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml' ':(exclude)*.min.js' ':(exclude)*.min.css')"
```

### 5. Parse and Present Feedback

Organize Gemini's response by priority:

```markdown
## Gemini Review Results

**Risk Level:** Medium
**Summary:** Adding user authentication with JWT tokens

---

### Critical Issues

#### #1. [Security] SQL Injection Risk

**Gemini says:** User input is directly concatenated into query

**Current code:**
\`\`\`javascript
db.query(`SELECT * FROM users WHERE id = ${userId}`)
\`\`\`

**Suggested fix:**
\`\`\`javascript
db.query('SELECT * FROM users WHERE id = ?', [userId])
\`\`\`

> Assessment: Valid - must fix

---

### Warnings

#### #2. [Logic] Missing null check
...

---

### Nitpicks

#### #3. [Style] Use const instead of let
...
```

### 6. Ask User for Selection

```markdown
## Which items would you like to apply?

| # | Severity | Category | Description |
|---|----------|----------|-------------|
| 1 | Critical | Security | SQL Injection Risk |
| 2 | Warning | Logic | Missing null check |
| 3 | Nitpick | Style | Use const instead of let |

Enter your selection (e.g., "1, 2", "all", or "none"):
```

Wait for user input before proceeding.

### 7. Apply Selected Changes

For each selected item:
1. Read the relevant file
2. Apply the fix using Edit tool
3. Confirm the change was made

### 8. Offer Another Review Cycle

```markdown
Changes applied. Would you like to:
1. Run another Gemini review (recommended after changes)
2. Proceed to commit

Enter your choice:
```

If user wants another review, go back to Step 3 with context about what was changed.

### 9. Create Commit

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
git commit -m "fix: address security and code quality issues

- Fix SQL injection vulnerability in user query
- Add null check to prevent runtime errors
- Use const for immutable variables

Reviewed-by: Gemini AI"
```

### 10. Confirm Success

```markdown
## Commit Created

\`\`\`
[branch-name abc1234] fix: address security and code quality issues
 3 files changed, 15 insertions(+), 8 deletions(-)
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
