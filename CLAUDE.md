# CLAUDE.md - Duet Plugin Development Guide

## Project Overview

**Duet** is a Claude Code plugin that enables AI-powered code review through collaboration between Claude Code and Gemini CLI. The plugin orchestrates a "duet" workflow where Gemini performs code review and Claude applies the feedback.

### Core Concept

```
Developer writes code → Claude stages diff → Gemini reviews → Claude presents & applies → Commit/PR
```

## Project Structure

```
claude-duet/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace registration (name: duet-marketplace)
├── plugins/
│   └── duet/
│       ├── .claude-plugin/
│       │   └── plugin.json   # Plugin metadata (name: duet, version: 0.1.x)
│       └── commands/
│           ├── review.md     # /duet:review - Review + Commit workflow
│           └── pr.md         # /duet:pr - Review + Commit + PR workflow
├── CLAUDE.md                 # This file
├── README.md                 # User-facing documentation
├── LICENSE                   # MIT License
└── .gitignore
```

## Commands

### /duet:review

**Purpose:** Code review workflow ending with a commit

**Flow:**
1. Check for uncommitted changes (`git status`)
2. Stage all changes excluding noise files (`git add -A`)
3. Check diff size (warn if >500 lines for Windows compatibility)
4. Send staged diff to Gemini CLI for 3-phase review
5. Parse and present feedback (translated to user's conversation language)
6. User selects which suggestions to apply
7. Apply selected fixes using Edit tool
8. Offer another review cycle if changes were made
9. Create commit matching project's existing commit style
10. Confirm success

### /duet:pr

**Purpose:** Full workflow from review to PR creation

**Flow:**
1-10. Same as `/duet:review`
11. Check branch status (prevent commits to main/master)
12. Push to remote with upstream tracking
13. Create PR using `gh pr create`
14. Display PR URL and summary

## Configuration

Create `.duetrc.json` in your project root to customize behavior:

```json
{
  "exclude": ["custom-file.js", "legacy/**"],
  "reviewPrompt": "Focus on security issues. Ignore style nitpicks.",
  "diffLimit": 1000
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `exclude` | string[] | (see below) | Files/patterns to exclude from review |
| `reviewPrompt` | string | `""` | Additional instructions appended to Gemini prompt |
| `diffLimit` | number | `500` | Line count threshold for size warnings |

**Default exclude patterns:**
```json
[
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "*.min.js",
  "*.min.css",
  "dist/",
  "build/",
  "*.generated.*"
]
```

User-specified excludes are merged with defaults, not replaced.

## Development Guidelines

### Command File Format

Commands use markdown with YAML frontmatter:

```markdown
---
description: Short description shown in /help
---

# Command Title

Detailed instructions for Claude to follow...

## Steps

### 1. Step Name

Instructions and code blocks...
```

### Key Principles

1. **Noise File Exclusion**
   Always exclude lock files and build artifacts from review:
   ```bash
   ':(exclude)package-lock.json'
   ':(exclude)yarn.lock'
   ':(exclude)pnpm-lock.yaml'
   ':(exclude)*.min.js'
   ':(exclude)*.min.css'
   ':(exclude)dist/'
   ':(exclude)build/'
   ':(exclude)*.generated.*'
   ```

2. **Diff Size Limits**
   - <500 lines: OK
   - 500-1000 lines: Warning (Windows may have issues)
   - >1000 lines: Recommend splitting

3. **Language Handling**
   - Gemini prompts: Always in English for consistent review quality
   - Results presentation: Translate to user's conversation language
   - Code/commands: Keep in original form (never translate code)

4. **Commit Style Matching**
   Check `git log --oneline -10` and match existing project conventions.
   Fallback to conventional commits (feat:, fix:, refactor:, etc.)

5. **Error Handling**
   Every command should handle:
   - Tool not installed (gemini, gh)
   - No changes to review
   - Authentication failures
   - Network/push failures

### Gemini CLI Integration

The plugin uses Gemini CLI (`gemini -p "prompt"`) for code review.

**3-Phase Review Structure:**
1. **Phase 1: Intent & Risk Analysis** - What changes do, risk level (Low/Medium/High)
2. **Phase 2: Critical Audit** - Security, Logic, Performance issues
3. **Phase 3: Code Quality** - Style, naming, duplication

**Severity Levels:**
- Critical: Must fix (security vulnerabilities, logic errors)
- Warning: Should fix (performance issues, missing checks)
- Nitpick: Nice to have (style improvements)

**Categories:**
- Security: Injection, auth bypass, exposed secrets
- Logic: Null pointer, off-by-one, state handling
- Performance: N+1 queries, memory leaks
- Style: Naming, duplication, formatting

### Feedback Presentation Format

```markdown
## Gemini Review Results

**Risk Level:** Medium
**Summary:** Brief description of changes

---

### Critical Issues

#### #1. [Security] Issue Title

**Gemini says:** Description of the issue

**Current code:**
\`\`\`language
problematic code
\`\`\`

**Suggested fix:**
\`\`\`language
fixed code
\`\`\`

> Assessment: Valid - must fix

---

### Warnings
...

### Nitpicks
...
```

### User Interaction Points

1. **Selection Prompt** - After presenting feedback:
   ```markdown
   | # | Severity | Category | Description |
   |---|----------|----------|-------------|
   | 1 | Critical | Security | SQL Injection |

   Enter your selection (e.g., "1, 2", "all", or "none"):
   ```

2. **Review Cycle Prompt** - After applying changes:
   ```markdown
   Would you like to:
   1. Run another Gemini review (recommended after changes)
   2. Proceed to commit
   ```

3. **Branch Check** (PR only) - If on main:
   ```markdown
   You're on the main branch. Would you like me to:
   1. Create a new branch for this PR
   2. Cancel the PR creation
   ```

## Version Management

Version is tracked in two files (keep in sync):
- `.claude-plugin/marketplace.json` → `plugins[0].version`
- `plugins/duet/.claude-plugin/plugin.json` → `version`

Current version: 0.1.6

## Testing Checklist

Before releasing:
- [ ] Run `/duet:review` with small diff (<100 lines)
- [ ] Run `/duet:review` with medium diff (100-500 lines)
- [ ] Test with no changes (should exit gracefully)
- [ ] Test Gemini CLI error handling
- [ ] Run `/duet:pr` full workflow
- [ ] Test on non-main branch
- [ ] Test branch creation from main
- [ ] Verify commit message matches project style

## Common Issues

### "gemini: command not found"
```bash
npm install -g @google/gemini-cli
# or
npx @google/gemini-cli
```

### "gh: command not found"
```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
sudo apt install gh
```

### Diff too large for command line
Windows has ~32KB command line limit. For large diffs:
1. Review specific files: `git diff --cached -- path/to/file.js`
2. Split into smaller commits
3. Use interactive staging: `git add -p`

### Pre-commit hook failures
If commit fails due to hooks:
1. Check the hook error message
2. Fix the issue (linting, tests, etc.)
3. Stage fixes and retry commit
4. Never use `--no-verify` unless explicitly requested

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes to command files
4. Test both `/duet:review` and `/duet:pr`
5. Update version in both JSON files
6. Submit PR

## Dependencies

**Required:**
- Git (any recent version)
- Gemini CLI (`@google/gemini-cli`) - Node.js 20+

**Optional:**
- GitHub CLI (`gh`) - Only for `/duet:pr`
