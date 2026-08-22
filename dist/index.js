// src/index.ts
import { fileURLToPath } from "node:url";

// src/tones.ts
var TONE_PRESETS = [
  {
    id: "more-concise",
    name: "More Concise",
    description: "Crisp, brief, and punchy copy that removes fluff while preserving core meaning.",
    icon: "⚡",
    rewriterOptions: {
      tone: "as-is",
      length: "shorter",
      format: "plain-text"
    },
    systemPrompt: "You are an expert copy editor. Make the provided web copy significantly more concise, direct, and impactful. Remove redundant words, passive voice, and filler while maintaining the original message.",
    buildPrompt: (text, context) => {
      const contextClause = context ? `Context: ${context.trim()}

` : "";
      return `${contextClause}Rewrite the following copy to be as concise, punchy, and clear as possible without losing essential meaning:

"${text.trim()}"`;
    }
  },
  {
    id: "high-conversion-cta",
    name: "High Conversion CTA",
    description: "Compelling, action-oriented, and high-urgency phrasing to maximize clicks and engagement.",
    icon: "\uD83C\uDFAF",
    rewriterOptions: {
      tone: "more-casual",
      length: "as-is",
      format: "plain-text"
    },
    systemPrompt: "You are a world-class conversion rate optimization (CRO) copywriter. Craft high-converting, value-driven call-to-action or marketing copy that sparks immediate action, builds trust, and removes friction.",
    buildPrompt: (text, context) => {
      const contextClause = context ? `Context: ${context.trim()}

` : "";
      return `${contextClause}Transform the following copy into high-converting, irresistible call-to-action or product copy:

"${text.trim()}"`;
    }
  },
  {
    id: "technical-accuracy",
    name: "Technical Accuracy",
    description: "Precise, developer-focused, unambiguous wording with standard terminology and no hype.",
    icon: "\uD83D\uDEE0️",
    rewriterOptions: {
      tone: "more-formal",
      length: "as-is",
      format: "plain-text"
    },
    systemPrompt: "You are a senior technical writer and developer advocate. Rewrite the text to be technically precise, unambiguous, and professional using standard industry terminology with zero marketing fluff.",
    buildPrompt: (text, context) => {
      const contextClause = context ? `Context: ${context.trim()}

` : "";
      return `${contextClause}Rewrite the following technical text for optimal clarity, precision, and developer accuracy:

"${text.trim()}"`;
    }
  },
  {
    id: "casual-friendly",
    name: "Casual & Friendly",
    description: "Warm, conversational, approachable tone that feels human, delightful, and natural.",
    icon: "\uD83D\uDC4B",
    rewriterOptions: {
      tone: "more-casual",
      length: "as-is",
      format: "plain-text"
    },
    systemPrompt: "You are a friendly brand voice copywriter. Rewrite the copy to be warm, approachable, conversational, and delightful while keeping it natural and easy to read.",
    buildPrompt: (text, context) => {
      const contextClause = context ? `Context: ${context.trim()}

` : "";
      return `${contextClause}Rewrite the following copy to feel friendly, conversational, and welcoming:

"${text.trim()}"`;
    }
  },
  {
    id: "engaging-headline",
    name: "Engaging Headline",
    description: "Attention-grabbing headlines and subheadings crafted for maximum readability.",
    icon: "✨",
    rewriterOptions: {
      tone: "as-is",
      length: "as-is",
      format: "plain-text"
    },
    systemPrompt: "You are a headline specialist. Craft an attention-grabbing, highly engaging headline or hook that captures attention instantly and sparks curiosity.",
    buildPrompt: (text, context) => {
      const contextClause = context ? `Context: ${context.trim()}

` : "";
      return `${contextClause}Rewrite the following text into an engaging, high-impact headline:

"${text.trim()}"`;
    }
  }
];
var DEFAULT_TONE_ID = "more-concise";
function getTonePreset(id) {
  if (!id)
    return TONE_PRESETS[0];
  const found = TONE_PRESETS.find((p) => p.id === id);
  return found || TONE_PRESETS[0];
}
function sanitizeInput(input) {
  if (typeof input !== "string")
    return "";
  return input.replace(/\r\n/g, `
`).replace(/\r/g, `
`).replace(/[ \t]+/g, " ").trim();
}
function validateInput(input) {
  const sanitized = sanitizeInput(input);
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: "Text content cannot be empty." };
  }
  if (sanitized.length > 8000) {
    return { valid: false, error: "Text is too long (maximum 8,000 characters supported)." };
  }
  return { valid: true };
}
// src/rewriter.ts
function getAIAssistant() {
  if (typeof window !== "undefined" && window.ai) {
    return window.ai;
  }
  if (typeof globalThis.ai !== "undefined") {
    return globalThis.ai;
  }
  return;
}
async function checkAICapabilities() {
  const assistant = getAIAssistant();
  if (!assistant) {
    return {
      status: "unsupported",
      hasRewriter: false,
      hasWriter: false,
      hasLanguageModel: false,
      details: "Chrome Built-in AI is not detected. Please enable flags in chrome://flags (Prompt API, Rewriter API)."
    };
  }
  let rewriterStatus = "no";
  let writerStatus = "no";
  let lmStatus = "no";
  try {
    if (assistant.rewriter?.capabilities) {
      const caps = await assistant.rewriter.capabilities();
      rewriterStatus = caps.available;
    }
  } catch {
    rewriterStatus = "no";
  }
  try {
    if (assistant.writer?.capabilities) {
      const caps = await assistant.writer.capabilities();
      writerStatus = caps.available;
    }
  } catch {
    writerStatus = "no";
  }
  try {
    if (assistant.languageModel?.capabilities) {
      const caps = await assistant.languageModel.capabilities();
      lmStatus = caps.available;
    }
  } catch {
    lmStatus = "no";
  }
  const hasRewriter = rewriterStatus === "readily" || rewriterStatus === "after-download";
  const hasWriter = writerStatus === "readily" || writerStatus === "after-download";
  const hasLanguageModel = lmStatus === "readily" || lmStatus === "after-download";
  if (!hasRewriter && !hasWriter && !hasLanguageModel) {
    return {
      status: "unavailable",
      hasRewriter: false,
      hasWriter: false,
      hasLanguageModel: false,
      details: "AI APIs are present but models are not currently supported on this device/configuration."
    };
  }
  const downloadNeeded = rewriterStatus === "after-download" || writerStatus === "after-download" || lmStatus === "after-download";
  return {
    status: downloadNeeded ? "download-needed" : "available",
    hasRewriter,
    hasWriter,
    hasLanguageModel,
    details: downloadNeeded ? "AI model requires an initial download by Chrome before first use." : "Chrome Built-in AI is ready."
  };
}
async function optimizeCopy(input, options = {}) {
  const validation = validateInput(input);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid input.");
  }
  const sanitized = sanitizeInput(input);
  const preset = options.customPreset || getTonePreset(options.toneId);
  const assistant = getAIAssistant();
  if (!assistant) {
    throw new Error("Chrome Built-in AI is not available in this environment. Ensure Chrome experimental flags are enabled.");
  }
  const errors = [];
  if (assistant.rewriter?.create) {
    let rewriterSession;
    try {
      rewriterSession = await assistant.rewriter.create({
        signal: options.signal,
        tone: preset.rewriterOptions?.tone,
        format: preset.rewriterOptions?.format || "plain-text",
        length: preset.rewriterOptions?.length,
        sharedContext: options.context || preset.systemPrompt,
        monitor: options.onDownloadProgress ? (m) => {
          m.addEventListener("downloadprogress", (e) => {
            options.onDownloadProgress?.(e.loaded, e.total);
          });
        } : undefined
      });
      let output = "";
      if (options.onChunk && typeof rewriterSession.rewriteStreaming === "function") {
        const stream = rewriterSession.rewriteStreaming(sanitized, {
          context: options.context,
          signal: options.signal
        });
        output = await readStream(stream, options.onChunk);
      } else {
        output = await rewriterSession.rewrite(sanitized, {
          context: options.context,
          signal: options.signal
        });
      }
      const trimmed = output.trim();
      if (trimmed.length > 0) {
        return {
          original: sanitized,
          optimized: cleanModelOutput(trimmed),
          toneId: preset.id,
          engine: "rewriter"
        };
      }
    } catch (err) {
      errors.push(`Rewriter failed: ${err.message || String(err)}`);
    } finally {
      if (rewriterSession && typeof rewriterSession.destroy === "function") {
        try {
          rewriterSession.destroy();
        } catch {}
      }
    }
  }
  if (assistant.writer?.create) {
    let writerSession;
    try {
      writerSession = await assistant.writer.create({
        signal: options.signal,
        tone: preset.rewriterOptions?.tone,
        format: preset.rewriterOptions?.format || "plain-text",
        length: preset.rewriterOptions?.length,
        sharedContext: preset.systemPrompt,
        monitor: options.onDownloadProgress ? (m) => {
          m.addEventListener("downloadprogress", (e) => {
            options.onDownloadProgress?.(e.loaded, e.total);
          });
        } : undefined
      });
      const writePrompt = preset.buildPrompt(sanitized, options.context);
      let output = "";
      if (options.onChunk && typeof writerSession.writeStreaming === "function") {
        const stream = writerSession.writeStreaming(writePrompt, {
          context: options.context,
          signal: options.signal
        });
        output = await readStream(stream, options.onChunk);
      } else {
        output = await writerSession.write(writePrompt, {
          context: options.context,
          signal: options.signal
        });
      }
      const trimmed = output.trim();
      if (trimmed.length > 0) {
        return {
          original: sanitized,
          optimized: cleanModelOutput(trimmed),
          toneId: preset.id,
          engine: "writer"
        };
      }
    } catch (err) {
      errors.push(`Writer failed: ${err.message || String(err)}`);
    } finally {
      if (writerSession && typeof writerSession.destroy === "function") {
        try {
          writerSession.destroy();
        } catch {}
      }
    }
  }
  if (assistant.languageModel?.create) {
    let lmSession;
    try {
      lmSession = await assistant.languageModel.create({
        signal: options.signal,
        systemPrompt: `${preset.systemPrompt}
Return ONLY the rewritten copy without conversational intros, explanations, or quotes.`,
        temperature: 0.7,
        topK: 3,
        monitor: options.onDownloadProgress ? (m) => {
          m.addEventListener("downloadprogress", (e) => {
            options.onDownloadProgress?.(e.loaded, e.total);
          });
        } : undefined
      });
      const promptText = preset.buildPrompt(sanitized, options.context);
      let output = "";
      if (options.onChunk && typeof lmSession.promptStreaming === "function") {
        const stream = lmSession.promptStreaming(promptText, {
          signal: options.signal
        });
        output = await readStream(stream, options.onChunk);
      } else {
        output = await lmSession.prompt(promptText, {
          signal: options.signal
        });
      }
      const trimmed = output.trim();
      if (trimmed.length > 0) {
        return {
          original: sanitized,
          optimized: cleanModelOutput(trimmed),
          toneId: preset.id,
          engine: "languageModel"
        };
      }
    } catch (err) {
      errors.push(`LanguageModel failed: ${err.message || String(err)}`);
    } finally {
      if (lmSession && typeof lmSession.destroy === "function") {
        try {
          lmSession.destroy();
        } catch {}
      }
    }
  }
  throw new Error(`Failed to optimize copy with all available AI engines.
${errors.join(`
`)}`);
}
async function readStream(stream, onChunk) {
  const reader = stream.getReader();
  let accumulated = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      if (typeof value === "string") {
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
function cleanModelOutput(output) {
  let cleaned = output.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"') || cleaned.startsWith("'") && cleaned.endsWith("'") || cleaned.startsWith("“") && cleaned.endsWith("”")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return cleaned;
}

// src/index.ts
var DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20h9"/>
  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  <path d="m15 5 3 3"/>
</svg>`;
function copyOptimizer(options = {}) {
  return {
    name: "astro-dev-copy-optimizer",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: "astro-dev-copy-optimizer",
          name: options.name || "Copy Optimizer",
          icon: options.icon || DEFAULT_ICON,
          entrypoint: fileURLToPath(new URL("./app.js", import.meta.url))
        });
      }
    }
  };
}
var src_default = copyOptimizer;
export {
  validateInput,
  sanitizeInput,
  optimizeCopy,
  getTonePreset,
  getAIAssistant,
  src_default as default,
  copyOptimizer,
  cleanModelOutput,
  checkAICapabilities,
  TONE_PRESETS,
  DEFAULT_TONE_ID
};
