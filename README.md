# Duet

> AI Code Review Plugin - Claude Code + Gemini working together like a duet

A Claude Code plugin that enables two AIs to collaborate on code review, commit, and PR creation.

## Features

| Command | Description |
|---------|-------------|
| `/duet:review` | Gemini code review -> Apply feedback -> Commit |
| `/duet:pr` | Gemini code review -> Apply feedback -> Commit -> Create PR |

## Installation

### From GitHub

```bash
# 1. Add the marketplace (one-time setup)
/plugin marketplace add bokuhe/claude-duet

# 2. Install the plugin
/plugin install duet@duet-marketplace
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/bokuhe/claude-duet.git

# Add as local marketplace
/plugin marketplace add ./claude-duet

# Install the plugin
/plugin install duet@duet-marketplace
```

### Updating

```bash
/plugin update duet@duet-marketplace
```

## Prerequisites

- **Gemini CLI** installed and configured (requires Node.js 20+)
  ```bash
  npm install -g @google/gemini-cli
  gemini --version
  ```
- **Git** repository initialized
- (For PR creation) **GitHub CLI** installed
  ```bash
  gh --version
  ```

## Usage

### Review and Commit

```bash
# After making code changes
/duet:review
```

**Workflow:**
1. Check `git diff` for pending changes
2. Request code review via Gemini CLI
3. Display feedback in a structured table
4. Select which suggestions to apply
5. Apply selected feedback
6. (Repeat if needed)
7. Create commit

### Review and Create PR

```bash
/duet:pr
```

**Workflow:**
1. Perform review + commit process above
2. Push to remote branch
3. Create GitHub PR

## Feedback Format

Review results are organized by priority:

| # | Severity | Category | Description |
|---|----------|----------|-------------|
| 1 | Critical | Security | SQL injection vulnerability |
| 2 | Warning | Logic | Missing null check |
| 3 | Nitpick | Style | Use const instead of let |

**Gemini reviews in 3 phases:**
1. **Intent & Risk** - What the changes do, risk level
2. **Critical Audit** - Security, Logic, Performance issues
3. **Code Quality** - Style and improvements

You select which items to apply before any changes are made.

## How It Works

```
+-----------------------------------------------------------+
|  /duet:review                                             |
|                                                           |
|  1. git diff --> 2. gemini CLI --> 3. Parse feedback      |
|                                           |               |
|                                           v               |
|  6. commit <-- 5. Apply fixes <-- 4. User selects         |
+-----------------------------------------------------------+

+---------------------------------------------------------------+
|  /duet:pr                                                     |
|                                                               |
|  [ Same as above ] --> 7. git push --> 8. gh pr create        |
+---------------------------------------------------------------+
```

## Project Structure

```
duet/
├── .claude-plugin/
│   └── marketplace.json     # Marketplace configuration
├── plugins/
│   └── duet/
│       ├── .claude-plugin/
│       │   └── plugin.json  # Plugin metadata
│       └── commands/
│           ├── review.md    # /duet:review command
│           └── pr.md        # /duet:pr command
├── README.md
└── LICENSE
```

## License

MIT License

## Contributing

Issues and PRs are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request
