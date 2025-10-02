---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*), Bash(ls:*), Bash(find:*)
description: Create a git commit with optional staged-only mode
version: 1.2.0
last-updated: 2025-07-21T15:20:00Z
---

## Arguments

Arguments: $ARGUMENTS

**Available Options:**
- `--staged` - Only commit currently staged changes, ignore unstaged files
- No arguments - Analyze all changes (staged and unstaged) and stage relevant files

## Context

**Staged vs All Changes Mode:**

If `--staged` flag is present in arguments:
- Current git status (staged files only): !`git diff --staged --name-only`
- Current staged diff: !`git diff --staged`
- **Do NOT stage any additional files** - work only with what's already staged

Otherwise (default mode):
- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Stage relevant files as needed for the commit

**Additional Context:**
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your Task

Based on the arguments and changes above:

1. **If `--staged` flag is present:**
   - Create a commit using ONLY the currently staged changes
   - Do NOT run `git add` commands
   - Focus commit message on the staged changes only

2. **If no `--staged` flag:**
   - Analyze all changes (staged and unstaged)
   - Stage relevant files using `git add`
   - Create a comprehensive commit

**Requirements:**
- Follow formatting guidelines in `.cursor/rules/git-best-practices.mdc` if it exists
- Use conventional commit format: `<type>[scope]: <description>`
- Write clear, descriptive commit messages explaining the "why" not just the "what"
- Keep subject line under 50 characters
- Use imperative mood ("Add feature" not "Added feature")

**Commit Message Format:**
```
<type>[optional scope]: <description>

[optional body explaining why these changes were made]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```