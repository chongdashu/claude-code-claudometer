---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(ls:*), Bash(find:*)
description: Create semantic git commits by intelligently grouping changes with optional staged-only mode
version: 1.2.0
last-updated: 2025-07-21T15:20:00Z
---

## Arguments

Arguments: $ARGUMENTS

**Available Options:**
- `--staged` - Only work with currently staged changes, create commits from staged files only
- No arguments - Analyze all changes (staged and unstaged) and group them intelligently

## Context

**Staged vs All Changes Mode:**

If `--staged` flag is present in arguments:
- Current git status (staged files only): !`git diff --staged --name-only`
- Current staged diff: !`git diff --staged`
- **Do NOT stage any additional files** - create semantic groups from staged changes only

Otherwise (default mode):
- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Group all changes and stage files selectively for each semantic commit

**Additional Context:**
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your Task

Based on the arguments and changes above, create a series of semantic git commits by intelligently grouping related changes together. You **must** follow the formatting guidelines in `.cursor/rules/git-best-practices.mdc` if it exists.

**Mode-Specific Behavior:**

1. **If `--staged` flag is present:**
   - Analyze ONLY the currently staged changes
   - Create logical groups from the staged files
   - Use `git reset HEAD <files>` to selectively unstage files
   - Commit each group separately, then re-stage files for the next commit
   - Do NOT use `git add` commands to stage new files

2. **If no `--staged` flag (default):**
   - Analyze all changes (staged and unstaged)
   - Group changes semantically and stage files selectively using `git add <specific-files>`
   - Create multiple commits by staging different groups of files

## User Approval

Summarize the list of proposed commits + rationale for breakdown, and seek user approval before performing the commits.

### Smart Commit Strategy

1. **Analyze Changes**: Group changes by:
   - **File renames/moves**: Check for deleted+added file pairs with similar content
   - File type and purpose (docs, code, config, tests)
   - Functional area (auth, api, ui, database, hooks)
   - Change type (feat, fix, docs, refactor, style, chore)
   - Logical dependency (changes that must go together)

2. **Create Semantic Groups**:
   - **Documentation changes** → `docs:` commits
   - **New features** → `feat:` commits
   - **Bug fixes** → `fix:` commits
   - **Refactoring** → `refactor:` commits
   - **Configuration/build** → `chore:` or `build:` commits
   - **Tests** → `test:` commits
   - **Hook system changes** → `feat(hooks):` or `refactor(hooks):` commits

3. **Commit Order**:
   - Dependencies first (config, build changes)
   - Core functionality changes
   - Documentation updates
   - Test additions

4. **Atomic Commits**: Each commit should:
   - Represent one logical change
   - Pass tests independently (when applicable)
   - Have a clear, descriptive message
   - Follow conventional commit format

### Staged-Only Mode Workflow

When using `--staged` flag, the workflow becomes:

```bash
# Example: User has staged multiple files for different purposes
# git diff --staged --name-only shows: src/hooks/handler.py, src/hooks/config.json, docs/README.md

# Step 1: Reset all staged files
git reset HEAD

# Step 2: Stage and commit first group (core functionality)
git add src/hooks/handler.py src/hooks/config.json
git commit -m "feat(hooks): add voice notification handler with config"

# Step 3: Stage and commit second group (documentation)  
git add docs/README.md
git commit -m "docs: update hook system documentation"
```

### Commit Message Requirements

**Format:**
```
<type>[optional scope]: <description>

[optional body explaining why these changes were made]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Guidelines:**
- Use conventional commit format: `<type>[scope]: <description>`
- Keep subject line under 50 characters
- Use imperative mood ("Add feature" not "Added feature")
- Include body for complex changes explaining "why"
- Reference issues when applicable

### File Rename Detection

Before creating separate commits for deleted and new files, check for potential renames:
- **Similar filenames**: `old-file.txt` deleted + `new-file.txt` added
- **Similar paths**: File moved between directories
- **Content similarity**: Use `git diff --no-index` to compare content
- **Logical relationship**: Related functionality or documentation

### Granularity Guidelines

**Avoid Over-Granularity**: Don't create excessive commits for closely related changes:

❌ **Too granular**:
- Separate commits for `.env.template`, `config.json`, and `handler.py` in same feature
- Individual commits for each config field update
- Splitting documentation and code for the same feature unnecessarily

✅ **Appropriate granularity**:
- Group all related hook files together (handler + config + sounds)
- Combine configuration updates that serve the same purpose
- Bundle feature implementation with its immediate documentation

**Practical Atomic Commits**: Each commit should:
- Solve one complete problem or add one complete feature
- Be deployable/usable independently when possible
- Group logically related files that change together
- Balance between "too many tiny commits" and "one massive commit"

### Final Guidelines

- **Detect renames first** before grouping other changes
- **Group related changes** - avoid splitting closely coupled modifications
- **Respect staged-only mode** when `--staged` flag is present
- **Validate each commit** represents a complete, logical change
- **Maintain consistency** with existing commit patterns in the repository
- **Use appropriate scopes** based on the area being changed (hooks, docs, config, etc.)