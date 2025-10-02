---
allowed-tools: Task, Bash, Read, Write, Edit, MultiEdit, TodoWrite, Glob, Grep
description: Build App from design specifications using practical implementation approach
argument-hint: <design-folder-output-path> <app-folder>
---

# App Implementation from Design Specifications

Build production-ready Apps from `/design-app` outputs using practical implementation approach focused on rapid delivery and design specification adherence.

## Core Philosophy

This command prioritizes practical delivery by:

- **Design-First**: All implementation decisions derive from design phase outputs
- **Implementation-First**: Build working features quickly, add tests for critical paths
- **Progressive Quality**: Start with core functionality, enhance with testing as needed
- **Specification-Driven**: Follow design outputs exactly without over-engineering

## Prerequisites

This command requires design outputs from `/design-app`:

- `.claude/outputs/design/projects/[project-name]/[timestamp]/MANIFEST.md` - Requirements registry and roadmap
- Agent outputs in `.claude/outputs/design/agents/`:
  - `ui-designer/` - Visual specifications, wireframes, component hierarchy
  - `shadcn-expert/` - Component selections and implementation patterns
  - `youtube-api-expert/` - API integration specifications
  - `chatgpt-expert/` - AI service integration patterns
  - `stagehand-expert/` - Testing strategies (for reference)

## Arguments

Parse `$ARGUMENTS` to extract the path to:

- <design-folder-output-path> the design folder containing the design outputs. The path should point to a folder like `.claude/outputs/design/projects/[project-name]/[timestamp]/`

- <app-folder> (optional) the folder that the app should be built in.

The command will automatically read:

- `MANIFEST.md` - Registry of all design agent outputs with requirements traceability and implementation roadmap
- All agent outputs referenced in the MANIFEST.md for implementation details
- Check if the `app-folder` is specified. Otherwise, create a new project folder or assess existing state
- If existing files are present, perform an assessment to determine starting point (likely Next.js boilerplate)

## Usage Example

```bash
# Implement from design folder path
/implement-app .claude/outputs/design/projects/youtube-social-proof/20250904-141128

# Specify custom app folder
/implement-app .claude/outputs/design/projects/youtube-social-proof/20250904-141128 ./youtube-widget-app
```

## Practical Implementation Workflow with Design Integration

### Phase 1: Design Analysis & Project Setup (10-15 minutes)

**1. Read ALL Design Specifications First**

Before writing any code, thoroughly analyze the design outputs to understand the full scope:

**1.1. Extract Implementation Details from Agent Outputs**

**CRITICAL**: Read all agent outputs to understand the complete implementation requirements:

```typescript
// Example: Extract from ui-designer outputs
interface DesignSpecification {
  colors: Record<string, string>; // Exact hex values from design
  components: ComponentHierarchy; // From shadcn-expert
  apiIntegration: ServicePatterns; // From youtube-api-expert
  aiServices: AIServiceConfig; // From chatgpt-expert
}
```

**Implementation Validation Checklist**:

- [ ] Visual specifications extracted from ui-designer outputs
- [ ] Component selections and patterns from shadcn-expert
- [ ] API integration patterns from youtube-api-expert
- [ ] AI service configuration from chatgpt-expert
- [ ] Technology stack confirmed from MANIFEST.md

**If design outputs are incomplete**:

1. Continue with available specifications
2. Document gaps for future iterations
3. Use reasonable defaults that align with project goals
4. Focus on core functionality first

**Then proceed with systematic design analysis:**

- `MANIFEST.md` - Complete project scope, requirements, and 4-week roadmap
- `ui-designer/design-specification.md` - Visual structure, wireframes, component hierarchy
- `shadcn-expert/component-implementation.md` - Component selections and implementation patterns
- `youtube-api-expert/youtube-integration.md` - API service architecture and caching
- `chatgpt-expert/ai-integration.md` - Sentiment analysis and AI service integration
- `stagehand-expert/test-specifications.md` - Testing strategies (for reference)

**1.2. API Integration Planning**

For YouTube Social Proof app, focus on:

- **YouTube Data API v3**: Video metadata and comments extraction
- **OpenAI API**: Sentiment analysis with GPT-3.5-turbo-0125
- **Caching Strategy**: 24-hour YouTube cache, 7-day sentiment cache
- **Type Safety**: Create interfaces for all API responses

**Example from Design Specifications**:

```typescript
// Based on youtube-api-expert outputs
interface YouTubeVideoData {
  id: string;
  title: string;
  channelTitle: string;
  statistics: VideoStatistics;
  commentThreads: CommentThread[];
}
```

**2. Initialize Project Based on Design Specs**

Follow the MANIFEST.md roadmap for practical setup:

- Check if the target app-folder already exists
- Assess current state if project files exist
- Initialize Next.js 14 with TypeScript if starting fresh
- Install shadcn/ui components specified in design outputs
- Setup environment variables for YouTube API and OpenAI

**3. Create Basic Project Structure**

Establish core structure before implementation:

- Setup Next.js pages/API routes structure
- Create service classes for YouTube and OpenAI integration
- Implement basic TypeScript interfaces from design specifications
- Configure Tailwind CSS with design system colors
- Create placeholder components identified in ui-designer outputs

### Phase 2: Core Service Implementation (15-20 minutes)

**API Services First Approach**

Implement core services based on design specifications before UI:

**YouTube Data API Service**

- Implement service class from `youtube-api-expert` specifications
- Add video metadata extraction with proper error handling
- Implement comment fetching with pagination
- Add 24-hour caching mechanism (Redis/NodeCache fallback)

**OpenAI Sentiment Analysis Service**

- Implement service class from `chatgpt-expert` specifications
- Add GPT-3.5-turbo integration with 8-comment batching
- Implement 7-day sentiment caching
- Add cost optimization and rate limiting

**Data Models and Validation**

- Create TypeScript interfaces for all API responses
- Implement Zod schemas for validation
- Setup error handling patterns
- Create proper type definitions for widget data

### Phase 3: UI Implementation from Design (20-25 minutes)

**Component Implementation Strategy**

Implement UI components based on design specifications:

**Core Pages (from ui-designer outputs)**

- Landing page with URL input (trust blue theme)
- Processing screen with progress indicators
- Widget preview with customization controls
- Export/embed code generation

**shadcn/ui Component Integration**

- Install and configure components from `shadcn-expert` specifications
- Implement form components (Input, Button, Select) with proper validation
- Add Card, Badge, and Progress components for widget display
- Setup responsive layout with proper breakpoints

**Widget Generation Pipeline**

- Connect UI to YouTube API service
- Implement sentiment analysis integration
- Create widget preview with live updates
- Add comment carousel functionality

**Key Implementation Principles**:

- Follow design specifications exactly
- Use established patterns from shadcn-expert outputs
- Implement responsive design per ui-designer breakpoints
- Focus on functional App over perfect polish

### Phase 4: Feature Integration and Polish (15-20 minutes)

**End-to-End Integration**

Connect all components into working application:

**Complete User Flow Implementation**

1. URL input validation and submission
2. YouTube API data fetching with progress indicators
3. Sentiment analysis processing of comments
4. Widget preview generation with customization options
5. Embed code generation in multiple formats

**Error Handling and Edge Cases**

- Private/deleted video handling
- Disabled comments scenarios
- API quota exceeded fallbacks
- Network error recovery
- Invalid URL input validation

**Performance Optimizations**

- Implement caching strategies from API expert specs
- Add loading states and progress indicators
- Optimize bundle size and lazy loading
- Server-side rendering for widget endpoints

**Quality Verification**

- Manual testing of complete user workflows
- Verify responsive design across devices
- Test all embed format generations
- Validate API cost estimates match projections

### Phase 5: Production Readiness & Testing (10-15 minutes)

**Production Deployment Setup**

Prepare application for deployment:

- Environment variable configuration guide
- Docker container setup (if specified in roadmap)
- Vercel deployment configuration
- Database/Redis setup instructions

**Critical Path Testing**

Implement essential tests for key workflows:

- YouTube API integration smoke tests
- Sentiment analysis service validation
- Widget generation end-to-end test
- Error handling verification

**Documentation and Handoff**

Create essential documentation:

- Setup and installation guide
- API key configuration instructions
- Cost monitoring and optimization notes
- Known limitations and future improvements

## Implementation Strategy

### Practical Design-First Approach

The implementation strategy prioritizes rapid delivery with design specification adherence:

**Core Workflow**:

1. Read design specifications completely before any implementation
2. Implement working features quickly with proper error handling
3. Add critical path testing after core functionality works
4. Let design outputs guide ALL implementation decisions

**Quality Philosophy**:

- **Functional First**: Get features working before perfecting tests
- **Critical Path Testing**: Focus testing on high-risk areas (API integration, data processing)
- **Progressive Enhancement**: Start with core functionality, enhance incrementally
- **Design Fidelity**: Match specifications exactly, avoid over-engineering

**Design Integration Points**:

- `MANIFEST.md`: Complete requirements and 4-week roadmap
- `ui-designer outputs`: Visual specifications and component hierarchy
- `shadcn-expert outputs`: Component selections and implementation patterns
- `youtube-api-expert outputs`: Service architecture and caching strategies
- `chatgpt-expert outputs`: AI integration and cost optimization
- `stagehand-expert outputs`: Testing strategies for future enhancement

### Design Integration Points

**Phase 1 - Project Setup:**

- Read MANIFEST.md to understand complete project scope and 4-week roadmap
- Extract technology stack and dependencies from design specifications
- Assess existing project state if app-folder already contains code
- Setup Next.js project with TypeScript and shadcn/ui per specifications

**Phase 2 - Service Implementation:**

- Follow youtube-api-expert specifications for YouTube Data API v3 integration
- Implement chatgpt-expert patterns for OpenAI sentiment analysis
- Create caching strategies per API expert recommendations
- Build proper TypeScript interfaces and error handling

**Phase 3 - UI Implementation:**

- Follow ui-designer specifications for visual design and layout
- Implement shadcn-expert component selections and patterns
- Match exact color scheme and responsive breakpoints
- Create component hierarchy as specified in design outputs

**Phase 4 - Feature Integration:**

- Connect UI components to API services
- Implement complete user workflow from URL input to widget export
- Add error handling and edge case management
- Optimize performance per design specifications

**Phase 5 - Production Readiness:**

- Setup deployment configurations
- Create essential documentation
- Implement critical path testing
- Verify cost projections and performance targets

## Input

- **Design folder path** (required) - Path to design outputs folder containing MANIFEST.md and agent outputs
- **App folder path** (optional) - Target folder for implementation, defaults to intelligent selection

The command automatically determines project setup requirements and implementation approach from the design specifications in MANIFEST.md and agent outputs.

## Success Metrics

### Technical Implementation Success

✅ Next.js app initialized with TypeScript and shadcn/ui
✅ YouTube Data API v3 service properly integrated
✅ OpenAI sentiment analysis service working with cost optimization
✅ Dual-layer caching implemented (24hr YouTube, 7-day sentiment)
✅ UI components match design specifications exactly

### Functional Success

✅ Complete user workflow: URL input → processing → widget preview → export
✅ Error handling for private videos, disabled comments, API limits
✅ Responsive design working across all specified breakpoints
✅ Widget embedding in multiple formats (iframe, JS, React)
✅ Cost projections validated (<$0.02 per widget)

### Production Readiness

✅ Critical path testing covers API integration and widget generation
✅ TypeScript compilation clean with proper type safety
✅ App builds for production successfully
✅ Environment variables properly configured
✅ Deployment documentation complete

## Design-Driven Implementation Rules

### Implementation Requirements

- **Must** read ALL design outputs before starting implementation
- **Must** follow UI designer visual specifications and component hierarchy
- **Must** use shadcn-expert component selections and patterns
- **Must** implement API services per youtube-api-expert and chatgpt-expert specs
- **Should** reference stagehand-expert for testing strategies

### Implementation Phase (Practical Approach)

- Implement working features based on design specifications
- Focus on core functionality first, polish incrementally
- Add proper error handling and validation throughout
- Test critical paths manually and with automated tests

### Quality Assurance (Continuous Verification)

- Verify each feature works as designed before moving to next
- Ensure API integrations handle edge cases properly
- Validate responsive design matches ui-designer breakpoints
- Confirm cost projections align with chatgpt-expert estimates

### User Confirmation Points

- Show working YouTube URL processing
- Demonstrate sentiment analysis and comment curation
- Present widget preview with customization options
- Verify embed code generation in multiple formats

## Implementation Patterns

### Design-to-Code Pattern

Translate design outputs directly into implementation:

**Service Implementation Strategy**:

1. Read `youtube-api-expert` outputs for API service architecture
2. Read `chatgpt-expert` outputs for AI integration patterns
3. Create services that implement EXACT specifications from design

**Component Implementation Strategy**:

- **Visual Structure** → Follow ui-designer wireframes exactly
- **Component Library** → Use shadcn-expert selections and patterns
- **Data Flow** → Connect UI to API services per specifications

### Progressive Implementation Pattern

Build functionality incrementally based on design outputs:

**Implementation Progression**:

1. **Foundation**: Next.js setup with TypeScript and shadcn/ui
2. **Services**: API integrations with proper caching and error handling
3. **UI Components**: Visual implementation matching design specifications
4. **Integration**: Complete user workflow with all features connected
5. **Polish**: Error handling, optimization, and production readiness

**Key Principle**: Every implementation decision comes from design outputs:

- Use exact specifications from agent outputs in `.claude/outputs/design/agents/`
- Follow MANIFEST.md roadmap for implementation sequence
- No improvised features - all functionality traces to design requirements

## Troubleshooting Implementation Issues

### Design Files Not Found

- Verify the provided design folder path exists
- Check for MANIFEST.md in the specified folder
- Ensure design phase completed successfully with `/design-app`
- Check for agent outputs in `.claude/outputs/design/agents/`

### API Integration Issues

- Verify YouTube Data API v3 credentials are properly configured
- Check OpenAI API key setup and quota limits
- Implement proper error handling per youtube-api-expert specifications
- Test caching mechanisms work correctly

### UI Component Implementation Problems

- Re-read ui-designer specifications for exact visual requirements
- Verify shadcn-expert component selections are installed correctly
- Check responsive breakpoints match design specifications
- Ensure color scheme follows design system exactly

## Philosophy

### Practical Implementation Principles

1. **Design as Single Source of Truth** - All implementation decisions derive from design outputs
2. **Function Before Form** - Get features working correctly before perfecting details
3. **Progressive Enhancement** - Start with core functionality, add sophistication incrementally
4. **No Assumptions** - If it's not in the design, don't implement it
5. **Continuous Verification** - Verify each major feature works before proceeding

### Quality Assurance Strategy

**Critical Path Testing**:

- API integration smoke tests (YouTube, OpenAI)
- End-to-end widget generation workflow
- Error handling for edge cases
- Performance validation for cost projections

**Manual Verification**:

- Complete user workflow testing
- Responsive design validation
- Widget embed format verification
- Cross-browser compatibility checks

**Automated Testing (Secondary)**:

- Use stagehand-expert specifications as reference for future test implementation
- Focus on high-value, high-risk areas first
- Add comprehensive testing after App is functional

### Implementation Excellence

The goal is to demonstrate that practical design-driven implementation creates superior Apps by:

- Following design specifications exactly (no scope drift)
- Implementing working features quickly with proper error handling
- Using the right technologies for each requirement (Next.js, shadcn/ui, APIs)
- Maintaining continuous user feedback and verification
- Shipping production-ready code with essential testing and documentation
