// ============================================================
// 世界生成器 — 真实与幻想 (Realism & Fantasy)
// 依赖: core/state.js, core/utils.js, core/ai.js
// ============================================================

const WORLD_RULE_TREE = [
  { id: 'era', label: '时代背景', icon: '🕰️', children: [
    { id: 'era.period', label: '历史时期', icon: '📜', hints: ['朝代','纪年','年号'] },
    { id: 'era.divergence', label: '架空起点', icon: '🦋', hints: ['蝴蝶效应边界','分岔点','架空程度'] },
    { id: 'era.calendar', label: '历法时间', icon: '📅', hints: ['历法','节气','时辰'] },
  ]},
  { id: 'events', label: '重大事件', icon: '⚡', hints: ['与历史年表联动','📜史实事件自动成为锚点','✨虚构事件为作者规划'], children: [] },
  { id: 'geography', label: '地理疆域', icon: '🗺️', children: [
    { id: 'geography.admin', label: '行政区划', icon: '📐', hints: ['省/府/州/县','边疆与内地'] },
    { id: 'geography.terrain', label: '地形地貌', icon: '⛰️', hints: ['山脉','平原','盆地','沙漠','高原'] },
    { id: 'geography.cities', label: '城市重镇', icon: '🏰', hints: ['都城布局','军事要塞','商业都会','城墙城门'] },
    { id: 'geography.water', label: '水系', icon: '🌊', hints: ['河流','湖泊','运河','漕运路线','水利工程'] },
    { id: 'geography.roads', label: '道路交通', icon: '🛤️', hints: ['官道','驿站','栈道','关隘','海路'] },
  ]},
  { id: 'climate', label: '气候环境', icon: '🌦️', children: [
    { id: 'climate.weather', label: '气候特征', icon: '☀️', hints: ['季节','温度','降水'] },
    { id: 'climate.disaster', label: '自然灾害', icon: '🌪️', hints: ['旱涝','地震','瘟疫','蝗灾'] },
    { id: 'climate.ecology', label: '生态物种', icon: '🌿', hints: ['动物','植物','特殊物产'] },
  ]},
  { id: 'politics', label: '政治制度', icon: '🏛️', children: [
    { id: 'politics.system', label: '政体形态', icon: '👑', hints: ['君主制/共和','集权程度','分权制衡'] },
    { id: 'politics.central', label: '中央官制', icon: '📋', hints: ['宰辅','部院','寺监','内阁/军机'] },
    { id: 'politics.local', label: '地方官制', icon: '🏠', hints: ['州牧/刺史/知府','藩镇','地方自治'] },
    { id: 'politics.selection', label: '选官制度', icon: '🎓', hints: ['科举','荐举','九品中正','世袭'] },
    { id: 'politics.nobility', label: '爵位封号', icon: '🎖️', hints: ['公侯伯子男','封国','食邑'] },
    { id: 'politics.law', label: '法律刑罚', icon: '⚖️', hints: ['律令格式','刑罚种类','审判流程','监狱'] },
    { id: 'politics.diplomacy', label: '外交', icon: '🤝', hints: ['朝贡','邦交','和亲','质子','国书'] },
  ]},
  { id: 'military', label: '军事', icon: '⚔️', children: [
    { id: 'military.organization', label: '军制编制', icon: '🪖', hints: ['兵种','军衔','编制单位','府兵/募兵'] },
    { id: 'military.weapons', label: '武器装备', icon: '🗡️', hints: ['兵器','铠甲','攻城器械'] },
    { id: 'military.tactics', label: '战术战法', icon: '🗺️', hints: ['阵法','骑兵/步兵/水师','攻城/守城'] },
    { id: 'military.fortification', label: '防御工事', icon: '🏰', hints: ['城池','关隘','长城','烽燧','堡寨'] },
  ]},
  { id: 'economy', label: '经济', icon: '💰', children: [
    { id: 'economy.tax', label: '赋税制度', icon: '📊', hints: ['田赋','徭役','商税','两税法/一条鞭法'] },
    { id: 'economy.currency', label: '货币金融', icon: '🪙', hints: ['铜钱','银两','纸钞','钱庄','飞钱'] },
    { id: 'economy.trade', label: '商业贸易', icon: '🏪', hints: ['坊市','行商坐贾','丝路/海贸','行会'] },
    { id: 'economy.agriculture', label: '农业', icon: '🌾', hints: ['耕作方式','作物种类','灌溉','田制'] },
    { id: 'economy.crafts', label: '手工业', icon: '🔨', hints: ['织造','冶炼','陶瓷','造纸','印刷'] },
    { id: 'economy.resources', label: '资源物产', icon: '💎', hints: ['盐铁茶马','矿产','地方特产','战略物资'] },
  ]},
  { id: 'society', label: '社会结构', icon: '👥', children: [
    { id: 'society.hierarchy', label: '阶层等级', icon: '📶', hints: ['士农工商','贵族/平民/贱民','社会流动性'] },
    { id: 'society.clan', label: '宗族家族', icon: '🏠', hints: ['家谱','祠堂','嫡庶/长幼','分家/继承'] },
    { id: 'society.gender', label: '性别秩序', icon: '⚤', hints: ['婚嫁制度','贞操观','女性地位'] },
    { id: 'society.servitude', label: '依附关系', icon: '🔗', hints: ['奴婢','佃户','家仆','人身依附'] },
    { id: 'society.organizations', label: '民间组织', icon: '🤫', hints: ['帮会','秘密社团','商帮','会馆'] },
  ]},
  { id: 'technology', label: '科技生产力', icon: '⚙️', children: [
    { id: 'technology.engineering', label: '工程建筑', icon: '🏗️', hints: ['建筑','桥梁','水利','营造法式'] },
    { id: 'technology.medicine', label: '医药', icon: '🏥', hints: ['医学体系','药材','瘟疫防治','巫医'] },
    { id: 'technology.astronomy', label: '天文历算', icon: '🔭', hints: ['星象','占卜','数学','历法编制'] },
    { id: 'technology.transport', label: '交通工具', icon: '🚢', hints: ['车马','船舶','轿子','造船技术'] },
    { id: 'technology.communication', label: '通信', icon: '📨', hints: ['驿传','烽火','飞鸽','信使'] },
    { id: 'technology.tools', label: '生产工具', icon: '🔧', hints: ['农具','纺织机','冶炼炉','技术边界'] },
  ]},
  { id: 'culture', label: '文化思想', icon: '📚', children: [
    { id: 'culture.philosophy', label: '主流思想', icon: '🧠', hints: ['儒','释','道','法','墨','理学/心学'] },
    { id: 'culture.arts', label: '文学艺术', icon: '🎨', hints: ['诗词','话本','戏曲','书画','音乐'] },
    { id: 'culture.education', label: '教育', icon: '🎓', hints: ['私塾','官学','书院','太学','典籍'] },
  ]},
  { id: 'religion', label: '宗教信仰', icon: '🙏', children: [
    { id: 'religion.official', label: '官方宗教', icon: '⛪', hints: ['国教','祭天','宗庙','宗教政策'] },
    { id: 'religion.folk', label: '民间信仰', icon: '🏮', hints: ['土地','灶神','妈祖','关帝','祈福禳灾'] },
    { id: 'religion.funeral', label: '丧葬祭祀', icon: '🪦', hints: ['葬制','祭祖','招魂','忌日','陵墓'] },
    { id: 'religion.taboo', label: '禁忌避讳', icon: '🚫', hints: ['名讳','字号','文字狱','吉凶观念'] },
  ]},
  { id: 'ethnicity', label: '民族族群', icon: '🌏', children: [
    { id: 'ethnicity.main', label: '主体民族', icon: '🏘️', hints: ['民族特征','文化认同'] },
    { id: 'ethnicity.neighbors', label: '周边民族', icon: '🏕️', hints: ['游牧/渔猎','华夷关系'] },
    { id: 'ethnicity.interaction', label: '民族互动', icon: '🔄', hints: ['战争','融合','同化','边疆政策'] },
    { id: 'ethnicity.foreign', label: '外国势力', icon: '🌐', hints: ['外来文化','传教士','通商'] },
  ]},
  { id: 'language', label: '语言称谓', icon: '💬', children: [
    { id: 'language.spoken', label: '口语风格', icon: '🗣️', hints: ['时代语感','方言','雅俗分野'] },
    { id: 'language.titles', label: '称谓体系', icon: '📛', hints: ['官职称呼','亲属称谓','自称/敬称/贱称'] },
    { id: 'language.written', label: '书面语', icon: '✒️', hints: ['文言/白话','奏折/公文/信函格式'] },
    { id: 'language.taboo', label: '忌讳用语', icon: '🤐', hints: ['避讳字','委婉语','时代特有表达'] },
  ]},
];

const PRIORITY_LABELS = { historical: '史实优先', balanced: '均衡', fictional: '架空优先' };

function initRealismData() {
  if (!state.data.realismFantasy) {
    state.data.realismFantasy = { entries: {}, customNodes: [], globalNote: '' };
  }
  const rf = state.data.realismFantasy;
  if (!rf.entries) rf.entries = {};
  if (!rf.customNodes) rf.customNodes = [];
  return rf;
}

function getRealismEntry(nodeId) {
  const rf = initRealismData();
  return rf.entries[nodeId] || { historicalAnchors: '', fictionalAdaptations: '', priority: 'balanced' };
}

function isEntryEmpty(entry) {
  return !entry || (!entry.historicalAnchors && !entry.fictionalAdaptations);
}

function countFilledNodes() {
  const rf = initRealismData();
  let count = 0;
  for (const l1 of WORLD_RULE_TREE) {
    if (!isEntryEmpty(rf.entries[l1.id])) count++;
    if (l1.children) {
      for (const l2 of l1.children) {
        if (!isEntryEmpty(rf.entries[l2.id])) count++;
      }
    }
  }
  for (const n of rf.customNodes) {
    if (!isEntryEmpty(rf.entries[n.id])) count++;
  }
  return count;
}

function renderRealism() {
  initRealismData();
  const rf = state.data.realismFantasy;
  if (!state.realismSelectedL1) state.realismSelectedL1 = WORLD_RULE_TREE[0].id;
  const selL1 = state.realismSelectedL1;
  const l1Node = WORLD_RULE_TREE.find(n => n.id === selL1);
  const l2Nodes = [];
  if (l1Node && l1Node.children) l2Nodes.push(...l1Node.children);
  for (const cn of rf.customNodes) {
    if (cn.parentId === selL1) l2Nodes.push({ id: cn.id, label: cn.label, icon: cn.icon || '🔖', hints: cn.hints, isCustom: true });
  }
  const selNodeId = state.realismSelectedNode;
  const entry = selNodeId ? getRealismEntry(selNodeId) : null;
  const filledCount = countFilledNodes();

  const getNodeLabel = (nodeId) => {
    const l1 = WORLD_RULE_TREE.find(n => n.id === nodeId);
    if (l1) return `${l1.icon} ${l1.label}`;
    for (const l1n of WORLD_RULE_TREE) {
      if (l1n.children) { const l2 = l1n.children.find(n => n.id === nodeId); if (l2) return `${l2.icon} ${l2.label}`; }
    }
    const cn = rf.customNodes.find(n => n.id === nodeId);
    if (cn) return `${cn.icon || '🔖'} ${cn.label}`;
    return nodeId;
  };

  const getNodeHints = (nodeId) => {
    const l1 = WORLD_RULE_TREE.find(n => n.id === nodeId);
    if (l1 && l1.hints) return l1.hints;
    for (const l1n of WORLD_RULE_TREE) {
      if (l1n.children) { const l2 = l1n.children.find(n => n.id === nodeId); if (l2 && l2.hints) return l2.hints; }
    }
    const cn = rf.customNodes.find(n => n.id === nodeId);
    if (cn && cn.hints) return cn.hints;
    return [];
  };

  const countL1Filled = (l1Id) => {
    let c = 0;
    if (!isEntryEmpty(rf.entries[l1Id])) c++;
    const l1 = WORLD_RULE_TREE.find(n => n.id === l1Id);
    if (l1 && l1.children) { for (const l2 of l1.children) { if (!isEntryEmpty(rf.entries[l2.id])) c++; } }
    for (const cn of rf.customNodes) { if (cn.parentId === l1Id && !isEntryEmpty(rf.entries[cn.id])) c++; }
    return c;
  };

  return `<div class="card"><div class="flex-between"><h3>⚖️ 真实与幻想</h3><span class="text-sm text-muted">${filledCount} 个维度已设定</span></div>
    <p class="text-sm text-muted mb-12">按维度声明哪些设定取自真实历史、哪些是架空改造，AI 生成时会严格遵守这些约束。</p>
    <div class="realism-layout">
      <div class="realism-l1-nav">
        <div class="realism-nav-header">大类</div>
        ${WORLD_RULE_TREE.map(l1 => {
          const cnt = countL1Filled(l1.id);
          const active = l1.id === selL1;
          return `<div class="realism-nav-item${active?' active':''}" data-l1="${l1.id}" onclick="selectRealismL1('${l1.id}')">
            <span>${l1.icon} ${l1.label}</span><span class="realism-nav-count">${cnt > 0 ? cnt : ''}</span></div>`;
        }).join('')}
        ${rf.customNodes.filter(n => !n.parentId).map(cn => {
          const active = cn.id === selL1;
          return `<div class="realism-nav-item${active?' active':''}" data-l1="${cn.id}" onclick="selectRealismL1('${cn.id}')">
            <span>${cn.icon || '🔖'} ${cn.label}</span><span class="realism-nav-count"></span></div>`;
        }).join('')}
        <div class="realism-nav-footer"><button class="btn btn-xs btn-outline" onclick="addRealismCustomL1()" style="width:100%;font-size:10px">+ 添加大类</button></div>
      </div>
      <div class="realism-l2-nav">
        <div class="realism-nav-header">${l1Node ? l1Node.icon + ' ' + l1Node.label : '子类'}</div>
        ${l2Nodes.map(l2 => {
          const active = l2.id === selNodeId;
          const filled = !isEntryEmpty(rf.entries[l2.id]);
          return `<div class="realism-nav-item${active?' active':''}" data-node="${l2.id}" onclick="selectRealismNode('${l2.id}')">
            <span>${l2.icon} ${l2.label}</span>${filled?'<span class="realism-dot-filled">●</span>':''}
            ${l2.isCustom?`<button class="btn btn-xs btn-icon btn-danger" style="font-size:9px;margin-left:auto" onclick="event.stopPropagation();deleteRealismNode('${l2.id}')">×</button>`:''}
          </div>`;
        }).join('')}
        <div class="realism-nav-footer"><button class="btn btn-xs btn-outline" onclick="addRealismCustomL2()" style="width:100%;font-size:10px">+ 添加子类</button></div>
      </div>
      <div class="realism-editor">
        ${selNodeId ? `<div>
          <div class="flex-between mb-12"><h3>${getNodeLabel(selNodeId)}</h3>
            ${selNodeId && rf.customNodes.some(n=>n.id===selNodeId) ? `<button class="btn btn-xs btn-danger" onclick="deleteRealismNode('${selNodeId}')">删除节点</button>` : ''}
            ${!isEntryEmpty(entry) ? `<button class="btn btn-xs btn-outline" onclick="clearRealismEntry('${selNodeId}')">清空</button>` : ''}
          </div>
          ${(() => { const hints = getNodeHints(selNodeId); return hints.length > 0 ? `<div class="realism-hints">${hints.map(h=>`<span class="realism-hint-tag">${h}</span>`).join('')}</div>` : ''; })()}
          <div class="form-group"><label>📜 取自真实（历史考据 / 现实原型）</label>
            <textarea rows="5" onchange="updateRealismEntry('${selNodeId}','historicalAnchors',this.value)" style="width:100%;padding:10px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(entry.historicalAnchors||'')}</textarea></div>
          <div class="form-group"><label>✨ 架空改造（虚构 / 改编 / 原创设定）</label>
            <textarea rows="5" onchange="updateRealismEntry('${selNodeId}','fictionalAdaptations',this.value)" style="width:100%;padding:10px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(entry.fictionalAdaptations||'')}</textarea></div>
          <div class="form-group"><label>⚖️ 当真实与架空冲突时</label>
            <div class="realism-priority-row">
              ${Object.entries(PRIORITY_LABELS).map(([v,label]) => {
                const active = (entry.priority||'balanced') === v;
                const colorClass = v === 'historical' ? 'priority-historical' : v === 'fictional' ? 'priority-fictional' : 'priority-balanced';
                return `<button class="btn btn-sm ${active ? colorClass : 'btn-outline'}" onclick="updateRealismEntry('${selNodeId}','priority','${v}');renderTabContent()">${label}</button>`;
              }).join('')}
            </div></div>
        </div>` : `<div class="empty-state"><div class="icon">👈</div><p>选择左侧维度开始编辑</p></div>`}
      </div>
    </div></div>
    <div class="card"><h3>📝 全局补充说明</h3><p class="text-sm text-muted mb-8">对 AI 的额外约束，适用于所有维度</p>
      <textarea rows="3" onchange="updateRealismGlobalNote(this.value)" style="width:100%;padding:10px 12px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--black);font-size:14px;font-family:var(--font-body);resize:vertical">${esc(rf.globalNote||'')}</textarea></div>
    <div class="card"><div class="flex-between"><h3>📋 AI 清单预览</h3><button class="btn btn-sm btn-outline" onclick="toggleRealismPreview()">${state.showRealismPreview?'关闭预览':'生成预览'}</button></div>
      ${state.showRealismPreview ? `<pre class="realism-preview">${esc(buildRealismManifest())}</pre>` : ''}</div>`;
}

function selectRealismL1(l1Id) { state.realismSelectedL1 = l1Id; state.realismSelectedNode = null; renderTabContent(); }
function selectRealismNode(nodeId) { state.realismSelectedNode = nodeId; renderTabContent(); }

function updateRealismEntry(nodeId, key, value) {
  const rf = initRealismData();
  if (!rf.entries[nodeId]) rf.entries[nodeId] = { historicalAnchors: '', fictionalAdaptations: '', priority: 'balanced' };
  rf.entries[nodeId][key] = value;
  autoSave();
}

async function clearRealismEntry(nodeId) {
  if (!await customConfirm('确定清空此节点的所有设定？')) return;
  const rf = initRealismData();
  rf.entries[nodeId] = { historicalAnchors: '', fictionalAdaptations: '', priority: 'balanced' };
  autoSave();
  renderTabContent();
}

function updateRealismGlobalNote(value) { const rf = initRealismData(); rf.globalNote = value; autoSave(); }

async function addRealismCustomL1() {
  const name = await customPrompt('新大类名称', '');
  if (!name || !name.trim()) return;
  const rf = initRealismData();
  const id = 'custom_' + Date.now();
  rf.customNodes.push({ id, parentId: null, label: name.trim(), icon: '🔖' });
  autoSave(); renderTabContent();
}

async function addRealismCustomL2() {
  const name = await customPrompt('新子类名称', '');
  if (!name || !name.trim()) return;
  const rf = initRealismData();
  const id = 'custom_' + Date.now();
  rf.customNodes.push({ id, parentId: state.realismSelectedL1, label: name.trim(), icon: '📝' });
  state.realismSelectedNode = id;
  autoSave(); renderTabContent();
}

async function deleteRealismNode(nodeId) {
  if (!await customConfirm('确定删除此节点及其设定？')) return;
  const rf = initRealismData();
  rf.customNodes = rf.customNodes.filter(n => n.id !== nodeId);
  delete rf.entries[nodeId];
  if (state.realismSelectedNode === nodeId) state.realismSelectedNode = null;
  autoSave(); renderTabContent();
}

function toggleRealismPreview() { state.showRealismPreview = !state.showRealismPreview; renderTabContent(); }

function buildRealismManifest() {
  const rf = initRealismData();
  const lines = [];
  for (const l1 of WORLD_RULE_TREE) {
    const e1 = rf.entries[l1.id];
    if (e1 && !isEntryEmpty(e1)) {
      lines.push(`## ${l1.icon} ${l1.label}`);
      if (e1.historicalAnchors) lines.push(`- 📜 取自真实：${e1.historicalAnchors}`);
      if (e1.fictionalAdaptations) lines.push(`- ✨ 架空改造：${e1.fictionalAdaptations}`);
      if (e1.priority) lines.push(`- ⚖️ 冲突优先：${PRIORITY_LABELS[e1.priority]}`);
      lines.push('');
    }
    if (l1.children) {
      for (const l2 of l1.children) {
        const e2 = rf.entries[l2.id];
        if (e2 && !isEntryEmpty(e2)) {
          lines.push(`### ${l2.icon} ${l2.label}`);
          if (e2.historicalAnchors) lines.push(`- 📜 取自真实：${e2.historicalAnchors}`);
          if (e2.fictionalAdaptations) lines.push(`- ✨ 架空改造：${e2.fictionalAdaptations}`);
          if (e2.priority) lines.push(`- ⚖️ 冲突优先：${PRIORITY_LABELS[e2.priority]}`);
          lines.push('');
        }
      }
    }
    for (const cn of rf.customNodes) {
      if (cn.parentId === l1.id) {
        const ec = rf.entries[cn.id];
        if (ec && !isEntryEmpty(ec)) {
          lines.push(`### ${cn.icon || '🔖'} ${cn.label}`);
          if (ec.historicalAnchors) lines.push(`- 📜 取自真实：${ec.historicalAnchors}`);
          if (ec.fictionalAdaptations) lines.push(`- ✨ 架空改造：${ec.fictionalAdaptations}`);
          if (ec.priority) lines.push(`- ⚖️ 冲突优先：${PRIORITY_LABELS[ec.priority]}`);
          lines.push('');
        }
      }
    }
  }
  if (rf.globalNote) { lines.push('---'); lines.push(`## 📝 全局约束`); lines.push(rf.globalNote); }
  return lines.join('\n') || '暂无已设定的维度';
}