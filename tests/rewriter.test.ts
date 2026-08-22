import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  cleanModelOutput,
  checkAICapabilities,
  optimizeCopy,
} from '../src/rewriter.js';
import type { AIAssistant } from '../src/chrome-ai.js';

describe('cleanModelOutput', () => {
  it('strips matching surrounding double quotes and single quotes', () => {
    expect(cleanModelOutput('"Boost your revenue today"')).toBe('Boost your revenue today');
    expect(cleanModelOutput("'Build fast websites'")).toBe('Build fast websites');
    expect(cleanModelOutput('“Start building in minutes”')).toBe('Start building in minutes');
  });

  it('strips markdown code fence blocks if returned by model', () => {
    const fenced = '```markdown\nSupercharge your workflow\n```';
    expect(cleanModelOutput(fenced)).toBe('Supercharge your workflow');
  });

  it('keeps inner quotes untouched', () => {
    expect(cleanModelOutput('Click "Submit" to continue')).toBe('Click "Submit" to continue');
  });
});

describe('checkAICapabilities', () => {
  const originalAI = (globalThis as unknown as { ai?: AIAssistant }).ai;

  afterEach(() => {
    (globalThis as unknown as { ai?: AIAssistant }).ai = originalAI;
  });

  it('returns unsupported when window.ai / ai is absent', async () => {
    (globalThis as unknown as { ai?: AIAssistant }).ai = undefined;
    const report = await checkAICapabilities();
    expect(report.status).toBe('unsupported');
    expect(report.hasRewriter).toBe(false);
  });

  it('returns available when rewriter is ready', async () => {
    (globalThis as unknown as { ai: AIAssistant }).ai = {
      rewriter: {
        capabilities: async () => ({ available: 'readily' }),
        create: async () => ({} as never),
      },
    };
    const report = await checkAICapabilities();
    expect(report.status).toBe('available');
    expect(report.hasRewriter).toBe(true);
  });

  it('returns download-needed when model status is after-download', async () => {
    (globalThis as unknown as { ai: AIAssistant }).ai = {
      languageModel: {
        capabilities: async () => ({ available: 'after-download' }),
        create: async () => ({} as never),
      },
    };
    const report = await checkAICapabilities();
    expect(report.status).toBe('download-needed');
    expect(report.hasLanguageModel).toBe(true);
  });
});

describe('optimizeCopy execution pipeline', () => {
  const originalAI = (globalThis as unknown as { ai?: AIAssistant }).ai;

  afterEach(() => {
    (globalThis as unknown as { ai?: AIAssistant }).ai = originalAI;
  });

  it('rejects empty input', async () => {
    expect(optimizeCopy('')).rejects.toThrow('Text content cannot be empty');
  });

  it('rejects when ai is not available', async () => {
    (globalThis as unknown as { ai?: AIAssistant }).ai = undefined;
    expect(optimizeCopy('Hello world')).rejects.toThrow('Chrome Built-in AI is not available');
  });

  it('optimizes copy using ai.rewriter', async () => {
    let destroyed = false;
    (globalThis as unknown as { ai: AIAssistant }).ai = {
      rewriter: {
        capabilities: async () => ({ available: 'readily' }),
        create: async (options) => ({
          rewrite: async (text) => `Polished: ${text}`,
          rewriteStreaming: (text) => {
            return new ReadableStream({
              start(controller) {
                controller.enqueue(`Polished: ${text}`);
                controller.close();
              },
            });
          },
          destroy: () => {
            destroyed = true;
          },
        }),
      },
    };

    const res = await optimizeCopy('Click here to buy our software', {
      toneId: 'high-conversion-cta',
    });

    expect(res.engine).toBe('rewriter');
    expect(res.original).toBe('Click here to buy our software');
    expect(res.optimized).toBe('Polished: Click here to buy our software');
    expect(destroyed).toBe(true);
  });

  it('supports streaming with onChunk callback in rewriter', async () => {
    const chunks: string[] = [];
    (globalThis as unknown as { ai: AIAssistant }).ai = {
      rewriter: {
        capabilities: async () => ({ available: 'readily' }),
        create: async () => ({
          rewrite: async (text) => text,
          rewriteStreaming: (text) => {
            return new ReadableStream({
              start(controller) {
                controller.enqueue('Boost ');
                controller.enqueue('your ');
                controller.enqueue('conversions');
                controller.close();
              },
            });
          },
          destroy: () => {},
        }),
      },
    };

    const res = await optimizeCopy('Better copy', {
      onChunk: (chunk) => {
        chunks.push(chunk);
      },
    });

    expect(res.optimized).toBe('Boost your conversions');
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('falls back to ai.languageModel (Prompt API) when rewriter fails', async () => {
    let lmDestroyed = false;
    (globalThis as unknown as { ai: AIAssistant }).ai = {
      rewriter: {
        capabilities: async () => ({ available: 'readily' }),
        create: async () => {
          throw new Error('Rewriter session initialization failed');
        },
      },
      languageModel: {
        capabilities: async () => ({ available: 'readily' }),
        create: async () => ({
          prompt: async (text) => 'Concise copy output',
          promptStreaming: (text) => {
            return new ReadableStream({
              start(controller) {
                controller.enqueue('Concise copy output');
                controller.close();
              },
            });
          },
          countPromptTokens: async () => 10,
          maxTokens: 4096,
          tokensSoFar: 0,
          tokensLeft: 4096,
          topK: 3,
          temperature: 0.7,
          clone: async () => ({} as never),
          destroy: () => {
            lmDestroyed = true;
          },
        }),
      },
    };

    const res = await optimizeCopy('Original bloated text', { toneId: 'more-concise' });
    expect(res.engine).toBe('languageModel');
    expect(res.optimized).toBe('Concise copy output');
    expect(lmDestroyed).toBe(true);
  });
});
