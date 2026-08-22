/**
 * Tone presets and prompt templates for Astro Dev Copy Optimizer
 */

import type { AIRewriterTone, AIRewriterLength, AIRewriterFormat } from './chrome-ai.js';

export interface TonePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  rewriterOptions?: {
    tone?: AIRewriterTone;
    length?: AIRewriterLength;
    format?: AIRewriterFormat;
  };
  buildPrompt: (text: string, context?: string) => string;
}

export const TONE_PRESETS: TonePreset[] = [
  {
    id: 'more-concise',
    name: 'More Concise',
    description: 'Crisp, brief, and punchy copy that removes fluff while preserving core meaning.',
    icon: '⚡',
    rewriterOptions: {
      tone: 'as-is',
      length: 'shorter',
      format: 'plain-text',
    },
    systemPrompt:
      'You are an expert copy editor. Make the provided web copy significantly more concise, direct, and impactful. Remove redundant words, passive voice, and filler while maintaining the original message.',
    buildPrompt: (text: string, context?: string) => {
      const contextClause = context ? `Context: ${context.trim()}\n\n` : '';
      return `${contextClause}Rewrite the following copy to be as concise, punchy, and clear as possible without losing essential meaning:\n\n"${text.trim()}"`;
    },
  },
  {
    id: 'high-conversion-cta',
    name: 'High Conversion CTA',
    description: 'Compelling, action-oriented, and high-urgency phrasing to maximize clicks and engagement.',
    icon: '🎯',
    rewriterOptions: {
      tone: 'more-casual',
      length: 'as-is',
      format: 'plain-text',
    },
    systemPrompt:
      'You are a world-class conversion rate optimization (CRO) copywriter. Craft high-converting, value-driven call-to-action or marketing copy that sparks immediate action, builds trust, and removes friction.',
    buildPrompt: (text: string, context?: string) => {
      const contextClause = context ? `Context: ${context.trim()}\n\n` : '';
      return `${contextClause}Transform the following copy into high-converting, irresistible call-to-action or product copy:\n\n"${text.trim()}"`;
    },
  },
  {
    id: 'technical-accuracy',
    name: 'Technical Accuracy',
    description: 'Precise, developer-focused, unambiguous wording with standard terminology and no hype.',
    icon: '🛠️',
    rewriterOptions: {
      tone: 'more-formal',
      length: 'as-is',
      format: 'plain-text',
    },
    systemPrompt:
      'You are a senior technical writer and developer advocate. Rewrite the text to be technically precise, unambiguous, and professional using standard industry terminology with zero marketing fluff.',
    buildPrompt: (text: string, context?: string) => {
      const contextClause = context ? `Context: ${context.trim()}\n\n` : '';
      return `${contextClause}Rewrite the following technical text for optimal clarity, precision, and developer accuracy:\n\n"${text.trim()}"`;
    },
  },
  {
    id: 'casual-friendly',
    name: 'Casual & Friendly',
    description: 'Warm, conversational, approachable tone that feels human, delightful, and natural.',
    icon: '👋',
    rewriterOptions: {
      tone: 'more-casual',
      length: 'as-is',
      format: 'plain-text',
    },
    systemPrompt:
      'You are a friendly brand voice copywriter. Rewrite the copy to be warm, approachable, conversational, and delightful while keeping it natural and easy to read.',
    buildPrompt: (text: string, context?: string) => {
      const contextClause = context ? `Context: ${context.trim()}\n\n` : '';
      return `${contextClause}Rewrite the following copy to feel friendly, conversational, and welcoming:\n\n"${text.trim()}"`;
    },
  },
  {
    id: 'engaging-headline',
    name: 'Engaging Headline',
    description: 'Attention-grabbing headlines and subheadings crafted for maximum readability.',
    icon: '✨',
    rewriterOptions: {
      tone: 'as-is',
      length: 'as-is',
      format: 'plain-text',
    },
    systemPrompt:
      'You are a headline specialist. Craft an attention-grabbing, highly engaging headline or hook that captures attention instantly and sparks curiosity.',
    buildPrompt: (text: string, context?: string) => {
      const contextClause = context ? `Context: ${context.trim()}\n\n` : '';
      return `${contextClause}Rewrite the following text into an engaging, high-impact headline:\n\n"${text.trim()}"`;
    },
  },
];

export const DEFAULT_TONE_ID = 'more-concise';

/**
 * Find a preset by ID or return default
 */
export function getTonePreset(id?: string): TonePreset {
  if (!id) return TONE_PRESETS[0];
  const found = TONE_PRESETS.find((p) => p.id === id);
  return found || TONE_PRESETS[0];
}

/**
 * Sanitize text input by trimming whitespace and normalizing line breaks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Validate input string for rewriting
 */
export function validateInput(input: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(input);
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Text content cannot be empty.' };
  }
  if (sanitized.length > 8000) {
    return { valid: false, error: 'Text is too long (maximum 8,000 characters supported).' };
  }
  return { valid: true };
}
