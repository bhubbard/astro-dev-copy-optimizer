/**
 * Astro Dev Toolbar App: Copy Optimizer
 * Inspects on-page text elements and optimizes copy using Chrome Built-in AI.
 */

import { defineToolbarApp } from 'astro/toolbar';
import { TONE_PRESETS, getTonePreset, sanitizeInput } from './tones.js';
import { optimizeCopy, checkAICapabilities, type AICapabilityReport } from './rewriter.js';

export default defineToolbarApp({
  init(canvas, app) {
    let inspectMode = false;
    let selectedElement: HTMLElement | null = null;
    let originalText = '';
    let selectedToneId = TONE_PRESETS[0].id;
    let contextInput = '';
    let isOptimizing = false;
    let currentAbortController: AbortController | null = null;
    let aiReport: AICapabilityReport | null = null;

    // Root wrapper inside canvas (shadow root)
    const container = document.createElement('div');
    container.className = 'copy-optimizer-root';
    canvas.appendChild(container);

    // Create Stylesheet for Shadow DOM
    const style = document.createElement('style');
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

    // Inspector highlight overlay in page document
    let hoverOutline: HTMLDivElement | null = null;

    function createOverlay() {
      if (!hoverOutline) {
        hoverOutline = document.createElement('div');
        hoverOutline.style.position = 'fixed';
        hoverOutline.style.pointerEvents = 'none';
        hoverOutline.style.border = '2px solid #6366f1';
        hoverOutline.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
        hoverOutline.style.borderRadius = '4px';
        hoverOutline.style.zIndex = '2147483646';
        hoverOutline.style.transition = 'all 0.05s ease';
        hoverOutline.style.display = 'none';
        document.body.appendChild(hoverOutline);
      }
    }

    function removeOverlay() {
      if (hoverOutline && hoverOutline.parentNode) {
        hoverOutline.parentNode.removeChild(hoverOutline);
        hoverOutline = null;
      }
    }

    function updateOverlay(el: HTMLElement | null) {
      if (!hoverOutline) createOverlay();
      if (!el || !hoverOutline) return;

      const rect = el.getBoundingClientRect();
      hoverOutline.style.top = `${rect.top}px`;
      hoverOutline.style.left = `${rect.left}px`;
      hoverOutline.style.width = `${rect.width}px`;
      hoverOutline.style.height = `${rect.height}px`;
      hoverOutline.style.display = 'block';
    }

    // Inspect event handlers
    function handleMouseOver(e: MouseEvent) {
      if (!inspectMode) return;
      const target = e.target as HTMLElement;
      if (!target || target.closest('astro-dev-toolbar') || target === hoverOutline) return;
      updateOverlay(target);
    }

    function handleClick(e: MouseEvent) {
      if (!inspectMode) return;
      const target = e.target as HTMLElement;
      if (!target || target.closest('astro-dev-toolbar') || target === hoverOutline) return;

      e.preventDefault();
      e.stopPropagation();

      selectedElement = target;
      originalText = sanitizeInput(target.innerText || target.textContent || (target as HTMLInputElement).value || '');
      inspectMode = false;
      if (hoverOutline) hoverOutline.style.display = 'none';

      renderUI();
    }

    function toggleInspect(enabled?: boolean) {
      inspectMode = enabled !== undefined ? enabled : !inspectMode;
      if (inspectMode) {
        createOverlay();
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('click', handleClick, true);
      } else {
        document.removeEventListener('mouseover', handleMouseOver, true);
        document.removeEventListener('click', handleClick, true);
        if (hoverOutline) hoverOutline.style.display = 'none';
      }
      renderUI();
    }

    // Initial check
    checkAICapabilities().then((rep) => {
      aiReport = rep;
      renderUI();
    });

    let currentOptimizedText = '';
    let errorMessage = '';

    function renderUI() {
      container.innerHTML = '';

      const panel = document.createElement('div');
      panel.className = 'panel';

      // Header
      const header = document.createElement('div');
      header.className = 'header';

      const titleGroup = document.createElement('div');
      titleGroup.className = 'title-group';
      titleGroup.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          <path d="m15 5 3 3"/>
        </svg>
        <span>Copy Optimizer</span>
      `;

      let badgeHtml = '<span class="badge warn">AI Inactive</span>';
      if (aiReport?.status === 'available') {
        badgeHtml = '<span class="badge ready">Chrome AI Ready</span>';
      } else if (aiReport?.status === 'download-needed') {
        badgeHtml = '<span class="badge download">Model Download</span>';
      }
      titleGroup.insertAdjacentHTML('beforeend', badgeHtml);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-ghost';
      closeBtn.innerHTML = '✕';
      closeBtn.title = 'Close Panel';
      closeBtn.addEventListener('click', () => {
        app.toggleState({ state: false });
      });

      header.appendChild(titleGroup);
      header.appendChild(closeBtn);
      panel.appendChild(header);

      // Body
      const body = document.createElement('div');
      body.className = 'body';

      // Inspect Banner
      const inspectBanner = document.createElement('div');
      inspectBanner.className = 'inspect-banner';
      inspectBanner.innerHTML = `
        <div>
          <strong style="color:#f8fafc;">Inspect Element</strong>
          <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Click any text on the page to optimize</p>
        </div>
      `;

      const inspectBtn = document.createElement('button');
      inspectBtn.className = `btn btn-secondary ${inspectMode ? 'active' : ''}`;
      inspectBtn.innerHTML = inspectMode ? '🎯 Inspecting...' : '🔍 Pick Text';
      inspectBtn.addEventListener('click', () => toggleInspect());
      inspectBanner.appendChild(inspectBtn);
      body.appendChild(inspectBanner);

      if (selectedElement && originalText) {
        // Selected Original Text
        const origSection = document.createElement('div');
        origSection.innerHTML = `
          <div class="section-label">Original Text (${originalText.length} chars)</div>
          <div class="card">
            <span class="tag-chip">&lt;${selectedElement.tagName.toLowerCase()}&gt;</span>
            <span>${escapeHtml(originalText)}</span>
          </div>
        `;
        body.appendChild(origSection);

        // Tone Selector
        const toneSection = document.createElement('div');
        toneSection.innerHTML = `<div class="section-label">Target Tone & Style</div>`;
        const toneGrid = document.createElement('div');
        toneGrid.className = 'tone-grid';

        TONE_PRESETS.forEach((preset) => {
          const btn = document.createElement('button');
          btn.className = `tone-btn ${selectedToneId === preset.id ? 'selected' : ''}`;
          btn.innerHTML = `<span>${preset.icon}</span> <span>${preset.name}</span>`;
          btn.title = preset.description;
          btn.addEventListener('click', () => {
            selectedToneId = preset.id;
            renderUI();
          });
          toneGrid.appendChild(btn);
        });
        toneSection.appendChild(toneGrid);
        body.appendChild(toneSection);

        // Optional Context Field
        const contextSection = document.createElement('div');
        contextSection.innerHTML = `
          <div class="section-label">Additional Context (Optional)</div>
          <input type="text" class="input-text" placeholder="e.g. Hero section CTA button, dev audience..." value="${escapeHtml(contextInput)}" />
        `;
        const inputEl = contextSection.querySelector('input');
        if (inputEl) {
          inputEl.addEventListener('input', (e) => {
            contextInput = (e.target as HTMLInputElement).value;
          });
        }
        body.appendChild(contextSection);

        // Optimize Action Button
        const actionRow = document.createElement('div');
        const optBtn = document.createElement('button');
        optBtn.className = 'btn btn-primary';
        optBtn.style.width = '100%';
        optBtn.disabled = isOptimizing;
        optBtn.innerHTML = isOptimizing
          ? '<span>⚡ Generating Copy...</span>'
          : `<span>✨ Polish with ${getTonePreset(selectedToneId).name}</span>`;

        optBtn.addEventListener('click', async () => {
          if (isOptimizing) return;
          isOptimizing = true;
          errorMessage = '';
          currentOptimizedText = '';
          renderUI();

          currentAbortController = new AbortController();

          try {
            const res = await optimizeCopy(originalText, {
              toneId: selectedToneId,
              context: contextInput,
              signal: currentAbortController.signal,
              onChunk: (chunk) => {
                currentOptimizedText = chunk;
                updateSuggestionBox(currentOptimizedText);
              },
            });
            currentOptimizedText = res.optimized;
          } catch (err: unknown) {
            errorMessage = (err as Error).message || 'Failed to rewrite copy.';
          } finally {
            isOptimizing = false;
            currentAbortController = null;
            renderUI();
          }
        });
        actionRow.appendChild(optBtn);
        body.appendChild(actionRow);

        // Error message if any
        if (errorMessage) {
          const errBox = document.createElement('div');
          errBox.className = 'error-msg';
          errBox.textContent = errorMessage;
          body.appendChild(errBox);
        }

        // Suggestion / Result Box
        if (currentOptimizedText || isOptimizing) {
          const resSection = document.createElement('div');
          resSection.innerHTML = `<div class="section-label">Optimized Suggestion</div>`;

          const sugBox = document.createElement('div');
          sugBox.className = 'suggestion-box';
          sugBox.id = 'suggestion-container';

          const sugText = document.createElement('div');
          sugText.className = 'suggestion-text';
          sugText.id = 'suggestion-text-el';
          sugText.textContent = currentOptimizedText || 'Thinking...';
          sugBox.appendChild(sugText);

          if (!isOptimizing && currentOptimizedText) {
            const actions = document.createElement('div');
            actions.className = 'actions-row';

            // Copy Button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn btn-secondary';
            copyBtn.innerHTML = '📋 Copy';
            copyBtn.addEventListener('click', async () => {
              await navigator.clipboard.writeText(currentOptimizedText);
              copyBtn.innerHTML = '✅ Copied!';
              setTimeout(() => {
                copyBtn.innerHTML = '📋 Copy';
              }, 2000);
            });

            // In-situ replace preview button
            const applyBtn = document.createElement('button');
            applyBtn.className = 'btn btn-primary';
            applyBtn.innerHTML = '🚀 Replace on Page';
            applyBtn.addEventListener('click', () => {
              if (selectedElement) {
                if ('value' in selectedElement && typeof selectedElement.value === 'string') {
                  (selectedElement as HTMLInputElement).value = currentOptimizedText;
                } else {
                  selectedElement.textContent = currentOptimizedText;
                }
                applyBtn.innerHTML = '✅ Replaced!';
                setTimeout(() => {
                  applyBtn.innerHTML = '🚀 Replace on Page';
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
        // Placeholder when no element selected
        const emptyState = document.createElement('div');
        emptyState.style.padding = '24px 12px';
        emptyState.style.textAlign = 'center';
        emptyState.style.color = '#94a3b8';
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

    function updateSuggestionBox(text: string) {
      const el = canvas.querySelector('#suggestion-text-el');
      if (el) {
        el.textContent = text;
      }
    }

    function escapeHtml(str: string): string {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // App toolbar state listener
    app.onToggled(({ state }) => {
      container.style.display = state ? 'block' : 'none';
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
  },
});
