/**
 * Chrome Built-in AI TypeScript Definitions
 * Covers Prompt API (languageModel), Rewriter API, Writer API, Summarizer API, Translator API.
 */

export type AICapabilityAvailability = 'readily' | 'after-download' | 'no';

export interface AICapabilities {
  readonly available: AICapabilityAvailability;
  readonly defaultTone?: AIRewriterTone;
  readonly defaultFormat?: AIRewriterFormat;
  readonly defaultLength?: AIRewriterLength;
  readonly defaultTemperature?: number;
  readonly maxTemperature?: number;
  readonly defaultTopK?: number;
  readonly maxTopK?: number;
  supportsTone?(tone: AIRewriterTone): AICapabilityAvailability;
  supportsFormat?(format: AIRewriterFormat): AICapabilityAvailability;
  supportsLength?(length: AIRewriterLength): AICapabilityAvailability;
  languageAvailable?(languageTag: string): AICapabilityAvailability;
}

export type AIRewriterTone = 'as-is' | 'more-formal' | 'more-casual';
export type AIRewriterFormat = 'as-is' | 'plain-text' | 'markdown';
export type AIRewriterLength = 'as-is' | 'shorter' | 'longer';

export interface AIRewriterCreateOptions {
  signal?: AbortSignal;
  tone?: AIRewriterTone;
  format?: AIRewriterFormat;
  length?: AIRewriterLength;
  sharedContext?: string;
  monitor?: (monitor: AICreateMonitor) => void;
}

export interface AIRewriterRewriteOptions {
  context?: string;
  signal?: AbortSignal;
}

export interface AIRewriter {
  rewrite(input: string, options?: AIRewriterRewriteOptions): Promise<string>;
  rewriteStreaming(input: string, options?: AIRewriterRewriteOptions): ReadableStream<string>;
  destroy(): void;
}

export interface AIRewriterFactory {
  capabilities(): Promise<AICapabilities>;
  create(options?: AIRewriterCreateOptions): Promise<AIRewriter>;
}

export interface AIWriterCreateOptions {
  signal?: AbortSignal;
  tone?: AIRewriterTone;
  format?: AIRewriterFormat;
  length?: AIRewriterLength;
  sharedContext?: string;
  monitor?: (monitor: AICreateMonitor) => void;
}

export interface AIWriterWriteOptions {
  context?: string;
  signal?: AbortSignal;
}

export interface AIWriter {
  write(input: string, options?: AIWriterWriteOptions): Promise<string>;
  writeStreaming(input: string, options?: AIWriterWriteOptions): ReadableStream<string>;
  destroy(): void;
}

export interface AIWriterFactory {
  capabilities(): Promise<AICapabilities>;
  create(options?: AIWriterCreateOptions): Promise<AIWriter>;
}

export interface AILanguageModelPromptOptions {
  signal?: AbortSignal;
}

export interface AILanguageModelCreateOptions {
  signal?: AbortSignal;
  systemPrompt?: string;
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  topK?: number;
  monitor?: (monitor: AICreateMonitor) => void;
}

export interface AILanguageModel {
  prompt(input: string, options?: AILanguageModelPromptOptions): Promise<string>;
  promptStreaming(input: string, options?: AILanguageModelPromptOptions): ReadableStream<string>;
  countPromptTokens(input: string): Promise<number>;
  maxTokens: number;
  tokensSoFar: number;
  tokensLeft: number;
  topK: number;
  temperature: number;
  clone(): Promise<AILanguageModel>;
  destroy(): void;
}

export interface AILanguageModelFactory {
  capabilities(): Promise<AICapabilities>;
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
}

export interface AICreateMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: { loaded: number; total: number }) => void
  ): void;
}

export interface AISummarizerCreateOptions {
  signal?: AbortSignal;
  type?: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  format?: 'plain-text' | 'markdown';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
}

export interface AISummarizer {
  summarize(input: string, options?: { context?: string; signal?: AbortSignal }): Promise<string>;
  summarizeStreaming(input: string, options?: { context?: string; signal?: AbortSignal }): ReadableStream<string>;
  destroy(): void;
}

export interface AISummarizerFactory {
  capabilities(): Promise<AICapabilities>;
  create(options?: AISummarizerCreateOptions): Promise<AISummarizer>;
}

export interface AITranslatorCreateOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
}

export interface AITranslator {
  translate(input: string): Promise<string>;
  translateStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

export interface AITranslatorFactory {
  capabilities(): Promise<AICapabilities>;
  create(options: AITranslatorCreateOptions): Promise<AITranslator>;
}

export interface AIAssistant {
  rewriter?: AIRewriterFactory;
  writer?: AIWriterFactory;
  languageModel?: AILanguageModelFactory;
  summarizer?: AISummarizerFactory;
  translator?: AITranslatorFactory;
}

declare global {
  interface Window {
    ai?: AIAssistant;
  }
  const ai: AIAssistant | undefined;
}
