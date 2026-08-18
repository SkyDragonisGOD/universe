// ============================================================
// 世界生成器 — 关系图表 · 图谱引擎
// 依赖: relations-data.js, core/state.js, core/utils.js
// ============================================================

// ---- 拖拽跟随物理 ----
const DRAG_FOLLOW_STIFFNESS = 0.07;
const DRAG_DAMPING = 0.88;

// ---- 边界弹性回弹物理 ----
const BOUNDARY_SPRING_STIFFNESS = 0.12;
const BOUNDARY_DAMPING = 0.82;
const BOUNDARY_OVERALLOW_OFFSET = 45;

// ---- 物理模拟状态 ----
let _graphPhysicsActive = false;
let _graphDragTarget = null;
let _graphDragTargetX = 0;
let _graphDragTargetY = 0;
let _graphNodeVelocities = {};
let _graphReleasingNodes = {};

// ---- 物理模拟帧循环 ----
function _graphPhysicsStep() {
  const canvas = $('#relations-canvas');
  if (!canvas) { _graphPhysicsActive = false; return; }
  const positions = _getGraphPositions();
  const vp = _getGraphViewport();
  const margin = 28 / vp.zoom;
  const minX = -vp.panX / vp.zoom + margin;
  const minY = -vp.panY / vp.zoom + margin;
  const maxX = (canvas.width - vp.panX) / vp.zoom - margin;
  const maxY = (canvas.height - vp.panY) / vp.zoom - margin;

  let anyActive = false;

  // ---- 拖拽跟随：弹簧-阻尼模型 ----
  if (_graphDragTarget && positions[_graphDragTarget]) {
    const p = positions[_graphDragTarget];
    if (!_graphNodeVelocities[_graphDragTarget]) _graphNodeVelocities[_graphDragTarget] = { vx: 0, vy: 0 };
    const vel = _graphNodeVelocities[_graphDragTarget];
    const dx = _graphDragTargetX - p.x;
    const dy = _graphDragTargetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const outOfBounds = p.x < minX || p.x > maxX || p.y < minY || p.y > maxY;
    if (!outOfBounds && dist < 1.5) {
      p.x = _graphDragTargetX;
      p.y = _graphDragTargetY;
      vel.vx = 0;
      vel.vy = 0;
    } else {
      const fx = dx * DRAG_FOLLOW_STIFFNESS;
      const fy = dy * DRAG_FOLLOW_STIFFNESS;
      vel.vx = (vel.vx + fx) * DRAG_DAMPING;
      vel.vy = (vel.vy + fy) * DRAG_DAMPING;
    }
    // ---- 边界弹簧：拖拽中按住不回弹，仅增加阻力 ----
    if (p.x < minX) {
      const over = minX - p.x;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      vel.vx += (over + extra) * BOUNDARY_SPRING_STIFFNESS * 0.3;
    }
    if (p.x > maxX) {
      const over = p.x - maxX;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      vel.vx -= (over + extra) * BOUNDARY_SPRING_STIFFNESS * 0.3;
    }
    if (p.y < minY) {
      const over = minY - p.y;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      vel.vy += (over + extra) * BOUNDARY_SPRING_STIFFNESS * 0.3;
    }
    if (p.y > maxY) {
      const over = p.y - maxY;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      vel.vy -= (over + extra) * BOUNDARY_SPRING_STIFFNESS * 0.3;
    }
    p.x += vel.vx;
    p.y += vel.vy;
    anyActive = true;
  }

  // ---- 释放回弹：弹簧振荡衰减 ----
  for (const id in _graphReleasingNodes) {
    if (!positions[id]) { delete _graphReleasingNodes[id]; continue; }
    const p = positions[id];
    if (!_graphNodeVelocities[id]) _graphNodeVelocities[id] = { vx: 0, vy: 0 };
    const vel = _graphNodeVelocities[id];
    let bx = 0, by = 0;
    if (p.x < minX) {
      const over = minX - p.x;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      bx = (over + extra) * BOUNDARY_SPRING_STIFFNESS;
    }
    if (p.x > maxX) {
      const over = p.x - maxX;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      bx = -(over + extra) * BOUNDARY_SPRING_STIFFNESS;
    }
    if (p.y < minY) {
      const over = minY - p.y;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      by = (over + extra) * BOUNDARY_SPRING_STIFFNESS;
    }
    if (p.y > maxY) {
      const over = p.y - maxY;
      const extra = over > BOUNDARY_OVERALLOW_OFFSET ? (over - BOUNDARY_OVERALLOW_OFFSET) * 3 : 0;
      by = -(over + extra) * BOUNDARY_SPRING_STIFFNESS;
    }
    vel.vx = (vel.vx + bx) * BOUNDARY_DAMPING;
    vel.vy = (vel.vy + by) * BOUNDARY_DAMPING;
    p.x += vel.vx;
    p.y += vel.vy;
    const speed = Math.abs(vel.vx) + Math.abs(vel.vy) + Math.abs(bx) + Math.abs(by);
    if (speed < 0.05) {
      delete _graphReleasingNodes[id];
      delete _graphNodeVelocities[id];
    } else {
      anyActive = true;
    }
  }

  if (anyActive) drawRelationsGraph();

  if (anyActive || _graphDragTarget) {
    requestAnimationFrame(_graphPhysicsStep);
  } else {
    _graphPhysicsActive = false;
  }
}

function _startGraphPhysics() {
  if (!_graphPhysicsActive) {
    _graphPhysicsActive = true;
    requestAnimationFrame(_graphPhysicsStep);
  }
}

// ---- 画布交互 ----
function _setupCanvasInteraction() {
  const canvas = $('#relations-canvas');
  if (!canvas) return;
  let draggingNode = null;
  let dragOffsetX = 0, dragOffsetY = 0;
  let dragPending = null;
  let dragStartSX = 0, dragStartSY = 0;
  let panning = false;
  let panStartX = 0, panStartY = 0;
  let panStartPanX = 0, panStartPanY = 0;

  canvas.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = _screenToWorld(sx, sy);
    const positions = _getGraphPositions();
    if (e.button === 0) {
      for (const id in positions) {
        const p = positions[id];
        const dx = world.x - p.x, dy = world.y - p.y;
        if (dx*dx + dy*dy <= 784) {
          dragPending = id;
          dragOffsetX = world.x - p.x;
          dragOffsetY = world.y - p.y;
          dragStartSX = e.clientX;
          dragStartSY = e.clientY;
          e.preventDefault();
          return;
        }
      }
      if (state._graphSelectedNode) {
        state._graphSelectedNode = null;
        state._graphRelatedNodes = null;
        drawRelationsGraph();
      }
      panning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      const vp = _getGraphViewport();
      panStartPanX = vp.panX;
      panStartPanY = vp.panY;
      canvas.style.cursor = 'move';
      e.preventDefault();
    } else if (e.button === 1 || e.button === 2) {
      panning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      const vp = _getGraphViewport();
      panStartPanX = vp.panX;
      panStartPanY = vp.panY;
      canvas.style.cursor = 'move';
      e.preventDefault();
    }
  };

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = _screenToWorld(sx, sy);
    const positions = _getGraphPositions();

    if (dragPending && !draggingNode) {
      const dist = Math.sqrt((e.clientX - dragStartSX) ** 2 + (e.clientY - dragStartSY) ** 2);
      if (dist > 3) {
        draggingNode = dragPending;
        dragPending = null;
        _graphDragTarget = draggingNode;
        _graphDragTargetX = world.x - dragOffsetX;
        _graphDragTargetY = world.y - dragOffsetY;
        if (!_graphNodeVelocities[draggingNode]) _graphNodeVelocities[draggingNode] = { vx: 0, vy: 0 };
        _startGraphPhysics();
        canvas.style.cursor = 'grabbing';
      }
    }

    if (draggingNode) {
      _graphDragTargetX = world.x - dragOffsetX;
      _graphDragTargetY = world.y - dragOffsetY;
      return;
    }

    if (panning) {
      const vp = _getGraphViewport();
      vp.panX = panStartPanX + (e.clientX - panStartX);
      vp.panY = panStartPanY + (e.clientY - panStartY);
      drawRelationsGraph();
      return;
    }

    let hoveredId = null;
    for (const id in positions) {
      const p = positions[id];
      const dx = world.x - p.x, dy = world.y - p.y;
      if (dx*dx + dy*dy <= 784) { hoveredId = id; break; }
    }
    if (hoveredId !== state._graphHoveredNode) {
      state._graphHoveredNode = hoveredId;
      drawRelationsGraph();
    }
    canvas.style.cursor = hoveredId ? 'pointer' : 'default';
  };

  canvas.onmouseup = (e) => {
    if (dragPending && !draggingNode) {
      const id = dragPending;
      dragPending = null;
      if (state._graphSelectedNode === id) {
        state._graphSelectedNode = null;
        state._graphRelatedNodes = null;
      } else {
        state._graphSelectedNode = id;
        const related = new Set();
        related.add(id);
        const selectedSubjects = _getSelectedGraphSubjects();
        const allEntities = _getAllGraphEntities();
        const entities = selectedSubjects.map(sid => { const [tk,id2] = sid.split(':'); return allEntities.find(en=>en.id===id2 && en.typeKey===tk); }).filter(Boolean);
        const idList = entities.map(en=>en.id);
        const allConns = _collectAllConnections(idList);
        allConns.forEach(c => {
          if (c.from === id) related.add(c.to);
          if (c.to === id) related.add(c.from);
        });
        state._graphRelatedNodes = related;
      }
      drawRelationsGraph();
      _syncRelationList();
    }
    if (draggingNode) {
      _graphReleasingNodes[draggingNode] = true;
      _graphDragTarget = null;
      _startGraphPhysics();
      draggingNode = null;
      canvas.style.cursor = 'default';
    }
    dragPending = null;
    if (panning) { panning = false; canvas.style.cursor = 'default'; }
  };

  canvas.onmouseleave = () => {
    if (draggingNode) {
      _graphReleasingNodes[draggingNode] = true;
      _graphDragTarget = null;
      _startGraphPhysics();
      draggingNode = null;
    }
    if (panning) { panning = false; }
    if (state._graphHoveredNode) { state._graphHoveredNode = null; drawRelationsGraph(); }
    canvas.style.cursor = 'default';
  };

  canvas.onwheel = (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    graphZoom(delta, mouseX, mouseY);
  };

  canvas.oncontextmenu = (e) => e.preventDefault();
}

// ---- 绘制原语 ----
function _drawArrow(ctx, fromX, fromY, toX, toY, color, label, offset) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 1) return;
  const nx = dx/len, ny = dy/len;
  const px = -ny, py = nx;
  const off = offset || 0;
  const sx = fromX + nx*28 + px*off, sy = fromY + ny*28 + py*off;
  const ex = toX - nx*28 + px*off, ey = toY - ny*28 + py*off;
  const mx = (sx+ex)/2 + px*off*0.5, my = (sy+ey)/2 + py*off*0.5;
  const ctrlX = mx + px*len*0.12, ctrlY = my + py*len*0.12;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ctrlX, ctrlY, ex, ey);
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.45; ctx.stroke(); ctx.globalAlpha = 1;
  const headLen = 7;
  const t = 0.95;
  const tangentX = 2*(1-t)*(ctrlX-sx) + 2*t*(ex-ctrlX);
  const tangentY = 2*(1-t)*(ctrlY-sy) + 2*t*(ey-ctrlY);
  const angle = Math.atan2(tangentY, tangentX);
  const tipX = sx*(1-t)*(1-t) + 2*ctrlX*t*(1-t) + ex*t*t;
  const tipY = sy*(1-t)*(1-t) + 2*ctrlY*t*(1-t) + ey*t*t;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - headLen*Math.cos(angle-Math.PI/6), tipY - headLen*Math.sin(angle-Math.PI/6));
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - headLen*Math.cos(angle+Math.PI/6), tipY - headLen*Math.sin(angle+Math.PI/6));
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1;
  if (label && state._graphSelectedNode) {
    const labelX = sx*0.25 + ctrlX*0.5 + ex*0.25 + px*8;
    const labelY = sy*0.25 + ctrlY*0.5 + ey*0.25 + py*8;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#57534e'; ctx.font = '9px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center';
    const displayLabel = label.length > 6 ? label.slice(0,6)+'…' : label;
    ctx.fillText(displayLabel, labelX, labelY);
    ctx.globalAlpha = 1;
  }
}

function _drawLine(ctx, fromX, fromY, toX, toY, color, label) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 1) return;
  const nx = dx/len, ny = dy/len;
  const px = -ny, py = nx;
  const sx = fromX + nx*28, sy = fromY + ny*28;
  const ex = toX - nx*28, ey = toY - ny*28;
  const mx = (sx+ex)/2, my = (sy+ey)/2;
  const ctrlX = mx + px*len*0.08, ctrlY = my + py*len*0.08;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ctrlX, ctrlY, ex, ey);
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
  if (label && state._graphSelectedNode) {
    const labelX = sx*0.25 + ctrlX*0.5 + ex*0.25 + px*8;
    const labelY = sy*0.25 + ctrlY*0.5 + ey*0.25 + py*8 - 4;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#57534e'; ctx.font = '10px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center';
    const displayLabel = label.length > 8 ? label.slice(0,8)+'…' : label;
    ctx.fillText(displayLabel, labelX, labelY);
    ctx.globalAlpha = 1;
  }
}

// ---- 头像缓存 ----
const _graphAvatarCache = {};

function _loadAvatarForGraph(typeKey, id) {
  const avatar = _getEntityAvatar(typeKey, id);
  if (!avatar) return Promise.resolve(null);
  const cacheKey = typeKey + ':' + id;
  if (_graphAvatarCache[cacheKey]) return Promise.resolve(_graphAvatarCache[cacheKey]);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { _graphAvatarCache[cacheKey] = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = avatar;
  });
}

// ---- 主绘制 ----
async function drawRelationsGraph() {
  const canvas = $('#relations-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const vp = _getGraphViewport();

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#f7f8fa'; ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(vp.panX, vp.panY);
  ctx.scale(vp.zoom, vp.zoom);

  const selectedSubjects = _getSelectedGraphSubjects();
  const allEntities = _getAllGraphEntities();
  const entities = selectedSubjects.map(sid => { const [tk,id] = sid.split(':'); return allEntities.find(e=>e.id===id && e.typeKey===tk); }).filter(Boolean);
  if (entities.length === 0) {
    ctx.restore();
    ctx.fillStyle='#777169'; ctx.font='14px "Microsoft YaHei",sans-serif'; ctx.textAlign='center'; ctx.fillText('请勾选主体或添加词条',w/2,h/2);
    return;
  }
  const idList = entities.map(e=>e.id);
  const allConns = _collectAllConnections(idList);
  const edges = _buildEdgeMap(allConns);
  const positions = _getGraphPositions();
  const cx=w/2, cy=h/2, radius=Math.min(w,h)/2-50;
  const typeColors = {character:'#7c9cb5',faction:'#c48b7f',location:'#7fb89a',item:'#c4a96b',event:'#a08bc4'};
  const edgeColors = {
    'character|faction':'#c48b7f', 'character|location':'#7fb89a', 'character|item':'#c4a96b',
    'character|event':'#a08bc4', 'faction|location':'#b49cd0', 'faction|faction':'#d4918a',
    'character|character':'#7c9cb5', 'location|event':'#7bb5c4', 'item|location':'#8db87a',
    'faction|event':'#c9a07a', 'item|event':'#c4b67a'
  };
  const currentIds = new Set(entities.map(e=>e.id));
  Object.keys(positions).forEach(id => { if (!currentIds.has(id)) delete positions[id]; });
  entities.forEach((e,i) => {
    if (!positions[e.id]) {
      const angle = (Math.PI*2/entities.length)*i - Math.PI/2;
      positions[e.id] = { x:cx+radius*Math.cos(angle), y:cy+radius*Math.sin(angle) };
    }
  });
  edges.forEach(edge => {
    const posA = positions[edge.a], posB = positions[edge.b];
    if (!posA || !posB) return;
    const typeKey = [edge.aType, edge.bType].sort().join('|');
    const color = edgeColors[typeKey] || '#c4b89a';
    const hasA2B = edge.aToB && edge.aToB.trim();
    const hasB2A = edge.bToA && edge.bToA.trim();
    const edgeDimmed = state._graphHoveredNode && (!state._graphRelatedNodes || !state._graphRelatedNodes.has(edge.a) || !state._graphRelatedNodes.has(edge.b));
    if (edgeDimmed) ctx.globalAlpha = 0.12;
    if (hasA2B && hasB2A) {
      if (edge.aToB.trim() === edge.bToA.trim()) {
        _drawLine(ctx, posA.x, posA.y, posB.x, posB.y, color, edge.aToB.trim());
      } else {
        _drawArrow(ctx, posA.x, posA.y, posB.x, posB.y, color, edge.aToB.trim(), 8);
        _drawArrow(ctx, posB.x, posB.y, posA.x, posA.y, color, edge.bToA.trim(), 8);
      }
    } else if (hasA2B) {
      _drawArrow(ctx, posA.x, posA.y, posB.x, posB.y, color, edge.aToB.trim(), 0);
    } else if (hasB2A) {
      _drawArrow(ctx, posB.x, posB.y, posA.x, posA.y, color, edge.bToA.trim(), 0);
    } else {
      _drawLine(ctx, posA.x, posA.y, posB.x, posB.y, color, '');
    }
    if (edgeDimmed) ctx.globalAlpha = 1;
  });
  const avatarPromises = entities.map(e => _loadAvatarForGraph(e.typeKey, e.id));
  const avatarImages = await Promise.all(avatarPromises);
  entities.forEach((e, idx) => {
    const pos = positions[e.id]; if (!pos) return;
    const color = typeColors[e.typeKey] || '#888888';
    const avatarImg = avatarImages[idx];
    const isHovered = state._graphHoveredNode === e.id;
    const isSelected = state._graphSelectedNode === e.id;
    const isRelated = state._graphSelectedNode && state._graphRelatedNodes && state._graphRelatedNodes.has(e.id);
    const dimmed = state._graphSelectedNode && !isSelected && !isRelated;
    const nodeAlpha = dimmed ? 0.25 : 1;
    ctx.save();
    ctx.globalAlpha = nodeAlpha;
    const cardW = 56, cardH = 56, cardR = 14;
    const cardX = pos.x - cardW/2, cardY = pos.y - cardH/2;
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = isSelected ? '#b4a0d4' : (isHovered ? '#c4bdd4' : '#e2e5ea');
    ctx.lineWidth = isSelected ? 2 : (isHovered ? 1.5 : 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.clip();
    if (avatarImg) {
      const size = 40;
      const aspect = avatarImg.naturalWidth / avatarImg.naturalHeight;
      let dw, dh, dx, dy;
      if (aspect > 1) { dh = size; dw = size * aspect; dx = pos.x - dw/2; dy = pos.y - dh/2; }
      else { dw = size; dh = size / aspect; dx = pos.x - dw/2; dy = pos.y - dh/2; }
      ctx.drawImage(avatarImg, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = color; ctx.font = 'bold 14px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.icon||'●', pos.x, pos.y);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = nodeAlpha;
    ctx.fillStyle = '#3d3929'; ctx.font = '11px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(e.name, pos.x, pos.y + cardH/2 + 4);
    ctx.restore();
  });
  ctx.restore();

  const legend = _getGraphEntityTypes().filter(t => entities.some(e=>e.typeKey===t.key));
  if (legend.length > 1) {
    const legendH = legend.length * 18 + 8;
    ctx.fillStyle = 'rgba(247,248,250,0.9)';
    ctx.fillRect(4, 4, 90, legendH);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 90, legendH);
    legend.forEach((t,i) => {
      const lx = 12, ly = 16 + i*18;
      ctx.fillStyle = typeColors[t.key] || '#000000';
      ctx.fillRect(lx, ly-8, 10, 10);
      ctx.fillStyle = '#777169'; ctx.font = '11px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(t.icon+' '+t.label, lx+14, ly);
    });
  }
}

// ---- 入场动画 ----
function _playGraphEntrance() {
  const canvas = $('#relations-canvas');
  if (!canvas) return;
  const positions = _getGraphPositions();
  const ids = Object.keys(positions);
  if (ids.length === 0) return;
  const savedPositions = {};
  ids.forEach(id => { savedPositions[id] = { x: positions[id].x, y: positions[id].y }; });
  const cx = canvas.width / 2, cy = canvas.height / 2;
  ids.forEach(id => { positions[id].x = cx; positions[id].y = cy; });
  let progress = 0;
  const step = () => {
    progress += 0.04;
    if (progress >= 1) {
      ids.forEach(id => { positions[id].x = savedPositions[id].x; positions[id].y = savedPositions[id].y; });
      drawRelationsGraph();
      return;
    }
    const ease = 1 - Math.pow(1 - progress, 3);
    ids.forEach(id => {
      positions[id].x = cx + (savedPositions[id].x - cx) * ease;
      positions[id].y = cy + (savedPositions[id].y - cy) * ease;
    });
    drawRelationsGraph();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---- 图谱控制 ----
function resetGraphLayout() {
  delete state._graphPositions;
  state._graphViewport = { zoom: 1, panX: 0, panY: 0 };
  drawRelationsGraph();
}

function graphZoom(delta, centerX, centerY) {
  const vp = _getGraphViewport();
  const oldZoom = vp.zoom;
  vp.zoom = Math.max(0.15, Math.min(4, vp.zoom + delta));
  if (centerX !== undefined && centerY !== undefined) {
    vp.panX = centerX - (centerX - vp.panX) * (vp.zoom / oldZoom);
    vp.panY = centerY - (centerY - vp.panY) * (vp.zoom / oldZoom);
  }
  drawRelationsGraph();
  const zoomLabel = document.querySelector('.flex-gap.mb-8 span[style*="min-width"]');
  if (zoomLabel) zoomLabel.textContent = Math.round(vp.zoom * 100) + '%';
}

async function saveCurrentGraphToResources() {
  const subjects = _getSelectedGraphSubjects();
  if (subjects.length === 0) { showToast('请先勾选主体'); return; }
  const entities = subjects.map(sid => {
    const [typeKey, id] = sid.split(':');
    return _getEntityById(id) || {name:'未知'};
  });
  const names = entities.map(e=>e.name).join('、');
  const title = await customPrompt('关系图标题', names + ' 关系图');
  if (!title) return;
  const note = await customPrompt('备注（可选）', '');
  const canvas = $('#relations-canvas');
  const imageData = canvas ? canvas.toDataURL('image/png') : '';
  saveRelationGraphAsResource(subjects, title, note || '', imageData);
}