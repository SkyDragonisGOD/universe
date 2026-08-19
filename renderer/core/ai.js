// ============================================================
// 世界生成器 — AI 辅助
// ============================================================

async function runAI(promise, el) {
  if (el) el.innerHTML = '<div class="ai-loading"><div class="spinner"></div>AI 正在生成中...</div>';
  try {
    const text = await promise;
    if (text) { if (el) el.innerHTML = `<div class="ai-result-panel">${esc(text)}</div>`; return text; }
  } catch (e) { aiError(el, e.message || '生成失败'); }
  return null;
}

function aiError(el, msg) { if (el) el.innerHTML = `<div class="ai-error">❌ ${esc(msg)}</div>`; }

function tryParseJSON(text) {
  try { return JSON.parse(text.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch (e) {}
  try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (e2) {}
  return null;
}

function tryParseJSONArray(text) {
  try { return JSON.parse(text.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch (e) {}
  try { const m = text.match(/\[[\s\S]*\]/); if (m) return JSON.parse(m[0]); } catch (e2) {}
  return null;
}

async function showLLMSettings() {
  const config = await window.api.getLLMConfig();
  const modal = $('#modal-box');
  const overlay = $('#modal-overlay');
  modal.innerHTML = `
    <h3>🤖 LLM 设置</h3>
    <div class="form-group"><label>API 端点</label><input id="llm-endpoint" value="${esc(config.endpoint||'')}" placeholder="https://api.openai.com/v1"></div>
    <div class="form-group"><label>API 密钥</label><input id="llm-apikey" type="password" value="${esc(config.apiKey||'')}" placeholder="sk-..."></div>
    <div class="form-group"><label>模型名称</label><input id="llm-model" value="${esc(config.model||'')}" placeholder="gpt-4o / deepseek-chat"></div>
    <div class="form-row">
      <div class="form-group"><label>温度 (0-2)</label><input id="llm-temp" type="number" min="0" max="2" step="0.1" value="${config.temperature||0.8}"></div>
      <div class="form-group"><label>最大Token</label><input id="llm-maxtokens" type="number" min="256" max="32768" step="256" value="${config.maxTokens||2048}"></div>
    </div>
    <p class="text-xs text-muted">支持 OpenAI 兼容 API（Ollama、LM Studio、DeepSeek、通义千问等）</p>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="btn-save-llm">保存配置</button>
    </div>`;
  showModalOverlay();
  document.getElementById('btn-save-llm').onclick = async () => {
    await window.api.setLLMConfig({
      endpoint: $('#llm-endpoint').value.trim(),
      apiKey: $('#llm-apikey').value.trim(),
      model: $('#llm-model').value.trim(),
      temperature: parseFloat($('#llm-temp').value) || 0.8,
      maxTokens: parseInt($('#llm-maxtokens').value) || 2048
    });
    closeModal();
  };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}