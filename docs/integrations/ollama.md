# Ollama Integration Guide

## Overview

Ollama is a local LLM serving platform that enables running large language models on your own infrastructure. ColdRunners uses Ollama as the primary inference engine for all AI tasks.

**Official Documentation:** https://ollama.com  
**API Reference:** https://github.com/ollama/ollama/blob/main/docs/api.md  
**Model Library:** https://ollama.com/library

## Installation

### macOS / Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Docker

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### GPU Support (NVIDIA)

```bash
docker run -d --gpus all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

## ColdRunners Configuration

### Environment Variables

```bash
# .env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_CODING=qwen2.5-coder:32b
OLLAMA_MODEL_REASONING=deepseek-r1:latest
OLLAMA_MODEL_VISION=gemma3:27b
OLLAMA_MODEL_FAST=qwen3:8b
OLLAMA_MODEL_EMBEDDING=bge-m3:latest
```

### Model Routing

```typescript
// src/server/services/llm-router.ts
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL });

export async function routeTask(task: AITask): Promise<string> {
  const model = getModelForTask(task.type);
  
  const response = await ollama.chat({
    model,
    messages: [
      { role: 'system', content: task.systemPrompt },
      { role: 'user', content: task.userPrompt }
    ],
    options: {
      temperature: task.temperature ?? 0.7,
      top_p: task.topP ?? 0.9,
      num_predict: task.maxTokens ?? 1024
    }
  });
  
  return response.message.content;
}

function getModelForTask(type: TaskType): string {
  switch (type) {
    case 'coding':
      return process.env.OLLAMA_MODEL_CODING!;
    case 'reasoning':
      return process.env.OLLAMA_MODEL_REASONING!;
    case 'vision':
      return process.env.OLLAMA_MODEL_VISION!;
    case 'fast':
      return process.env.OLLAMA_MODEL_FAST!;
    case 'embedding':
      return process.env.OLLAMA_MODEL_EMBEDDING!;
    default:
      return process.env.OLLAMA_MODEL_FAST!;
  }
}
```

## Recommended Models for ColdRunners

### Primary Models

| Purpose | Model | Size | VRAM | Use Case |
|---------|-------|------|------|----------|
| Coding | `qwen2.5-coder:32b` | 32B | ~20GB | Code generation, refactoring, debugging |
| Reasoning | `deepseek-r1:latest` | 671B (MoE) | ~40GB | Multi-step planning, complex analysis |
| Vision | `gemma3:27b` | 27B | ~16GB | Screenshot analysis, OCR, UI understanding |
| Fast Tasks | `qwen3:8b` | 8B | ~6GB | Classification, summaries, quick responses |
| Embeddings | `bge-m3:latest` | 568M | ~2GB | Vector embeddings for RAG |

### Pull Commands

```bash
# Core models
ollama pull qwen2.5-coder:32b
ollama pull deepseek-r1:latest
ollama pull gemma3:27b
ollama pull qwen3:8b
ollama pull bge-m3:latest

# Alternative models
ollama pull llama3.3:70b          # General purpose
ollama pull mistral-large:latest  # Balanced performance
ollama pull nomic-embed-text      # Alternative embeddings
```

## API Usage

### Generate Completion

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5-coder:32b",
  "prompt": "Write a function to calculate opportunity score",
  "stream": false
}'
```

### Chat Completion

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5-coder:32b",
  "messages": [
    {"role": "system", "content": "You are a business intelligence analyst."},
    {"role": "user", "content": "Analyze this business: ..."}
  ],
  "stream": false
}'
```

### Generate Embeddings

```bash
curl http://localhost:11434/api/embeddings -d '{
  "model": "bge-m3:latest",
  "prompt": "Business description text"
}'
```

## TypeScript SDK

### Installation

```bash
npm install ollama
```

### Usage

```typescript
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

// Chat
const response = await ollama.chat({
  model: 'qwen2.5-coder:32b',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.message.content);

// Generate embeddings
const embedding = await ollama.embeddings({
  model: 'bge-m3:latest',
  prompt: 'Text to embed',
});

console.log(embedding.embedding); // number[]
```

## Health Check

```typescript
async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
```

## Performance Tuning

### Context Window

```typescript
const response = await ollama.chat({
  model: 'qwen2.5-coder:32b',
  messages: [...],
  options: {
    num_ctx: 8192,  // Context window size (default: 2048)
  }
});
```

### Batch Processing

```typescript
// Process multiple prompts in parallel
const promises = prompts.map(prompt => 
  ollama.chat({
    model: 'qwen2.5-coder:32b',
    messages: [{ role: 'user', content: prompt }],
  })
);

const results = await Promise.all(promises);
```

## Troubleshooting

### Model Not Found

```bash
# List installed models
ollama list

# Pull missing model
ollama pull qwen2.5-coder:32b
```

### Out of Memory

```bash
# Use smaller quantization
ollama pull qwen2.5-coder:32b-q4_K_M  # 4-bit quantization

# Or use smaller model
ollama pull qwen2.5-coder:7b
```

### Slow Inference

- Ensure GPU acceleration is enabled
- Check VRAM usage: `nvidia-smi`
- Reduce context window size
- Use smaller models for fast tasks

## Integration Points

### Agent System

```typescript
// src/server/agents/llm-agent.ts
import { Ollama } from 'ollama';

export class LLMAgent {
  private ollama: Ollama;
  
  constructor() {
    this.ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL });
  }
  
  async analyze(lead: BusinessLead): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(lead);
    
    const response = await this.ollama.chat({
      model: process.env.OLLAMA_MODEL_CODING!,
      messages: [
        { role: 'system', content: 'You are a business intelligence analyst.' },
        { role: 'user', content: prompt }
      ],
      options: { temperature: 0.3 }
    });
    
    return JSON.parse(response.message.content);
  }
}
```

### RAG Pipeline

```typescript
// src/server/services/rag.ts
import { Ollama } from 'ollama';
import { QdrantClient } from '@qdrant/js-client-rest';

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL });
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

export async function retrieveAndGenerate(query: string): Promise<string> {
  // 1. Embed query
  const queryEmbedding = await ollama.embeddings({
    model: 'bge-m3:latest',
    prompt: query,
  });
  
  // 2. Search vector store
  const results = await qdrant.search('documents', {
    vector: queryEmbedding.embedding,
    limit: 5,
  });
  
  // 3. Build context
  const context = results.map(r => r.payload.text).join('\n\n');
  
  // 4. Generate response
  const response = await ollama.chat({
    model: 'qwen2.5-coder:32b',
    messages: [
      { role: 'system', content: `Context:\n${context}` },
      { role: 'user', content: query }
    ],
  });
  
  return response.message.content;
}
```

## Resources

- **Official Docs:** https://ollama.com
- **API Reference:** https://github.com/ollama/ollama/blob/main/docs/api.md
- **Model Library:** https://ollama.com/library
- **GitHub:** https://github.com/ollama/ollama
- **Discord:** https://discord.gg/ollama
