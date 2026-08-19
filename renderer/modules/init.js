// ============================================================
// 世界生成器 — LLM 状态 & 初始化
// 依赖: core/state.js, core/utils.js, core/navigation.js
// ============================================================

// --- LLM STATUS BAR ---
async function updateLLMStatus() {
  try {
    const config = await window.api.getLLMConfig();
    const bar = $('#llm-status-bar');
    if (bar) {
      if (config.apiKey && config.endpoint && config.model) {
        bar.innerHTML = `<span class="status-dot connected"></span> ${esc(config.model)} · <button class="btn btn-xs btn-outline" onclick="showLLMSettings()">配置</button>`;
      } else {
        bar.innerHTML = `<span class="status-dot disconnected"></span> 未配置 · <button class="btn btn-xs btn-outline" onclick="showLLMSettings()">配置</button>`;
      }
    }
  } catch(e) {}
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[init] DOMContentLoaded fired');
  updateLLMStatus();
  showScreen('home');

  const btnNew = $('#btn-new-project');
  const btnImport = $('#btn-import-project');
  const btnBack = $('#btn-back-home');
  const btnExport = $('#btn-export');
  const btnSave = $('#btn-save');
  const btnSwitch = $('#btn-switch-project');

  console.log('[init] btnNew found:', !!btnNew, 'btnImport:', !!btnImport, 'btnBack:', !!btnBack);

  if (btnNew) { btnNew.onclick = createProject; console.log('[init] btnNew.onclick bound'); }
  if (btnImport) { btnImport.onclick = importProject; console.log('[init] btnImport.onclick bound'); }
  if (btnBack) { btnBack.onclick = () => { console.log('[init] back clicked'); showScreen('home'); }; console.log('[init] btnBack.onclick bound'); }
  if (btnExport) { btnExport.onclick = exportProject; }
  if (btnSave) { btnSave.onclick = saveProject; }
  if (btnSwitch) { btnSwitch.onclick = () => { showScreen('home'); }; }

  console.log('[init] all bindings done');

  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); await saveProject(); }
  });

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { const nav = document.querySelector('#tab-nav'); if (!nav) return; const a = nav.querySelector('.nav-item.is-active'); if (a) moveActiveBox(a, false); }, 150); });

  if (typeof initWikiLinkSystem === 'function') initWikiLinkSystem();
});