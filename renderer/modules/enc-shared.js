// ============================================================
// 世界百科 — 共享状态、常量与工具函数
// ============================================================

let editEncyclopediaItemId = null;
let _encyclopediaIsNew = false;

const DEFAULT_ENCYCLOPEDIA_TREE = [
  { id: 'enc_era', label: '时代背景', icon: '🕰️', children: [
    { id: 'enc_era_period', label: '历史时期', icon: '📜' },
    { id: 'enc_era_divergence', label: '架空起点', icon: '🦋' },
    { id: 'enc_era_calendar', label: '历法时间', icon: '📅' },
  ]},
  { id: 'enc_events', label: '重大事件', icon: '⚡', children: [] },
  { id: 'enc_geography', label: '地理疆域', icon: '🗺️', children: [
    { id: 'enc_geo_admin', label: '行政区划', icon: '📐' },
    { id: 'enc_geo_terrain', label: '地形地貌', icon: '⛰️' },
    { id: 'enc_geo_cities', label: '城市重镇', icon: '🏰' },
    { id: 'enc_geo_water', label: '水系', icon: '🌊' },
    { id: 'enc_geo_roads', label: '道路交通', icon: '🛤️' },
  ]},
  { id: 'enc_climate', label: '气候环境', icon: '🌦️', children: [
    { id: 'enc_cli_weather', label: '气候特征', icon: '☀️' },
    { id: 'enc_cli_disaster', label: '自然灾害', icon: '🌪️' },
    { id: 'enc_cli_ecology', label: '生态物种', icon: '🌿' },
  ]},
  { id: 'enc_politics', label: '政治制度', icon: '🏛️', children: [
    { id: 'enc_pol_system', label: '政体形态', icon: '👑' },
    { id: 'enc_pol_central', label: '中央官制', icon: '📋' },
    { id: 'enc_pol_local', label: '地方官制', icon: '🏠' },
    { id: 'enc_pol_selection', label: '选官制度', icon: '🎓' },
    { id: 'enc_pol_nobility', label: '爵位封号', icon: '🎖️' },
    { id: 'enc_pol_law', label: '法律刑罚', icon: '⚖️' },
    { id: 'enc_pol_diplomacy', label: '外交', icon: '🤝' },
  ]},
  { id: 'enc_military', label: '军事', icon: '⚔️', children: [
    { id: 'enc_mil_org', label: '军制编制', icon: '🪖' },
    { id: 'enc_mil_weapons', label: '武器装备', icon: '🗡️' },
    { id: 'enc_mil_tactics', label: '战术战法', icon: '🗺️' },
    { id: 'enc_mil_fort', label: '防御工事', icon: '🏰' },
  ]},
  { id: 'enc_economy', label: '经济', icon: '💰', children: [
    { id: 'enc_eco_tax', label: '赋税制度', icon: '📊' },
    { id: 'enc_eco_currency', label: '货币金融', icon: '🪙' },
    { id: 'enc_eco_trade', label: '商业贸易', icon: '🏪' },
    { id: 'enc_eco_agri', label: '农业', icon: '🌾' },
    { id: 'enc_eco_crafts', label: '手工业', icon: '🔨' },
    { id: 'enc_eco_resources', label: '资源物产', icon: '💎' },
  ]},
  { id: 'enc_society', label: '社会结构', icon: '👥', children: [
    { id: 'enc_soc_hierarchy', label: '阶层等级', icon: '📶' },
    { id: 'enc_soc_clan', label: '宗族家族', icon: '🏠' },
    { id: 'enc_soc_gender', label: '性别秩序', icon: '⚤' },
    { id: 'enc_soc_servitude', label: '依附关系', icon: '🔗' },
    { id: 'enc_soc_orgs', label: '民间组织', icon: '🤫' },
  ]},
  { id: 'enc_technology', label: '科技生产力', icon: '⚙️', children: [
    { id: 'enc_tech_eng', label: '工程建筑', icon: '🏗️' },
    { id: 'enc_tech_med', label: '医药', icon: '🏥' },
    { id: 'enc_tech_astro', label: '天文历算', icon: '🔭' },
    { id: 'enc_tech_transport', label: '交通工具', icon: '🚢' },
    { id: 'enc_tech_comm', label: '通信', icon: '📨' },
    { id: 'enc_tech_tools', label: '生产工具', icon: '🔧' },
  ]},
  { id: 'enc_culture', label: '文化思想', icon: '📚', children: [
    { id: 'enc_cul_phil', label: '主流思想', icon: '🧠' },
    { id: 'enc_cul_arts', label: '文学艺术', icon: '🎨' },
    { id: 'enc_cul_edu', label: '教育', icon: '🎓' },
  ]},
  { id: 'enc_religion', label: '宗教信仰', icon: '🙏', children: [
    { id: 'enc_rel_official', label: '官方宗教', icon: '⛪' },
    { id: 'enc_rel_folk', label: '民间信仰', icon: '🏮' },
    { id: 'enc_rel_funeral', label: '丧葬祭祀', icon: '🪦' },
    { id: 'enc_rel_taboo', label: '禁忌避讳', icon: '🚫' },
  ]},
  { id: 'enc_ethnicity', label: '民族族群', icon: '🌏', children: [
    { id: 'enc_eth_main', label: '主体民族', icon: '🏘️' },
    { id: 'enc_eth_neighbors', label: '周边民族', icon: '🏕️' },
    { id: 'enc_eth_interact', label: '民族互动', icon: '🔄' },
    { id: 'enc_eth_foreign', label: '外国势力', icon: '🌐' },
  ]},
  { id: 'enc_language', label: '语言称谓', icon: '💬', children: [
    { id: 'enc_lang_spoken', label: '口语风格', icon: '🗣️' },
    { id: 'enc_lang_titles', label: '称谓体系', icon: '📛' },
    { id: 'enc_lang_written', label: '书面语', icon: '✒️' },
    { id: 'enc_lang_taboo', label: '忌讳用语', icon: '🤐' },
  ]},
];

function initEncyclopediaData() {
  let needSave = false;
  if (!state.data.encyclopediaCategories) { state.data.encyclopediaCategories = []; needSave = true; }
  if (!state.data.encyclopediaSubCategories) { state.data.encyclopediaSubCategories = []; needSave = true; }
  if (!state.data.encyclopediaItems) { state.data.encyclopediaItems = []; needSave = true; }
  ensurePropertyDefs();
  if (!state.data.propertyDefs.categoryBindings) { state.data.propertyDefs.categoryBindings = {}; needSave = true; }
  if (state.data.encyclopediaCategories.length === 0 && state.data.encyclopediaSubCategories.length === 0) {
    for (const l1 of DEFAULT_ENCYCLOPEDIA_TREE) {
      state.data.encyclopediaCategories.push({ id: l1.id, name: l1.label, icon: l1.icon, description: '' });
      if (l1.children) {
        for (const l2 of l1.children) {
          state.data.encyclopediaSubCategories.push({ id: l2.id, name: l2.label, icon: l2.icon, description: '', parentId: l1.id });
        }
      }
    }
    needSave = true;
  }
  if (needSave) autoSave();
}

function getEncyclopediaBinding(catType) {
  initEncyclopediaData();
  return state.data.propertyDefs.categoryBindings[catType] || null;
}

function getBoundCatType(subId) {
  initEncyclopediaData();
  const bindings = state.data.propertyDefs.categoryBindings || {};
  for (const [catType, sid] of Object.entries(bindings)) {
    if (sid === subId) return catType;
  }
  return null;
}

function getCategoryDesc(catType, name) {
  const cat = (state.data.categories || []).find(c => c.type === catType && c.name === name);
  return cat ? (cat.description || '') : '';
}