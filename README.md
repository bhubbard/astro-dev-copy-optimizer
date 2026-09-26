# astro-dev-copy-optimizer

[![npm version](https://img.shields.io/npm/v/astro-dev-copy-optimizer.svg?style=flat-square)](https://www.npmjs.com/package/astro-dev-copy-optimizer)
[![Astro Integration](https://img.shields.io/badge/Astro-Integration-FF5D01.svg?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Chrome Built-in AI](https://img.shields.io/badge/Chrome-Built--in%20AI-4285F4.svg?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/ai/built-in)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-code.brandonhubbard.com-brightgreen?logo=github)](https://code.brandonhubbard.com/astro-dev-copy-optimizer/)

An Astro Dev Toolbar app that empowers developers and designers to click any text element on their page during development and instantly polish, rewrite, and optimize copy using local, on-device Chrome Built-in AI (`window.ai.rewriter`, `window.ai.writer`, and `window.ai.languageModel`).

Includes 1-click copy-to-clipboard, in-situ live preview replacement, streaming output cards, and preset copywriting tone profiles.

> 🎮 **Live Interactive Visualizer & Demo:** [astro-dev-copy-optimizer on code.brandonhubbard.com](https://code.brandonhubbard.com/astro-dev-copy-optimizer/)

---

## Features

- 🔍 **Interactive Text Element Inspector**: Click "Pick Text" and hover over any headline, paragraph, button, or CTA to grab its content with precise element tag targeting.
- ⚡ **Local On-Device AI**: Zero API keys or cloud costs—powered entirely by Chrome's on-device Gemini Nano via `window.ai`.
- 🎨 **Preset Copywriting Profiles**:
  - ⚡ **More Concise**: Strips fluff, passive voice, and wordiness while keeping core meaning.
  - 🎯 **High Conversion CTA**: Action-oriented, urgency-driven phrasing tailored for high click-through rates.
  - 🛠️ **Technical Accuracy**: Unambiguous, developer-friendly terminology with zero marketing hype.
  - 👋 **Casual & Friendly**: Warm, conversational, human brand voice.
  - ✨ **Engaging Headline**: High-impact hooks crafted for maximum readability.
- 🌊 **Live Streaming Generation**: Real-time response streaming with download status tracking.
- 📋 **1-Click Copy to Clipboard**: Instant clipboard copy with visual confirmation.
- 🚀 **In-Situ Live Replacement Preview**: Test new copy directly inside your rendered page with one click.
- 🛡️ **Graceful Multi-Tier Fallback**: Automatically tries `window.ai.rewriter` &rarr; `window.ai.writer` &rarr; `window.ai.languageModel` (Prompt API).
- 🔒 **Shadow DOM UI**: Isolated Dev Toolbar panel that won't interfere with your page styles.

---

## Installation

Install `astro-dev-copy-optimizer` into your Astro project:

```bash
# Using bun
bun add -d astro-dev-copy-optimizer

# Using pnpm
pnpm add -D astro-dev-copy-optimizer

# Using npm
npm install --save-dev astro-dev-copy-optimizer
```

---

## Chrome Built-in AI Prerequisites

`astro-dev-copy-optimizer` uses Google Chrome's built-in Gemini Nano model. To enable on-device AI in your browser:

1. **Use Google Chrome 128+** (Chrome Dev / Canary / Stable with flags enabled).
2. Enable experimental flags by visiting `chrome://flags` in your URL bar:
   - `chrome://flags/#prompt-api-for-gemini-nano` &rarr; Set to **Enabled**.
   - `chrome://flags/#rewriter-api-for-gemini-nano` &rarr; Set to **Enabled**.
   - `chrome://flags/#writer-api-for-gemini-nano` &rarr; Set to **Enabled**.
   - `chrome://flags/#optimization-guide-on-device-model` &rarr; Set to **Enabled BypassPrefRequirement**.
3. Relaunch Chrome.
4. Verify the model download status in `chrome://components`:
   - Find **Optimization Guide On Device Model** and click **Check for update** until it is fully downloaded.

---

## Quick Start

Add the integration to your `astro.config.mjs` (or `.ts`):

```js
import { defineConfig } from 'astro/config';
import copyOptimizer from 'astro-dev-copy-optimizer';

export default defineConfig({
  integrations: [
    copyOptimizer(),
  ],
});
```

Start your dev server:

```bash
bun run dev
```

Open your app in Chrome, look for the **Copy Optimizer** icon in the Astro Dev Toolbar at the bottom of the screen, and click **Pick Text**!

---

## Integration Options

You can customize the toolbar app name or icon:

```ts
import { defineConfig } from 'astro/config';
import copyOptimizer from 'astro-dev-copy-optimizer';

export default defineConfig({
  integrations: [
    copyOptimizer({
      name: 'AI Copy Polish', // Custom toolbar title
    }),
  ],
});
```

### Options Reference

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | `'Copy Optimizer'` | Display title for the app in the Astro Dev Toolbar. |
| `icon` | `string` | SVG icon | Custom SVG string for the toolbar button. |

---

## Programmatic API

You can also use the optimizer programmatically in your own client-side scripts:

```ts
import { optimizeCopy, checkAICapabilities } from 'astro-dev-copy-optimizer';

// Check browser capability status
const status = await checkAICapabilities();
console.log(status.status); // 'available' | 'download-needed' | 'unavailable' | 'unsupported'

// Optimize text
const result = await optimizeCopy('Sign up to get 10% discount on software today', {
  toneId: 'high-conversion-cta',
  context: 'SaaS landing page hero section',
  onChunk: (partial) => {
    console.log('Streaming chunk:', partial);
  },
});

console.log(result.optimized);
```

---

## Testing & Quality

Run the test suite:

```bash
bun test
```

Type check:

```bash
bun run typecheck
```

Build for distribution:

```bash
bun run build
```

---

## License

[MIT](LICENSE) © [bhubbard](https://github.com/bhubbard)
