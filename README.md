# ColdRunners

**Agentic business-intelligence and lead-research platform**

ColdRunners is a TypeScript-based application for discovering, analyzing, scoring, and exporting business leads. The repository combines a React/Vite frontend, an Express backend, agent workflows, and an MCP server.

> **Documentation note:** This README describes capabilities visible in the repository. It does not claim production scale, customer volume, uptime, or business outcomes unless those are measured and documented elsewhere.

## Engineering focus

- Agent workflow orchestration
- MCP server integration
- Tool and resource integration
- Lead/opportunity scoring
- External API integration
- Graceful fallback behavior
- Backend/frontend separation
- Export pipelines

## Architecture

```
React + Vite frontend
        |
     Express
        |
  Workflow / Agents
     /       \
 Plugins     MCP Server
     \       /
     External APIs
```

The repository documentation describes a six-agent workflow coordinated by a master planner and an MCP layer exposing tools and resources. Treat those as repository architecture claims; verify implementation details against the current source before describing the system as production infrastructure.

## Technology

- TypeScript
- Node.js
- Express
- React
- Vite
- Tailwind CSS
- MCP
- Google Gemini API
- Google Places
- Firecrawl
- Hunter.io
- Apollo.io
- PageSpeed Insights

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Available scripts documented by the repository include:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run clean
```

## Repository structure

The project is organized around a frontend, Express backend, agent/workflow logic, integrations, and MCP functionality. See the repository's `docs/` directory and architecture documents for the current implementation details.

## AI Systems Engineering relevance

ColdRunners is a useful proof-of-work project for:

- agent orchestration
- tool calling
- MCP
- API integration
- workflow design
- backend engineering
- failure/fallback handling

For portfolio claims, distinguish **implemented behavior** from roadmap architecture.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [AGENTS.md](AGENTS.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/backend.md](docs/backend.md)
- [docs/api.md](docs/api.md)
- [docs/mcp.md](docs/mcp.md)
- [docs/agents.md](docs/agents.md)
- [docs/roadmap.md](docs/roadmap.md)

## Keywords

AI Systems Engineer, Agentic AI, AI Agents, MCP, Model Context Protocol, LLM applications, TypeScript, Node.js, Express, React, API integration, workflow orchestration, business intelligence, automation.

## Status

Active engineering project / portfolio proof of work. Check the latest commits and documentation for implementation status.

## License

Proprietary — ColdRunners
