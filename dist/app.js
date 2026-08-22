// src/app.ts
import { defineToolbarApp } from "astro/toolbar";

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

// src/app.ts
var app_default = defineToolbarApp({
  init(canvas, app) {
    let inspectMode = false;
    let selectedElement = null;
    let originalText = "";
    let selectedToneId = TONE_PRESETS[0].id;
    let contextInput = "";
    let isOptimizing = false;
    let currentAbortController = null;
    let aiReport = null;
    const container = document.createElement("div");
    container.className = "copy-optimizer-root";
    canvas.appendChild(container);
    const style = document.createElement("style");
    style.textContent = `
      :host {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color-scheme: dark;
      }
      .copy-optimizer-root {
        position: fixed;
        bottom: 70px;
        right: 20px;
        z-index: 999999;
        font-family: inherit;
        font-size: 13px;
        color: #f1f5f9;
      }
      .panel {
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
        width: 420px;
        max-width: calc(100vw - 40px);
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: fadeIn 0.15s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
      }
      .title-group {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        color: #f8fafc;
      }
      .badge {
        font-size: 10px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 9999px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .badge.ready { background: #065f46; color: #34d399; }
      .badge.download { background: #854d0e; color: #fde047; }
      .badge.warn { background: #991b1b; color: #fca5a5; }

      .body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        overflow-y: auto;
      }
      .inspect-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #1e293b;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px dashed #475569;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
      }
      .btn-primary {
        background: #6366f1;
        color: #ffffff;
      }
      .btn-primary:hover { background: #4f46e5; }
      .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn-secondary {
        background: #334155;
        color: #f8fafc;
      }
      .btn-secondary:hover { background: #475569; }
      .btn-secondary.active {
        background: #38bdf8;
        color: #0f172a;
        font-weight: 600;
      }
      .btn-ghost {
        background: transparent;
        color: #94a3b8;
        padding: 4px 6px;
      }
      .btn-ghost:hover { color: #f8fafc; background: #334155; }

      .section-label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 13px;
        line-height: 1.5;
        color: #cbd5e1;
        position: relative;
        word-break: break-word;
      }
      .tag-chip {
        font-family: monospace;
        font-size: 10px;
        background: #334155;
        color: #38bdf8;
        padding: 1px 5px;
        border-radius: 4px;
        margin-right: 6px;
      }
      .tone-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }
      .tone-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        color: #cbd5e1;
        font-size: 12px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
      }
      .tone-btn:hover {
        background: #334155;
        border-color: #475569;
      }
      .tone-btn.selected {
        background: rgba(99, 102, 241, 0.15);
        border-color: #818cf8;
        color: #ffffff;
        font-weight: 600;
      }
      .input-text {
        width: 100%;
        box-sizing: border-box;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 8px 10px;
        color: #f8fafc;
        font-size: 12px;
        outline: none;
      }
      .input-text:focus { border-color: #6366f1; }
      .suggestion-box {
        background: rgba(99, 102, 241, 0.08);
        border: 1px solid #4f46e5;
        border-radius: 8px;
        padding: 12px;
        position: relative;
      }
      .suggestion-text {
        font-size: 13px;
        line-height: 1.5;
        color: #f8fafc;
        white-space: pre-wrap;
      }
      .actions-row {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }
      .error-msg {
        color: #f87171;
        font-size: 12px;
        background: rgba(239, 68, 68, 0.1);
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }
    `;
    canvas.appendChild(style);
    let hoverOutline = null;
    function createOverlay() {
      if (!hoverOutline) {
        hoverOutline = document.createElement("div");
        hoverOutline.style.position = "fixed";
        hoverOutline.style.pointerEvents = "none";
        hoverOutline.style.border = "2px solid #6366f1";
        hoverOutline.style.backgroundColor = "rgba(99, 102, 241, 0.15)";
        hoverOutline.style.borderRadius = "4px";
        hoverOutline.style.zIndex = "2147483646";
        hoverOutline.style.transition = "all 0.05s ease";
        hoverOutline.style.display = "none";
        document.body.appendChild(hoverOutline);
      }
    }
    function removeOverlay() {
      if (hoverOutline && hoverOutline.parentNode) {
        hoverOutline.parentNode.removeChild(hoverOutline);
        hoverOutline = null;
      }
    }
    function updateOverlay(el) {
      if (!hoverOutline)
        createOverlay();
      if (!el || !hoverOutline)
        return;
      const rect = el.getBoundingClientRect();
      hoverOutline.style.top = `${rect.top}px`;
      hoverOutline.style.left = `${rect.left}px`;
      hoverOutline.style.width = `${rect.width}px`;
      hoverOutline.style.height = `${rect.height}px`;
      hoverOutline.style.display = "block";
    }
    function handleMouseOver(e) {
      if (!inspectMode)
        return;
      const target = e.target;
      if (!target || target.closest("astro-dev-toolbar") || target === hoverOutline)
        return;
      updateOverlay(target);
    }
    function handleClick(e) {
      if (!inspectMode)
        return;
      const target = e.target;
      if (!target || target.closest("astro-dev-toolbar") || target === hoverOutline)
        return;
      e.preventDefault();
      e.stopPropagation();
      selectedElement = target;
      originalText = sanitizeInput(target.innerText || target.textContent || target.value || "");
      inspectMode = false;
      if (hoverOutline)
        hoverOutline.style.display = "none";
      renderUI();
    }
    function toggleInspect(enabled) {
      inspectMode = enabled !== undefined ? enabled : !inspectMode;
      if (inspectMode) {
        createOverlay();
        document.addEventListener("mouseover", handleMouseOver, true);
        document.addEventListener("click", handleClick, true);
      } else {
        document.removeEventListener("mouseover", handleMouseOver, true);
        document.removeEventListener("click", handleClick, true);
        if (hoverOutline)
          hoverOutline.style.display = "none";
      }
      renderUI();
    }
    checkAICapabilities().then((rep) => {
      aiReport = rep;
      renderUI();
    });
    let currentOptimizedText = "";
    let errorMessage = "";
    function renderUI() {
      container.innerHTML = "";
      const panel = document.createElement("div");
      panel.className = "panel";
      const header = document.createElement("div");
      header.className = "header";
      const titleGroup = document.createElement("div");
      titleGroup.className = "title-group";
      titleGroup.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          <path d="m15 5 3 3"/>
        </svg>
        <span>Copy Optimizer</span>
      `;
      let badgeHtml = '<span class="badge warn">AI Inactive</span>';
      if (aiReport?.status === "available") {
        badgeHtml = '<span class="badge ready">Chrome AI Ready</span>';
      } else if (aiReport?.status === "download-needed") {
        badgeHtml = '<span class="badge download">Model Download</span>';
      }
      titleGroup.insertAdjacentHTML("beforeend", badgeHtml);
      const closeBtn = document.createElement("button");
      closeBtn.className = "btn btn-ghost";
      closeBtn.innerHTML = "✕";
      closeBtn.title = "Close Panel";
      closeBtn.addEventListener("click", () => {
        app.toggleState({ state: false });
      });
      header.appendChild(titleGroup);
      header.appendChild(closeBtn);
      panel.appendChild(header);
      const body = document.createElement("div");
      body.className = "body";
      const inspectBanner = document.createElement("div");
      inspectBanner.className = "inspect-banner";
      inspectBanner.innerHTML = `
        <div>
          <strong style="color:#f8fafc;">Inspect Element</strong>
          <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Click any text on the page to optimize</p>
        </div>
      `;
      const inspectBtn = document.createElement("button");
      inspectBtn.className = `btn btn-secondary ${inspectMode ? "active" : ""}`;
      inspectBtn.innerHTML = inspectMode ? "\uD83C\uDFAF Inspecting..." : "\uD83D\uDD0D Pick Text";
      inspectBtn.addEventListener("click", () => toggleInspect());
      inspectBanner.appendChild(inspectBtn);
      body.appendChild(inspectBanner);
      if (selectedElement && originalText) {
        const origSection = document.createElement("div");
        origSection.innerHTML = `
          <div class="section-label">Original Text (${originalText.length} chars)</div>
          <div class="card">
            <span class="tag-chip">&lt;${selectedElement.tagName.toLowerCase()}&gt;</span>
            <span>${escapeHtml(originalText)}</span>
          </div>
        `;
        body.appendChild(origSection);
        const toneSection = document.createElement("div");
        toneSection.innerHTML = `<div class="section-label">Target Tone & Style</div>`;
        const toneGrid = document.createElement("div");
        toneGrid.className = "tone-grid";
        TONE_PRESETS.forEach((preset) => {
          const btn = document.createElement("button");
          btn.className = `tone-btn ${selectedToneId === preset.id ? "selected" : ""}`;
          btn.innerHTML = `<span>${preset.icon}</span> <span>${preset.name}</span>`;
          btn.title = preset.description;
          btn.addEventListener("click", () => {
            selectedToneId = preset.id;
            renderUI();
          });
          toneGrid.appendChild(btn);
        });
        toneSection.appendChild(toneGrid);
        body.appendChild(toneSection);
        const contextSection = document.createElement("div");
        contextSection.innerHTML = `
          <div class="section-label">Additional Context (Optional)</div>
          <input type="text" class="input-text" placeholder="e.g. Hero section CTA button, dev audience..." value="${escapeHtml(contextInput)}" />
        `;
        const inputEl = contextSection.querySelector("input");
        if (inputEl) {
          inputEl.addEventListener("input", (e) => {
            contextInput = e.target.value;
          });
        }
        body.appendChild(contextSection);
        const actionRow = document.createElement("div");
        const optBtn = document.createElement("button");
        optBtn.className = "btn btn-primary";
        optBtn.style.width = "100%";
        optBtn.disabled = isOptimizing;
        optBtn.innerHTML = isOptimizing ? "<span>⚡ Generating Copy...</span>" : `<span>✨ Polish with ${getTonePreset(selectedToneId).name}</span>`;
        optBtn.addEventListener("click", async () => {
          if (isOptimizing)
            return;
          isOptimizing = true;
          errorMessage = "";
          currentOptimizedText = "";
          renderUI();
          currentAbortController = new AbortController;
          try {
            const res = await optimizeCopy(originalText, {
              toneId: selectedToneId,
              context: contextInput,
              signal: currentAbortController.signal,
              onChunk: (chunk) => {
                currentOptimizedText = chunk;
                updateSuggestionBox(currentOptimizedText);
              }
            });
            currentOptimizedText = res.optimized;
          } catch (err) {
            errorMessage = err.message || "Failed to rewrite copy.";
          } finally {
            isOptimizing = false;
            currentAbortController = null;
            renderUI();
          }
        });
        actionRow.appendChild(optBtn);
        body.appendChild(actionRow);
        if (errorMessage) {
          const errBox = document.createElement("div");
          errBox.className = "error-msg";
          errBox.textContent = errorMessage;
          body.appendChild(errBox);
        }
        if (currentOptimizedText || isOptimizing) {
          const resSection = document.createElement("div");
          resSection.innerHTML = `<div class="section-label">Optimized Suggestion</div>`;
          const sugBox = document.createElement("div");
          sugBox.className = "suggestion-box";
          sugBox.id = "suggestion-container";
          const sugText = document.createElement("div");
          sugText.className = "suggestion-text";
          sugText.id = "suggestion-text-el";
          sugText.textContent = currentOptimizedText || "Thinking...";
          sugBox.appendChild(sugText);
          if (!isOptimizing && currentOptimizedText) {
            const actions = document.createElement("div");
            actions.className = "actions-row";
            const copyBtn = document.createElement("button");
            copyBtn.className = "btn btn-secondary";
            copyBtn.innerHTML = "\uD83D\uDCCB Copy";
            copyBtn.addEventListener("click", async () => {
              await navigator.clipboard.writeText(currentOptimizedText);
              copyBtn.innerHTML = "✅ Copied!";
              setTimeout(() => {
                copyBtn.innerHTML = "\uD83D\uDCCB Copy";
              }, 2000);
            });
            const applyBtn = document.createElement("button");
            applyBtn.className = "btn btn-primary";
            applyBtn.innerHTML = "\uD83D\uDE80 Replace on Page";
            applyBtn.addEventListener("click", () => {
              if (selectedElement) {
                if ("value" in selectedElement && typeof selectedElement.value === "string") {
                  selectedElement.value = currentOptimizedText;
                } else {
                  selectedElement.textContent = currentOptimizedText;
                }
                applyBtn.innerHTML = "✅ Replaced!";
                setTimeout(() => {
                  applyBtn.innerHTML = "\uD83D\uDE80 Replace on Page";
                }, 2000);
              }
            });
            actions.appendChild(copyBtn);
            actions.appendChild(applyBtn);
            sugBox.appendChild(actions);
          }
          resSection.appendChild(sugBox);
          body.appendChild(resSection);
        }
      } else {
        const emptyState = document.createElement("div");
        emptyState.style.padding = "24px 12px";
        emptyState.style.textAlign = "center";
        emptyState.style.color = "#94a3b8";
        emptyState.innerHTML = `
          <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
          <div style="font-weight: 500; color: #f1f5f9; margin-bottom: 4px;">No text element selected</div>
          <div style="font-size: 12px;">Click "Pick Text" above and select any headline, button, or paragraph on your Astro page.</div>
        `;
        body.appendChild(emptyState);
      }
      panel.appendChild(body);
      container.appendChild(panel);
    }
    function updateSuggestionBox(text) {
      const el = canvas.querySelector("#suggestion-text-el");
      if (el) {
        el.textContent = text;
      }
    }
    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    app.onToggled(({ state }) => {
      container.style.display = state ? "block" : "none";
      if (!state) {
        toggleInspect(false);
        removeOverlay();
      } else {
        renderUI();
      }
    });
  },
  beforeTogglingOff() {
    return true;
  }
});
export {
  app_default as default
};
