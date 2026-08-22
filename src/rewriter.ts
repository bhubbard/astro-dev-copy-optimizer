/**
 * Chrome Built-in AI Rewriter & Prompt API safe wrapper
 */

import type { AIAssistant, AICapabilityAvailability, AIRewriter, AILanguageModel, AIWriter } from './chrome-ai.js';
import { getTonePreset, sanitizeInput, validateInput, type TonePreset } from './tones.js';

export type AICapabilityStatus = 'available' | 'download-needed' | 'unavailable' | 'unsupported';

export interface AICapabilityReport {
  status: AICapabilityStatus;
  hasRewriter: boolean;
  hasWriter: boolean;
  hasLanguageModel: boolean;
  details: string;
}

export interface OptimizeCopyOptions {
  toneId?: string;
  context?: string;
  signal?: AbortSignal;
  onChunk?: (partialText: string) => void;
  onDownloadProgress?: (loaded: number, total: number) => void;
  customPreset?: TonePreset;
}

export interface OptimizeCopyResult {
  original: string;
  optimized: string;
  toneId: string;
  engine: 'rewriter' | 'writer' | 'languageModel';
}

/**
 * Safely resolves the window.ai or global ai assistant object
 */
export function getAIAssistant(): AIAssistant | undefined {
  if (typeof window !== 'undefined' && window.ai) {
    return window.ai;
  }
  if (typeof (globalThis as unknown as { ai?: AIAssistant }).ai !== 'undefined') {
    return (globalThis as unknown as { ai: AIAssistant }).ai;
  }
  return undefined;
}

/**
 * Check browser capabilities for Chrome Built-in AI
 */
export async function checkAICapabilities(): Promise<AICapabilityReport> {
  const assistant = getAIAssistant();

  if (!assistant) {
    return {
      status: 'unsupported',
      hasRewriter: false,
      hasWriter: false,
      hasLanguageModel: false,
      details:
        'Chrome Built-in AI is not detected. Please enable flags in chrome://flags (Prompt API, Rewriter API).',
    };
  }

  let rewriterStatus: AICapabilityAvailability = 'no';
  let writerStatus: AICapabilityAvailability = 'no';
  let lmStatus: AICapabilityAvailability = 'no';

  try {
    if (assistant.rewriter?.capabilities) {
      const caps = await assistant.rewriter.capabilities();
      rewriterStatus = caps.available;
    }
  } catch {
    rewriterStatus = 'no';
  }

  try {
    if (assistant.writer?.capabilities) {
      const caps = await assistant.writer.capabilities();
      writerStatus = caps.available;
    }
  } catch {
    writerStatus = 'no';
  }

  try {
    if (assistant.languageModel?.capabilities) {
      const caps = await assistant.languageModel.capabilities();
      lmStatus = caps.available;
    }
  } catch {
    lmStatus = 'no';
  }

  const hasRewriter = rewriterStatus === 'readily' || rewriterStatus === 'after-download';
  const hasWriter = writerStatus === 'readily' || writerStatus === 'after-download';
  const hasLanguageModel = lmStatus === 'readily' || lmStatus === 'after-download';

  if (!hasRewriter && !hasWriter && !hasLanguageModel) {
    return {
      status: 'unavailable',
      hasRewriter: false,
      hasWriter: false,
      hasLanguageModel: false,
      details: 'AI APIs are present but models are not currently supported on this device/configuration.',
    };
  }

  const downloadNeeded =
    rewriterStatus === 'after-download' ||
    writerStatus === 'after-download' ||
    lmStatus === 'after-download';

  return {
    status: downloadNeeded ? 'download-needed' : 'available',
    hasRewriter,
    hasWriter,
    hasLanguageModel,
    details: downloadNeeded
      ? 'AI model requires an initial download by Chrome before first use.'
      : 'Chrome Built-in AI is ready.',
  };
}

/**
 * Main copy optimization runner with fallback strategy:
 * 1. window.ai.rewriter
 * 2. window.ai.writer
 * 3. window.ai.languageModel (Prompt API)
 */
export async function optimizeCopy(
  input: string,
  options: OptimizeCopyOptions = {}
): Promise<OptimizeCopyResult> {
  const validation = validateInput(input);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid input.');
  }

  const sanitized = sanitizeInput(input);
  const preset = options.customPreset || getTonePreset(options.toneId);
  const assistant = getAIAssistant();

  if (!assistant) {
    throw new Error(
      'Chrome Built-in AI is not available in this environment. Ensure Chrome experimental flags are enabled.'
    );
  }

  const errors: string[] = [];

  // Attempt 1: AIRewriter
  if (assistant.rewriter?.create) {
    let rewriterSession: AIRewriter | undefined;
    try {
      rewriterSession = await assistant.rewriter.create({
        signal: options.signal,
        tone: preset.rewriterOptions?.tone,
        format: preset.rewriterOptions?.format || 'plain-text',
        length: preset.rewriterOptions?.length,
        sharedContext: options.context || preset.systemPrompt,
        monitor: options.onDownloadProgress
          ? (m) => {
              m.addEventListener('downloadprogress', (e) => {
                options.onDownloadProgress?.(e.loaded, e.total);
              });
            }
          : undefined,
      });

      let output = '';
      if (options.onChunk && typeof rewriterSession.rewriteStreaming === 'function') {
        const stream = rewriterSession.rewriteStreaming(sanitized, {
          context: options.context,
          signal: options.signal,
        });
        output = await readStream(stream, options.onChunk);
      } else {
        output = await rewriterSession.rewrite(sanitized, {
          context: options.context,
          signal: options.signal,
        });
      }

      const trimmed = output.trim();
      if (trimmed.length > 0) {
        return {
          original: sanitized,
          optimized: cleanModelOutput(trimmed),
          toneId: preset.id,
          engine: 'rewriter',
        };
      }
    } catch (err: unknown) {
      errors.push(`Rewriter failed: ${(err as Error).message || String(err)}`);
    } finally {
      if (rewriterSession && typeof rewriterSession.destroy === 'function') {
        try {
          rewriterSession.destroy();
        } catch {
          // Ignore destruction errors
        }
      }
    }
  }

  // Attempt 2: AIWriter
  if (assistant.writer?.create) {
    let writerSession: AIWriter | undefined;
    try {
      writerSession = await assistant.writer.create({
        signal: options.signal,
        tone: preset.rewriterOptions?.tone,
        format: preset.rewriterOptions?.format || 'plain-text',
        length: preset.rewriterOptions?.length,
        sharedContext: preset.systemPrompt,
        monitor: options.onDownloadProgress
          ? (m) => {
              m.addEventListener('downloadprogress', (e) => {
                options.onDownloadProgress?.(e.loaded, e.total);
              });
            }
          : undefined,
      });

      const writePrompt = preset.buildPrompt(sanitized, options.context);
      let output = '';
      if (options.onChunk && typeof writerSession.writeStreaming === 'function') {
        const stream = writerSession.writeStreaming(writePrompt, {
          context: options.context,
          signal: options.signal,
        });
        output = await readStream(stream, options.onChunk);
      } else {
        output = await writerSession.write(writePrompt, {
          context: options.context,
          signal: options.signal,
        });
      }

      const trimmed = output.trim();
      if (trimmed.length > 0) {
        return {
          original: sanitized,
          optimized: cleanModelOutput(trimmed),
          toneId: preset.id,
          engine: 'writer',
        };
      }
    } catch (err: unknown) {
      errors.push(`Writer failed: ${(err as Error).message || String(err)}`);
    } finally {
      if (writerSession && typeof writerSession.destroy === 'function') {
        try {
          writerSession.destroy();
        } catch {
          // Ignore destruction errors
        }
      }
    }
  }

  // Attempt 3: AILanguageModel (Prompt API)
  if (assistant.languageModel?.create) {
    let lmSession: AILanguageModel | undefined;
    try {
      lmSession = await assistant.languageModel.create({
        signal: options.signal,
        systemPrompt: `${preset.systemPrompt}\nReturn ONLY the rewritten copy without conversational intros, explanations, or quotes.`,
        temperature: 0.7,
        topK: 3,
        monitor: options.onDownloadProgress
          ? (m) => {
              m.addEventListener('downloadprogress', (e) => {
                options.onDownloadProgress?.(e.loaded, e.total);
              });
            }
          : undefined,
      });

      const promptText = preset.buildPrompt(sanitized, options.context);
      let output = '';

      if (options.onChunk && typeof lmSession.promptStreaming === 'function') {
        const stream = lmSession.promptStreaming(promptText, {
          signal: options.signal,
        });
        output = await readStream(stream, options.onChunk);
      } else {
        output = await lmSession.prompt(promptText, {
          signal: options.signal,
        });
      }

      const trimmed = output.trim();
      if (trimmed.length > 0) {
        return {
          original: sanitized,
          optimized: cleanModelOutput(trimmed),
          toneId: preset.id,
          engine: 'languageModel',
        };
      }
    } catch (err: unknown) {
      errors.push(`LanguageModel failed: ${(err as Error).message || String(err)}`);
    } finally {
      if (lmSession && typeof lmSession.destroy === 'function') {
        try {
          lmSession.destroy();
        } catch {
          // Ignore destruction errors
        }
      }
    }
  }

  throw new Error(
    `Failed to optimize copy with all available AI engines.\n${errors.join('\n')}`
  );
}

/**
 * Reads a ReadableStream<string> and triggers onChunk callback
 */
async function readStream(
  stream: ReadableStream<string>,
  onChunk?: (text: string) => void
): Promise<string> {
  const reader = stream.getReader();
  let accumulated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (typeof value === 'string') {
        // Chrome AI streams may yield cumulative text or chunk deltas
        // If the chunk starts with the existing accumulated text, treat it as cumulative
        if (value.startsWith(accumulated) && value.length > accumulated.length) {
          accumulated = value;
        } else {
          accumulated += value;
        }
        if (onChunk) {
          onChunk(accumulated);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

/**
 * Cleans quotation marks or markdown code fences if added by the LLM
 */
export function cleanModelOutput(output: string): string {
  let cleaned = output.trim();
  // Strip surrounding quotes if matching
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
    (cleaned.startsWith('“') && cleaned.endsWith('”'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Strip code block backticks if present
  if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  return cleaned;
}
