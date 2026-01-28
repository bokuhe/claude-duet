---
description: Review code with Gemini and commit
---

# Duet Review

Review pending git changes with Gemini AI, apply selected feedback, and create a commit.

## Steps

### 0. Load Configuration

Check for `.duetrc.json` in project root:

```bash
cat .duetrc.json 2>/dev/null || echo '{}'
```

**Default configuration:**
```json
{
  "exclude": [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "*.min.js",
    "*.min.css",
    "dist/",
    "build/",
    "*.generated.*"
  ],
  "reviewPrompt": "",
  "diffLimit": 500
}
```

Merge user config with defaults. Use these settings throughout the review:
- `exclude`: Patterns to exclude from diff (merged with defaults)
- `reviewPrompt`: Additional instructions appended to Gemini prompt
- `diffLimit`: Line count threshold for size warnings

### 1. Check for Changes

```bash
git status
```

If no changes exist (no modified or untracked files), inform the user and stop.

### 2. Stage All Changes

Stage all changes including new files, excluding noise files from config:

```bash
git add -A
```

Build exclude arguments dynamically from the configuration's `exclude` array. For each pattern in the exclude list, format as `':(exclude)pattern'` and append to the git diff command:

```bash
# Example with default excludes:
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

This ensures meaningful code is reviewed while excluding noise files defined in config.

### 3. Check Diff Size

Check the diff size before sending to Gemini:

```bash
git diff --cached | wc -l
```

Use the `diffLimit` from configuration (default: 500) to determine thresholds:

**Size Limits (due to OS command line restrictions):**

| Lines | Status | Action |
|-------|--------|--------|
| < diffLimit | ✅ OK | Proceed normally |
| diffLimit to 2×diffLimit | ⚠️ Warning | Windows users may experience issues |
| > 2×diffLimit | 🔴 Too Large | Recommend splitting or reviewing by file |

If diff is too large, inform the user:
```markdown
⚠️ Diff is [X] lines. This may exceed command line limits on some systems.

Options:
1. Review specific files only: `git diff --cached -- path/to/file.js`
2. Split changes into smaller commits
3. Continue anyway (may fail on Windows)
```

### 4. Send to Gemini for Review

Call Gemini CLI with the staged diff using a structured prompt that requests JSON output.

Build the exclude arguments from config and construct the prompt:

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

[ADDITIONAL_INSTRUCTIONS_FROM_CONFIG]

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  \"riskLevel\": \"Low|Medium|High\",
  \"summary\": \"Brief description of what changes achieve\",
  \"issues\": [
    {
      \"id\": 1,
      \"severity\": \"Critical|Warning|Nitpick\",
      \"category\": \"Security|Logic|Performance|Style\",
      \"file\": \"path/to/file.js\",
      \"line\": 42,
      \"title\": \"Issue title\",
      \"description\": \"What is wrong and why\",
      \"currentCode\": \"the problematic code snippet\",
      \"suggestedFix\": \"the corrected code snippet\"
    }
  ]
}

If no issues are found, return an empty issues array.
Do not include any text outside the JSON object.

Git Diff:
$(git diff --cached -- . [EXCLUDE_ARGS_FROM_CONFIG])"
```

Replace `[ADDITIONAL_INSTRUCTIONS_FROM_CONFIG]` with the `reviewPrompt` value from config (if provided).
Replace `[EXCLUDE_ARGS_FROM_CONFIG]` with the dynamically built exclude patterns.

### 5. Parse and Present Feedback

Parse the JSON response from Gemini. If the response is not valid JSON, attempt to extract JSON from the response or fall back to treating it as unstructured text.

**Important:** Translate Gemini's response into the language you're currently using with the user. If the conversation is in Korean, present the results in Korean. If in Japanese, present in Japanese, etc.

Organize the parsed JSON response by severity (Critical → Warning → Nitpick):

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
