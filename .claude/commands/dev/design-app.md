---
allowed-tools: Task, Read, Write, TodoWrite
description: Design Next.js full-stack application architecture from PRD with test-first specifications
argument-hint: <prd-file-path>
required-agents: orchestrator, ui-designer, shadcn-expert, stagehand-expert, system-architect, youtube-api-expert, chatgpt-expert
agent-execution-pattern: sequential-then-parallel
minimum-task-calls: 8
---

# Next.js 15 Full-Stack Application Design Command

Create a comprehensive Next.js 15 application design with test-first specifications based on a Product Requirements Document (PRD).

## ⚠️ CRITICAL EXECUTION CONSTRAINTS ⚠️

**NEVER** give the orchestrator agent the entire workflow to execute. The orchestrator agent:
- **Phase 1**: ONLY creates folders and initial MANIFEST.md
- **Phase 4**: ONLY synthesizes outputs from other agents

**MANDATORY AGENT SEPARATION:**
- Each agent MUST be invoked with a separate Task tool call
- The orchestrator MUST NOT be asked to spawn sub-agents itself
- **YOU (Claude Code) are the coordinator, not the orchestrator agent**

**Required Execution Pattern:**
```bash
Phase 1: Task(orchestrator) - Setup only
Phase 2: Task(ui-designer) - Wireframes  
Phase 3: Task(shadcn-expert) + Task(stagehand-expert) + Task(youtube-api-expert) + Task(chatgpt-expert) - Parallel (4 calls in 1 message)
Phase 4: Task(system-architect) - Integration architecture after parallel outputs
Phase 5: Task(orchestrator) - Synthesis
Total Task calls: 8 (minimum)
```

**The orchestrator agent is just another specialist that:**
- Sets up project structure (Phase 1)
- Synthesizes outputs (Phase 4)
- Does NOT coordinate other agents - that's YOUR job

## Usage Examples

Analyze PRD file referenced from `$ARGUMENTS`. It may be passed directly as text, or as a file reference, or with parameters.

```bash
# Design from PRD file
/design-app --prd=docs/projects/analytics/prd.md

# Design with specific data sources
/design-app --prd=projects/analytics/prd.md --data=.claude/outputs/data/latest

# Design with custom output location
/design-app --prd=specs/chat-app.md --output=designs/chat-app
```

## PRD-Driven Design Philosophy

The command analyzes a Product Requirements Document to create a complete Next.js application design:

1. **PRD Analysis**: Extract features, user stories, and technical requirements
2. **Test-First Design**: Write acceptance tests based on PRD user stories
3. **Next.js 15 Architecture**: Design specifically for Next.js 15 App Router patterns with React 19
4. **Visual Component Planning**: Select shadcn/ui components with aesthetic excellence for all UI requirements

## Enhanced Visual Design Integration

The **shadcn-expert** agent now provides comprehensive visual design capabilities:

### Visual Excellence Focus

- **Aesthetic Component Selection**: Choose components that enhance visual appeal and user experience
- **Design Context Integration**: Leverage wireframes, color schemes, and visual patterns from ui-designer output
- **Beautiful Composition Planning**: Ensure components work together harmoniously for stunning interfaces
- **Responsive Beauty**: Maintain visual excellence across all breakpoints and devices

### Enhanced Deliverables with Concrete Specifications

**Streamlined Output Approach**: Each agent produces **1 comprehensive file** combining planning and implementation:

- **ui-designer**: `design-specification.md` - Complete UI/UX design (wireframes, components, flows)
- **shadcn-expert**: `component-implementation.md` - Component selection, design system, exact values
- **stagehand-expert**: `test-specifications.md` - E2E test plan and executable test cases
- **system-architect**: `integration-architecture.md` - Complete integration patterns, API routes, data flow
- **youtube-api-expert**: `youtube-integration.md` - API plan with embedded TypeScript implementation
- **chatgpt-expert**: `ai-integration.md` - OpenAI plan with embedded TypeScript implementation

### Required Concrete Deliverables (App-Specific)

Each design agent MUST provide:

- Exact hex/RGB values CHOSEN FOR THIS APP (not copied from examples)
- Rationale for why these colors suit THIS application's purpose and audience
- Specific Tailwind classes that implement THIS design system
- WCAG contrast validation results for all text/background combinations

Examples showing proper variety (avoiding AI clichés):

- E-commerce platform: Trustworthy deep blues (#1e3a8a) and conversion oranges (#ea580c)
- Developer dashboard: High-contrast terminal blacks (#0a0a0a) and code greens (#22c55e)
- Learning platform: Warm earth tones (#92400e) and focus-friendly grays (#64748b)
- Healthcare app: Calming teals (#0f766e) and professional whites (#fafafa)
- Finance platform: Conservative navy (#1e3a8a) and accent gold (#d97706)

**Explicitly Avoid AI Design Clichés:**

- ❌ Purple-blue gradients (from-purple-600 to-blue-600)
- ❌ Generic violet/indigo schemes
- ❌ Predictable "AI tool" color patterns
- ✅ Industry-appropriate, user-expected color choices

### Design Quality Standards

Every component selection considers:

- ✅ **Visual Impact** and color integration
- ✅ **Spacing Harmony** and typography hierarchy
- ✅ **Interactive Delight** with thoughtful animations
- ✅ **Accessibility Elegance** without compromising beauty

## Anti-Patterns (DO NOT DO THIS)

### ❌ **WRONG - Single orchestrator doing everything:**
```bash
Task(orchestrator, "Do Phase 1, then spawn ui-designer, then spawn shadcn-expert...")
```

### ❌ **WRONG - Orchestrator spawning sub-agents:**
```bash
Task(orchestrator, "Initialize project then coordinate ui-designer agent...")
```

### ❌ **WRONG - Sequential Phase 3 execution:**
```bash
Task(shadcn-expert, "...")  # Wait for completion
Task(stagehand-expert, "...") # Then execute - NOT parallel
```

### ✅ **CORRECT - Separate agent invocations:**
```bash
Task(orchestrator, "Initialize project folders and create initial MANIFEST")
# Wait for completion
Task(ui-designer, "Create wireframes from PRD") 
# Wait for completion
Task(shadcn-expert, "...") + Task(stagehand-expert, "...") # Parallel in single message
# Wait for both
Task(orchestrator, "Synthesize all outputs")
```

## Workflow (Sequential then Parallel Coordination)

Following orchestrator-initialized workflow with structured project setup and validation:

### Phase 1: Orchestrator Initialization (Sequential - Project Setup)

**Agent**: `orchestrator`
**Output**: `.claude/outputs/design/projects/[project-name]/[timestamp]/`
**Purpose**:

- Analyze PRD and confirm project scope
- Generate consistent project name and timestamp
- Create initial MANIFEST.md with requirements baseline
- Note: Agent outputs go directly to shared `.claude/outputs/design/agents/` location

### Phase 2: UI Design Foundation (Sequential - Foundation Required)

**Agent**: `ui-designer`
**Output**: `.claude/outputs/design/agents/ui-designer/[project-name]-[timestamp]/` (pre-created)
**Purpose**: Read PRD, create wireframes, component hierarchy, and user flows

### Phase 3: Parallel Component, Testing & API Integration Design

**Executed Simultaneously** after Phase 2 completion:

You **MUST** execute Phase 3A, Phase 3B, Phase 3C, and Phase 3D in parallel using sub-agents.

#### Phase 3A: Component System Design

```bash
- shadcn-expert → visual component selection, beautiful composition strategy, design system aesthetics (uses ui-designer output for visual design context)
```

#### Phase 3B: Test Specification Design

```bash
- stagehand-expert → E2E test specifications (uses ui-designer output)
```

#### Phase 3C: YouTube API Integration Design

```bash
- youtube-api-expert → YouTube Data API v3 integration plan, quota management, caching strategy (24-hour TTL)
```

#### Phase 3D: AI Integration Design

```bash
- chatgpt-expert → OpenAI API integration for sentiment analysis, prompt engineering, cost optimization (7-day cache)
```

### Phase 4: System Integration Architecture (Sequential - After Parallel Outputs)

**Agent**: `system-architect`
**Output**: `.claude/outputs/design/agents/system-architect/[project-name]-[timestamp]/`

**Purpose**: Design complete integration architecture after analyzing all parallel agent outputs
**Input**: All agent outputs from Phases 2-3 + initial MANIFEST from Phase 1

```bash
- system-architect → Complete integration architecture connecting all components:
  • API route specifications (/api/widget/generate, etc.)
  • Frontend-backend data flow patterns
  • Service instantiation and dependency injection
  • State management strategy (Context, Redux, or localStorage)
  • Caching layer coordination between frontend and backend
  • Error handling and retry patterns across layers
  • Session and request scoping strategies
  • Synthesizes outputs from shadcn, stagehand, youtube-api, and chatgpt experts
```

### Phase 5: Orchestrator Synthesis & Validation (Sequential - Requires All Inputs)

**Agent**: `orchestrator` (final validation)
**Output**: `.claude/outputs/design/projects/[project-name]/[timestamp]/`

**Purpose**: Synthesize all agent outputs into coherent implementation plan
**Input**: All agent outputs from Phases 2-4 + initial MANIFEST from Phase 1
**Validates**:

- ✓ All PRD requirements have corresponding design outputs
- ✓ UI wireframes cover all user stories
- ✓ Component plan addresses all UI requirements
- ✓ Test specifications cover all acceptance criteria
- ✓ Cross-agent consistency and integration points
- ✓ All color specifications include exact hex values with contrast ratios
- ✓ All text/background combinations pass WCAG AA (4.5:1 ratio minimum)
- ✓ CSS variables are defined with precise values for this specific app
- ✓ Tailwind classes are specified for each visual element
  **Output**:
- `MANIFEST.md` - Final registry linking all agent outputs with requirements traceability
  **Note**: Implementation details are in individual agent outputs, not duplicated here
  **TodoWrite Integration**: Creates final task list with requirement coverage validation

## Output Structure

**Phase 1 (Orchestrator Initialization)**:

```
.claude/outputs/design/projects/[project-name]/[timestamp]/
└── MANIFEST.md                   # Initial requirements baseline and agent registry
```

**Phase 2 (Sequential - UI Foundation)**:

```
.claude/outputs/design/agents/
└── ui-designer/[project-name]-[timestamp]/
    └── design-specification.md    # Complete UI/UX design (wireframes, components, flows)
```

**Phase 3 (Parallel Execution)**:

```
.claude/outputs/design/agents/
├── shadcn-expert/[project-name]-[timestamp]/
│   └── component-implementation.md   # Component selection, design system, exact values
├── stagehand-expert/[project-name]-[timestamp]/
│   └── test-specifications.md        # E2E test plan and test cases
├── system-architect/[project-name]-[timestamp]/
│   └── integration-architecture.md   # Complete integration patterns connecting all layers
├── youtube-api-expert/[project-name]-[timestamp]/
│   └── youtube-integration.md        # API integration plan with implementation code
└── chatgpt-expert/[project-name]-[timestamp]/
    └── ai-integration.md             # OpenAI integration plan with implementation code
```

**Phase 4 (Sequential - Final Synthesis)**:

```
.claude/outputs/design/projects/[project-name]/[timestamp]/
└── MANIFEST.md                   # Complete registry linking all agent outputs with requirements traceability
```

## Task Management & Claude Code Coordination

**CRITICAL REMINDER**: Claude Code coordinates, NOT the orchestrator agent.

The command execution pattern:

- **Phase 1**: YOU invoke orchestrator for initialization with project setup and TodoWrite tracking
- **Phase 2**: YOU invoke ui-designer for sequential UI design (1 file output)
- **Phase 3**: YOU spawn all five agents in parallel (each produces 1 file output)
- **Phase 5**: YOU invoke orchestrator for final synthesis (1 MANIFEST.md file only)
- **Agent Coordination**: YOU use **multiple Task tool calls in single message** to spawn agents simultaneously
- **Progress Tracking**: YOU maintain individual TodoWrite entries for each agent's progress
- **Dependency Management**: YOU ensure Phase 4 waits for all Phase 3 agents to complete

**The orchestrator agent should NEVER know about the other agents' existence.**

### Critical Implementation Pattern for Phase 3

**Parallel Execution Requirements:**

```bash
# CORRECT: Five Task tool calls in single message for parallel execution
<invoke name="Task">
  # shadcn-expert task
</invoke>
<invoke name="Task">
  # stagehand-expert task
</invoke>
<invoke name="Task">
  # system-architect task
</invoke>
<invoke name="Task">
  # youtube-api-expert task
</invoke>
<invoke name="Task">
  # chatgpt-expert task
</invoke>

# INCORRECT: Sequential Task calls (not parallel)
# Call each agent one after another, waiting for completion
```

### Execution Strategy

```bash
# Phase 1: Sequential (project initialization)
orchestrator → PRD analysis, project setup, folder creation, initial MANIFEST.md

# Phase 2: Sequential (UI foundation required)
ui-designer → wireframes, component hierarchy, user flows

# Phase 3: Parallel (spawn simultaneously, using ui-designer output)
# CRITICAL: Use FOUR Task tool calls in SINGLE message for true parallelism
shadcn-expert + stagehand-expert + youtube-api-expert + chatgpt-expert
(simultaneous Task calls)

# Phase 4: Sequential (requires all parallel inputs)
system-architect → integration architecture synthesizing all outputs

# Phase 5: Sequential (requires all inputs)
orchestrator → synthesis, validation, finalize MANIFEST.md
```

## Exact Task Prompts for Each Phase

### Phase 1 - Orchestrator Initialization
```
Task(orchestrator): 
"Read PRD at [path]. Create project folder structure at .claude/outputs/design/projects/[project-name]/[timestamp]/. 
Generate initial MANIFEST.md with requirements baseline ONLY. 
DO NOT execute any other phases or spawn any agents."
```

### Phase 2 - UI Designer  
```
Task(ui-designer):
"Read PRD at [path]. Create comprehensive UI/UX design specification including wireframes, component hierarchy, and user flows in ONE file.
Output to .claude/outputs/design/agents/ui-designer/[project-name]-[timestamp]/"
```

### Phase 3A - shadcn Expert (Parallel)
```
Task(shadcn-expert):
"Read PRD at [path] and ui-designer output at [ui-path]. Select shadcn/ui components with exact hex codes.
Create ONE comprehensive file combining component plan and implementation values with WCAG contrast validation.
Output to .claude/outputs/design/agents/shadcn-expert/[project-name]-[timestamp]/"
```

### Phase 3B - Stagehand Expert (Parallel)  
```
Task(stagehand-expert):
"Read PRD at [path] and ui-designer output at [ui-path]. Create E2E test specifications.
Output to .claude/outputs/design/agents/stagehand-expert/[project-name]-[timestamp]/"
```

### Phase 3C - System Architect (Parallel)
```
Task(system-architect):
"Read PRD at [path] and ui-designer output at [ui-path]. Design complete integration architecture including:
- API route specifications with exact endpoints and contracts
- Frontend-backend data flow patterns and state management
- Service instantiation, dependency injection, and configuration
- Caching coordination between all layers
- Error handling and retry strategies
- Critical implementation sequencing to connect all components
Output to .claude/outputs/design/agents/system-architect/[project-name]-[timestamp]/"
```

### Phase 3D - YouTube API Expert (Parallel)
```
Task(youtube-api-expert):
"Read PRD at [path] and architecture notes. Design YouTube Data API v3 integration with quota management and 24-hour caching strategy.
Include implementation code within the integration plan markdown file.
Output to .claude/outputs/design/agents/youtube-api-expert/[project-name]-[timestamp]/"
```

### Phase 3E - ChatGPT Expert (Parallel)  
```
Task(chatgpt-expert):
"Read PRD at [path] and architecture notes. Design OpenAI API integration for sentiment analysis with 7-day caching strategy.
Include implementation code within the integration plan markdown file.
Output to .claude/outputs/design/agents/chatgpt-expert/[project-name]-[timestamp]/"
```

### Phase 4 - Orchestrator Synthesis
```
Task(orchestrator):
"Read all agent outputs from phases 2-3. Create ONLY ONE file: MANIFEST.md as the final registry.
DO NOT create redundant implementation plans - those exist in agent outputs. DO NOT re-execute previous phases."
```

## Execution Validation Checklist

Before proceeding, verify:
- [ ] Are you calling Task tool 7+ times (not just once)?
- [ ] Is orchestrator limited to setup (Phase 1) and synthesis (Phase 4) only?
- [ ] Are Phase 3 agents (shadcn-expert + stagehand-expert + system-architect + youtube-api-expert + chatgpt-expert) invoked in a SINGLE message with FIVE Task calls?
- [ ] Does each agent have a focused, specific prompt that matches the templates above?
- [ ] Are you (Claude Code) coordinating, not delegating coordination to orchestrator?
- [ ] Did you output your execution plan summary before starting?

## Input Parameters

- `--prd`: Path to PRD file (required)
- `--data`: Path to existing data specifications (optional)
- `--output`: Custom output directory (optional)

## PRD Requirements Coverage (Orchestrator-Managed Validation)

The design process ensures 100% PRD coverage across all agents:

- ✓ **orchestrator**: Initial PRD analysis & MANIFEST creation (initialization)
- ✓ **ui-designer**: UI requirements & user story mapping (foundation) - 1 file output
- ✓ **shadcn-expert**: Visual component selection, beautiful design systems & aesthetic integration - 1 file output
- ✓ **stagehand-expert**: User acceptance criteria & E2E testing - 1 file output
- ✓ **system-architect**: Integration architecture, API routes, data flow, state management - 1 file output
- ✓ **youtube-api-expert**: YouTube Data API v3 integration, quota management, caching (24-hour) - 1 file output
- ✓ **chatgpt-expert**: OpenAI API integration, sentiment analysis, prompt engineering (7-day cache) - 1 file output
- ✓ **orchestrator**: Cross-agent validation & MANIFEST finalization (synthesis) - 1 file output

## Next.js 15 Specific Design

The design is optimized for Next.js 15 App Router with React 19:

- **Page Structure**: `/app` directory layout
- **Server Components**: Default for data fetching
- **Client Components**: Only when needed for interactivity
- **API Routes**: `/app/api` for backend endpoints
- **Layouts**: Shared layouts for common elements
- **Loading/Error**: Proper loading.tsx and error.tsx pages

## Required Pre-Execution Summary

**MANDATORY**: Before executing ANY agents, output your execution plan:

```bash
Execution Plan Summary:
Phase 1: Task(orchestrator) - Setup folders and initial MANIFEST only
Phase 2: Task(ui-designer) - Create wireframes and user flows
Phase 3: Task(shadcn-expert) + Task(stagehand-expert) + Task(system-architect) + Task(youtube-api-expert) + Task(chatgpt-expert) - Parallel in single message
Phase 5: Task(orchestrator) - Synthesize outputs into implementation plan
Total Task calls: 8
Estimated completion: [time estimate]
```

**This summary confirms you understand the agent separation pattern before execution.**

## Success Criteria (Claude Code Coordinated Validation)

A complete design includes outputs from all phases:

- ✓ **Phase 1**: Project setup & initial MANIFEST (orchestrator initialization)
- ✓ **Phase 2**: UI wireframes & component hierarchy (ui-designer)
- ✓ **Phase 3A**: Visual shadcn/ui component selections, beautiful design systems & aesthetic customizations (shadcn-expert)
- ✓ **Phase 3B**: E2E test specifications covering all user stories (stagehand-expert)
- ✓ **Phase 3C**: Complete system integration architecture connecting all components (system-architect)
- ✓ **Phase 3D**: YouTube API integration plan with caching strategy (youtube-api-expert)
- ✓ **Phase 3E**: OpenAI API integration for sentiment analysis (chatgpt-expert)
- ✓ **Phase 5**: Complete MANIFEST linking all outputs (orchestrator synthesis - 1 file)

**Efficiency Gains**: Proper agent coordination enables consistent project structure and UI foundation enables parallel component and testing work

## Integration with Implementation

Output feeds directly into:

- `/implement-mvp` for TDD implementation
- Next.js project scaffolding
- Component and API implementation guidance
