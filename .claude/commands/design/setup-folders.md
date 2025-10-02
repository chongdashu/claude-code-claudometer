---
allowed-tools: Read, Write, Bash
description: Initialize project folder structure for design workflow
argument-hint: <prd-file-path>
---

# Setup Design Project Folders

Initialize the standardized folder structure for a Next.js design project based on a PRD.

## Usage

```bash
/dev:setup-folders docs/PRD.md
```

## What This Does

1. Reads the PRD at `$ARGUMENTS`
2. Generates project name from PRD (lowercase-kebab-case)
3. Creates timestamp (YYYYMMDD-HHMMSS format)
4. Creates base folder structure:
   - `.claude/outputs/design/projects/[project-name]/[timestamp]/`
5. Creates initial `MANIFEST.md` with PRD summary and project metadata

**Note:** Agent-specific folders (ui-designer, shadcn-expert, etc.) will be created by the orchestrator agent based on the project's required agents.

## Execution Steps

1. Read the PRD file from `$ARGUMENTS`
2. Extract project name from PRD title/content and convert to lowercase-kebab-case
3. Generate timestamp in YYYYMMDD-HHMMSS format
4. Create all required folders
5. Write initial MANIFEST.md with:
   - Project name and timestamp
   - PRD summary
   - Folder structure reference
   - Agent output locations

## Output

Displays:
- Created folder paths
- Project name (for reuse in subsequent commands)
- Timestamp (for reuse in subsequent commands)
- Path to MANIFEST.md

This information can be used by `/dev:design-app` or other commands to maintain consistency across the design workflow.
