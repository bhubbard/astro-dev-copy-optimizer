/**
 * astro-dev-copy-optimizer
 * Astro Dev Toolbar app to inspect and optimize on-page copy using Chrome Built-in AI.
 */

import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';

export interface CopyOptimizerOptions {
  /** Custom display name in the Astro Dev Toolbar */
  name?: string;
  /** Custom SVG icon string */
  icon?: string;
}

const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20h9"/>
  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  <path d="m15 5 3 3"/>
</svg>`;

export function copyOptimizer(options: CopyOptimizerOptions = {}): AstroIntegration {
  return {
    name: 'astro-dev-copy-optimizer',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: 'astro-dev-copy-optimizer',
          name: options.name || 'Copy Optimizer',
          icon: options.icon || DEFAULT_ICON,
          entrypoint: fileURLToPath(new URL('./app.js', import.meta.url)),
        });
      },
    },
  };
}

export {
  TONE_PRESETS,
  DEFAULT_TONE_ID,
  getTonePreset,
  sanitizeInput,
  validateInput,
  type TonePreset,
} from './tones.js';

export {
  optimizeCopy,
  checkAICapabilities,
  cleanModelOutput,
  getAIAssistant,
  type AICapabilityReport,
  type AICapabilityStatus,
  type OptimizeCopyOptions,
  type OptimizeCopyResult,
} from './rewriter.js';

export default copyOptimizer;

