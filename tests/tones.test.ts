import { describe, it, expect } from 'bun:test';
import {
  TONE_PRESETS,
  DEFAULT_TONE_ID,
  getTonePreset,
  sanitizeInput,
  validateInput,
} from '../src/tones.js';

describe('Tone Presets Configuration', () => {
  it('should define all required preset tones', () => {
    const ids = TONE_PRESETS.map((p) => p.id);
    expect(ids).toContain('more-concise');
    expect(ids).toContain('high-conversion-cta');
    expect(ids).toContain('technical-accuracy');
    expect(ids).toContain('casual-friendly');
  });

  it('should have non-empty metadata and prompt builders for every preset', () => {
    for (const preset of TONE_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.icon.length).toBeGreaterThan(0);
      expect(preset.systemPrompt.length).toBeGreaterThan(0);

      const promptWithoutContext = preset.buildPrompt('Sign Up Now');
      expect(promptWithoutContext).toContain('Sign Up Now');

      const promptWithContext = preset.buildPrompt('Sign Up Now', 'Hero pricing section');
      expect(promptWithContext).toContain('Sign Up Now');
      expect(promptWithContext).toContain('Hero pricing section');
    }
  });

  it('should retrieve preset by ID correctly', () => {
    const concise = getTonePreset('more-concise');
    expect(concise.id).toBe('more-concise');
    expect(concise.name).toBe('More Concise');

    const cta = getTonePreset('high-conversion-cta');
    expect(cta.id).toBe('high-conversion-cta');

    // Default fallback
    const fallback = getTonePreset('non-existent-tone');
    expect(fallback.id).toBe(DEFAULT_TONE_ID);

    const undefinedFallback = getTonePreset(undefined);
    expect(undefinedFallback.id).toBe(DEFAULT_TONE_ID);
  });
});

describe('Input Sanitization and Validation', () => {
  it('should sanitize extra spaces, line breaks, and whitespace', () => {
    const input = '   Hello \r\n  World \t  \n  ';
    const cleaned = sanitizeInput(input);
    expect(cleaned).toBe('Hello \n World');
  });

  it('should validate inputs correctly', () => {
    const emptyRes = validateInput('');
    expect(emptyRes.valid).toBe(false);
    expect(emptyRes.error).toBeDefined();

    const spacesRes = validateInput('    \n\t  ');
    expect(spacesRes.valid).toBe(false);

    const validRes = validateInput('Get started with Astro today!');
    expect(validRes.valid).toBe(true);
    expect(validRes.error).toBeUndefined();

    const hugeText = 'A'.repeat(8500);
    const hugeRes = validateInput(hugeText);
    expect(hugeRes.valid).toBe(false);
    expect(hugeRes.error).toContain('too long');
  });
});
