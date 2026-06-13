// ============================================================
// map.js — Ізометрична карта (Heroes III стиль)
// Підключається як <script src="map.js"></script> після основного скрипта
// Глобальні змінні гри (mapTiles, storage, epoch, addLog, etc.)
// доступні напряму з основного файлу.
// ============================================================

// --- КОНСТАНТИ ---
const ISO = {
  TW: 64,   // ширина тайлу (px)
  TH: 32,   // висота тайлу (px)
  ROWS: 20,
  COLS: 28,
  BLDH: 42, // висота будівлі
};

// --- СТАН КАМЕРИ ---
let isoOffset = { x: 0, y: 0 };
let isoDrag   = { active: false, sx: 0, sy: 0, ox: 0, oy: 0 };
let isoHover  = { col: -1, row: -1 };
let isoCtx, isoEl;
let _isoDirty = true;

// ============================================================
// КОЛЬОРОВІ ПАЛІТРИ ТЕРЕНІВ (Heroes III дух)
// ============================================================
const ISO_TERRAIN = {
  grass:  { lo:'#3a6b20', hi:'#4d8f2a', edge:'#2a4f15', detail:'#5aaa35' },
  forest: { lo:'#1c4a10', hi:'#255e14', edge:'#122e09', detail:'#3a7a20' },
  water:  { lo:'#1a3d6e', hi:'#2358a0', edge:'#0e2645', detail:'#3a7abf' },
  stone:  { lo:'#4a4e58', hi:'#5e636f', edge:'#2e3138', detail:'#7a7f8a' },
  sand:   { lo:'#9a8030', hi:'#b89840', edge:'#6a5820', detail:'#d4b055' },
  dirt:   { lo:'#6a4a20', hi:'#826035', edge:'#4a3010', detail:'#9a7040' },
  snow:   { lo:'#9aaecc', hi:'#bdd0e8', edge:'#6a7e98', detail:'#ddeeff' },
  swamp:  { lo:'#2a4030', hi:'#38563e', edge:'#162218', detail:'#4a7050' },
};

// ============================================================
// ПАЛІТРИ БУДІВЕЛЬ ПО ЕПОХАХ
// ============================================================
const ISO_BLDCOL = {
  1: { wall1:'#c8a870', wall2:'#a07848', roof1:'#8b4513', roof2:'#6a3010', win:'#ffe080', accent:'#d4a060' },  // дерев'яне
  2: { wall1:'#b8c090', wall2:'#8a9060', roof1:'#556030', roof2:'#38401e', win:'#d8e890', accent:'#a0b050' },  // дерево+камінь
  3: { wall1:'#c89060', wall2:'#a06838', roof1:'#c87830', roof2:'#a05020', win:'#ffd060', accent:'#e8a040' },  // середньовіччя
  4: { wall1:'#a05050', wall2:'#703030', roof1:'#7a2020', roof2:'#501010', win:'#ff8040', accent:'#c04030' },  // замок
  5: { wall1:'#6868a0', wall2:'#484878', roof1:'#383860', roof2:'#202040', win:'#a0b0ff', accent:'#8090e0' },  // магія
  6: { wall1:'#907080', wall2:'#604858', roof1:'#503040', roof2:'#301820', win:'#ffb0d0', accent:'#c080a0' },  // містика
  7: { wall1:'#b09060', wall2:'#806838', roof1:'#a06820', roof2:'#704810', win:'#ffe8a0', accent:'#d0a050' },  // ренесанс
  8: { wall1:'#484848', wall2:'#282828', roof1:'#202020', roof2:'#101010', win:'#ff6000', accent:'#cc4000' },  // індустріал
  9: { wall1:'#305840', wall2:'#1c3828', roof1:'#182818', roof2:'#0c1810', win:'#40ff80', accent:'#20c050' },  // біо
 10: { wall1:'#283858', wall2:'#181c38', roof1:'#101828', roof2:'#080c18', win:'#40c0ff', accent:'#2090d0' },  // кіберпанк
 11: { wall1:'#1a1a2a', wall2:'#101018', roof1:'#0c0c18', roof2:'#060608', win:'#00e5ff', accent:'#0090b0' },  // синтез
 12: { wall1:'#120c1a', wall2:'#080810', roof1:'#060610', roof2:'#020206', win:'#b040ff', accent:'#7020c0' },  // трансцендент
};

// ============================================================
// КОНВЕРТАЦІЯ: ТАЙЛ → ЕКРАН (ізометрія)
// ============================================================
function isoToScreen(col, row) {
  return {
    x: isoOffset.x + (col - row) * (ISO.TW / 2),
    y: isoOffset.y + (col + row) * (ISO.TH / 2),
  };
}

function screenToIso(sx, sy) {
  let rx = sx - isoOffset.x;
  let ry = sy - isoOffset.y;
  let col = (rx / (ISO.TW / 2) + ry / (ISO.TH / 2)) / 2;
  let row = (ry / (ISO.TH / 2) - rx / (ISO.TW / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

// ============================================================
// МАЛЮВАННЯ ІЗОМЕТРИЧНОГО ТАЙЛУ (ромб)
// ============================================================
function drawIsoTile(col, row, tile) {
  let { x, y } = isoToScreen(col, row);
  let T = ISO_TERRAIN[tile.type] || ISO_TERRAIN.grass;
  let tw = ISO.TW, th = ISO.TH;
  let isHov = (col === isoHover.col && row === isoHover.row);

  // Ромб — верхня грань тайлу
  isoCtx.beginPath();
  isoCtx.moveTo(x,          y);           // верх
  isoCtx.lineTo(x + tw / 2, y + th / 2); // право
  isoCtx.lineTo(x,          y + th);      // низ
  isoCtx.lineTo(x - tw / 2, y + th / 2); // ліво
  isoCtx.closePath();

  // Градієнт верхньої грані
  let grd = isoCtx.createLinearGradient(x - tw/2, y, x + tw/2, y + th);
  grd.addColorStop(0, isHov ? T.detail : T.hi);
  grd.addColorStop(1, isHov ? T.hi     : T.lo);
  isoCtx.fillStyle = grd;
  isoCtx.fill();

  // Обводка
  isoCtx.strokeStyle = isHov ? 'rgba(232,184,75,0.9)' : 'rgba(0,0,0,0.3)';
  isoCtx.lineWidth   = isHov ? 1.5 : 0.5;
  isoCtx.stroke();

  // Деталі теренів
  drawTerrainDetail(col, row, tile, x, y, T);
}

// ============================================================
// ДЕТАЛІ ТЕРЕНІВ
// ============================================================
function drawTerrainDetail(col, row, tile, x, y, T) {
  let v = tile.variation || 0;
  isoCtx.save();
  // Clip до ромбу щоб деталі не вилазили
  isoCtx.beginPath();
  isoCtx.moveTo(x, y);
  isoCtx.lineTo(x + ISO.TW/2, y + ISO.TH/2);
  isoCtx.lineTo(x,            y + ISO.TH);
  isoCtx.lineTo(x - ISO.TW/2, y + ISO.TH/2);
  isoCtx.closePath();
  isoCtx.clip();

  if (tile.type === 'forest' && !tile.building) {
    // Маленькі дерева
    for (let i = 0; i < 3; i++) {
      let tx = x - 12 + i * 12 + (v % 3) * 2;
      let ty = y + 4 + i * 3;
      // Тінь дерева
      isoCtx.fillStyle = 'rgba(0,0,0,0.25)';
      isoCtx.beginPath();
      isoCtx.ellipse(tx + 3, ty + 14, 5, 2, 0, 0, Math.PI*2);
      isoCtx.fill();
      // Стовбур
      isoCtx.fillStyle = '#5a3010';
      isoCtx.fillRect(tx + 1, ty + 10, 2, 6);
      // Крона (3 шари)
      [['#1a5808', 7], ['#2a7010', 6], ['#3a8818', 4]].forEach(([clr, r], li) => {
        isoCtx.fillStyle = clr;
        isoCtx.beginPath();
        isoCtx.moveTo(tx + 2, ty - li * 3);
        isoCtx.lineTo(tx + 2 + r, ty + 8 - li * 3);
        isoCtx.lineTo(tx + 2 - r, ty + 8 - li * 3);
        isoCtx.closePath();
        isoCtx.fill();
      });
    }
  } else if (tile.type === 'water') {
    // Анімовані хвилі
    let t = Date.now() / 900;
    isoCtx.strokeStyle = 'rgba(100,180,255,0.4)';
    isoCtx.lineWidth = 1;
    for (let wi = 0; wi < 2; wi++) {
      isoCtx.beginPath();
      let wy = y + 8 + wi * 8;
      isoCtx.moveTo(x - 16, wy + Math.sin(t + wi) * 2);
      isoCtx.bezierCurveTo(
        x - 8,  wy - 2 + Math.sin(t + wi + 1) * 2,
        x + 8,  wy + 2 + Math.sin(t + wi + 2) * 2,
        x + 16, wy + Math.sin(t + wi + 3) * 2
      );
      isoCtx.stroke();
    }
    // Відблиск
    isoCtx.fillStyle = 'rgba(180,220,255,0.15)';
    isoCtx.beginPath();
    isoCtx.ellipse(x, y + ISO.TH/2, 10, 4, -0.3, 0, Math.PI*2);
    isoCtx.fill();
  } else if (tile.type === 'stone') {
    // Каміння
    [[x-8, y+8, 5, 3], [x+5, y+12, 4, 2], [x-3, y+14, 6, 3]].forEach(([rx,ry,rw,rh]) => {
      isoCtx.fillStyle = T.detail;
      isoCtx.beginPath();
      isoCtx.ellipse(rx, ry, rw, rh, 0.2, 0, Math.PI*2);
      isoCtx.fill();
      isoCtx.strokeStyle = T.edge;
      isoCtx.lineWidth = 0.5;
      isoCtx.stroke();
    });
  } else if (tile.type === 'sand') {
    // Піщані рябини
    isoCtx.strokeStyle = T.detail + '55';
    isoCtx.lineWidth = 0.5;
    for (let si = 0; si < 3; si++) {
      isoCtx.beginPath();
      isoCtx.ellipse(x - 5 + si * 5, y + 8 + si * 3, 7, 2, 0.1, 0, Math.PI*2);
      isoCtx.stroke();
    }
  } else if (tile.type === 'snow') {
    // Сніжинки
    for (let si = 0; si < 4; si++) {
      let sx2 = x - 12 + si * 8 + (v % 2) * 3;
      let sy2 = y + 5 + (si % 2) * 5;
      isoCtx.fillStyle = 'rgba(255,255,255,0.7)';
      isoCtx.fillRect(sx2, sy2, 2, 2);
    }
  } else if (tile.type === 'grass' && v === 0) {
    // Трава з квіточками
    isoCtx.fillStyle = '#7ac840';
    [[x-10,y+8],[x+6,y+12],[x-2,y+6]].forEach(([fx,fy]) => {
      isoCtx.fillRect(fx, fy, 1, 3);
      isoCtx.fillStyle = '#ffee50';
      isoCtx.fillRect(fx-1, fy-1, 3, 2);
      isoCtx.fillStyle = '#7ac840';
    });
  }

  isoCtx.restore();
}

// ============================================================
// МАЛЮВАННЯ БУДІВЛІ (ізометрична "кубічна" будівля)
// ============================================================
function drawIsoBuilding(col, row, bdata) {
  let { x, y } = isoToScreen(col, row);
  let ep  = Math.min(bdata.epoch || 1, 12);
  let bc  = ISO_BLDCOL[ep] || ISO_BLDCOL[1];
  let lvl = bdata.lvl || 1;
  let isAC = bdata.autoClicker;

  // Розміри будівлі залежать від рівня
  let scale = 0.7 + Math.min(lvl - 1, 9) * 0.03;
  let bw = ISO.TW * 0.55 * scale;
  let bh = ISO.BLDH * scale;
  let tw = ISO.TW, th = ISO.TH;

  // Перевіряємо тип будівлі щоб малювати специфічний вигляд
  let name = (bdata.name || '').toLowerCase();
  let isCity   = name.includes('місто') || name.includes('табір') || name.includes('ратуш');
  let isFort   = name.includes('форт') || name.includes('вежа') || name.includes('замок') || name.includes('оборон');
  let isWall   = name.includes('стін') || name.includes('мур') || name.includes('частокіл');
  let isMine   = name.includes('шахт') || name.includes('руд') || name.includes('кам\'яр');
  let isFarm   = name.includes('ферм') || name.includes('поле') || name.includes('пасовищ');
  let isChurch = name.includes('храм') || name.includes('церк') || name.includes('собор');

  if (isWall)   { drawWallBuilding(x, y, bc, lvl, isAC); return; }
  if (isFort)   { drawFortBuilding(x, y, bc, bw, bh, lvl, isAC); return; }
  if (isCity)   { drawCityBuilding(x, y, bc, lvl, isAC, ep); return; }
  if (isChurch) { drawChurchBuilding(x, y, bc, bw, bh, lvl, isAC); return; }
  if (isMine)   { drawMineBuilding(x, y, bc, bw, bh, lvl, isAC); return; }
  if (isFarm)   { drawFarmBuilding(x, y, bc, bw, bh, lvl, isAC); return; }

  // Стандартна будівля
  drawStandardBuilding(x, y, bc, bw, bh, lvl, isAC, ep);
}

// --- СТАНДАРТНА БУДІВЛЯ ---
function drawStandardBuilding(x, y, bc, bw, bh, lvl, isAC, ep) {
  let tw = ISO.TW, th = ISO.TH;

  // Тінь
  isoCtx.fillStyle = 'rgba(0,0,0,0.3)';
  isoCtx.beginPath();
  isoCtx.ellipse(x, y + th * 0.9, bw * 0.6, th * 0.25, 0, 0, Math.PI * 2);
  isoCtx.fill();

  // AC glow halo
  if (isAC) {
    isoCtx.shadowColor = 'rgba(0,229,255,0.7)';
    isoCtx.shadowBlur  = 18;
  }

  // Ліва бокова грань
  isoCtx.fillStyle = shadeColor(bc.wall2, -15);
  isoCtx.beginPath();
  isoCtx.moveTo(x - bw/2, y + th*0.4);
  isoCtx.lineTo(x - bw/2, y + th*0.4 - bh);
  isoCtx.lineTo(x,        y + th*0.15 - bh);
  isoCtx.lineTo(x,        y + th*0.15);
  isoCtx.closePath();
  isoCtx.fill();

  // Права бокова грань
  isoCtx.fillStyle = bc.wall2;
  isoCtx.beginPath();
  isoCtx.moveTo(x,        y + th*0.15);
  isoCtx.lineTo(x,        y + th*0.15 - bh);
  isoCtx.lineTo(x + bw/2, y + th*0.4 - bh);
  isoCtx.lineTo(x + bw/2, y + th*0.4);
  isoCtx.closePath();
  isoCtx.fill();

  // Дах — ромб зверху
  isoCtx.fillStyle = bc.roof1;
  isoCtx.beginPath();
  isoCtx.moveTo(x,        y - bh);
  isoCtx.lineTo(x + bw/2, y + th*0.4 - bh);
  isoCtx.lineTo(x,        y + th*0.55 - bh);
  isoCtx.lineTo(x - bw/2, y + th*0.4 - bh);
  isoCtx.closePath();
  isoCtx.fill();

  // Дах — гребінь
  isoCtx.strokeStyle = bc.roof2;
  isoCtx.lineWidth = 1;
  isoCtx.beginPath();
  isoCtx.moveTo(x - bw/2, y + th*0.4 - bh);
  isoCtx.lineTo(x,        y - bh);
  isoCtx.lineTo(x + bw/2, y + th*0.4 - bh);
  isoCtx.stroke();

  // Вікна (права грань)
  if (ep >= 2) {
    isoCtx.fillStyle = isAC ? '#00e5ff' : bc.win;
    isoCtx.fillRect(x + bw*0.1, y + th*0.15 - bh*0.55, bw*0.15, bh*0.12);
    if (ep >= 4)
      isoCtx.fillRect(x + bw*0.3, y + th*0.15 - bh*0.55, bw*0.15, bh*0.12);
  }
  // Двері (права грань)
  isoCtx.fillStyle = 'rgba(0,0,0,0.5)';
  isoCtx.fillRect(x + bw*0.15, y + th*0.4 - bh*0.28, bw*0.18, bh*0.26);

  // Дим
  if (ISO_BLDCOL[Math.min(ep,12)]?.wall1 && ep >= 3) {
    drawSmoke(x, y - bh - 4);
  }

  isoCtx.shadowBlur = 0;

  // Рівень
  if (lvl > 1) {
    isoCtx.fillStyle = isAC ? '#00e5ff' : '#e8b84b';
    isoCtx.font = 'bold 8px monospace';
    isoCtx.textAlign = 'center';
    isoCtx.fillText('L' + lvl, x + bw/2 - 2, y + th*0.4 + 9);
  }
}

// --- СТІНА/ЧАСТоКІЛ ---
function drawWallBuilding(x, y, bc, lvl, isAC) {
  let tw = ISO.TW, th = ISO.TH;
  let h = 14 + lvl * 3;

  // Підставка
  isoCtx.fillStyle = bc.wall2;
  isoCtx.beginPath();
  isoCtx.moveTo(x,          y - h);
  isoCtx.lineTo(x + tw*0.5, y + th*0.5 - h);
  isoCtx.lineTo(x + tw*0.5, y + th*0.5);
  isoCtx.lineTo(x,          y);
  isoCtx.closePath();
  isoCtx.fill();

  isoCtx.fillStyle = shadeColor(bc.wall1, -10);
  isoCtx.beginPath();
  isoCtx.moveTo(x - tw*0.5, y + th*0.5 - h);
  isoCtx.lineTo(x,          y - h);
  isoCtx.lineTo(x,          y);
  isoCtx.lineTo(x - tw*0.5, y + th*0.5);
  isoCtx.closePath();
  isoCtx.fill();

  // Зубці
  let teeth = 5;
  for (let i = 0; i < teeth; i++) {
    let tx2 = x - tw*0.4 + i * (tw*0.8 / (teeth-1));
    let ty2 = y - h - 4 + i * 1.5;
    isoCtx.fillStyle = bc.wall1;
    isoCtx.fillRect(tx2 - 1.5, ty2 - 4, 4, 6);
  }
  // Верхня крайка
  isoCtx.strokeStyle = bc.roof1;
  isoCtx.lineWidth = 1.5;
  isoCtx.beginPath();
  isoCtx.moveTo(x - tw*0.5, y + th*0.5 - h);
  isoCtx.lineTo(x,          y - h);
  isoCtx.lineTo(x + tw*0.5, y + th*0.5 - h);
  isoCtx.stroke();
}

// --- ФОРТ / ВЕЖА ---
function drawFortBuilding(x, y, bc, bw, bh, lvl, isAC) {
  let tw = ISO.TW, th = ISO.TH;
  let h  = bh * 1.5;
  let r  = bw * 0.55;

  // Тінь
  isoCtx.fillStyle = 'rgba(0,0,0,0.35)';
  isoCtx.beginPath();
  isoCtx.ellipse(x, y + th*0.7, r*0.7, th*0.3, 0, 0, Math.PI*2);
  isoCtx.fill();

  if (isAC) { isoCtx.shadowColor = 'rgba(0,229,255,0.8)'; isoCtx.shadowBlur = 22; }

  // Башта — ліва грань
  isoCtx.fillStyle = shadeColor(bc.wall2, -20);
  isoCtx.beginPath();
  isoCtx.moveTo(x - r/2, y + th*0.4);
  isoCtx.lineTo(x - r/2, y + th*0.4 - h);
  isoCtx.lineTo(x,       y + th*0.1 - h);
  isoCtx.lineTo(x,       y + th*0.1);
  isoCtx.closePath();
  isoCtx.fill();

  // Башта — права грань
  isoCtx.fillStyle = bc.wall2;
  isoCtx.beginPath();
  isoCtx.moveTo(x,       y + th*0.1);
  isoCtx.lineTo(x,       y + th*0.1 - h);
  isoCtx.lineTo(x + r/2, y + th*0.4 - h);
  isoCtx.lineTo(x + r/2, y + th*0.4);
  isoCtx.closePath();
  isoCtx.fill();

  // Конічний дах
  isoCtx.fillStyle = bc.roof1;
  isoCtx.beginPath();
  isoCtx.moveTo(x,       y + th*0.1 - h - r*0.7);
  isoCtx.lineTo(x + r/2, y + th*0.4 - h);
  isoCtx.lineTo(x,       y + th*0.55 - h);
  isoCtx.lineTo(x - r/2, y + th*0.4 - h);
  isoCtx.closePath();
  isoCtx.fill();

  // Шпиль
  isoCtx.strokeStyle = bc.roof2;
  isoCtx.lineWidth = 1.5;
  isoCtx.beginPath();
  isoCtx.moveTo(x, y + th*0.1 - h - r*0.7);
  isoCtx.lineTo(x, y + th*0.1 - h - r*0.7 - 10);
  isoCtx.stroke();
  // Прапор
  isoCtx.fillStyle = '#cc2020';
  isoCtx.beginPath();
  isoCtx.moveTo(x, y + th*0.1 - h - r*0.7 - 10);
  isoCtx.lineTo(x + 8, y + th*0.1 - h - r*0.7 - 7);
  isoCtx.lineTo(x,     y + th*0.1 - h - r*0.7 - 4);
  isoCtx.closePath();
  isoCtx.fill();

  // Зубці навколо верху башти
  for (let i = 0; i < 6; i++) {
    let ang = (i / 6) * Math.PI * 2;
    let tx2 = x + Math.cos(ang) * r * 0.45;
    let ty2 = y + th*0.25 - h + Math.sin(ang) * th * 0.2;
    isoCtx.fillStyle = bc.wall1;
    isoCtx.fillRect(tx2 - 1.5, ty2 - 5, 3.5, 6);
  }

  // Бійниці
  isoCtx.fillStyle = 'rgba(0,0,0,0.6)';
  isoCtx.fillRect(x + r*0.05, y + th*0.1 - h*0.6, r*0.12, h*0.1);
  isoCtx.fillRect(x + r*0.25, y + th*0.1 - h*0.45, r*0.12, h*0.1);

  isoCtx.shadowBlur = 0;
  if (lvl > 1) {
    isoCtx.fillStyle = '#e8b84b';
    isoCtx.font = 'bold 8px monospace';
    isoCtx.textAlign = 'center';
    isoCtx.fillText('L' + lvl, x + r/2 + 2, y + th*0.4 + 9);
  }
}

// --- ГОЛОВНЕ МІСТО ---
function drawCityBuilding(x, y, bc, lvl, isAC, ep) {
  let tw = ISO.TW, th = ISO.TH;
  let scale = 1.2 + Math.min(lvl-1, 8) * 0.05;
  let bw = ISO.TW * 0.7 * scale;
  let bh = ISO.BLDH * 1.4 * scale;

  if (isAC) { isoCtx.shadowColor = 'rgba(232,184,75,0.9)'; isoCtx.shadowBlur = 28; }

  // Основний корпус — ліво
  isoCtx.fillStyle = shadeColor(bc.wall2, -10);
  isoCtx.beginPath();
  isoCtx.moveTo(x - bw/2, y + th*0.4);
  isoCtx.lineTo(x - bw/2, y + th*0.4 - bh);
  isoCtx.lineTo(x,        y + th*0.1 - bh);
  isoCtx.lineTo(x,        y + th*0.1);
  isoCtx.closePath();
  isoCtx.fill();

  // Основний корпус — право
  isoCtx.fillStyle = bc.wall1;
  isoCtx.beginPath();
  isoCtx.moveTo(x,        y + th*0.1);
  isoCtx.lineTo(x,        y + th*0.1 - bh);
  isoCtx.lineTo(x + bw/2, y + th*0.4 - bh);
  isoCtx.lineTo(x + bw/2, y + th*0.4);
  isoCtx.closePath();
  isoCtx.fill();

  // Центральна вежа
  let tw2 = bw * 0.35, th2 = bh * 0.5;
  isoCtx.fillStyle = shadeColor(bc.wall2, -5);
  isoCtx.beginPath();
  isoCtx.moveTo(x - tw2/2, y + th*0.25 - bh);
  isoCtx.lineTo(x - tw2/2, y + th*0.25 - bh - th2);
  isoCtx.lineTo(x,         y + th*0.05 - bh - th2);
  isoCtx.lineTo(x,         y + th*0.05 - bh);
  isoCtx.closePath();
  isoCtx.fill();
  isoCtx.fillStyle = bc.wall1;
  isoCtx.beginPath();
  isoCtx.moveTo(x,         y + th*0.05 - bh);
  isoCtx.lineTo(x,         y + th*0.05 - bh - th2);
  isoCtx.lineTo(x + tw2/2, y + th*0.25 - bh - th2);
  isoCtx.lineTo(x + tw2/2, y + th*0.25 - bh);
  isoCtx.closePath();
  isoCtx.fill();

  // Дахи
  [[bw, bh, bc.roof1, 0.4, 0.55, 0.1],
   [tw2, th2, bc.roof2, 0.25, 0.4, 0.05]].forEach(([w, h, clr, yr, ybr, yt]) => {
    let yb = y + th * yr - h;
    isoCtx.fillStyle = clr;
    isoCtx.beginPath();
    isoCtx.moveTo(x,       yb - w*0.1);
    isoCtx.lineTo(x + w/2, y + th*ybr - h);
    isoCtx.lineTo(x,       y + th*yt  - h + w*0.1);
    isoCtx.lineTo(x - w/2, y + th*ybr - h);
    isoCtx.closePath();
    isoCtx.fill();
  });

  // Прапор над вежею
  isoCtx.strokeStyle = '#888';
  isoCtx.lineWidth = 1;
  let flagY = y + th*0.05 - bh - th2 - bh*0.15;
  isoCtx.beginPath();
  isoCtx.moveTo(x, flagY);
  isoCtx.lineTo(x, flagY - 14);
  isoCtx.stroke();
  isoCtx.fillStyle = ep >= 8 ? '#00e5ff' : '#e8b84b';
  isoCtx.beginPath();
  isoCtx.moveTo(x,      flagY - 14);
  isoCtx.lineTo(x + 11, flagY - 11);
  isoCtx.lineTo(x,      flagY - 8);
  isoCtx.closePath();
  isoCtx.fill();

  // Вікна
  isoCtx.fillStyle = isAC ? '#00e5ff' : bc.win;
  [[x + bw*0.08, y + th*0.1 - bh*0.5], [x + bw*0.22, y + th*0.1 - bh*0.5],
   [x + bw*0.08, y + th*0.1 - bh*0.75],[x + tw2*0.08, y + th*0.05 - bh - th2*0.4]].forEach(([wx,wy]) => {
    isoCtx.fillRect(wx, wy, bw*0.12, bh*0.09);
  });

  isoCtx.shadowBlur = 0;
  if (lvl > 1) {
    isoCtx.fillStyle = '#e8b84b';
    isoCtx.font = 'bold 9px monospace';
    isoCtx.textAlign = 'center';
    isoCtx.fillText('L' + lvl, x, y + th*0.4 + 12);
  }
}

// --- ЦЕРКВА ---
function drawChurchBuilding(x, y, bc, bw, bh, lvl, isAC) {
  let tw = ISO.TW, th = ISO.TH;
  // Корпус
  drawStandardBuilding(x, y, bc, bw, bh, lvl, isAC, 5);
  // Дзвіниця зверху
  isoCtx.fillStyle = bc.roof2;
  isoCtx.beginPath();
  isoCtx.moveTo(x, y - bh - 10);
  isoCtx.lineTo(x + bw*0.2, y - bh - 2);
  isoCtx.lineTo(x - bw*0.2, y - bh - 2);
  isoCtx.closePath();
  isoCtx.fill();
  // Хрест
  isoCtx.strokeStyle = '#e8b84b';
  isoCtx.lineWidth = 2;
  isoCtx.beginPath();
  isoCtx.moveTo(x, y - bh - 20);
  isoCtx.lineTo(x, y - bh - 10);
  isoCtx.stroke();
  isoCtx.beginPath();
  isoCtx.moveTo(x - 5, y - bh - 16);
  isoCtx.lineTo(x + 5, y - bh - 16);
  isoCtx.stroke();
}

// --- ШАХТА/РУДНИК ---
function drawMineBuilding(x, y, bc, bw, bh, lvl, isAC) {
  let tw = ISO.TW, th = ISO.TH;
  // Вхід у шахту
  isoCtx.fillStyle = '#302010';
  isoCtx.beginPath();
  isoCtx.moveTo(x - bw*0.35, y + th*0.4);
  isoCtx.lineTo(x - bw*0.35, y + th*0.4 - bh*0.6);
  isoCtx.lineTo(x + bw*0.35, y + th*0.4 - bh*0.6);
  isoCtx.lineTo(x + bw*0.35, y + th*0.4);
  isoCtx.closePath();
  isoCtx.fill();
  // Дерев'яна підпора
  isoCtx.strokeStyle = '#8b5a2b';
  isoCtx.lineWidth = 2;
  [[x - bw*0.35, x - bw*0.35], [x + bw*0.35, x + bw*0.35]].forEach(([ax, bx2]) => {
    isoCtx.beginPath();
    isoCtx.moveTo(ax, y + th*0.4);
    isoCtx.lineTo(bx2, y + th*0.4 - bh*0.6);
    isoCtx.stroke();
  });
  isoCtx.beginPath();
  isoCtx.moveTo(x - bw*0.35, y + th*0.4 - bh*0.6);
  isoCtx.lineTo(x + bw*0.35, y + th*0.4 - bh*0.6);
  isoCtx.stroke();
  // Каміння/Руда
  [[x-10,y+th*0.2,'#8a8a90'],[x+5,y+th*0.25,'#a0704a'],[x,y+th*0.3,'#7a7a80']].forEach(([rx,ry,clr]) => {
    isoCtx.fillStyle = clr;
    isoCtx.beginPath();
    isoCtx.ellipse(rx, ry, 5, 3, 0.3, 0, Math.PI*2);
    isoCtx.fill();
  });
  if (lvl > 1) {
    isoCtx.fillStyle = '#e8b84b';
    isoCtx.font = 'bold 8px monospace';
    isoCtx.textAlign = 'center';
    isoCtx.fillText('L' + lvl, x, y + th*0.4 + 9);
  }
}

// --- ФЕРМА ---
function drawFarmBuilding(x, y, bc, bw, bh, lvl, isAC) {
  let th = ISO.TH;
  // Поле рядками
  for (let ri = 0; ri < 3; ri++) {
    isoCtx.strokeStyle = ri % 2 === 0 ? '#5a8020' : '#8ab030';
    isoCtx.lineWidth = 2.5;
    isoCtx.beginPath();
    isoCtx.moveTo(x - bw*0.5 + ri*4, y + th*0.2 + ri*4);
    isoCtx.lineTo(x + bw*0.5 - ri*3, y + th*0.5 + ri*4);
    isoCtx.stroke();
  }
  // Хатинка в куті
  drawStandardBuilding(x + bw*0.1, y - bh*0.1, bc, bw*0.65, bh*0.7, lvl, isAC, 1);
}

// ============================================================
// ДИМ
// ============================================================
function drawSmoke(x, y) {
  let t = Date.now() / 1000;
  for (let s = 0; s < 3; s++) {
    let progress = (t * 0.5 + s * 0.33) % 1;
    let alpha = 0.5 * (1 - progress);
    let sy2 = y - progress * 18;
    let sr = 2 + progress * 4;
    isoCtx.fillStyle = `rgba(160,150,140,${alpha})`;
    isoCtx.beginPath();
    isoCtx.arc(x + Math.sin(t + s) * 3, sy2, sr, 0, Math.PI * 2);
    isoCtx.fill();
  }
}

// ============================================================
// ДОПОМІЖНА: ЗАТЕМНЕННЯ КОЛЬОРУ
// ============================================================
function shadeColor(hex, pct) {
  let r = parseInt(hex.slice(1,3), 16);
  let g = parseInt(hex.slice(3,5), 16);
  let b = parseInt(hex.slice(5,7), 16);
  r = Math.max(0, Math.min(255, r + pct));
  g = Math.max(0, Math.min(255, g + pct));
  b = Math.max(0, Math.min(255, b + pct));
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ============================================================
// ОСНОВНИЙ РЕНДЕР
// ============================================================
function drawMap() {
  if (!isoCtx || !isoEl || !isoEl.width) return;
  let cw = isoEl.width, ch = isoEl.height;

  // Фон — небо/земля
  let bgGrd = isoCtx.createLinearGradient(0, 0, 0, ch);
  bgGrd.addColorStop(0, '#0a1020');
  bgGrd.addColorStop(1, '#06090e');
  isoCtx.fillStyle = bgGrd;
  isoCtx.fillRect(0, 0, cw, ch);

  // Легка сітка фону
  isoCtx.strokeStyle = 'rgba(20,30,50,0.8)';
  isoCtx.lineWidth = 0.5;
  for (let i = 0; i < ch; i += 30) {
    isoCtx.beginPath(); isoCtx.moveTo(0,i); isoCtx.lineTo(cw,i); isoCtx.stroke();
  }

  // Малюємо тайли в ізометричному порядку (задні першими)
  let tiles = (typeof mapTiles !== 'undefined') ? mapTiles : [];
  let rows  = tiles.length || ISO.ROWS;
  let cols  = (tiles[0] || []).length || ISO.COLS;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let tile = tiles[r] && tiles[r][c];
      if (!tile) tile = { type: 'grass', building: null, variation: 0 };
      drawIsoTile(c, r, tile);
    }
  }

  // Будівлі — окремий прохід (щоб вони не перекривались тайлами)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let tile = tiles[r] && tiles[r][c];
      if (tile && tile.building) {
        drawIsoBuilding(c, r, tile.building);
      }
    }
  }

  // Гобліни
  drawGoblins();

  // Tooltips залишаємо в DOM
}

// ============================================================
// ГОБЛІНИ
// ============================================================
function drawGoblins() {
  if (typeof goblinWave === 'undefined' || !goblinWave.active) return;
  let t = Date.now() / 400;
  let goblins = goblinWave.goblins || [];
  let maxShow = Math.min(goblins.length, 10);

  // Позиціонуємо гоблінів з правого краю карти
  let rows = (typeof mapTiles !== 'undefined' && mapTiles.length) ? mapTiles.length : ISO.ROWS;
  let cols = (typeof mapTiles !== 'undefined' && mapTiles[0]) ? mapTiles[0].length : ISO.COLS;

  for (let gi = 0; gi < maxShow; gi++) {
    let g = goblins[gi];
    let { x, y } = isoToScreen(cols - 1 - (gi % 3), Math.floor(gi / 3) + 2);
    let bobY = Math.sin(t + gi * 1.3) * 3;

    // Тінь
    isoCtx.fillStyle = 'rgba(0,0,0,0.3)';
    isoCtx.beginPath();
    isoCtx.ellipse(x, y + ISO.TH*0.5 + 10, 8, 3, 0, 0, Math.PI*2);
    isoCtx.fill();

    // Тіло гобліна
    isoCtx.fillStyle = g.color || '#c0392b';
    isoCtx.beginPath();
    isoCtx.arc(x, y + bobY, 9, 0, Math.PI * 2);
    isoCtx.fill();
    // Обводка
    isoCtx.strokeStyle = '#800';
    isoCtx.lineWidth = 1;
    isoCtx.stroke();

    // Очі
    isoCtx.fillStyle = '#ffff00';
    isoCtx.beginPath(); isoCtx.arc(x-3.5, y - 3 + bobY, 2, 0, Math.PI*2); isoCtx.fill();
    isoCtx.beginPath(); isoCtx.arc(x+3.5, y - 3 + bobY, 2, 0, Math.PI*2); isoCtx.fill();
    isoCtx.fillStyle = '#000';
    isoCtx.beginPath(); isoCtx.arc(x-3.5, y - 3 + bobY, 0.8, 0, Math.PI*2); isoCtx.fill();
    isoCtx.beginPath(); isoCtx.arc(x+3.5, y - 3 + bobY, 0.8, 0, Math.PI*2); isoCtx.fill();

    // HP бар
    let hpPct = g.hp / g.maxHp;
    isoCtx.fillStyle = '#300';
    isoCtx.fillRect(x - 12, y + 12 + bobY, 24, 3);
    isoCtx.fillStyle = hpPct > 0.5 ? '#0f0' : hpPct > 0.25 ? '#f80' : '#f00';
    isoCtx.fillRect(x - 12, y + 12 + bobY, Math.floor(24 * hpPct), 3);
  }

  // Стрілка атаки
  let { x: ax, y: ay } = isoToScreen(cols - 2, Math.floor(rows / 2));
  isoCtx.fillStyle = 'rgba(200,50,50,0.7)';
  isoCtx.beginPath();
  isoCtx.moveTo(ax + 30, ay);
  isoCtx.lineTo(ax + 8, ay - 12);
  isoCtx.lineTo(ax + 8, ay + 12);
  isoCtx.closePath();
  isoCtx.fill();
}

// ============================================================
// ЦЕНТРУВАННЯ МАПИ
// ============================================================
function centerIsoMap() {
  if (!isoEl) return;
  let rows = (typeof mapTiles !== 'undefined' && mapTiles.length) ? mapTiles.length : ISO.ROWS;
  let cols = (typeof mapTiles !== 'undefined' && mapTiles[0]) ? mapTiles[0].length : ISO.COLS;

  // Ізометричні розміри всієї карти
  let mapW = (cols + rows) * (ISO.TW / 2);
  let mapH = (cols + rows) * (ISO.TH / 2);

  isoOffset.x = Math.floor((isoEl.width  - mapW) / 2) + rows * (ISO.TW / 2);
  isoOffset.y = Math.floor((isoEl.height - mapH) / 2) + 20;
}

// ============================================================
// RESIZE
// ============================================================
function resizeCanvas() {
  let area = document.querySelector('.map-area');
  if (!area || !isoEl) return;
  let w = area.offsetWidth  || window.innerWidth;
  let h = area.offsetHeight || Math.floor(window.innerHeight * 0.6);
  if (w < 10) w = window.innerWidth;
  if (h < 10) h = Math.floor(window.innerHeight * 0.55);
  isoEl.width  = w;
  isoEl.height = h;
  isoCtx = isoEl.getContext('2d');
  centerIsoMap();
  _isoDirty = true;
}

// ============================================================
// КОНВЕРТАЦІЯ КЛІКУ → ТАЙЛ
// ============================================================
function screenToTile(sx, sy) {
  return screenToIso(sx, sy);
}

// ============================================================
// ПОДІЇ МИШКИ / ТАЧА
// ============================================================
function onMapMouseDown(e) {
  isoDrag = { active: true, sx: e.clientX, sy: e.clientY, ox: isoOffset.x, oy: isoOffset.y };
}
function onMapMouseUp() { isoDrag.active = false; }

function onMapMouse(e) {
  let rect = isoEl.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  if (isoDrag.active) {
    isoOffset.x = (isoDrag.ox + (e.clientX - isoDrag.sx)) | 0;
    isoOffset.y = (isoDrag.oy + (e.clientY - isoDrag.sy)) | 0;
    _isoDirty = true;
    return;
  }

  let { col, row } = screenToIso(mx, my);
  isoHover = { col, row };

  let tip = document.getElementById('map-tooltip');
  if (!tip) return;

  let tiles = (typeof mapTiles !== 'undefined') ? mapTiles : [];
  let rows  = tiles.length || ISO.ROWS;
  let cols  = (tiles[0] || []).length || ISO.COLS;

  if (col >= 0 && col < cols && row >= 0 && row < rows) {
    let tile = tiles[row] && tiles[row][col];
    if (!tile) { tip.style.display = 'none'; return; }
    tip.style.display = 'block';
    tip.style.left = (mx + 14) + 'px';
    tip.style.top  = (my + 14) + 'px';
    if (tile.building) {
      let b = tile.building;
      tip.innerHTML = `<b style="color:var(--gold)">${b.name}</b><br>🏗 Рів.${b.lvl||1} · Еп.${b.epoch}${b.autoClicker ? '<br><span style="color:var(--synth)">🤖 Автоклікер</span>' : ''}`;
    } else {
      let labels = { grass:'🌿 Луки', forest:'🌲 Ліс', water:'💧 Вода', stone:'⛰ Скеля',
                     sand:'🌾 Пісок', dirt:'🪨 Каміння', snow:'❄ Сніг', swamp:'🌿 Болото' };
      tip.innerHTML = `<span style="color:var(--dim)">${labels[tile.type] || tile.type} [${col},${row}]</span>`;
    }
  } else {
    tip.style.display = 'none';
  }
  _isoDirty = true;
}

function onMapClick(e) {
  // Можна додати логіку кліку по тайлу тут
}

// ============================================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================================
function initMap() {
  isoEl  = document.getElementById('isoCanvas');
  isoCtx = isoEl.getContext('2d');

  // Генерація мапи — лишається в основному файлі (generateMap())
  if (typeof generateMap === 'function') generateMap();

  setTimeout(() => {
    resizeCanvas();
    drawMap();
  }, 60);

  // Слухачі
  isoEl.addEventListener('mousemove',  onMapMouse);
  isoEl.addEventListener('click',      onMapClick);
  isoEl.addEventListener('mousedown',  onMapMouseDown);
  isoEl.addEventListener('mouseup',    onMapMouseUp);
  isoEl.addEventListener('mouseleave', () => { isoDrag.active = false; isoHover = {col:-1,row:-1}; });

  // Тач
  let _touchStart = null;
  isoEl.addEventListener('touchstart', e => {
    e.preventDefault();
    let t = e.touches[0];
    _touchStart = { x: t.clientX, y: t.clientY };
    onMapMouseDown({ clientX: t.clientX, clientY: t.clientY });
  }, { passive: false });

  isoEl.addEventListener('touchmove', e => {
    e.preventDefault();
    let t = e.touches[0];
    let rect = isoEl.getBoundingClientRect();
    onMapMouse({ clientX: t.clientX, clientY: t.clientY,
                 offsetX: t.clientX - rect.left, offsetY: t.clientY - rect.top });
  }, { passive: false });

  isoEl.addEventListener('touchend', e => {
    e.preventDefault();
    let t = e.changedTouches[0];
    let rect = isoEl.getBoundingClientRect();
    let dx = _touchStart ? Math.abs(t.clientX - _touchStart.x) : 99;
    let dy = _touchStart ? Math.abs(t.clientY - _touchStart.y) : 99;
    if (dx < 8 && dy < 8)
      onMapClick({ offsetX: t.clientX - rect.left, offsetY: t.clientY - rect.top });
    onMapMouseUp();
  }, { passive: false });

  window.addEventListener('resize', () => { resizeCanvas(); drawMap(); });
}
