# Claudometer - Reddit Sentiment Analysis for Claude Code

<div align="center">

### 📺 **As Seen in [Claude Code Episode 12](https://www.youtube.com/watch?v=fHPjgY7tgf8&feature=youtu.be)**

---

### 🚀 **Ready to Build Your Own Apps with Claude Code 2.0?**

<table>
<tr>
<td width="33%" valign="top">

**🌐 Public (This Repo)**
- ✅ 3 Core Agents
- ✅ Documentation & Tutorials
- ❌ No Slash Commands
- ❌ No Application Code
- ❌ No Orchestrator

</td>
<td width="33%" valign="top">

**🔓 Insiders Club (Free)**
- ✅ 3 Core Agents
- ✅ **Custom Slash Commands**
- ✅ Documentation & Tutorials
- ❌ No Application Code
- ❌ No Orchestrator

</td>
<td width="33%" valign="top">

**🏗️ Builder Pack**
- ✅ **Full Next.js 15 App**
- ✅ **9+ Specialized Agents**
- ✅ **Multi-Agent Orchestrator**
- ✅ **Custom Slash Commands**
- ✅ **Database & Backend**

</td>
</tr>
</table>

### **[🎯 Get the Complete Builder Pack →](https://rebrand.ly/d0e3fe)**

*Want a preview? [Join AI Oriented Insiders Club](https://aioriented.com) for free access to custom slash commands*

---

</div>

## About This Project

A Reddit sentiment analysis application demonstrating **Claude Code 2.0** for building full-stack applications. Tracks and visualizes community sentiment about Claude Code across r/ClaudeAI, r/ClaudeCode, and r/Anthropic.

**Technologies:** Claude Code 2.0, Sonnet 4.5, Reddit API, OpenAI sentiment analysis.

---

## 🎯 Project Overview

This repository showcases a working sentiment analysis application with:

- **Reddit API integration** with OAuth 2.0 and rate limiting
- **OpenAI sentiment analysis** using GPT-4o-mini with 7-day caching
- **Custom slash commands** for repeatable development workflows
- **Real-time dashboard** with interactive charts and data export

**Live Demo Features:**
- Real-time sentiment analysis using GPT-4o-mini
- Multi-subreddit tracking (r/ClaudeAI, r/ClaudeCode, r/Anthropic)
- Interactive charts with Recharts (sentiment trends, discussion volume)
- Drill-down to daily post/comment details
- CSV export functionality
- 7-day sentiment caching reducing API costs by 90%

---

## 📁 Repository Structure

```
cc-claudometer/
├── .claude/                    # Claude Code Configuration
│   ├── agents/                 # Specialized agents
│   │   └── research-planning/
│   │       ├── chatgpt-expert.md         # OpenAI sentiment analysis
│   │       ├── reddit-api-expert.md      # Reddit API integration
│   │       └── stagehand-expert.md       # E2E testing specialist
│   ├── commands/               # Custom slash commands (Insiders only)
│   │   ├── design/
│   │   │   └── setup-folders.md          # Initialize output folders
│   │   └── agent_prompts/                # Agent prompt templates
│   │       ├── reddit_api_expert_prompt.md
│   │       └── stagehand_expert_prompt.md
│   └── settings.json           # Claude Code settings
├── docs/
│   └── PRD.md                  # Product Requirements Document
└── README.md                   # This file
```

> **🏗️ The complete Next.js application, orchestrator, and custom slash commands are available in the [Builder Pack](https://rebrand.ly/d0e3fe)**
> **🔓 Custom slash commands are available for free in the [Insiders Club](https://aioriented.com)**

---

## 🤖 The .claude Folder: Claude Code Configuration

### What's Included (Public Version)

This public version includes three essential agents for Reddit sentiment analysis:

### Sub-Agents (`/.claude/agents/research-planning/`)

**`chatgpt-expert.md`** - OpenAI API integration
- Prompt engineering for sentiment analysis
- Structured outputs with Zod validation
- 7-day caching strategy (SHA-256 keys)
- Cost optimization techniques

**`reddit-api-expert.md`** - Reddit API integration
- OAuth 2.0 authentication flows
- Rate limiting strategies (token bucket)
- Data fetching and caching
- TypeScript interfaces for Reddit responses

**`stagehand-expert.md`** - E2E testing with Stagehand framework
- Test-first specifications from user stories
- Hybrid AI + data-testid test strategies
- Local and cloud execution modes

---

## 🎁 Upgrade to the Complete Framework

<div align="center">

### **Ready to Build Your Own Apps?**

This Insiders version gives you a taste, but the **Builder Pack** has everything you need to build production applications with Claude Code 2.0.

| Feature | Insiders | Builder Pack |
|---------|----------|--------------|
| **Application Code** | ❌ | ✅ Full Next.js 15 App |
| **Agents** | 3 Core | ✅ 9+ Specialized |
| **Orchestrator** | ❌ | ✅ Multi-Agent Coordinator |
| **Agent Prompts** | 2 | ✅ Complete Library |
| **Database** | ❌ | ✅ Schemas & Migrations |
| **Dashboard** | ❌ | ✅ Working UI |

### **[🚀 Get the Builder Pack Now →](https://rebrand.ly/d0e3fe)**

</div>

---

## 📚 Documentation

- **`docs/PRD.md`** - Original Product Requirements Document

> **🔓 Want custom slash commands for design and implementation workflows?** [Join the Insiders Club](https://aioriented.com) for free access to `/dev:design-app` and `/dev:implement-app`

---

## 🚀 Ready to Build Your Own Apps?

<div align="center">

### **From Learning to Building**

This public repository gives you the foundation. The **Builder Pack** gives you everything to ship.

**What You Get:**

| Component | Description |
|-----------|-------------|
| 🎯 **Working Application** | Complete Next.js 15 app with Reddit + OpenAI integration |
| 🤖 **9+ Specialized Agents** | orchestrator, ui-designer, system-architect, and more |
| 📝 **Complete Prompts** | All agent templates and coordination logic |
| 🗄️ **Database Ready** | Prisma schemas, migrations, and Supabase configs |
| 📊 **Dashboard UI** | Working charts, drill-downs, and CSV exports |
| 🎨 **shadcn/ui Components** | Pre-configured design system |
| 🚀 **Deploy Configs** | Vercel, Docker, and cron job setups |

### **[🎯 Get Full Access - Builder Pack →](https://rebrand.ly/d0e3fe)**

*Stop learning, start shipping. Get the complete framework today.*

</div>

---

## 🔗 Resources

- **Claude Code Documentation:** https://docs.claude.com/code
- **AI Oriented Insiders:** Join for free access to custom slash commands - https://aioriented.com
- **Tutorial Video:** https://www.youtube.com/watch?v=fHPjgY7tgf8&feature=youtu.be

---

## 🙏 Acknowledgments

Built with:
- **Claude Code 2.0** by Anthropic
- **Sonnet 4.5** (claude-sonnet-4-5-20250929)
- Custom multi-agent architecture patterns

---

**🌐 Public Repository - Built entirely using Claude Code 2.0**

For complete access to the multi-agent framework and working application, get the [Builder Pack](https://rebrand.ly/d0e3fe).
