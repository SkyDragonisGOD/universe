// ============================================================
// 架空地图 — 噪声生成与地形渲染
// ============================================================

function _mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function _createSimplexNoise(seed) {
  const rng = _mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad2 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  function noise2D(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { const gi = perm[ii + perm[jj]] & 7; t0 *= t0; n0 = t0 * t0 * (grad2[gi][0] * x0 + grad2[gi][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { const gi = perm[ii + i1 + perm[jj + j1]] & 7; t1 *= t1; n1 = t1 * t1 * (grad2[gi][0] * x1 + grad2[gi][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { const gi = perm[ii + 1 + perm[jj + 1]] & 7; t2 *= t2; n2 = t2 * t2 * (grad2[gi][0] * x2 + grad2[gi][1] * y2); }
    return 70 * (n0 + n1 + n2);
  }

  function fbm(x, y, octaves) {
    let val = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      val += amp * noise2D(x * freq, y * freq);
      maxAmp += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / maxAmp;
  }

  return { noise2D, fbm };
}

function _regenerateTerrain() {
  const md = _ensureMapData();
  if (!md.seed) { _terrainCache = null; return null; }

  const noise = _createSimplexNoise(md.seed);
  const scale = 0.005;
  const seaLevel = 0.0;
  const edgeFadeX = _MAP_W * 0.12;
  const edgeFadeY = _MAP_H * 0.15;

  const heightmap = new Float32Array(_MAP_W * _MAP_H);
  for (let y = 0; y < _MAP_H; y++) {
    for (let x = 0; x < _MAP_W; x++) {
      let h = noise.fbm(x * scale, y * scale, 6);
      const fx = Math.min(x, _MAP_W - 1 - x) / edgeFadeX;
      const fy = Math.min(y, _MAP_H - 1 - y) / edgeFadeY;
      const fade = Math.min(1, fx) * Math.min(1, fy);
      h = h * fade - 0.18 * (1 - fade);
      heightmap[y * _MAP_W + x] = h;
    }
  }

  const landMask = new Uint8Array(_MAP_W * _MAP_H);
  for (let i = 0; i < _MAP_W * _MAP_H; i++) {
    landMask[i] = heightmap[i] > seaLevel ? 1 : 0;
  }

  const componentMap = new Int16Array(_MAP_W * _MAP_H);
  componentMap.fill(-1);
  const components = [];
  const visited = new Uint8Array(_MAP_W * _MAP_H);

  for (let y = 0; y < _MAP_H; y++) {
    for (let x = 0; x < _MAP_W; x++) {
      const idx = y * _MAP_W + x;
      if (!landMask[idx] || visited[idx]) continue;
      const compId = components.length;
      const pixels = [];
      const queue = [idx];
      let head = 0;
      visited[idx] = 1;
      while (head < queue.length) {
        const ci = queue[head++];
        const cx = ci % _MAP_W;
        const cy = (ci - cx) / _MAP_W;
        pixels.push(ci);
        componentMap[ci] = compId;
        if (cx > 0 && landMask[ci - 1] && !visited[ci - 1]) { visited[ci - 1] = 1; queue.push(ci - 1); }
        if (cx < _MAP_W - 1 && landMask[ci + 1] && !visited[ci + 1]) { visited[ci + 1] = 1; queue.push(ci + 1); }
        if (cy > 0 && landMask[ci - _MAP_W] && !visited[ci - _MAP_W]) { visited[ci - _MAP_W] = 1; queue.push(ci - _MAP_W); }
        if (cy < _MAP_H - 1 && landMask[ci + _MAP_W] && !visited[ci + _MAP_W]) { visited[ci + _MAP_W] = 1; queue.push(ci + _MAP_W); }
      }
      components.push({ id: compId, pixels, area: pixels.length });
    }
  }

  const minArea = 300;
  const significant = components.filter(c => c.area >= minArea);
  const count = md.genCount || 12;
  const seeds = [];

  if (significant.length > 0) {
    const sigTotal = significant.reduce((s, c) => s + c.area, 0);
    const rawAlloc = significant.map(c => count * c.area / sigTotal);
    const alloc = rawAlloc.map(a => Math.floor(a));
    let totalAlloc = alloc.reduce((s, a) => s + a, 0);
    const frac = rawAlloc.map((a, i) => ({ i, f: a - alloc[i] }));
    frac.sort((a, b) => b.f - a.f);
    for (let k = 0; k < count - totalAlloc && k < frac.length; k++) {
      alloc[frac[k].i]++;
    }

    for (let ci = 0; ci < significant.length; ci++) {
      const comp = significant[ci];
      const terrCount = alloc[ci];
      if (terrCount <= 0) continue;

      const compRng = _mulberry32(md.seed + 7919 + ci * 1337);
      let placed = 0, attempts = 0;
      while (placed < terrCount && attempts < terrCount * 1000) {
        const randIdx = Math.floor(compRng() * comp.pixels.length);
        const pi = comp.pixels[randIdx];
        const px = pi % _MAP_W;
        const py = (pi - px) / _MAP_W;
        let tooClose = false;
        for (const s of seeds) {
          if (s.compId !== comp.id) continue;
          const dx = px - s.x, dy = py - s.y;
          if (dx * dx + dy * dy < 1600) { tooClose = true; break; }
        }
        if (!tooClose) {
          seeds.push({ x: px, y: py, compId: comp.id });
          placed++;
        }
        attempts++;
      }
    }
  }

  const warpNoise = _createSimplexNoise(md.seed + 42);
  const warpScale = 0.01;
  const warpStrength = 22;

  const territoryMap = new Int16Array(_MAP_W * _MAP_H);
  territoryMap.fill(-1);

  for (let y = 0; y < _MAP_H; y++) {
    for (let x = 0; x < _MAP_W; x++) {
      const idx = y * _MAP_W + x;
      if (!landMask[idx]) continue;
      const compId = componentMap[idx];
      const warpX = warpNoise.noise2D(x * warpScale, y * warpScale + 500) * warpStrength;
      const warpY = warpNoise.noise2D(x * warpScale + 500, y * warpScale) * warpStrength;
      const wx = x + warpX;
      const wy = y + warpY;
      let minD = Infinity, closest = -1;
      for (let i = 0; i < seeds.length; i++) {
        if (seeds[i].compId !== compId) continue;
        const dx = wx - seeds[i].x, dy = wy - seeds[i].y;
        const d = dx * dx + dy * dy;
        if (d < minD) { minD = d; closest = i; }
      }
      territoryMap[idx] = closest;
    }
  }

  _terrainCache = { heightmap, territoryMap, seeds, landMask, componentMap };
  return _terrainCache;
}

function _getTerrainAt(worldX, worldY) {
  if (!_terrainCache) return null;
  const x = Math.round(worldX), y = Math.round(worldY);
  if (x < 0 || x >= _MAP_W || y < 0 || y >= _MAP_H) return null;
  const idx = y * _MAP_W + x;
  const ti = _terrainCache.territoryMap[idx];
  if (ti < 0 || ti >= _ensureMapData().territories.length) return null;
  return _ensureMapData().territories[ti];
}

function _renderTerrainCanvas() {
  const md = _ensureMapData();
  const terrain = _terrainCache;
  if (!terrain) return null;

  const { heightmap, territoryMap, landMask } = terrain;
  const canvas = document.createElement('canvas');
  canvas.width = _MAP_W;
  canvas.height = _MAP_H;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(_MAP_W, _MAP_H);
  const d = imgData.data;
  const seaLevel = 0.0;
  const landR = 218, landG = 202, landB = 172;

  for (let y = 0; y < _MAP_H; y++) {
    for (let x = 0; x < _MAP_W; x++) {
      const idx = y * _MAP_W + x;
      const h = heightmap[idx];
      const ti = territoryMap[idx];
      const px = idx * 4;

      if (h <= seaLevel) {
        const depth = Math.min(1, (seaLevel - h) * 2.5);
        d[px] = Math.floor(100 + 80 * (1 - depth));
        d[px + 1] = Math.floor(160 + 60 * (1 - depth));
        d[px + 2] = Math.floor(220 + 30 * (1 - depth));
        d[px + 3] = 255;
      } else {
        let r = landR, g = landG, b = landB;
        if (ti >= 0 && ti < md.territories.length) {
          const t = md.territories[ti];
          const hexColor = parseInt(t.color.replace('#', ''), 16);
          const tr = (hexColor >> 16) & 0xFF;
          const tg = (hexColor >> 8) & 0xFF;
          const tb = hexColor & 0xFF;
          const blend = _mapSelectedId === t.id ? 0.5 : 0.32;
          r = Math.floor(r * (1 - blend) + tr * blend);
          g = Math.floor(g * (1 - blend) + tg * blend);
          b = Math.floor(b * (1 - blend) + tb * blend);
        }
        d[px] = r;
        d[px + 1] = g;
        d[px + 2] = b;
        d[px + 3] = 255;
      }
    }
  }

  for (let y = 0; y < _MAP_H - 1; y++) {
    for (let x = 0; x < _MAP_W - 1; x++) {
      const idx = y * _MAP_W + x;
      const ti = territoryMap[idx];
      if (ti < 0) continue;
      const right = territoryMap[idx + 1];
      const down = territoryMap[idx + _MAP_W];
      if ((right >= 0 && ti !== right) || (down >= 0 && ti !== down)) {
        const px = idx * 4;
        const isSelected = md.territories[ti] && md.territories[ti].id === _mapSelectedId;
        if (isSelected) {
          d[px] = 200; d[px + 1] = 55; d[px + 2] = 55;
        } else {
          d[px] = 88; d[px + 1] = 74; d[px + 2] = 58;
        }
      }
    }
  }

  for (let y = 1; y < _MAP_H - 1; y++) {
    for (let x = 1; x < _MAP_W - 1; x++) {
      const idx = y * _MAP_W + x;
      if (!landMask[idx]) continue;
      const isCoast =
        !landMask[idx - 1] || !landMask[idx + 1] ||
        !landMask[idx - _MAP_W] || !landMask[idx + _MAP_W];
      if (isCoast) {
        const px = idx * 4;
        d[px] = 72; d[px + 1] = 88; d[px + 2] = 108;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}