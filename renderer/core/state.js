// ============================================================
// 世界生成器 — 常量 & 全局状态
// ============================================================

const TABS = [
  { id: 'overview', label: '项目概览', icon: '📋' },
  { id: 'worldview', label: '世界观', icon: '🌌' },
  { id: 'constitution', label: '世界探索', icon: '🔭' },
  { id: 'encyclopedia', label: '世界百科', icon: '📚' },
  { id: 'locations', label: '地点管理', icon: '📍' },
  { id: 'characters', label: '角色系统', icon: '👤' },
  { id: 'relations', label: '关系图表', icon: '🕸️' },
  { id: 'factions', label: '势力', icon: '🏰' },
  { id: 'races', label: '种族', icon: '🧬' },
  { id: 'items', label: '世界系统', icon: '🌍' },
  { id: 'events', label: '事件', icon: '⚡' },
  { id: 'powers', label: '力量体系', icon: '🔮' },
  { id: 'outline', label: '大纲/章节', icon: '📑' },
  { id: 'map', label: '世界地图', icon: '🗺️' },
  { id: 'timeline', label: '时间线', icon: '⏳' },
  { id: 'rules', label: '资源库存', icon: '📦' },
  { id: 'properties', label: '属性定义', icon: '⚙️' },
  { id: 'backup', label: '备份管理', icon: '💾' }
];

const CHAR_DIMENSIONS = [
  { key: 'shortDescription', label: '一句话简介', group: '身份', rows: 2 },
  { key: 'appearance', label: '外貌', group: '身份', rows: 3 },
  { key: 'personality', label: '性格', group: '性格内核', rows: 3 },
  { key: 'values', label: '价值观/信念', group: '性格内核', rows: 2 },
  { key: 'strengths', label: '优点/长处', group: '性格内核', rows: 2 },
  { key: 'weaknesses', label: '缺点/性格弱点', group: '性格内核', rows: 2 },
  { key: 'fears', label: '恐惧/软肋', group: '性格内核', rows: 2 },
  { key: 'motivation', label: '动机/欲望', group: '驱动力', rows: 2 },
  { key: 'goals', label: '目标(短/长期)', group: '驱动力', rows: 2 },
  { key: 'innerConflict', label: '核心矛盾/内心冲突', group: '驱动力', rows: 2 },
  { key: 'background', label: '背景故事', group: '背景', rows: 4 },
  { key: 'keyEvents', label: '关键经历/转折', group: '背景', rows: 3 },
  { key: 'abilities', label: '能力/金手指', group: '能力', rows: 2 },
  { key: 'powerLevel', label: '实力定位/境界', group: '能力', rows: 1 },
  { key: 'speechStyle', label: '语言风格/口头禅', group: '鲜活细节', rows: 2 },
  { key: 'habits', label: '习惯/小动作/癖好', group: '鲜活细节', rows: 2 },
  { key: 'signatureItem', label: '标志性物品/符号', group: '鲜活细节', rows: 1 },
  { key: 'arc', label: '角色弧光/成长线', group: '成长', rows: 2 },
  { key: 'storyRole', label: '在故事中的作用', group: '剧情功能', rows: 2 },
  { key: 'ending', label: '结局走向', group: '剧情功能', rows: 2 }
];

const TAG_COLORS = ['#6c5ce7','#00cec9','#fdcb6e','#ff7675','#e17055','#74b9ff','#55efc4','#a29bfe','#fab1a0','#81ecec'];

const RELATION_TYPES = [
  { value: 'family', label: '家人', color: '#8055ad' },
  { value: 'lover', label: '恋人', color: '#e53e8e' },
  { value: 'friend', label: '朋友', color: '#38a169' },
  { value: 'rival', label: '对手', color: '#d69e2e' },
  { value: 'enemy', label: '敌人', color: '#e53e3e' },
  { value: 'master', label: '师徒(师)', color: '#dd6b20' },
  { value: 'student', label: '师徒(徒)', color: '#dd6b20' },
  { value: 'ally', label: '盟友', color: '#3182ce' },
  { value: 'subordinate', label: '下级', color: '#718096' },
  { value: 'other', label: '其他', color: '#a0aec0' }
];

// ============================================================
// STATE
// ============================================================
let state = {
  projects: [],
  currentProjectId: null,
  data: null,
  activeTab: 'overview',
  selectedLocationId: null,
  selectedCharacterId: null,
  selectedFactionId: null,
  selectedRaceId: null,
  selectedItemId: null,
  selectedEventId: null,
  selectedEncyclopediaCatId: null,
  selectedEncyclopediaSubId: null,
  _lastAnimatedTab: null,
  _forceAnimate: false,
  tagExpanded: {},
  inventoryPlaceMode: null,
  locationTagFilter: null,
  editingCharacter: false,
  editingLocation: false,
  editingFaction: false,
  editingRace: false,
  editingItem: false,
  editingEvent: false,
  navigationHistory: [],
  _saveTimer: null
};