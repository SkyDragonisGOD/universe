// ============================================================
// 世界生成器 — 屏幕导航 & 首页 & 侧栏
// ============================================================

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const screen = $(`#${id}-screen`);
  screen.classList.add('active');
  if (id === 'home') {
    const h1 = $('#home-screen h1');
    if (h1) { h1.textContent = '🌍 世界生成器'; h1.style.opacity = ''; h1.style.transform = ''; }
    const sub = $('#home-screen .subtitle');
    if (sub) { sub.textContent = '构建属于你的幻想世界'; sub.style.opacity = ''; sub.style.transform = ''; }
    const actions = $$('#home-screen .home-actions .btn');
    actions.forEach(btn => { gsap.set(btn, { opacity: 0, y: 20 }); });
    const cards = $$('#home-screen .project-card');
    cards.forEach(card => { gsap.set(card, { opacity: 0, y: 24 }); });
    requestAnimationFrame(() => {
      if (h1) splitTextAnimate(h1, { delay: 50, duration: 800, ease: 'outExpo', from: { opacity: 0, translateY: 20 }, to: { opacity: 1, translateY: 0 } });
      if (sub) splitTextAnimate(sub, { delay: 30, duration: 600, ease: 'outExpo', from: { opacity: 0, translateY: 12 }, to: { opacity: 1, translateY: 0 }, split_type: 'words' });
      actions.forEach((btn, i) => {
        gsap.to(btn, { opacity: 1, y: 0, duration: 0.5, delay: 0.15 + i * 0.08, ease: 'power3.out' });
      });
    });
    loadHome().then(() => {
      const newCards = $$('#home-screen .project-card');
      newCards.forEach(card => { card.style.transition = 'none'; gsap.set(card, { opacity: 0, y: 24 }); });
      requestAnimationFrame(() => {
        newCards.forEach((card, i) => {
          gsap.to(card, { opacity: 1, y: 0, duration: 0.5, delay: 0.2 + i * 0.06, ease: 'power3.out', onComplete: function() { card.style.transition = ''; } });
        });
      });
    });
  } else if (id === 'editor') {
    const header = $('.editor-header');
    if (header) { gsap.set(header, { opacity: 0, y: -20 }); requestAnimationFrame(() => { gsap.to(header, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }); }); }
  }
}

async function loadHome() { try { state.projects = await window.api.listProjects(); } catch(e) { state.projects = []; console.error('listProjects failed:', e); } renderProjectList(); }

function renderProjectList() {
  const list = $('#project-list');
  if (!list) return;
  if (state.projects.length === 0) { list.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>还没有世界项目，点击上方按钮创建吧</p></div>'; return; }
  list.innerHTML = state.projects.map(p => `
    <div class="project-card" data-id="${p.id}">
      <div><div class="name">${esc(p.name)}</div><div class="meta">创建: ${fmtDate(p.createdAt)} · 修改: ${fmtDate(p.lastModified)}</div></div>
      <div class="actions"><button class="btn btn-xs btn-outline btn-rename" data-id="${p.id}">改名</button><button class="btn btn-xs btn-danger btn-delete" data-id="${p.id}">删除</button></div>
    </div>`).join('');
  list.querySelectorAll('.project-card').forEach(card => { card.onclick = (e) => { if (!e.target.closest('.btn')) openProject(card.dataset.id); }; });
  list.querySelectorAll('.btn-rename').forEach(b => { b.onclick = (e) => { e.stopPropagation(); renameProject(b.dataset.id); }; });
  list.querySelectorAll('.btn-delete').forEach(b => { b.onclick = (e) => { e.stopPropagation(); deleteProject(b.dataset.id); }; });
}

async function openProject(id) {
  const data = await window.api.openProject(id);
  if (!data) return;
  state.currentProjectId = id;
  state.data = data;
  if (!data.categories) data.categories = [];
  if (data.characters) { data.characters.forEach(c => { if (c.faction && !c.factions) { c.factions = [c.faction]; delete c.faction; } if (c.location && !c.locations) { c.locations = [c.location]; delete c.location; } if (!c.factions) c.factions = []; if (!c.locations) c.locations = []; if (!c.relatedEvents) c.relatedEvents = []; }); }
  if (data.factions) { data.factions.forEach(f => { if (f.headquarters && !Array.isArray(f.headquarters)) { f.headquarters = [f.headquarters]; } if (!f.relatedEvents) f.relatedEvents = []; }); }
  if (data.locations) { data.locations.forEach(l => { if (!l.relatedFactions) l.relatedFactions = []; }); }
  if (data.races) { data.races.forEach(r => { if (!r.relatedCharacters) r.relatedCharacters = []; }); }
  state.selectedLocationId = null;
  state.selectedCharacterId = null;
  state.selectedFactionId = null;
  state.selectedRaceId = null;
  state.selectedItemId = null;
  state.selectedEventId = null;
  state.locationTagFilter = null;
  ensureData('locations', []);
  ensureData('characters', []);
  ensureData('factions', []);
  ensureData('locationTagTree', []);
  ensureData('itemInventory', { gridWidth: 8, gridHeight: 6, slots: [] });
  ensureData('characterRelations', []);
  ensureData('constitution', []);
  ensureData('outline', []);
  ensureData('races', []);
  ensureData('worldBackpacks', []);
  ensureData('items', []);
  ensureData('timeline', []);
  ensureData('timelineOrder', []);

  if (!state.data.realismFantasy || !state.data.realismFantasy.entries) {
    state.data.realismFantasy = { entries: {}, customNodes: [], globalNote: '' };
  }
  showScreen('editor');
  $('#editor-title').textContent = state.data.project.name;
  const tabNav = $('#tab-nav');
  if (tabNav) gsap.fromTo(tabNav, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' });
  state._forceAnimate = true;
  state._lastAnimatedTab = null;
  renderTabs();
  renderTabContent();
}

async function createProject() {
  const name = await customPrompt('请输入世界名称', '新世界');
  if (!name) return;
  try {
    const result = await window.api.createProject(name);
    if (result) { state.projects.unshift({ id: result.id, name, createdAt: result.data.project.createdAt, lastModified: result.data.project.createdAt }); renderProjectList(); openProject(result.id); }
  } catch(e) { console.error('[createProject] error:', e); alert('创建失败: ' + e.message); }
}

async function renameProject(id) {
  const proj = state.projects.find(p => p.id === id);
  const newName = await customPrompt('新名称', proj ? proj.name : '');
  if (!newName || !proj) return;
  await window.api.renameProject(id, newName);
  proj.name = newName;
  if (state.currentProjectId === id) { state.data.project.name = newName; $('#editor-title').textContent = newName; }
  renderProjectList();
}

async function deleteProject(id) {
  if (!await customConfirm('确定删除此项目？此操作不可撤销。')) return;
  await window.api.deleteProject(id);
  state.projects = state.projects.filter(p => p.id !== id);
  if (state.currentProjectId === id) { state.currentProjectId = null; state.data = null; showScreen('home'); }
  renderProjectList();
}

async function importProject() {
  const result = await window.api.importProjectZip();
  if (result) { state.projects.unshift({ id: result.id, name: result.name, createdAt: result.data.project.createdAt, lastModified: result.data.project.createdAt }); renderProjectList(); openProject(result.id); }
}

async function exportProject() { if (state.currentProjectId) await window.api.exportProjectZip(state.currentProjectId); }

async function saveProject() {
  if (state.currentProjectId && state.data) { await window.api.saveProject(state.currentProjectId, state.data); alert('保存成功！'); }
}

// ============================================================
// TABS - SIDEBAR NAV
// ============================================================
function switchTab(tabId) {
  state.activeTab = tabId;
  renderTabs();
  renderTabContent();
}

function moveActiveBox(targetItem, animate) {
  const nav = $('#tab-nav');
  if (!nav) return;
  const box = nav.querySelector('.nav-box-active');
  const list = nav.querySelector('.nav-list');
  if (!box || !list || !targetItem) return;
  nav.querySelectorAll('.nav-item.box-active').forEach(el => el.classList.remove('box-active'));
  targetItem.classList.add('box-active');
  const listRect = list.getBoundingClientRect();
  const itemRect = targetItem.getBoundingClientRect();
  const top = itemRect.top - listRect.top + list.scrollTop;
  if (animate) {
    box.classList.remove('no-transition');
  } else {
    box.classList.add('no-transition');
  }
  box.style.top = top + 'px';
  box.style.height = itemRect.height + 'px';
  if (!animate) {
    requestAnimationFrame(() => { box.classList.remove('no-transition'); });
  }
}

function moveHoverBox(targetItem, animate) {
  const nav = $('#tab-nav');
  if (!nav) return;
  const box = nav.querySelector('.nav-box-hover');
  const list = nav.querySelector('.nav-list');
  if (!box || !list || !targetItem) return;
  nav.querySelectorAll('.nav-item.box-hover').forEach(el => el.classList.remove('box-hover'));
  targetItem.classList.add('box-hover');
  const listRect = list.getBoundingClientRect();
  const itemRect = targetItem.getBoundingClientRect();
  const top = itemRect.top - listRect.top + list.scrollTop;
  const wasVisible = box.classList.contains('visible');
  if (!wasVisible) {
    box.classList.add('no-transition');
    box.style.top = top + 'px';
    box.style.height = itemRect.height + 'px';
    void box.offsetHeight;
    box.classList.remove('no-transition');
    box.classList.add('visible');
  } else {
    if (animate) {
      box.classList.remove('no-transition');
    } else {
      box.classList.add('no-transition');
    }
    box.style.top = top + 'px';
    box.style.height = itemRect.height + 'px';
    if (!animate) {
      requestAnimationFrame(() => { box.classList.remove('no-transition'); });
    }
  }
}

function splitNavText(text) {
  return text.split('').map(ch => '<span>' + esc(ch) + '</span>').join('');
}

function animateActiveNavText() {
  const nav = $('#tab-nav');
  if (!nav) return;
  const active = nav.querySelector('.nav-item.is-active .nav-text');
  if (!active) return;
  const chars = active.querySelectorAll('span');
  if (!chars.length) return;
  if (typeof anime !== 'undefined' && anime.animate) {
    anime.animate(chars, { opacity: [0, 1], translateY: [10, 0], delay: function(el, i) { return i * 40; }, duration: 600, ease: 'outExpo', complete: function() { chars.forEach(function(c) { c.style.transform = 'none'; }); } });
  }
}

function renderTabs() {
  const nav = $('#tab-nav');
  if (!nav) return;
  nav.innerHTML = '<ul class="nav-list"><div class="nav-box-active"></div><div class="nav-box-hover"></div>' + TABS.map(t => {
    const isActive = state.activeTab === t.id;
    return '<li class="nav-item' + (isActive ? ' is-active' : '') + '" data-tab="' + t.id + '">' +
      '<span class="nav-icon">' + t.icon + '</span>' +
      '<span class="nav-text">' + (isActive ? splitNavText(t.label) : esc(t.label)) + '</span>' +
    '</li>';
  }).join('') + '</ul>';
  const items = nav.querySelectorAll('.nav-item');
  const activeItem = nav.querySelector('.nav-item.is-active');
  if (activeItem) {
    requestAnimationFrame(() => { moveActiveBox(activeItem, false); });
  }
  items.forEach(item => {
    item.onmouseenter = () => {
      moveHoverBox(item, true);
      const activeBox = nav.querySelector('.nav-box-active');
      if (item.classList.contains('is-active')) {
        if (activeBox) activeBox.classList.add('pulse');
      } else {
        if (activeBox) activeBox.classList.remove('pulse');
      }
    };
    item.onmouseleave = () => {
      const activeBox = nav.querySelector('.nav-box-active');
      if (activeBox) activeBox.classList.remove('pulse');
    };
    item.onclick = () => {
      state.activeTab = item.dataset.tab;
      state.selectedLocationId = null;
      state.selectedCharacterId = null;
      state.selectedFactionId = null;
      state.selectedRaceId = null;
      state.selectedItemId = null;
      state.selectedEventId = null;
      state.locationTagFilter = null;
      renderTabs();
      renderTabContent();
    };
  });
  nav.onmouseleave = () => {
    const hoverBox = nav.querySelector('.nav-box-hover');
    if (hoverBox) {
      hoverBox.classList.remove('visible');
    }
    const activeBox = nav.querySelector('.nav-box-active');
    if (activeBox) activeBox.classList.remove('pulse');
    nav.querySelectorAll('.nav-item.box-hover').forEach(el => el.classList.remove('box-hover'));
  };
  requestAnimationFrame(animateActiveNavText);
}

function render() { renderTabs(); renderTabContent(); }

function renderTabContent() {
  const container = $('#tab-content');
  const fn = {
    overview: renderOverview, worldview: renderWorldview, realism: renderRealism,
    constitution: [renderConstitution, setupConstitution], locations: [renderLocations, setupLocations],
    characters: [renderCharacters, setupCharacters], relations: [renderRelations, setupRelations],
    factions: [renderFactions, setupFactions], races: [renderRaces, setupRaces], items: [renderItems, setupItems],
    events: [renderEvents, setupEvents], powers: [renderPowers, setupPowers],
    outline: [renderOutline, setupOutline], timeline: [renderTimelineView, setupTimelineView],
    map: [renderMap, setupMap],
    rules: [renderRules, setupRules], properties: [renderProperties, setupProperties], backup: [renderBackups, setupBackups]
  };
  const entry = fn[state.activeTab];
  if (Array.isArray(entry)) { container.innerHTML = entry[0](); entry[1](); } else { container.innerHTML = entry(); }
  const tabChanged = state.activeTab !== state._lastAnimatedTab;
  const shouldAnimate = tabChanged || state._forceAnimate;
  const animateScope = state._animateScope || 'full';
  state._lastAnimatedTab = state.activeTab;
  state._forceAnimate = false;
  state._animateScope = null;
  if (shouldAnimate) {
    requestAnimationFrame(function() { animatePageContent(animateScope); });
  }
}