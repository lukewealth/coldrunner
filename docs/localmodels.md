# Local AI Models

## Overview

ColdRunners is designed to run entirely on local infrastructure using open-source LLMs served via Ollama. This document covers model selection, routing, and fallback strategies.

## Recommended Models

### Coding Tasks

| Model | Size | Use Case |
|-------|------|----------|
| Qwen2.5-Coder 32B | 32B | Primary coding model |
| Qwen3 Coder | Latest | Code generation, refactoring |
| DeepSeek Coder | 33B | Alternative coding model |

### Reasoning Tasks

| Model | Size | Use Case |
|-------|------|----------|
| DeepSeek-R1 | 671B (MoE) | Multi-step planning, complex reasoning |
| Qwen3 Thinking | Latest | Chain-of-thought reasoning |
| Llama 3.3 | 70B | General agent tasks |

### Vision Tasks

| Model | Size | Use Case |
|-------|------|----------|
| Gemma 3 | 27B | OCR, screenshot analysis |
| Qwen VL | Latest | Visual understanding |

### Fast Tasks

| Model | Size | Use Case |
|-------|------|----------|
| Qwen3 8B | 8B | Quick classifications, summaries |
| Llama 3.2 3B | 3B | Ultra-fast responses |

### Embeddings

| Model | Dimensions | Use Case |
|-------|-----------|----------|
| BGE-M3 | 1024 | Multilingual embeddings, fast retrieval |
| Nomic Embed | 768 | Alternative embedding model |

### Reranker

| Model | Use Case |
|-------|----------|
| BGE Reranker | Search result reranking for better quality |

## Serving Infrastructure

### Ollama (Primary)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull qwen2.5-coder:32b
ollama pull deepseek-r1:latest
ollama pull gemma3:27b
ollama pull bge-m3:latest

# Run server
ollama serve
# Default: http://localhost:11434
```

### Alternative Serving Options

| Tool | Purpose |
|------|---------|
| Ollama | Primary local inference |
| vLLM | High-throughput serving |
| LiteLLM | Unified API for multiple providers |
| LM Studio | Desktop GUI for local models |
| Open WebUI | Web interface for Ollama |

## LLM Routing Policy

```
Task arrives
    ↓
Classify task type
    ↓
┌─────────────────────────────────────┐
│ Coding      → Qwen2.5-Coder 32B    │
│ Reasoning   → DeepSeek-R1          │
│ Vision      → Gemma 3              │
│ Fast        → Qwen3 8B             │
│ Embeddings  → BGE-M3               │
│ Reranking   → BGE Reranker         │
└─────────────────────────────────────┘
    ↓
Ollama available?
    ├─ Yes → Execute locally
    └─ No  → Fallback chain
              ↓
           OpenRouter
              ↓
           Anthropic (Claude)
              ↓
           OpenAI (GPT)
              ↓
           Google (Gemini)
```

## Integration Architecture

```
┌─────────────────────────────────────────┐
│           LLM Router Service            │
│                                         │
│  ┌────────────┐  ┌──────────────────┐  │
│  │   Task     │  │   Model          │  │
│  │ Classifier │→ │   Selector       │  │
│  └────────────┘  └───────┬──────────┘  │
│                          │              │
│  ┌───────────────────────┴──────────┐  │
│  │        Provider Adapter          │  │
│  │                                  │  │
│  │  OllamaAdapter                   │  │
│  │  OpenRouterAdapter               │  │
│  │  AnthropicAdapter                │  │
│  │  OpenAIAdapter                   │  │
│  │  GeminiAdapter                   │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Rate Limiter │ Circuit Breaker │ Cache │
└─────────────────────────────────────────┘
```

## Configuration

```bash
# .env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL_CODING="qwen2.5-coder:32b"
OLLAMA_MODEL_REASONING="deepseek-r1:latest"
OLLAMA_MODEL_VISION="gemma3:27b"
OLLAMA_MODEL_FAST="qwen3:8b"
OLLAMA_MODEL_EMBEDDING="bge-m3:latest"

# Cloud fallback
OPENROUTER_API_KEY=""
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
GEMINI_API_KEY=""
```

## Hardware Requirements

| Model | VRAM | RAM | Disk |
|-------|------|-----|------|
| Qwen2.5-Coder 32B (Q4) | ~20GB | 32GB | ~18GB |
| DeepSeek-R1 (Q4) | ~40GB | 64GB | ~38GB |
| Gemma 3 27B (Q4) | ~16GB | 24GB | ~15GB |
| Qwen3 8B (Q4) | ~6GB | 8GB | ~5GB |
| BGE-M3 | ~2GB | 4GB | ~1.2GB |

### Minimum Setup (Coding + Fast)
- GPU: NVIDIA RTX 3090 (24GB) or Apple M2 Pro (32GB unified)
- RAM: 32GB
- Disk: 50GB free

### Recommended Setup (All models)
- GPU: NVIDIA A100 (80GB) or Apple M2 Ultra (192GB unified)
- RAM: 64GB+
- Disk: 200GB free

## Prompt Templates

### Business Analysis

```
You are a business intelligence analyst. Analyze the following business:

Name: {businessName}
Category: {category}
Location: {city}, {province}, {country}
Website: {website}
Rating: {rating}/5 ({reviewCount} reviews)

Provide:
1. Opportunity assessment (0-100 score)
2. Key issues identified
3. Recommended services
4. AI-powered insights

Return JSON: { "score": number, "issues": string[], "recommendations": string[], "insights": string }
```

### Email Draft

```
Write a personalized B2B outreach email:

Business: {name} ({category}) in {city}
Owner: {ownerName}
Website: {website} (Status: {websiteStatus})
Opportunity Score: {score}/100
Issues: {issues}
Recommended: {recommendedService}
Style: {style}

Return JSON: { "subject": "...", "body": "..." }
```

## Phase 2 Implementation Plan

1. Add Ollama client library
2. Implement LLM Router service
3. Add task classification logic
4. Create provider adapters
5. Implement fallback chain
6. Add rate limiting and circuit breakers
7. Create prompt template system
8. Add response caching
9. Implement streaming support
10. Add usage monitoring
