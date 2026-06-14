// ============================================================
// expansions.js — Розширення КУБІЧНОЇ ЕВОЛЮЦІЇ
// Підключається після map.js у index.html
// Всі глобальні змінні гри доступні напряму.
// ============================================================

// ============================================================
// ЛОР ТА ЦІЛЬ ГРИ
// ============================================================
const GAME_LORE = {
  title: "КУБІЧНА ЕВОЛЮЦІЯ",
  subtitle: "Від первісного табору до зоряної цивілізації",
  intro: `Твій клан прокинувся у незнайомому світі. Навколо — ліси, болота і руїни стародавніх культур.
Гобліни безжально нападають на поселення. Але є надія — легенди кажуть про Душі Стародавніх,
захованих у глибинах цього світу. Зберіть їх усіх — і відкриється Шлях Синтезу.`,
  victory: `Щоб перемогти, ти маєш:
1. Пройти всі 12 Епох розвитку
2. Зібрати 100 Душ Стародавніх
3. Побудувати Вівтар Синтезу (Епоха 11)
4. Сформувати Гарнізон із 500+ воїнів// ============================================================
// expansions.js — Розширення КУБІЧНОЇ ЕВОЛЮЦІЇ
// Підключається після map.js у index.html
// Всі глобальні змінні гри доступні напряму.
// ============================================================

// ============================================================
// ЛОР ТА ЦІЛЬ ГРИ
// ============================================================
const GAME_LORE = {
  title: "КУБІЧНА ЕВОЛЮЦІЯ",
  subtitle: "Від первісного табору до зоряної цивілізації",
  intro: `Твій клан прокинувся у незнайомому світі. Навколо — ліси, болота і руїни стародавніх культур.
Гобліни безжально нападають на поселення. Але є надія — легенди кажуть про Душі Стародавніх,
захованих у глибинах цього світу. Зберіть їх усіх — і відкриється Шлях Синтезу.`,
  victory: `Щоб перемогти, ти маєш:
1. Пройти всі 12 Епох розвитку
2. Зібрати 100 Душ Стародавніх
3. Побудувати Вівтар Синтезу (Епоха 11)
4. Сформувати Гарнізон із 500+ воїнів
5. Пережити 50 хвиль гоблінів
6. Відкрити всі типи геологічних родовищ`,
  chapters: [
    { ep: [1,2],   name: "Виживання",         desc: "Перші кроки. Збери ресурси, побудуй табір." },
    { ep: [3,4],   name: "Ремесла та Бронза",  desc: "Навчися обробляти метали. Дослідж околиці." },
    { ep: [5,6],   name: "Королівство",        desc: "Зведи замок. Сформуй першу армію." },
    { ep: [7,8],   name: "Промисловість",      desc: "Фабрики, парова машина, масове виробництво." },
    { ep: [9,10],  name: "Хімічна ера",        desc: "Нафта, пластик, електрика. Місто зростає." },
    { ep: [11,12], name: "Синтез",             desc: "Мікросхеми, роботи, дрони. Шлях до перемоги." },
  ]
};

// ============================================================
// СПІЛЬНІ РЕСУРСИ РОЗШИРЕНЬ
// ============================================================
// Додаємо нові ресурси до RES якщо доступний
const EXPANSION_RES = {
  soul:        { n:"Душа Стародавніх", e:"👻", ep:1 },
  game_meat:   { n:"М'ясо дичини",     e:"🍖", ep:1 },
  hide:        { n:"Шкура",            e:"🦊", ep:1 },
  feather:     { n:"Пір'я",            e:"🪶", ep:2 },
  fish:        { n:"Риба",             e:"🐟", ep:1 },
  rare_fish:   { n:"Рідкісна риба",    e:"🐠", ep:4 },
  mushroom:    { n:"Гриби",            e:"🍄", ep:1 },
  truffle:     { n:"Трюфель",          e:"⚫", ep:5 },
  herb:        { n:"Трави",            e:"🌿", ep:1 },
  rare_herb:   { n:"Рідкісна трава",   e:"🌸", ep:3 },
  gem:         { n:"Дорогоцінний камінь", e:"💎", ep:3 },
  crystal:     { n:"Кристал",          e:"🔮", ep:5 },
  fossil:      { n:"Скам'янілість",    e:"🦴", ep:6 },
  goblin_loot: { n:"Трофей гобліна",   e:"🪙", ep:1 },
  goblin_relic:{ n:"Реліквія гоблінів",e:"🗿", ep:4 },
  troop_sword: { n:"Мечник",           e:"⚔️", ep:2 },
  troop_archer:{ n:"Лучник",           e:"🏹", ep:2 },
  troop_knight:{ n:"Лицар",            e:"🛡", ep:5 },
  troop_mage:  { n:"Маг",              e:"🧙", ep:6 },
  troop_elite: { n:"Елітний воїн",     e:"💂", ep:8 },
};

// Додаємо до глобального RES якщо він є
function injectResources(){
  if(typeof RES === 'undefined') return;
  Object.entries(EXPANSION_RES).forEach(([k,v])=>{ if(!RES[k]) RES[k]=v; });
  Object.keys(EXPANSION_RES).forEach(k=>{
    if(typeof storage !== 'undefined' && storage[k] === undefined) storage[k] = 0;
    if(typeof psCounters !== 'undefined' && psCounters[k] === undefined) psCounters[k] = 0;
    if(typeof resLifetimeTotal !== 'undefined' && resLifetimeTotal[k] === undefined) resLifetimeTotal[k] = 0;
  });
}
// Викликаємо одразу при завантаженні скрипта (RES вже визначений на цей момент)
injectResources();

// ============================================================
// 1. ПОШУК ДУШ
// ============================================================
const SOUL_SYSTEM = {
  totalFound: 0,
  totalTarget: 100,  // Ціль гри
  lastSearch: 0,
  cooldown: 60,      // секунд між пошуками
  searching: false,
  searchProgress: 0,
  searchDuration: 10, // секунд на пошук

  // Локації пошуку душ
  locations: [
    { id:'ruins',    name:'🏚 Руїни',        desc:'Стародавні будівлі приховують духів',  minEp:1, chance:0.25, reward:{soul:[1,2]},  rareChance:0.05, rareReward:{soul:[5,10]} },
    { id:'graveyard',name:'⚰️ Цвинтар',       desc:'Тут спочивають загиблі герої',         minEp:2, chance:0.35, reward:{soul:[1,3]},  rareChance:0.08, rareReward:{soul:[8,15]} },
    { id:'cave',     name:'🕳 Печера',        desc:'Глибокі печери зберігають таємниці',    minEp:3, chance:0.40, reward:{soul:[2,4]},  rareChance:0.10, rareReward:{soul:[10,20]} },
    { id:'altar',    name:'🗿 Стародавній вівтар',desc:'Місце сили. Духи тут сильні',       minEp:5, chance:0.50, reward:{soul:[3,6]},  rareChance:0.15, rareReward:{soul:[15,30]} },
    { id:'abyss',    name:'🌑 Безодня',       desc:'Найглибше місце. Ризик великий',        minEp:8, chance:0.60, reward:{soul:[5,10]}, rareChance:0.20, rareReward:{soul:[25,50]} },
  ],
  activeLocation: 'ruins',

  // Пасивний дохід від душ
  get passiveBonus(){ return Math.floor(this.totalFound / 10) * 0.01; }, // +1% до вироб. за кожні 10 душ
};

let soulSearchTimer = null;
let soulSearchProgressTimer = null;

function startSoulSearch(){
  let sys = SOUL_SYSTEM;
  if(sys.searching) return;
  let loc = sys.locations.find(l=>l.id===sys.activeLocation);
  if(!loc || (typeof epoch !== 'undefined' && epoch < loc.minEp)){
    showExpToast(`🔒 Потрібна Епоха ${loc?.minEp || 1}!`); return;
  }
  let now = Date.now()/1000;
  if(now - sys.lastSearch < sys.cooldown){
    let rem = Math.ceil(sys.cooldown - (now - sys.lastSearch));
    showExpToast(`⏳ Перезарядка: ${rem}с`); return;
  }
  sys.searching = true;
  sys.searchProgress = 0;
  renderSoulTab();

  let elapsed = 0;
  soulSearchProgressTimer = setInterval(()=>{
    elapsed++;
    sys.searchProgress = elapsed / sys.searchDuration * 100;
    let bar = document.getElementById('soul-search-bar');
    if(bar) bar.style.width = sys.searchProgress + '%';
    if(elapsed >= sys.searchDuration){
      clearInterval(soulSearchProgressTimer);
      finishSoulSearch();
    }
  }, 1000);
}

function finishSoulSearch(){
  let sys = SOUL_SYSTEM;
  sys.searching = false;
  sys.searchProgress = 0;
  sys.lastSearch = Date.now()/1000;
  let loc = sys.locations.find(l=>l.id===sys.activeLocation);
  if(!loc) { renderSoulTab(); return; }

  let roll = Math.random();
  let found = false;
  let logMsg = '';

  if(roll < loc.rareChance){
    // Рідкісна знахідка!
    let [min, max] = loc.rareReward.soul;
    let amt = Math.floor(Math.random()*(max-min+1))+min;
    if(typeof storage !== 'undefined') storage.soul = (storage.soul||0) + amt;
    sys.totalFound += amt;
    logMsg = `✨ РІДКІСНО! Знайдено ${amt} Душ у ${loc.name}!`;
    found = true;
  } else if(roll < loc.rareChance + loc.chance){
    let [min, max] = loc.reward.soul;
    let amt = Math.floor(Math.random()*(max-min+1))+min;
    if(typeof storage !== 'undefined') storage.soul = (storage.soul||0) + amt;
    sys.totalFound += amt;
    logMsg = `👻 Знайдено ${amt} Душ у ${loc.name}`;
    found = true;
  } else {
    logMsg = `😔 Нічого не знайдено у ${loc.name}...`;
  }

  if(typeof addLog === 'function') addLog(logMsg, found && roll < loc.rareChance);
  if(found) showExpToast(logMsg);

  // Перевірка перемоги
  if(sys.totalFound >= sys.totalTarget){
    if(typeof addLog === 'function') addLog('🏆 ПЕРЕМОЖЕЦЬ! Зібрано 100 Душ Стародавніх! Шлях Синтезу відкритий!', true);
    showExpToast('🏆 100 Душ! ПЕРЕМОГА НАБЛИЖАЄТЬСЯ!');
  }

  if(typeof markDirty === 'function') markDirty('full');
  renderSoulTab();
}

function renderSoulTab(){
  let div = document.getElementById('tab-souls-content');
  if(!div) return;
  let sys = SOUL_SYSTEM;
  let loc = sys.locations.find(l=>l.id===sys.activeLocation);
  let now = Date.now()/1000;
  let cdRem = Math.max(0, Math.ceil(sys.cooldown - (now - sys.lastSearch)));
  let pct = (sys.totalFound / sys.totalTarget * 100).toFixed(1);
  let passBonus = (sys.passiveBonus * 100).toFixed(0);

  let html = `
  <div style="padding:4px;">
    <div class="sh">👻 ПОШУК ДУШ СТАРОДАВНІХ</div>
    <div style="background:#0a0a1a;border:1px solid #5b2fd5;padding:8px;margin-bottom:6px;">
      <div style="font-size:11px;color:var(--purple);margin-bottom:4px;">⭐ ПРОГРЕС ДО ПЕРЕМОГИ</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
        <span>👻 Зібрано: <b style="color:var(--purple)">${sys.totalFound}</b> / ${sys.totalTarget}</span>
        <span style="color:var(--gold)">${pct}%</span>
      </div>
      <div style="height:8px;background:#070a0f;border:1px solid var(--border);margin-bottom:5px;">
        <div style="height:100%;background:linear-gradient(90deg,#5b2fd5,#a040ff);width:${Math.min(100,pct)}%;transition:width .5s;"></div>
      </div>
      <div style="font-size:10px;color:var(--teal);">✨ Бонус виробництва від Душ: +${passBonus}%</div>
    </div>

    <div class="sh">📍 ЛОКАЦІЯ ПОШУКУ</div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
    ${sys.locations.map(l=>{
      let avail = typeof epoch === 'undefined' || epoch >= l.minEp;
      let sel = sys.activeLocation === l.id;
      return `<div style="background:${sel?'#0d0a1a':'var(--panel2)'};border:1px solid ${sel?'var(--purple)':avail?'var(--border)':'#1a1a1a'};padding:7px;cursor:${avail?'pointer':'not-allowed'};opacity:${avail?1:.4};"
        onclick="${avail?`setSoulLocation('${l.id}')`:''}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:12px">${l.name}</span>
            ${sel?'<span style="font-size:9px;color:var(--purple);margin-left:6px;">◀ ВИБРАНО</span>':''}
          </div>
          <span style="font-size:9px;color:var(--dim)">Еп.${l.minEp}</span>
        </div>
        <div style="font-size:10px;color:var(--dim);margin-top:2px;">${l.desc}</div>
        <div style="font-size:10px;color:var(--teal);margin-top:2px;">
          Шанс: ${Math.round(l.chance*100)}% · 👻 ${l.reward.soul[0]}-${l.reward.soul[1]}
          <span style="color:var(--gold)"> · Рідко: ${Math.round(l.rareChance*100)}% → ${l.rareReward.soul[0]}-${l.rareReward.soul[1]}</span>
        </div>
      </div>`;
    }).join('')}
    </div>

    <div style="margin-bottom:6px;">
      ${sys.searching ? `
        <div style="font-size:11px;color:var(--purple);margin-bottom:4px;">🔍 Пошук у ${loc?.name || ''}...</div>
        <div style="height:8px;background:#070a0f;border:1px solid var(--purple);">
          <div id="soul-search-bar" style="height:100%;background:var(--purple);width:${sys.searchProgress}%;transition:width 1s linear;"></div>
        </div>
      ` : `
        <button onclick="startSoulSearch()" style="width:100%;font-family:var(--font);font-size:12px;padding:10px;border:1px solid var(--purple);background:rgba(91,47,213,.12);color:var(--purple);cursor:pointer;transition:all .15s;"
          ${cdRem>0?`disabled style="width:100%;font-family:var(--font);font-size:12px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--dim);cursor:not-allowed;"`:''}>
          ${cdRem>0 ? `⏳ ПЕРЕЗАРЯДКА: ${cdRem}с` : '🔍 ШУКАТИ ДУШІ'}
        </button>
      `}
    </div>

    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:6px;">
      💡 Душі Стародавніх потрібні для Перемоги. Кожні 10 душ дають +1% до виробництва. Пошук займає ${sys.searchDuration}с. Перезарядка: ${sys.cooldown}с.
    </div>
  </div>`;
  div.innerHTML = html;
}

function setSoulLocation(id){
  SOUL_SYSTEM.activeLocation = id;
  renderSoulTab();
}

// ============================================================
// 2. МИСЛИВСТВО
// ============================================================
const HUNTING_SYSTEM = {
  huntsTotal: 0,
  lastHunt: 0,
  cooldown: 90,
  hunting: false,
  huntProgress: 0,
  huntDuration: 15,
  heroBonus: 0, // бонус від героя-мисливця
  upgrades: {
    bow:    { name:'🏹 Лук',         lvl:0, maxLvl:10, cost:{wood:20,stone:10},       costMult:1.5, bonus:'Більше дичини' },
    trap:   { name:'🪤 Пастки',      lvl:0, maxLvl:10, cost:{logs:30,fiber:15},        costMult:1.6, bonus:'Пасивний видобуток' },
    dog:    { name:'🐕 Мисливський пес', lvl:0, maxLvl:5, cost:{wheat:50,water:20},    costMult:2.0, bonus:'Швидкість пошуку' },
    scope:  { name:'🔭 Оптика',      lvl:0, maxLvl:5, cost:{iron:40,tools:20},         costMult:2.0, bonus:'Точний постріл' },
  },
  // Пасивний дохід від пасток
  get trapPassive(){
    let t = this.upgrades.trap;
    return t.lvl * 0.05; // 0.05 м'яса/с за рівень
  },
  prey: [
    { id:'rabbit', name:'🐰 Кролик',  minEp:1, chance:0.6, meat:[1,3], hide:[0,1], feather:[0,0], rare:false },
    { id:'deer',   name:'🦌 Олень',   minEp:1, chance:0.4, meat:[3,6], hide:[1,2], feather:[0,0], rare:false },
    { id:'boar',   name:'🐗 Вепр',    minEp:2, chance:0.3, meat:[5,10],hide:[2,3], feather:[0,0], rare:false },
    { id:'wolf',   name:'🐺 Вовк',    minEp:3, chance:0.25,meat:[4,8], hide:[3,5], feather:[0,0], rare:true  },
    { id:'bear',   name:'🐻 Ведмідь', minEp:4, chance:0.15,meat:[8,15],hide:[4,6], feather:[0,0], rare:true  },
    { id:'eagle',  name:'🦅 Орел',    minEp:5, chance:0.1, meat:[3,5], hide:[1,2], feather:[5,10],rare:true  },
  ],
  lastPrey: null,
};

function startHunt(){
  let sys = HUNTING_SYSTEM;
  if(sys.hunting){ showExpToast('⚠️ Полювання вже йде!'); return; }
  let now = Date.now()/1000;
  let cd = sys.cooldown - (sys.upgrades.dog.lvl * 5);
  if(now - sys.lastHunt < cd){
    showExpToast(`⏳ ${Math.ceil(cd-(now-sys.lastHunt))}с до наступного полювання`); return;
  }
  sys.hunting = true;
  sys.huntProgress = 0;
  renderHuntingTab();

  let dur = Math.max(5, sys.huntDuration - sys.upgrades.scope.lvl * 2);
  let elapsed = 0;
  let timer = setInterval(()=>{
    elapsed++;
    sys.huntProgress = elapsed / dur * 100;
    let bar = document.getElementById('hunt-progress-bar');
    if(bar) bar.style.width = sys.huntProgress + '%';
    if(elapsed >= dur){
      clearInterval(timer);
      finishHunt();
    }
  }, 1000);
}

function finishHunt(){
  let sys = HUNTING_SYSTEM;
  sys.hunting = false;
  sys.huntProgress = 0;
  sys.lastHunt = Date.now()/1000;
  sys.huntsTotal++;

  let ep = typeof epoch !== 'undefined' ? epoch : 1;
  let available = sys.prey.filter(p => ep >= p.minEp);
  let bowBonus = sys.upgrades.bow.lvl * 0.05;

  let caught = [];
  available.forEach(p=>{
    if(Math.random() < p.chance + bowBonus){
      caught.push(p);
    }
  });

  if(caught.length === 0){
    if(typeof addLog === 'function') addLog('🏹 Полювання невдале — дичина розбіглась');
    sys.lastPrey = null;
    renderHuntingTab();
    return;
  }

  // Беремо найкращий трофей
  let prey = caught.sort((a,b)=>(b.meat[1]-a.meat[1]))[0];
  sys.lastPrey = prey;

  let meat = rndRange(prey.meat[0], prey.meat[1]);
  let hide = rndRange(prey.hide[0], prey.hide[1]);
  let feather = rndRange(prey.feather[0], prey.feather[1]);

  if(typeof storage !== 'undefined'){
    storage.game_meat = (storage.game_meat||0) + meat;
    storage.hide = (storage.hide||0) + hide;
    if(feather) storage.feather = (storage.feather||0) + feather;
  }

  let msg = `🏹 ${prey.name} здобутий! +${meat}🍖 ${hide?`+${hide}🦊`:''}${feather?` +${feather}🪶`:''}`;
  if(typeof addLog === 'function') addLog(msg, prey.rare);
  showExpToast(msg);
  if(typeof markDirty === 'function') markDirty('full');
  renderHuntingTab();
}

function upgradeHunting(id){
  let sys = HUNTING_SYSTEM;
  let upg = sys.upgrades[id];
  if(!upg || upg.lvl >= upg.maxLvl) return;
  let cost = {};
  Object.entries(upg.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(upg.costMult,upg.lvl)); });
  if(typeof storage !== 'undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){
      showExpToast('⚠️ Недостатньо ресурсів!'); return;
    }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  upg.lvl++;
  if(typeof addLog === 'function') addLog(`🏹 ${upg.name} → Рів.${upg.lvl}`);
  if(typeof markDirty === 'function') markDirty('full');
  renderHuntingTab();
}

function renderHuntingTab(){
  let div = document.getElementById('tab-hunting-content');
  if(!div) return;
  let sys = HUNTING_SYSTEM;
  let ep = typeof epoch !== 'undefined' ? epoch : 1;
  let cd = sys.cooldown - sys.upgrades.dog.lvl * 5;
  let now = Date.now()/1000;
  let cdRem = Math.max(0, Math.ceil(cd - (now - sys.lastHunt)));
  let trapP = sys.trapPassive;
  let meat = typeof storage !== 'undefined' ? (storage.game_meat||0) : 0;
  let hide = typeof storage !== 'undefined' ? (storage.hide||0) : 0;

  let html = `<div style="padding:4px;">
    <div class="sh">🏹 МИСЛИВСТВО</div>
    <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🍖</div>
        <div style="font-size:13px;color:var(--text)">${fmt2(meat)}</div>
        <div style="font-size:10px;color:var(--dim)">М'ясо дичини</div>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🦊</div>
        <div style="font-size:13px;color:var(--text)">${fmt2(hide)}</div>
        <div style="font-size:10px;color:var(--dim)">Шкури</div>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🏹</div>
        <div style="font-size:13px;color:var(--text)">${sys.huntsTotal}</div>
        <div style="font-size:10px;color:var(--dim)">Полювань</div>
      </div>
    </div>
    ${trapP > 0 ? `<div style="font-size:11px;color:var(--green);border:1px solid #1a3520;padding:5px 8px;margin-bottom:6px;">🪤 Пастки приносять +${(trapP*60).toFixed(1)} 🍖/хв пасивно</div>` : ''}
    ${sys.hunting ? `
      <div style="font-size:11px;color:var(--orange);margin-bottom:4px;">🏹 Полювання...</div>
      <div style="height:8px;background:#070a0f;border:1px solid var(--orange);margin-bottom:8px;">
        <div id="hunt-progress-bar" style="height:100%;background:var(--orange);width:${sys.huntProgress}%;transition:width 1s;"></div>
      </div>
    ` : `
      <button onclick="startHunt()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:10px;border:1px solid ${cdRem>0?'var(--border)':'var(--orange)'};background:rgba(212,128,74,.1);color:${cdRem>0?'var(--dim)':'var(--orange)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:8px;">
        ${cdRem>0 ? `⏳ ${cdRem}с` : '🏹 ПОЛЮВАТИ'}
      </button>
    `}
    ${sys.lastPrey ? `<div style="font-size:11px;color:var(--teal);margin-bottom:6px;">Останній трофей: ${sys.lastPrey.name}</div>` : ''}

    <div class="sh">⚙️ СПОРЯДЖЕННЯ</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
    ${Object.entries(sys.upgrades).map(([id,u])=>{
      let cost={};
      Object.entries(u.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(u.costMult,u.lvl)); });
      let canBuy = typeof storage==='undefined' || Object.keys(cost).every(k=>(storage[k]||0)>=cost[k]);
      let maxed = u.lvl >= u.maxLvl;
      return `<div style="background:var(--panel2);border:1px solid var(--border);padding:7px;display:flex;gap:7px;align-items:center;">
        <div style="font-size:20px">${u.name.split(' ')[0]}</div>
        <div style="flex:1;">
          <div style="font-size:11px;">${u.name.replace(/^[^\s]+ /,'')}</div>
          <div style="font-size:10px;color:var(--teal)">${u.bonus}</div>
          <div style="font-size:10px;color:var(--dim)">Рів.${u.lvl}/${u.maxLvl}</div>
          ${!maxed ? `<div style="font-size:10px;color:var(--orange)">${Object.entries(cost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>` : ''}
        </div>
        <button onclick="upgradeHunting('${id}')" ${maxed||!canBuy?'disabled':''} style="font-family:var(--font);font-size:10px;padding:5px 10px;border:1px solid ${maxed?'var(--gold)':canBuy?'var(--orange)':'var(--border)'};background:transparent;color:${maxed?'var(--gold)':canBuy?'var(--orange)':'var(--dim)'};cursor:${maxed||!canBuy?'not-allowed':'pointer'};">
          ${maxed ? 'МАКС' : '⬆ РІВ'}
        </button>
      </div>`;
    }).join('')}
    </div>

    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:6px;margin-top:6px;">
      💡 Дичина дає 🍖 та 🦊 для крафту. М'ясо живить воїнів гарнізону.
    </div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 3. РИБАЛКА
// ============================================================
const FISHING_SYSTEM = {
  fishedTotal: 0,
  lastFish: 0,
  cooldown: 45,
  fishing: false,
  fishProgress: 0,
  fishDuration: 8,
  fishCount: 0,
  upgrades: {
    rod:    { name:'🎣 Вудилище',     lvl:0, maxLvl:10, cost:{wood:15,fiber:10},       costMult:1.5 },
    bait:   { name:'🪱 Наживка',      lvl:0, maxLvl:10, cost:{vegetation:20,water:10}, costMult:1.5 },
    net:    { name:'🕸 Сіть',         lvl:0, maxLvl:5,  cost:{fiber:40,logs:20},        costMult:2.0 },
    boat:   { name:'⛵ Човен',        lvl:0, maxLvl:3,  cost:{boards:80,iron:30},       costMult:2.5 },
  },
  spots: [
    { id:'stream',  name:'💧 Струмок',      minEp:1, fish:[2,5],  rareFish:false, chance:0.8 },
    { id:'lake',    name:'🏞 Озеро',        minEp:2, fish:[4,8],  rareFish:false, chance:0.7 },
    { id:'river',   name:'🌊 Ріка',         minEp:3, fish:[6,12], rareFish:true,  chance:0.6 },
    { id:'sea',     name:'🌊 Море',         minEp:6, fish:[10,20],rareFish:true,  chance:0.5 },
    { id:'deep_sea',name:'🔵 Глибоке море', minEp:9, fish:[15,30],rareFish:true,  chance:0.4 },
  ],
  activeSpot: 'stream',
};

function startFishing(){
  let sys = FISHING_SYSTEM;
  if(sys.fishing){ showExpToast('🎣 Вже рибалимо!'); return; }
  let now = Date.now()/1000;
  let cd = sys.cooldown - sys.upgrades.bait.lvl * 3;
  if(now - sys.lastFish < cd){ showExpToast(`⏳ ${Math.ceil(cd-(now-sys.lastFish))}с`); return; }
  sys.fishing = true; sys.fishProgress = 0;
  renderFishingTab();
  let dur = Math.max(3, sys.fishDuration - sys.upgrades.rod.lvl);
  let el = 0;
  let timer = setInterval(()=>{
    el++;
    sys.fishProgress = el/dur*100;
    let b = document.getElementById('fish-progress-bar');
    if(b) b.style.width = sys.fishProgress+'%';
    if(el >= dur){ clearInterval(timer); finishFishing(); }
  }, 1000);
}

function finishFishing(){
  let sys = FISHING_SYSTEM;
  sys.fishing = false; sys.fishProgress = 0; sys.lastFish = Date.now()/1000;
  let spot = sys.spots.find(s=>s.id===sys.activeSpot);
  if(!spot){ renderFishingTab(); return; }
  let netBonus = sys.upgrades.net.lvl * 2;
  let boatBonus = sys.upgrades.boat.lvl * 0.1;
  if(Math.random() > spot.chance - boatBonus){ 
    if(typeof addLog==='function') addLog('🎣 Риба не клює...');
    renderFishingTab(); return;
  }
  let [min,max] = spot.fish;
  let amt = rndRange(min, max + netBonus);
  sys.fishedTotal += amt; sys.fishCount++;
  if(typeof storage!=='undefined') storage.fish = (storage.fish||0) + amt;
  let rareAmt = 0;
  if(spot.rareFish && Math.random() < 0.15){
    rareAmt = rndRange(1,3);
    if(typeof storage!=='undefined') storage.rare_fish = (storage.rare_fish||0) + rareAmt;
  }
  let msg = `🎣 +${amt}🐟${rareAmt?` +${rareAmt}🐠 (рідкісна!)`:''}`;
  if(typeof addLog==='function') addLog(msg, rareAmt > 0);
  showExpToast(msg);
  if(typeof markDirty==='function') markDirty('full');
  renderFishingTab();
}

function upgradeFishing(id){
  let sys = FISHING_SYSTEM;
  let u = sys.upgrades[id]; if(!u || u.lvl >= u.maxLvl) return;
  let cost={};
  Object.entries(u.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(u.costMult,u.lvl)); });
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  u.lvl++; if(typeof addLog==='function') addLog(`🎣 ${u.name} → Рів.${u.lvl}`);
  if(typeof markDirty==='function') markDirty('full');
  renderFishingTab();
}

function renderFishingTab(){
  let div = document.getElementById('tab-fishing-content');
  if(!div) return;
  let sys = FISHING_SYSTEM;
  let ep = typeof epoch!=='undefined'?epoch:1;
  let cd = sys.cooldown - sys.upgrades.bait.lvl * 3;
  let now = Date.now()/1000;
  let cdRem = Math.max(0,Math.ceil(cd-(now-sys.lastFish)));
  let fish = typeof storage!=='undefined'?(storage.fish||0):0;
  let rare = typeof storage!=='undefined'?(storage.rare_fish||0):0;
  let html = `<div style="padding:4px;">
    <div class="sh">🎣 РИБАЛКА</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🐟</div><b style="color:var(--blue)">${fmt2(fish)}</b><div style="font-size:9px;color:var(--dim)">Риба</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🐠</div><b style="color:var(--purple)">${fmt2(rare)}</b><div style="font-size:9px;color:var(--dim)">Рідкісна</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🎣</div><b>${sys.fishCount}</b><div style="font-size:9px;color:var(--dim)">Уловів</div></div>
    </div>
    <div class="sh">📍 МІСЦЕ РИБАЛКИ</div>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px;">
    ${sys.spots.map(s=>{ let av=ep>=s.minEp; let sel=sys.activeSpot===s.id;
      return `<div onclick="${av?`setFishSpot('${s.id}')`:''}" style="padding:5px 8px;border:1px solid ${sel?'var(--blue)':av?'var(--border)':'#0d0d0d'};background:${sel?'#0a0a20':'var(--panel2)'};cursor:${av?'pointer':'default'};opacity:${av?1:.4};display:flex;justify-content:space-between;">
        <span style="font-size:11px">${s.name} ${sel?'◀':''}</span>
        <span style="font-size:10px;color:var(--dim)">🐟 ${s.fish[0]}-${s.fish[1]+sys.upgrades.net.lvl*2} · Еп.${s.minEp}</span>
      </div>`;
    }).join('')}
    </div>
    ${sys.fishing ? `
      <div style="height:6px;background:#070a0f;border:1px solid var(--blue);margin-bottom:6px;">
        <div id="fish-progress-bar" style="height:100%;background:var(--blue);width:${sys.fishProgress}%;transition:width 1s;"></div>
      </div>
    ` : `
      <button onclick="startFishing()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--blue)'};background:rgba(91,155,213,.1);color:${cdRem>0?'var(--dim)':'var(--blue)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">
        ${cdRem>0?`⏳ ${cdRem}с`:'🎣 РИБАЛИТИ'}
      </button>
    `}
    <div class="sh">⚙️ СПОРЯДЖЕННЯ</div>
    <div style="display:flex;flex-direction:column;gap:3px;">
    ${Object.entries(sys.upgrades).map(([id,u])=>{
      let cost={}; Object.entries(u.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(u.costMult,u.lvl)); });
      let can=typeof storage==='undefined'||Object.keys(cost).every(k=>(storage[k]||0)>=cost[k]);
      let max=u.lvl>=u.maxLvl;
      return `<div style="background:var(--panel2);border:1px solid var(--border);padding:6px;display:flex;align-items:center;gap:6px;">
        <div style="font-size:18px">${u.name.split(' ')[0]}</div>
        <div style="flex:1;font-size:11px;">${u.name.replace(/^[^\s]+ /,'')} <span style="color:var(--dim)">Рів.${u.lvl}/${u.maxLvl}</span></div>
        ${!max?`<div style="font-size:10px;color:var(--orange)">${Object.entries(cost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>`:''}
        <button onclick="upgradeFishing('${id}')" ${max||!can?'disabled':''} style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid ${max?'var(--gold)':can?'var(--blue)':'var(--border)'};background:transparent;color:${max?'var(--gold)':can?'var(--blue)':'var(--dim)'};cursor:${max||!can?'not-allowed':'pointer'};">${max?'MAX':'⬆'}</button>
      </div>`;
    }).join('')}
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;margin-top:5px;">💡 Риба — їжа для воїнів і ресурс для торгівлі. Рідкісна риба дає бонуси до досліджень.</div>
  </div>`;
  div.innerHTML = html;
}

function setFishSpot(id){ FISHING_SYSTEM.activeSpot = id; renderFishingTab(); }

// ============================================================
// 4. ГРИБНИЦТВО
// ============================================================
const MUSHROOM_SYSTEM = {
  gatheredTotal: 0,
  lastGather: 0,
  cooldown: 30,
  gathering: false,
  gatherProgress: 0,
  gatherDuration: 6,
  basketLvl: 0, // покращення кошика
  knowledgeLvl: 0, // знання грибів (шанс рідкісних)
  basketMax: 10, knowledgeMax: 8,
  types: [
    { id:'common',   name:'🍄 Звичайні гриби', minEp:1, chance:0.9, amt:[3,8],   truffle:false },
    { id:'forest',   name:'🌲 Лісові гриби',   minEp:1, chance:0.7, amt:[2,6],   truffle:false },
    { id:'chanterelle',name:'🟡 Лисички',       minEp:2, chance:0.5, amt:[2,5],   truffle:false },
    { id:'porcini',  name:'🟫 Білі гриби',     minEp:3, chance:0.35,amt:[1,3],   truffle:false },
    { id:'truffle',  name:'⚫ Трюфель',        minEp:5, chance:0.1, amt:[1,2],   truffle:true  },
  ],
};

function startMushroomGather(){
  let sys = MUSHROOM_SYSTEM;
  if(sys.gathering){ showExpToast('🍄 Вже збираємо!'); return; }
  let now = Date.now()/1000;
  if(now - sys.lastGather < sys.cooldown){ showExpToast(`⏳ ${Math.ceil(sys.cooldown-(now-sys.lastGather))}с`); return; }
  sys.gathering = true; sys.gatherProgress = 0;
  renderMushroomTab();
  let dur = Math.max(3, sys.gatherDuration - Math.floor(sys.basketLvl/2));
  let el=0;
  let timer = setInterval(()=>{
    el++; sys.gatherProgress=el/dur*100;
    let b=document.getElementById('mush-progress-bar'); if(b) b.style.width=sys.gatherProgress+'%';
    if(el>=dur){ clearInterval(timer); finishMushroomGather(); }
  },1000);
}

function finishMushroomGather(){
  let sys = MUSHROOM_SYSTEM;
  sys.gathering=false; sys.gatherProgress=0; sys.lastGather=Date.now()/1000;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let available=sys.types.filter(t=>ep>=t.minEp);
  let knowledgeBonus = sys.knowledgeLvl * 0.03;
  let basketBonus = sys.basketLvl;
  let totalMush=0, totalTruffle=0;
  available.forEach(t=>{
    if(Math.random()<t.chance+knowledgeBonus){
      let amt=rndRange(t.amt[0],t.amt[1]+basketBonus);
      if(t.truffle){ totalTruffle+=amt; if(typeof storage!=='undefined') storage.truffle=(storage.truffle||0)+amt; }
      else { totalMush+=amt; if(typeof storage!=='undefined') storage.mushroom=(storage.mushroom||0)+amt; }
    }
  });
  sys.gatheredTotal += totalMush + totalTruffle;
  let msg = totalMush||totalTruffle ? `🍄 +${totalMush}🍄${totalTruffle?` +${totalTruffle}⚫ Трюфель!`:''}` : '🍄 Нічого не знайдено';
  if(typeof addLog==='function') addLog(msg, totalTruffle>0);
  if(totalMush||totalTruffle) showExpToast(msg);
  if(typeof markDirty==='function') markDirty('full');
  renderMushroomTab();
}

function upgradeMushroomBasket(){
  let sys = MUSHROOM_SYSTEM;
  if(sys.basketLvl>=sys.basketMax){ showExpToast('Максимум!'); return; }
  let cost={logs:Math.floor(20*Math.pow(1.6,sys.basketLvl)), fiber:Math.floor(15*Math.pow(1.6,sys.basketLvl))};
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  sys.basketLvl++;
  if(typeof addLog==='function') addLog(`🧺 Кошик → Рів.${sys.basketLvl}`);
  if(typeof markDirty==='function') markDirty('full');
  renderMushroomTab();
}

function upgradeMushroomKnowledge(){
  let sys = MUSHROOM_SYSTEM;
  if(sys.knowledgeLvl>=sys.knowledgeMax){ showExpToast('Максимум!'); return; }
  let cost={books:Math.floor(10*Math.pow(1.8,sys.knowledgeLvl)), paper:Math.floor(8*Math.pow(1.8,sys.knowledgeLvl))};
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  sys.knowledgeLvl++;
  if(typeof addLog==='function') addLog(`📚 Знання грибів → Рів.${sys.knowledgeLvl}`);
  if(typeof markDirty==='function') markDirty('full');
  renderMushroomTab();
}

function renderMushroomTab(){
  let div=document.getElementById('tab-mushroom-content'); if(!div) return;
  let sys=MUSHROOM_SYSTEM;
  let now=Date.now()/1000;
  let cdRem=Math.max(0,Math.ceil(sys.cooldown-(now-sys.lastGather)));
  let mush=typeof storage!=='undefined'?(storage.mushroom||0):0;
  let truf=typeof storage!=='undefined'?(storage.truffle||0):0;
  let bCost={logs:Math.floor(20*Math.pow(1.6,sys.basketLvl)),fiber:Math.floor(15*Math.pow(1.6,sys.basketLvl))};
  let kCost={books:Math.floor(10*Math.pow(1.8,sys.knowledgeLvl)),paper:Math.floor(8*Math.pow(1.8,sys.knowledgeLvl))};
  let canB=typeof storage==='undefined'||Object.keys(bCost).every(k=>(storage[k]||0)>=bCost[k]);
  let canK=typeof storage==='undefined'||Object.keys(kCost).every(k=>(storage[k]||0)>=kCost[k]);
  let html=`<div style="padding:4px;">
    <div class="sh">🍄 ГРИБНИЦТВО</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🍄</div><b style="color:var(--green)">${fmt2(mush)}</b><div style="font-size:9px;color:var(--dim)">Гриби</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>⚫</div><b style="color:var(--purple)">${fmt2(truf)}</b><div style="font-size:9px;color:var(--dim)">Трюфелі</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🍄</div><b>${sys.gatheredTotal}</b><div style="font-size:9px;color:var(--dim)">Всього</div></div>
    </div>
    ${sys.gathering?`<div style="height:6px;background:#070a0f;border:1px solid var(--green);margin-bottom:6px;"><div id="mush-progress-bar" style="height:100%;background:var(--green);width:${sys.gatherProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startMushroomGather()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--green)'};background:rgba(78,203,113,.1);color:${cdRem>0?'var(--dim)':'var(--green)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🍄 ЗБИРАТИ ГРИБИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">🧺 Кошик Рів.${sys.basketLvl}/${sys.basketMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${sys.basketLvl} до кількості</div>
        ${sys.basketLvl<sys.basketMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(bCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeMushroomBasket()" ${!canB?'disabled':''} style="width:100%;font-family:var(--font);font-size:10px;padding:4px;border:1px solid ${canB?'var(--green)':'var(--border)'};background:transparent;color:${canB?'var(--green)':'var(--dim)'};cursor:${canB?'pointer':'not-allowed'};margin-top:4px;">⬆ ПОКРАЩИТИ</button>`:'<div style="font-size:10px;color:var(--gold)">✅ МАКСИМУМ</div>'}
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">📚 Знання Рів.${sys.knowledgeLvl}/${sys.knowledgeMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${(sys.knowledgeLvl*3)}% рідкісних</div>
        ${sys.knowledgeLvl<sys.knowledgeMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(kCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeMushroomKnowledge()" ${!canK?'disabled':''} style="width:100%;font-family:var(--font);font-size:10px;padding:4px;border:1px solid ${canK?'var(--blue)':'var(--border)'};background:transparent;color:${canK?'var(--blue)':'var(--dim)'};cursor:${canK?'pointer':'not-allowed'};margin-top:4px;">⬆ ВЧИТИСЬ</button>`:'<div style="font-size:10px;color:var(--gold)">✅ МАКСИМУМ</div>'}
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 Гриби — їжа та інгредієнт для зілля. Трюфелі — рідкісний делікатес, +5% до Синтезу за 1 трюфель.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 5. ТРАВНИЦТВО
// ============================================================
const HERB_SYSTEM = {
  harvestedTotal: 0,
  lastHarvest: 0,
  cooldown: 40,
  harvesting: false,
  harvestProgress: 0,
  harvestDuration: 8,
  dryingRackLvl: 0, // покращення сушарки
  alchemyLvl: 0,    // знання алхімії
  dryingMax: 8, alchemyMax: 8,
  herbs: [
    { id:'nettle',   name:'🌿 Кропива',       minEp:1, chance:0.85, amt:[3,7],  rare:false },
    { id:'mint',     name:'🌱 М\'ята',          minEp:1, chance:0.7,  amt:[2,5],  rare:false },
    { id:'lavender', name:'💜 Лаванда',         minEp:2, chance:0.5,  amt:[2,4],  rare:false },
    { id:'chamomile',name:'🌼 Ромашка',         minEp:2, chance:0.55, amt:[2,5],  rare:false },
    { id:'valerian', name:'🌸 Рідкісна трава',  minEp:3, chance:0.2,  amt:[1,3],  rare:true  },
    { id:'mandrake', name:'🌺 Мандрагора',      minEp:5, chance:0.1,  amt:[1,2],  rare:true  },
  ],
};

function startHerbHarvest(){
  let sys=HERB_SYSTEM;
  if(sys.harvesting){ showExpToast('🌿 Вже збираємо!'); return; }
  let now=Date.now()/1000;
  if(now-sys.lastHarvest<sys.cooldown){ showExpToast(`⏳ ${Math.ceil(sys.cooldown-(now-sys.lastHarvest))}с`); return; }
  sys.harvesting=true; sys.harvestProgress=0;
  renderHerbTab();
  let dur=Math.max(3,sys.harvestDuration-Math.floor(sys.dryingRackLvl/2));
  let el=0;
  let timer=setInterval(()=>{
    el++; sys.harvestProgress=el/dur*100;
    let b=document.getElementById('herb-progress-bar'); if(b) b.style.width=sys.harvestProgress+'%';
    if(el>=dur){ clearInterval(timer); finishHerbHarvest(); }
  },1000);
}

function finishHerbHarvest(){
  let sys=HERB_SYSTEM;
  sys.harvesting=false; sys.harvestProgress=0; sys.lastHarvest=Date.now()/1000;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let alchBonus=sys.alchemyLvl*0.04;
  let rackBonus=sys.dryingRackLvl;
  let totalHerb=0, totalRare=0;
  sys.herbs.filter(h=>ep>=h.minEp).forEach(h=>{
    if(Math.random()<h.chance+alchBonus){
      let amt=rndRange(h.amt[0],h.amt[1]+rackBonus);
      if(h.rare){ totalRare+=amt; if(typeof storage!=='undefined') storage.rare_herb=(storage.rare_herb||0)+amt; }
      else { totalHerb+=amt; if(typeof storage!=='undefined') storage.herb=(storage.herb||0)+amt; }
    }
  });
  sys.harvestedTotal+=totalHerb+totalRare;
  let msg=totalHerb||totalRare?`🌿 +${totalHerb}🌿${totalRare?` +${totalRare}🌸 Рідкісна!`:''}`:'🌿 Нічого не знайдено';
  if(typeof addLog==='function') addLog(msg,totalRare>0);
  if(totalHerb||totalRare) showExpToast(msg);
  if(typeof markDirty==='function') markDirty('full');
  renderHerbTab();
}

function upgradeHerbDrying(){
  let sys=HERB_SYSTEM;
  if(sys.dryingRackLvl>=sys.dryingMax) return;
  let cost={wood:Math.floor(15*Math.pow(1.5,sys.dryingRackLvl)),fiber:Math.floor(20*Math.pow(1.5,sys.dryingRackLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.dryingRackLvl++; if(typeof addLog==='function') addLog(`🌿 Сушарка → Рів.${sys.dryingRackLvl}`);
  if(typeof markDirty==='function') markDirty('full'); renderHerbTab();
}

function upgradeHerbAlchemy(){
  let sys=HERB_SYSTEM;
  if(sys.alchemyLvl>=sys.alchemyMax) return;
  let cost={books:Math.floor(15*Math.pow(1.7,sys.alchemyLvl)),paper:Math.floor(10*Math.pow(1.7,sys.alchemyLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.alchemyLvl++; if(typeof addLog==='function') addLog(`⚗️ Алхімія → Рів.${sys.alchemyLvl}`);
  if(typeof markDirty==='function') markDirty('full'); renderHerbTab();
}

function renderHerbTab(){
  let div=document.getElementById('tab-herb-content'); if(!div) return;
  let sys=HERB_SYSTEM;
  let now=Date.now()/1000; let cdRem=Math.max(0,Math.ceil(sys.cooldown-(now-sys.lastHarvest)));
  let herb=typeof storage!=='undefined'?(storage.herb||0):0;
  let rare=typeof storage!=='undefined'?(storage.rare_herb||0):0;
  let dCost={wood:Math.floor(15*Math.pow(1.5,sys.dryingRackLvl)),fiber:Math.floor(20*Math.pow(1.5,sys.dryingRackLvl))};
  let aCost={books:Math.floor(15*Math.pow(1.7,sys.alchemyLvl)),paper:Math.floor(10*Math.pow(1.7,sys.alchemyLvl))};
  let canD=typeof storage==='undefined'||Object.keys(dCost).every(k=>(storage[k]||0)>=dCost[k]);
  let canA=typeof storage==='undefined'||Object.keys(aCost).every(k=>(storage[k]||0)>=aCost[k]);
  let html=`<div style="padding:4px;">
    <div class="sh">🌿 ТРАВНИЦТВО</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🌿</div><b style="color:var(--green)">${fmt2(herb)}</b><div style="font-size:9px;color:var(--dim)">Трави</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🌸</div><b style="color:var(--purple)">${fmt2(rare)}</b><div style="font-size:9px;color:var(--dim)">Рідкісні</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🌿</div><b>${sys.harvestedTotal}</b><div style="font-size:9px;color:var(--dim)">Всього</div></div>
    </div>
    ${sys.harvesting?`<div style="height:6px;background:#070a0f;border:1px solid var(--teal);margin-bottom:6px;"><div id="herb-progress-bar" style="height:100%;background:var(--teal);width:${sys.harvestProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startHerbHarvest()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--teal)'};background:rgba(74,184,160,.1);color:${cdRem>0?'var(--dim)':'var(--teal)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🌿 ЗБИРАТИ ТРАВИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">🌿 Сушарка Рів.${sys.dryingRackLvl}/${sys.dryingMax}</div>
        ${sys.dryingRackLvl<sys.dryingMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(dCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeHerbDrying()" ${!canD?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:4px;border:1px solid ${canD?'var(--teal)':'var(--border)'};background:transparent;color:${canD?'var(--teal)':'var(--dim)'};cursor:${canD?'pointer':'not-allowed'};margin-top:4px;">⬆</button>`:'<div style="font-size:10px;color:var(--gold)">MAX</div>'}
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">⚗️ Алхімія Рів.${sys.alchemyLvl}/${sys.alchemyMax}</div>
        ${sys.alchemyLvl<sys.alchemyMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(aCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeHerbAlchemy()" ${!canA?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:4px;border:1px solid ${canA?'var(--purple)':'var(--border)'};background:transparent;color:${canA?'var(--purple)':'var(--dim)'};cursor:${canA?'pointer':'not-allowed'};margin-top:4px;">⬆</button>`:'<div style="font-size:10px;color:var(--gold)">MAX</div>'}
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 Трави використовуються в алхімії та медицині. Рідкісні трави дають бонуси до HP воїнів.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 6. ГЕОЛОГІЧНА РОЗВІДКА
// ============================================================
const GEOLOGY_SYSTEM = {
  expeditionsTotal: 0,
  lastExpedition: 0,
  cooldown: 120,
  exploring: false,
  exploreProgress: 0,
  exploreDuration: 20,
  expeditionLvl: 0, // рівень команди геологів
  equipLvl: 0,      // рівень обладнання
  expeditionMax: 10, equipMax: 10,
  discoveredDeposits: [],
  maxDeposits: 20,
  deposits: [
    { id:'coal_vein',  name:'🕳 Вугільна жила',  minEp:2, chance:0.4, resource:'charcoal', min:20, max:50,  rarity:'звичайна' },
    { id:'iron_vein',  name:'🔩 Залізна жила',   minEp:3, chance:0.3, resource:'iron',     min:15, max:40,  rarity:'рідкісна' },
    { id:'copper_ore', name:'🟤 Мідна руда',      minEp:3, chance:0.35,resource:'copper',   min:15, max:35,  rarity:'рідкісна' },
    { id:'gem_deposit',name:'💎 Коштовне каміння',minEp:3, chance:0.15,resource:'gem',      min:3,  max:8,   rarity:'цінна'    },
    { id:'oil_pocket', name:'🛢 Нафтова кишеня', minEp:7, chance:0.25,resource:'oil',      min:30, max:80,  rarity:'цінна'    },
    { id:'crystal_cave',name:'🔮 Кристальна печера',minEp:5,chance:0.1,resource:'crystal', min:5,  max:15,  rarity:'рідкісна' },
    { id:'fossil_site',name:'🦴 Скам\'янілості',   minEp:6, chance:0.2, resource:'fossil',  min:10, max:25,  rarity:'звичайна' },
    { id:'silicon_vein',name:'💎 Кремнієва жила',  minEp:9, chance:0.15,resource:'silicon', min:5,  max:15,  rarity:'цінна'    },
  ],
  activeDeposit: null,  // поточне активне родовище для видобутку
  miningCooldown: 30,
  lastMined: 0,
};

function startGeologyExpedition(){
  let sys=GEOLOGY_SYSTEM;
  if(sys.exploring){ showExpToast('🔍 Вже досліджуємо!'); return; }
  let now=Date.now()/1000; let cd=sys.cooldown-sys.expeditionLvl*5;
  if(now-sys.lastExpedition<cd){ showExpToast(`⏳ ${Math.ceil(cd-(now-sys.lastExpedition))}с`); return; }
  if(sys.discoveredDeposits.length>=sys.maxDeposits){ showExpToast('🗺 Усі родовища вже знайдено!'); return; }
  sys.exploring=true; sys.exploreProgress=0;
  renderGeologyTab();
  let dur=Math.max(8,sys.exploreDuration-sys.equipLvl*2);
  let el=0;
  let timer=setInterval(()=>{
    el++; sys.exploreProgress=el/dur*100;
    let b=document.getElementById('geo-progress-bar'); if(b) b.style.width=sys.exploreProgress+'%';
    if(el>=dur){ clearInterval(timer); finishGeologyExpedition(); }
  },1000);
}

function finishGeologyExpedition(){
  let sys=GEOLOGY_SYSTEM;
  sys.exploring=false; sys.exploreProgress=0; sys.lastExpedition=Date.now()/1000; sys.expeditionsTotal++;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let available=sys.deposits.filter(d=>ep>=d.minEp&&!sys.discoveredDeposits.find(dd=>dd.id===d.id));
  if(!available.length){ if(typeof addLog==='function') addLog('🗺 Всі можливі родовища вже знайдено!'); renderGeologyTab(); return; }
  let eqBonus=sys.equipLvl*0.05;
  let found=available.filter(d=>Math.random()<d.chance+eqBonus);
  if(!found.length){ if(typeof addLog==='function') addLog('🔍 Нічого не знайдено. Продовжуйте дослідження!'); renderGeologyTab(); return; }
  found.forEach(d=>{
    sys.discoveredDeposits.push({...d, mined:0, totalReserve:rndRange(d.min*10, d.max*20)});
    if(typeof addLog==='function') addLog(`⛏️ ЗНАЙДЕНО: ${d.name} (${d.rarity})!`, true);
    showExpToast(`⛏️ ${d.name}!`);
  });
  if(typeof markDirty==='function') markDirty('full');
  renderGeologyTab();
}

function mineGeologyDeposit(idx){
  let sys=GEOLOGY_SYSTEM;
  let dep=sys.discoveredDeposits[idx]; if(!dep) return;
  let now=Date.now()/1000;
  if(now-sys.lastMined<sys.miningCooldown){ showExpToast(`⏳ ${Math.ceil(sys.miningCooldown-(now-sys.lastMined))}с`); return; }
  let ep=typeof epoch!=='undefined'?epoch:1;
  let toolBonus=1+sys.equipLvl*0.1;
  let amt=Math.floor(rndRange(dep.min,dep.max)*toolBonus);
  amt=Math.min(amt, dep.totalReserve-dep.mined);
  if(amt<=0){ showExpToast('🪨 Родовище вичерпано!'); return; }
  dep.mined+=amt; sys.lastMined=now;
  if(typeof storage!=='undefined') storage[dep.resource]=(storage[dep.resource]||0)+amt;
  let resName=typeof RES!=='undefined'?RES[dep.resource]?.n||dep.resource:dep.resource;
  let resEmoji=typeof RES!=='undefined'?RES[dep.resource]?.e||'📦':'📦';
  if(typeof addLog==='function') addLog(`⛏️ ${dep.name}: +${amt} ${resEmoji}`);
  showExpToast(`⛏️ +${amt} ${resEmoji}`);
  if(dep.mined>=dep.totalReserve){ if(typeof addLog==='function') addLog(`🪨 ${dep.name} — вичерпано!`); }
  if(typeof markDirty==='function') markDirty('full');
  renderGeologyTab();
}

function upgradeGeologyExpedition(){
  let sys=GEOLOGY_SYSTEM;
  if(sys.expeditionLvl>=sys.expeditionMax) return;
  let cost={iron:Math.floor(30*Math.pow(1.6,sys.expeditionLvl)),tools:Math.floor(20*Math.pow(1.6,sys.expeditionLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.expeditionLvl++; if(typeof markDirty==='function') markDirty('full'); renderGeologyTab();
}

function upgradeGeologyEquip(){
  let sys=GEOLOGY_SYSTEM;
  if(sys.equipLvl>=sys.equipMax) return;
  let cost={steel:Math.floor(25*Math.pow(1.7,sys.equipLvl)),iron:Math.floor(40*Math.pow(1.7,sys.equipLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.equipLvl++; if(typeof markDirty==='function') markDirty('full'); renderGeologyTab();
}

function renderGeologyTab(){
  let div=document.getElementById('tab-geology-content'); if(!div) return;
  let sys=GEOLOGY_SYSTEM;
  let now=Date.now()/1000; let cd=sys.cooldown-sys.expeditionLvl*5;
  let cdRem=Math.max(0,Math.ceil(cd-(now-sys.lastExpedition)));
  let mineCd=Math.max(0,Math.ceil(sys.miningCooldown-(now-sys.lastMined)));
  let html=`<div style="padding:4px;">
    <div class="sh">⛏️ ГЕОЛОГІЧНА РОЗВІДКА</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🗺</div><b style="color:var(--gold)">${sys.discoveredDeposits.length}</b><div style="font-size:9px;color:var(--dim)">Родовищ</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>⛏️</div><b>${sys.expeditionsTotal}</b><div style="font-size:9px;color:var(--dim)">Експедицій</div></div>
    </div>
    ${sys.exploring?`<div style="height:6px;background:#070a0f;border:1px solid var(--gold);margin-bottom:6px;"><div id="geo-progress-bar" style="height:100%;background:var(--gold);width:${sys.exploreProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startGeologyExpedition()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--gold)'};background:rgba(232,184,75,.1);color:${cdRem>0?'var(--dim)':'var(--gold)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🔍 РОЗВІДАТИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;">
        <div style="font-size:11px;">👥 Геологи Рів.${sys.expeditionLvl}/${sys.expeditionMax}</div>
        <button onclick="upgradeGeologyExpedition()" ${sys.expeditionLvl>=sys.expeditionMax?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:3px;border:1px solid var(--gold);background:transparent;color:var(--gold);cursor:pointer;margin-top:4px;">⬆ НАЙНЯТИ</button>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;">
        <div style="font-size:11px;">⛏️ Обладнання Рів.${sys.equipLvl}/${sys.equipMax}</div>
        <button onclick="upgradeGeologyEquip()" ${sys.equipLvl>=sys.equipMax?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:3px;border:1px solid var(--orange);background:transparent;color:var(--orange);cursor:pointer;margin-top:4px;">⬆ ОНОВИТИ</button>
      </div>
    </div>
    ${sys.discoveredDeposits.length>0?`
    <div class="sh">🗺 ЗНАЙДЕНІ РОДОВИЩА ${mineCd>0?`<span style="font-size:9px;color:var(--dim)">⏳ ${mineCd}с</span>`:''}</div>
    <div style="display:flex;flex-direction:column;gap:3px;">
    ${sys.discoveredDeposits.map((dep,i)=>{
      let pct=Math.min(100,(dep.mined/dep.totalReserve*100));
      let exhausted=dep.mined>=dep.totalReserve;
      let res=typeof RES!=='undefined'?RES[dep.resource]:null;
      return `<div style="background:var(--panel2);border:1px solid ${exhausted?'var(--dim)':'var(--border)'};padding:7px;opacity:${exhausted?.5:1};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span style="font-size:11px;">${dep.name}</span>
          <span style="font-size:10px;color:var(--dim)">${dep.rarity}</span>
        </div>
        <div style="height:4px;background:#070a0f;border:1px solid var(--border);margin-bottom:4px;">
          <div style="height:100%;background:${exhausted?'var(--dim)':'var(--gold)'};width:${100-pct}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;color:var(--dim)">${res?.e||'📦'} Залишок: ${dep.totalReserve-dep.mined}</span>
          <button onclick="mineGeologyDeposit(${i})" ${exhausted||mineCd>0?'disabled':''} style="font-family:var(--font);font-size:9px;padding:3px 8px;border:1px solid ${exhausted?'var(--dim)':mineCd>0?'var(--border)':'var(--orange)'};background:transparent;color:${exhausted?'var(--dim)':mineCd>0?'var(--dim)':'var(--orange)'};cursor:${exhausted||mineCd>0?'not-allowed':'pointer'};">${exhausted?'ВИЧЕРПАНО':'⛏️ КОПАТИ'}</button>
        </div>
      </div>`;
    }).join('')}
    </div>`:'<div style="font-size:11px;color:var(--dim);padding:10px;text-align:center;">Проведіть розвідку щоб знайти родовища</div>'}
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;margin-top:5px;">💡 Геологічна розвідка відкриває родовища корисних копалин. Видобуток можливий кожні ${sys.miningCooldown}с.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 7. РЕЙДИ НА ГОБЛІНСЬКІ УГІДДЯ
// ============================================================
const RAID_SYSTEM = {
  raidsTotal: 0,
  lastRaid: 0,
  cooldown: 300, // 5 хвилин між рейдами
  raiding: false,
  raidProgress: 0,
  raidDuration: 30,
  raidPower: 0,   // сила рейду (залежить від гарнізону)
  raidLevel: 0,   // рівень тактики рейдів
  raidMax: 10,
  victories: 0,
  defeats: 0,
  targets: [
    { id:'goblin_camp',   name:'🏕 Гоблінський табір', minEp:1, power:20,  loot:{goblin_loot:[5,15], wood:[20,50]},    chance:0.85 },
    { id:'goblin_village',name:'🏘 Гоблінське село',   minEp:2, power:50,  loot:{goblin_loot:[15,30],iron:[10,25]},    chance:0.7  },
    { id:'goblin_fortress',name:'🏰 Фортеця гоблінів', minEp:4, power:120, loot:{goblin_relic:[2,5], bronze:[20,40]},  chance:0.55 },
    { id:'goblin_temple', name:'⛩ Храм гоблінів',     minEp:6, power:300, loot:{goblin_relic:[5,10],gold_ore:[10,20]},chance:0.4  },
    { id:'goblin_lair',   name:'💀 Лігво вождя',       minEp:8, power:800, loot:{goblin_relic:[10,20],soul:[3,8]},     chance:0.3  },
  ],
  activeTarget: 'goblin_camp',
};

function getRaidPower(){
  let sys=RAID_SYSTEM;
  let tp=TROOP_SYSTEM;
  let base=0;
  base+=tp.garrison.sword*10+tp.garrison.archer*15+tp.garrison.knight*50+tp.garrison.mage*80+tp.garrison.elite*150;
  base*=(1+sys.raidLevel*0.1);
  return Math.floor(base);
}

function startRaid(){
  let sys=RAID_SYSTEM;
  if(sys.raiding){ showExpToast('⚔️ Рейд вже йде!'); return; }
  let now=Date.now()/1000;
  if(now-sys.lastRaid<sys.cooldown){ showExpToast(`⏳ ${Math.ceil(sys.cooldown-(now-sys.lastRaid))}с`); return; }
  let target=sys.targets.find(t=>t.id===sys.activeTarget);
  if(!target){ return; }
  let ep=typeof epoch!=='undefined'?epoch:1;
  if(ep<target.minEp){ showExpToast(`🔒 Потрібна Епоха ${target.minEp}!`); return; }
  let power=getRaidPower();
  if(power<target.power*0.5){ showExpToast(`⚔️ Недостатньо військ! Потрібна сила: ${target.power}, є: ${power}`); return; }
  sys.raiding=true; sys.raidProgress=0; sys.raidPower=power;
  renderRaidTab();
  let dur=Math.max(10,sys.raidDuration-sys.raidLevel*2);
  let el=0;
  let timer=setInterval(()=>{
    el++; sys.raidProgress=el/dur*100;
    let b=document.getElementById('raid-progress-bar'); if(b) b.style.width=sys.raidProgress+'%';
    if(el>=dur){ clearInterval(timer); finishRaid(); }
  },1000);
}

function finishRaid(){
  let sys=RAID_SYSTEM;
  sys.raiding=false; sys.raidProgress=0; sys.lastRaid=Date.now()/1000; sys.raidsTotal++;
  let target=sys.targets.find(t=>t.id===sys.activeTarget);
  if(!target){ renderRaidTab(); return; }
  let power=sys.raidPower;
  let ratio=Math.min(2, power/target.power);
  let successChance=target.chance * Math.min(1.5, ratio);
  if(Math.random()<successChance){
    sys.victories++;
    let lootStr='';
    Object.entries(target.loot).forEach(([res,[min,max]])=>{
      let mult=1+sys.raidLevel*0.1;
      let amt=Math.floor(rndRange(min,max)*mult);
      if(typeof storage!=='undefined') storage[res]=(storage[res]||0)+amt;
      let e=typeof RES!=='undefined'?RES[res]?.e||'📦':'📦';
      lootStr+=`+${amt}${e} `;
    });
    if(typeof addLog==='function') addLog(`⚔️ ПЕРЕМОГА! Рейд на ${target.name}: ${lootStr}`, true);
    showExpToast(`⚔️ ПЕРЕМОГА! ${lootStr}`);
  } else {
    sys.defeats++;
    // Втрати — рандомна часина військ
    let tp=TROOP_SYSTEM;
    let loss=Math.floor(tp.getTotalTroops()*0.05);
    if(typeof addLog==='function') addLog(`💀 Поразка в рейді! Втрати: ~${loss} воїнів`);
    showExpToast('💀 Рейд провалився!');
    // Зменшуємо трупи
    ['sword','archer','knight','mage','elite'].forEach(t=>{
      let rem=Math.floor(tp.garrison[t]*0.05);
      tp.garrison[t]=Math.max(0,tp.garrison[t]-rem);
    });
  }
  if(typeof markDirty==='function') markDirty('full');
  renderRaidTab();
}

function upgradeRaidTactics(){
  let sys=RAID_SYSTEM;
  if(sys.raidLevel>=sys.raidMax) return;
  let cost={iron:Math.floor(50*Math.pow(1.7,sys.raidLevel)),books:Math.floor(20*Math.pow(1.7,sys.raidLevel))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.raidLevel++; if(typeof addLog==='function') addLog(`⚔️ Тактика рейдів → Рів.${sys.raidLevel}`);
  if(typeof markDirty==='function') markDirty('full'); renderRaidTab();
}

function renderRaidTab(){
  let div=document.getElementById('tab-raids-content'); if(!div) return;
  let sys=RAID_SYSTEM;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let now=Date.now()/1000; let cdRem=Math.max(0,Math.ceil(sys.cooldown-(now-sys.lastRaid)));
  let power=getRaidPower();
  let loot=typeof storage!=='undefined'?(storage.goblin_loot||0):0;
  let relic=typeof storage!=='undefined'?(storage.goblin_relic||0):0;
  let html=`<div style="padding:4px;">
    <div class="sh">⚔️ РЕЙДИ НА ГОБЛІНІВ</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>⚔️</div><b style="color:var(--orange)">${power}</b><div style="font-size:9px;color:var(--dim)">Сила рейду</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🏆</div><b style="color:var(--green)">${sys.victories}</b><div style="font-size:9px;color:var(--dim)">Перемог</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>💀</div><b style="color:var(--red)">${sys.defeats}</b><div style="font-size:9px;color:var(--dim)">Поразок</div></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:5px 8px;flex:1;text-align:center;font-size:11px;">🪙 Трофеї: <b style="color:var(--gold)">${fmt2(loot)}</b></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:5px 8px;flex:1;text-align:center;font-size:11px;">🗿 Реліквії: <b style="color:var(--purple)">${fmt2(relic)}</b></div>
    </div>
    <div class="sh">🎯 ЦІЛЬ РЕЙДУ</div>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px;">
    ${sys.targets.map(t=>{
      let av=ep>=t.minEp; let sel=sys.activeTarget===t.id;
      let sufficient=power>=t.power*0.5;
      return `<div onclick="${av?`setRaidTarget('${t.id}')`:''}" style="padding:6px 8px;border:1px solid ${sel?'var(--red)':av?'var(--border)':'#0d0d0d'};background:${sel?'#1a0a0a':'var(--panel2)'};cursor:${av?'pointer':'default'};opacity:${av?1:.4};">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:11px">${t.name} ${sel?'◀':''}</span>
          <span style="font-size:9px;color:var(--dim)">Еп.${t.minEp}</span>
        </div>
        <div style="font-size:10px;color:${sufficient?'var(--teal)':'var(--red)'};margin-top:2px;">💪 Сила: ${t.power} ${sufficient?'✓':'← недостатньо'}</div>
      </div>`;
    }).join('')}
    </div>
    ${sys.raiding?`<div style="height:6px;background:#070a0f;border:1px solid var(--red);margin-bottom:6px;"><div id="raid-progress-bar" style="height:100%;background:var(--red);width:${sys.raidProgress}%;transition:width 1s;"></div></div><div style="font-size:11px;color:var(--red);text-align:center;margin-bottom:6px;">⚔️ Рейд...</div>`
    :`<button onclick="startRaid()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--red)'};background:rgba(224,85,85,.1);color:${cdRem>0?'var(--dim)':'var(--red)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'⚔️ ЗДІЙСНИТИ РЕЙД'}</button>`}
    <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
      <div style="font-size:11px;margin-bottom:4px;">🗡 Тактика рейдів Рів.${sys.raidLevel}/${sys.raidMax}</div>
      <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${sys.raidLevel*10}% до видобутку, -${sys.raidLevel*2}с часу</div>
      <button onclick="upgradeRaidTactics()" ${sys.raidLevel>=sys.raidMax?'disabled':''} style="font-family:var(--font);font-size:10px;padding:4px 12px;border:1px solid ${sys.raidLevel>=sys.raidMax?'var(--gold)':'var(--red)'};background:transparent;color:${sys.raidLevel>=sys.raidMax?'var(--gold)':'var(--red)'};cursor:${sys.raidLevel>=sys.raidMax?'not-allowed':'pointer'};">${sys.raidLevel>=sys.raidMax?'MAX':'⬆ ПОКРАЩИТИ ТАКТИКУ'}</button>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;margin-top:5px;">💡 Для рейдів потрібні воїни у Гарнізоні. Трофеї продаються або обмінюються. Реліквії дають постійні бонуси.</div>
  </div>`;
  div.innerHTML = html;
}

function setRaidTarget(id){ RAID_SYSTEM.activeTarget=id; renderRaidTab(); }

// ============================================================
// 8. РОЗВИТОК ВІЙСЬК ТА ГАРНІЗОН
// ============================================================
const TROOP_SYSTEM = {
  garrison: {
    sword: 0,   // мечники
    archer: 0,  // лучники
    knight: 0,  // лицарі
    mage: 0,    // маги
    elite: 0,   // елітні воїни
  },
  garrisonMax: 500, // ціль гри
  trainingQueue: [], // черга навчання
  trainingActive: false,
  trainingProgress: 0,
  barracks: { lvl:0, maxLvl:10 },   // казарма
  academy: { lvl:0, maxLvl:8 },     // академія
  armory: { lvl:0, maxLvl:10 },     // зброярня
  morale: 100, // моральний дух (0-100)
  moraleDecayRate: 0.1, // деградація моралі за секунду без їжі
  lastFed: Date.now()/1000,
  feedInterval: 120, // секунд між годуванням
  xp: 0,   // досвід армії
  tier: 0, // тир армії

  // Вартість і характеристики загонів
  troopDefs: {
    sword:  { name:'⚔️ Мечник',    cost:{wood:20,iron:10},       trainTime:10, power:10,  minEp:2, upkeep:{game_meat:0.01}, desc:'Базова піхота' },
    archer: { name:'🏹 Лучник',    cost:{wood:15,fiber:10,stone:5},trainTime:12, power:15,  minEp:2, upkeep:{game_meat:0.01}, desc:'Дистанційний бій' },
    knight: { name:'🛡 Лицар',     cost:{iron:30,bronze:15},      trainTime:30, power:50,  minEp:5, upkeep:{game_meat:0.02}, desc:'Важка кавалерія' },
    mage:   { name:'🧙 Маг',       cost:{books:20,synth_energy:30},trainTime:45, power:80,  minEp:6, upkeep:{herb:0.01},      desc:'Магічна підтримка' },
    elite:  { name:'💂 Елітний',   cost:{steel:25,chips:10},      trainTime:60, power:150, minEp:8, upkeep:{game_meat:0.03}, desc:'Найкраще спорядження' },
  },

  getTotalTroops(){ return Object.values(this.garrison).reduce((s,v)=>s+v,0); },
  getCombatPower(){
    let p=0;
    Object.entries(this.garrison).forEach(([t,n])=>{
      p+=n*(this.troopDefs[t]?.power||0);
    });
    return Math.floor(p*(1+this.morale/200)*(1+this.armory.lvl*0.05)*(1+this.xp/1000));
  },
};

function trainTroop(type){
  let sys=TROOP_SYSTEM;
  let def=sys.troopDefs[type]; if(!def) return;
  let ep=typeof epoch!=='undefined'?epoch:1;
  if(ep<def.minEp){ showExpToast(`🔒 Потрібна Епоха ${def.minEp}!`); return; }
  if(sys.getTotalTroops()>=sys.garrisonMax){ showExpToast('⚠️ Гарнізон повний!'); return; }
  let barBonus=sys.barracks.lvl;
  let cost={}; Object.entries(def.cost).forEach(([k,v])=>cost[k]=Math.max(1,Math.floor(v*(1-barBonus*0.03))));
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо ресурсів!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  let time=Math.max(3,def.trainTime-sys.academy.lvl*2);
  sys.trainingQueue.push({type, timeLeft:time, totalTime:time});
  if(!sys.trainingActive) processTrainingQueue();
  if(typeof addLog==='function') addLog(`🎖 ${def.name} набраний до черги`);
  if(typeof markDirty==='function') markDirty('full');
  renderTroopTab();
}

function trainTroopBulk(type, n){
  for(let i=0;i<n;i++) trainTroop(type);
}

let _trainingTimer=null;
function processTrainingQueue(){
  let sys=TROOP_SYSTEM;
  if(!sys.trainingQueue.length){ sys.trainingActive=false; return; }
  sys.trainingActive=true;
  let current=sys.trainingQueue[0];
  _trainingTimer=setInterval(()=>{
    current.timeLeft--;
    sys.trainingProgress=(1-current.timeLeft/current.totalTime)*100;
    let b=document.getElementById('troop-train-bar'); if(b) b.style.width=sys.trainingProgress+'%';
    if(current.timeLeft<=0){
      clearInterval(_trainingTimer);
      sys.garrison[current.type]=(sys.garrison[current.type]||0)+1;
      sys.xp+=sys.troopDefs[current.type]?.power||10;
      sys.trainingQueue.shift();
      if(typeof addLog==='function') addLog(`🎖 ${sys.troopDefs[current.type]?.name} готовий до бою!`);
      if(sys.getTotalTroops()>=sys.garrisonMax && sys.xp>500){
        if(typeof addLog==='function') addLog('🏆 ГАРНІЗОН УКОМПЛЕКТОВАНО! Ціль виконана!', true);
      }
      sys.trainingProgress=0;
      if(typeof markDirty==='function') markDirty('full');
      renderTroopTab();
      if(sys.trainingQueue.length) processTrainingQueue();
      else sys.trainingActive=false;
    }
  },1000);
}

function upgradeBarracks(){
  let sys=TROOP_SYSTEM;
  if(sys.barracks.lvl>=sys.barracks.maxLvl) return;
  let cost={boards:Math.floor(40*Math.pow(1.6,sys.barracks.lvl)),stone:Math.floor(50*Math.pow(1.6,sys.barracks.lvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.barracks.lvl++; if(typeof markDirty==='function') markDirty('full'); renderTroopTab();
}

function upgradeAcademy(){
  let sys=TROOP_SYSTEM;
  if(sys.academy.lvl>=sys.academy.maxLvl) return;
  let cost={books:Math.floor(30*Math.pow(1.7,sys.academy.lvl)),iron:Math.floor(40*Math.pow(1.7,sys.academy.lvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.academy.lvl++; if(typeof markDirty==='function') markDirty('full'); renderTroopTab();
}

function upgradeArmory(){
  let sys=TROOP_SYSTEM;
  if(sys.armory.lvl>=sys.armory.maxLvl) return;
  let cost={steel:Math.floor(30*Math.pow(1.7,sys.armory.lvl)),tools:Math.floor(30*Math.pow(1.7,sys.armory.lvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.armory.lvl++; if(typeof markDirty==='function') markDirty('full'); renderTroopTab();
}

function feedTroops(){
  let sys=TROOP_SYSTEM;
  let n=sys.getTotalTroops();
  if(!n){ showExpToast('ℹ️ Немає воїнів'); return; }
  let meatNeeded=Math.ceil(n*0.5);
  if(typeof storage!=='undefined'&&(storage.game_meat||0)<meatNeeded){ showExpToast(`⚠️ Потрібно ${meatNeeded} 🍖`); return; }
  if(typeof storage!=='undefined') storage.game_meat=(storage.game_meat||0)-meatNeeded;
  sys.morale=Math.min(100,sys.morale+20);
  sys.lastFed=Date.now()/1000;
  if(typeof addLog==='function') addLog(`🍖 Воїнів нагодовано. Моральний дух: ${sys.morale}%`);
  if(typeof markDirty==='function') markDirty('full');
  renderTroopTab();
}

function dismissTroop(type, n){
  let sys=TROOP_SYSTEM;
  sys.garrison[type]=Math.max(0,(sys.garrison[type]||0)-n);
  if(typeof addLog==='function') addLog(`🏠 ${n} ${sys.troopDefs[type]?.name} відпущені`);
  if(typeof markDirty==='function') markDirty('full');
  renderTroopTab();
}

function renderTroopTab(){
  let div=document.getElementById('tab-troops-content'); if(!div) return;
  let sys=TROOP_SYSTEM;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let total=sys.getTotalTroops();
  let power=sys.getCombatPower();
  let pct=(total/sys.garrisonMax*100).toFixed(1);
  let moraleColor=sys.morale>70?'var(--green)':sys.morale>40?'var(--orange)':'var(--red)';
  let html=`<div style="padding:4px;">
    <div class="sh">⚔️ ГАРНІЗОН ТА АРМІЯ</div>
    <div style="background:#0a0808;border:1px solid var(--red);padding:8px;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:11px;">🎖 Гарнізон: <b style="color:var(--orange)">${total}</b> / ${sys.garrisonMax}</span>
        <span style="font-size:11px;color:var(--red)">💪 Сила: <b>${power}</b></span>
      </div>
      <div style="height:6px;background:#070a0f;border:1px solid var(--border);margin-bottom:5px;">
        <div style="height:100%;background:${total>=sys.garrisonMax?'var(--gold)':'var(--orange)'};width:${Math.min(100,pct)}%;transition:width .5s;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);">
        <span>😤 Моральний дух: <b style="color:${moraleColor}">${sys.morale}%</b></span>
        <span>⚔️ Досвід: ${sys.xp}</span>
      </div>
      ${total>0?`<button onclick="feedTroops()" style="margin-top:6px;width:100%;font-family:var(--font);font-size:10px;padding:5px;border:1px solid var(--green);background:rgba(78,203,113,.1);color:var(--green);cursor:pointer;">🍖 НАГОДУВАТИ (${Math.ceil(total*0.5)}🍖)</button>`:''}
    </div>
    <div class="sh">🎖 ЗАГОНИ</div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
    ${Object.entries(sys.troopDefs).map(([type,def])=>{
      let av=ep>=def.minEp;
      let cnt=sys.garrison[type]||0;
      let bCost={};Object.entries(def.cost).forEach(([k,v])=>bCost[k]=Math.max(1,Math.floor(v*(1-sys.barracks.lvl*0.03))));
      let can=av&&typeof storage==='undefined'||Object.keys(bCost).every(k=>(storage[k]||0)>=bCost[k]);
      let canAfford=typeof storage==='undefined'||Object.keys(bCost).every(k=>(storage[k]||0)>=bCost[k]);
      return `<div style="background:var(--panel2);border:1px solid var(--border);padding:7px;opacity:${av?1:.4};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <div>
            <span style="font-size:11px">${def.name}</span>
            <span style="font-size:10px;color:var(--dim);margin-left:6px">${def.desc}</span>
          </div>
          <span style="font-size:12px;color:var(--orange);font-weight:bold;">${cnt}</span>
        </div>
        <div style="font-size:10px;color:var(--dim);margin-bottom:4px;">💪 Сила: ${def.power} · ⏱ ${Math.max(3,def.trainTime-sys.academy.lvl*2)}с · Еп.${def.minEp}</div>
        <div style="font-size:10px;color:var(--orange);margin-bottom:4px;">${Object.entries(bCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        ${av?`<div style="display:flex;gap:3px;flex-wrap:wrap;">
          <button onclick="trainTroop('${type}')" ${!canAfford||total>=sys.garrisonMax?'disabled':''} style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid ${canAfford?'var(--green)':'var(--border)'};background:transparent;color:${canAfford?'var(--green)':'var(--dim)'};cursor:${canAfford&&total<sys.garrisonMax?'pointer':'not-allowed'};">+1</button>
          <button onclick="trainTroopBulk('${type}',5)" ${!canAfford||total+5>sys.garrisonMax?'disabled':''} style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid ${canAfford?'var(--blue)':'var(--border)'};background:transparent;color:${canAfford?'var(--blue)':'var(--dim)'};cursor:${canAfford?'pointer':'not-allowed'};">+5</button>
          ${cnt>0?`<button onclick="dismissTroop('${type}',1)" style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid var(--red);background:transparent;color:var(--red);cursor:pointer;">-1</button>`:''}
        </div>`:'<div style="font-size:10px;color:var(--dim)">🔒 Відкривається в Еп.'+def.minEp+'</div>'}
      </div>`;
    }).join('')}
    </div>
    ${sys.trainingActive?`<div style="margin-bottom:6px;"><div style="font-size:11px;color:var(--gold);margin-bottom:3px;">⚔️ Навчання: ${sys.troopDefs[sys.trainingQueue[0]?.type]?.name||''} (черга: ${sys.trainingQueue.length})</div><div style="height:6px;background:#070a0f;border:1px solid var(--gold);"><div id="troop-train-bar" style="height:100%;background:var(--gold);width:${sys.trainingProgress}%;transition:width 1s;"></div></div></div>`:''}
    <div class="sh">🏰 СПОРУДИ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;text-align:center;">
        <div style="font-size:12px;">🏟</div>
        <div style="font-size:10px;">Казарма Рів.${sys.barracks.lvl}</div>
        <button onclick="upgradeBarracks()" ${sys.barracks.lvl>=sys.barracks.maxLvl?'disabled':''} style="width:100%;font-family:var(--font);font-size:8px;padding:3px;border:1px solid var(--orange);background:transparent;color:var(--orange);cursor:pointer;margin-top:3px;">${sys.barracks.lvl>=sys.barracks.maxLvl?'MAX':'⬆'}</button>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;text-align:center;">
        <div style="font-size:12px;">📚</div>
        <div style="font-size:10px;">Академія Рів.${sys.academy.lvl}</div>
        <button onclick="upgradeAcademy()" ${sys.academy.lvl>=sys.academy.maxLvl?'disabled':''} style="width:100%;font-family:var(--font);font-size:8px;padding:3px;border:1px solid var(--blue);background:transparent;color:var(--blue);cursor:pointer;margin-top:3px;">${sys.academy.lvl>=sys.academy.maxLvl?'MAX':'⬆'}</button>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;text-align:center;">
        <div style="font-size:12px;">⚒️</div>
        <div style="font-size:10px;">Зброярня Рів.${sys.armory.lvl}</div>
        <button onclick="upgradeArmory()" ${sys.armory.lvl>=sys.armory.maxLvl?'disabled':''} style="width:100%;font-family:var(--font);font-size:8px;padding:3px;border:1px solid var(--purple);background:transparent;color:var(--purple);cursor:pointer;margin-top:3px;">${sys.armory.lvl>=sys.armory.maxLvl?'MAX':'⬆'}</button>
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 ЦІЛЬ: сформуйте Гарнізон з ${sys.garrisonMax} воїнів. Воїни потрібні для Рейдів та захисту від Гоблінів.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 9. ЦІЛ ГРАВЦЯ (Лор та прогрес до перемоги)
// ============================================================
function renderLoreTab(){
  let div=document.getElementById('tab-lore-content'); if(!div) return;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let souls=SOUL_SYSTEM.totalFound;
  let troops=TROOP_SYSTEM.getTotalTroops();
  let gobWaves=typeof goblinWave!=='undefined'?goblinWave.totalWaves:0;
  let geoDeposits=GEOLOGY_SYSTEM.discoveredDeposits.length;
  
  let victories=[
    { text:'Пройдено 12 Епох',      done:ep>=12,  prog:`Еп.${ep}/12` },
    { text:'100 Душ Стародавніх',   done:souls>=100, prog:`${souls}/100` },
    { text:'Гарнізон 500 воїнів',   done:troops>=500, prog:`${troops}/500` },
    { text:'50 хвиль гоблінів',     done:gobWaves>=50, prog:`${gobWaves}/50` },
    { text:'10 родовищ георозвідки',done:geoDeposits>=10, prog:`${geoDeposits}/10` },
  ];
  let doneCnt=victories.filter(v=>v.done).length;
  
  let html=`<div style="padding:4px;">
    <div style="background:linear-gradient(135deg,#0a050f,#050a15);border:2px solid var(--purple);padding:10px;margin-bottom:8px;">
      <div style="font-family:var(--font2);font-size:9px;color:var(--gold);margin-bottom:6px;">📖 ${GAME_LORE.title}</div>
      <div style="font-size:10px;color:var(--dim);line-height:1.6;margin-bottom:6px;">${GAME_LORE.subtitle}</div>
      <div style="font-size:11px;color:var(--text);line-height:1.6;">${GAME_LORE.intro}</div>
    </div>
    
    <div class="sh">🏆 ЦІЛЬ ГРИ <span class="sh-badge">${doneCnt}/${victories.length}</span></div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
    ${victories.map(v=>`<div style="background:var(--panel2);border:1px solid ${v.done?'var(--gold)':'var(--border)'};padding:7px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:11px;color:${v.done?'var(--gold)':'var(--text)'}">${v.done?'✅':'◻️'} ${v.text}</span>
      <span style="font-size:11px;color:${v.done?'var(--gold)':'var(--dim)'}">${v.done?'ВИКОНАНО':v.prog}</span>
    </div>`).join('')}
    </div>
    ${doneCnt>=victories.length?`<div style="background:linear-gradient(135deg,#1a0a00,#0a100a);border:2px solid var(--gold);padding:12px;text-align:center;">
      <div style="font-family:var(--font2);font-size:11px;color:var(--gold);margin-bottom:6px;">🏆 ПЕРЕМОГА!</div>
      <div style="font-size:11px;color:var(--text);">Ти досяг вершини Кубічної Еволюції! Легенда записана у зірках.</div>
    </div>`:''}
    
    <div class="sh">📖 РОЗДІЛИ</div>
    <div style="display:flex;flex-direction:column;gap:3px;">
    ${GAME_LORE.chapters.map(ch=>{
      let done=ep>=ch.ep[1]; let active=ep>=ch.ep[0]&&ep<=ch.ep[1];
      return `<div style="background:${active?'#0a1a08':done?'var(--panel2)':'#070a0f'};border:1px solid ${active?'var(--green)':done?'var(--border)':'#0d0d0d'};padding:6px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:11px;color:${active?'var(--green)':done?'var(--dim)':'#333'}">${done?'✅':active?'▶':''} ${ch.name}</span>
          <span style="font-size:10px;color:var(--dim)">Еп.${ch.ep[0]}-${ch.ep[1]}</span>
        </div>
        <div style="font-size:10px;color:var(--dim);margin-top:2px;">${ch.desc}</div>
      </div>`;
    }).join('')}
    </div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ============================================================
function rndRange(min,max){ return min + Math.floor(Math.random()*(max-min+1)); }
function fmt2(n){ if(typeof fmt==='function') return fmt(n); return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':Math.floor(n)+''; }
function showExpToast(msg){
  if(typeof showToast==='function'){ showToast(msg); return; }
  // Fallback
  let el=document.getElementById('toast');
  if(el){ el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2500); }
}

// ============================================================
// ПАСИВНИЙ ДОХІД ВІД РОЗШИРЕНЬ (інтегрується в основний тік)
// ============================================================
setInterval(()=>{
  // Пастки для мисливства
  let ht=HUNTING_SYSTEM;
  let trap=ht.trapPassive;
  if(trap>0&&typeof storage!=='undefined'){
    storage.game_meat=(storage.game_meat||0)+trap;
  }
  // Годування воїнів — деградація моралі
  let tr=TROOP_SYSTEM;
  let now=Date.now()/1000;
  if(tr.getTotalTroops()>0&&now-tr.lastFed>tr.feedInterval){
    tr.morale=Math.max(0,tr.morale-1);
    if(tr.morale===0&&typeof addLog==='function'){ addLog('😟 Моральний дух воїнів впав до нуля!'); }
  }
}, 1000);

// ============================================================
// ІНТЕГРАЦІЯ: бонус від Душ Стародавніх множить виробничий мультиплікатор
// ============================================================
(function patchProductionMult(){
  // Синхронний патч — expansions.js завантажено після index.html
  if(typeof getCityProductionMult==='undefined'){
    console.error('[expansions] КРИТИЧНО: getCityProductionMult не знайдено!');
    return;
  }
  let _orig=getCityProductionMult;
  window.getCityProductionMult=function(){
    let base=_orig();
    let soulBonus=1+SOUL_SYSTEM.passiveBonus;
    return base*soulBonus;
  };
})();

// ============================================================
// ІНІЦІАЛІЗАЦІЯ UI ВКЛАДОК
// ============================================================
function initExpansionTabs(){
  // Додаємо нові вкладки до лівої панелі
  let tabsEl=document.querySelector('.panel-tabs');
  if(!tabsEl) return;

  const newTabs=[
    { id:'lore',    label:'📖 ЛОР',      fn:'renderLoreTab' },
    { id:'souls',   label:'👻 ДУШІ',     fn:'renderSoulTab' },
    { id:'hunting', label:'🏹 МИСЛ.',    fn:'renderHuntingTab' },
    { id:'fishing', label:'🎣 РИБА',     fn:'renderFishingTab' },
    { id:'mushroom',label:'🍄 ГРИБИ',    fn:'renderMushroomTab' },
    { id:'herb',    label:'🌿 ТРАВИ',    fn:'renderHerbTab' },
    { id:'geology', label:'⛏️ ГЕО',      fn:'renderGeologyTab' },
    { id:'raids',   label:'⚔️ РЕЙДИ',    fn:'renderRaidTab' },
    { id:'troops',  label:'🎖 АРМІЯ',    fn:'renderTroopTab' },
  ];

  newTabs.forEach(t=>{
    // Кнопка вкладки
    let btn=document.createElement('button');
    btn.className='ptab';
    btn.id=`tab-btn-${t.id}`;
    btn.setAttribute('onclick',`switchTab('${t.id}')`);
    btn.textContent=t.label;
    tabsEl.appendChild(btn);
    // Контент вкладки
    let content=document.createElement('div');
    content.className='tab-content';
    content.id=`tab-${t.id}`;
    content.innerHTML=`<div id="tab-${t.id}-content" style="width:100%;"></div>`;
    let leftPanel=document.querySelector('.left-panel');
    if(leftPanel) leftPanel.appendChild(content);
  });

  const EXP_TAB_IDS = newTabs.map(t=>t.id);

  // Патчимо switchTab щоб рендерити нові вкладки і коректно перемикати active клас
  let _origSwitch=window.switchTab;
  window.switchTab=function(name){
    if(EXP_TAB_IDS.includes(name)){
      // Власна логіка перемикання для нових вкладок
      document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
      document.querySelectorAll('.ptab').forEach(el=>el.classList.remove('active'));
      let tabEl=document.getElementById('tab-'+name);
      if(tabEl) tabEl.classList.add('active');
      let btn=document.getElementById('tab-btn-'+name);
      if(btn) btn.classList.add('active');
    } else {
      _origSwitch&&_origSwitch(name);
    }
    switch(name){
      case 'lore':     renderLoreTab();     break;
      case 'souls':    renderSoulTab();     break;
      case 'hunting':  renderHuntingTab();  break;
      case 'fishing':  renderFishingTab();  break;
      case 'mushroom': renderMushroomTab(); break;
      case 'herb':     renderHerbTab();     break;
      case 'geology':  renderGeologyTab();  break;
      case 'raids':    renderRaidTab();     break;
      case 'troops':   renderTroopTab();    break;
    }
  };
}

// ============================================================
// ЗБЕРЕЖЕННЯ / ЗАВАНТАЖЕННЯ РОЗШИРЕНЬ
// ============================================================
function serializeExpansions(){
  return {
    souls: { totalFound:SOUL_SYSTEM.totalFound, lastSearch:SOUL_SYSTEM.lastSearch, activeLocation:SOUL_SYSTEM.activeLocation },
    hunting: { huntsTotal:HUNTING_SYSTEM.huntsTotal, lastHunt:HUNTING_SYSTEM.lastHunt, upgrades: Object.fromEntries(Object.entries(HUNTING_SYSTEM.upgrades).map(([k,u])=>[k,u.lvl])) },
    fishing: { fishedTotal:FISHING_SYSTEM.fishedTotal, lastFish:FISHING_SYSTEM.lastFish, fishCount:FISHING_SYSTEM.fishCount, activeSpot:FISHING_SYSTEM.activeSpot, upgrades:Object.fromEntries(Object.entries(FISHING_SYSTEM.upgrades).map(([k,u])=>[k,u.lvl])) },
    mushroom: { gatheredTotal:MUSHROOM_SYSTEM.gatheredTotal, lastGather:MUSHROOM_SYSTEM.lastGather, basketLvl:MUSHROOM_SYSTEM.basketLvl, knowledgeLvl:MUSHROOM_SYSTEM.knowledgeLvl },
    herb: { harvestedTotal:HERB_SYSTEM.harvestedTotal, lastHarvest:HERB_SYSTEM.lastHarvest, dryingRackLvl:HERB_SYSTEM.dryingRackLvl, alchemyLvl:HERB_SYSTEM.alchemyLvl },
    geology: { expeditionsTotal:GEOLOGY_SYSTEM.expeditionsTotal, lastExpedition:GEOLOGY_SYSTEM.lastExpedition, expeditionLvl:GEOLOGY_SYSTEM.expeditionLvl, equipLvl:GEOLOGY_SYSTEM.equipLvl, discoveredDeposits:GEOLOGY_SYSTEM.discoveredDeposits, lastMined:GEOLOGY_SYSTEM.lastMined },
    raids: { raidsTotal:RAID_SYSTEM.raidsTotal, lastRaid:RAID_SYSTEM.lastRaid, raidLevel:RAID_SYSTEM.raidLevel, victories:RAID_SYSTEM.victories, defeats:RAID_SYSTEM.defeats, activeTarget:RAID_SYSTEM.activeTarget },
    troops: { garrison:{...TROOP_SYSTEM.garrison}, xp:TROOP_SYSTEM.xp, morale:TROOP_SYSTEM.morale, lastFed:TROOP_SYSTEM.lastFed, barracks:TROOP_SYSTEM.barracks.lvl, academy:TROOP_SYSTEM.academy.lvl, armory:TROOP_SYSTEM.armory.lvl },
  };
}

function deserializeExpansions(data){
  if(!data) return;
  if(data.souls){ SOUL_SYSTEM.totalFound=data.souls.totalFound||0; SOUL_SYSTEM.lastSearch=data.souls.lastSearch||0; SOUL_SYSTEM.activeLocation=data.souls.activeLocation||'ruins'; }
  if(data.hunting){ HUNTING_SYSTEM.huntsTotal=data.hunting.huntsTotal||0; HUNTING_SYSTEM.lastHunt=data.hunting.lastHunt||0; if(data.hunting.upgrades) Object.entries(data.hunting.upgrades).forEach(([k,v])=>{ if(HUNTING_SYSTEM.upgrades[k]) HUNTING_SYSTEM.upgrades[k].lvl=v||0; }); }
  if(data.fishing){ FISHING_SYSTEM.fishedTotal=data.fishing.fishedTotal||0; FISHING_SYSTEM.lastFish=data.fishing.lastFish||0; FISHING_SYSTEM.fishCount=data.fishing.fishCount||0; FISHING_SYSTEM.activeSpot=data.fishing.activeSpot||'stream'; if(data.fishing.upgrades) Object.entries(data.fishing.upgrades).forEach(([k,v])=>{ if(FISHING_SYSTEM.upgrades[k]) FISHING_SYSTEM.upgrades[k].lvl=v||0; }); }
  if(data.mushroom){ MUSHROOM_SYSTEM.gatheredTotal=data.mushroom.gatheredTotal||0; MUSHROOM_SYSTEM.lastGather=data.mushroom.lastGather||0; MUSHROOM_SYSTEM.basketLvl=data.mushroom.basketLvl||0; MUSHROOM_SYSTEM.knowledgeLvl=data.mushroom.knowledgeLvl||0; }
  if(data.herb){ HERB_SYSTEM.harvestedTotal=data.herb.harvestedTotal||0; HERB_SYSTEM.lastHarvest=data.herb.lastHarvest||0; HERB_SYSTEM.dryingRackLvl=data.herb.dryingRackLvl||0; HERB_SYSTEM.alchemyLvl=data.herb.alchemyLvl||0; }
  if(data.geology){ GEOLOGY_SYSTEM.expeditionsTotal=data.geology.expeditionsTotal||0; GEOLOGY_SYSTEM.lastExpedition=data.geology.lastExpedition||0; GEOLOGY_SYSTEM.expeditionLvl=data.geology.expeditionLvl||0; GEOLOGY_SYSTEM.equipLvl=data.geology.equipLvl||0; GEOLOGY_SYSTEM.discoveredDeposits=data.geology.discoveredDeposits||[]; GEOLOGY_SYSTEM.lastMined=data.geology.lastMined||0; }
  if(data.raids){ RAID_SYSTEM.raidsTotal=data.raids.raidsTotal||0; RAID_SYSTEM.lastRaid=data.raids.lastRaid||0; RAID_SYSTEM.raidLevel=data.raids.raidLevel||0; RAID_SYSTEM.victories=data.raids.victories||0; RAID_SYSTEM.defeats=data.raids.defeats||0; RAID_SYSTEM.activeTarget=data.raids.activeTarget||'goblin_camp'; }
  if(data.troops){ Object.assign(TROOP_SYSTEM.garrison,data.troops.garrison||{}); TROOP_SYSTEM.xp=data.troops.xp||0; TROOP_SYSTEM.morale=data.troops.morale||100; TROOP_SYSTEM.lastFed=data.troops.lastFed||Date.now()/1000; TROOP_SYSTEM.barracks.lvl=data.troops.barracks||0; TROOP_SYSTEM.academy.lvl=data.troops.academy||0; TROOP_SYSTEM.armory.lvl=data.troops.armory||0; }
}

// Патчуємо серіалізацію/десеріалізацію основної гри
(function patchSaveSystem(){
  // expansions.js завантажується після index.html, тому serializeGameState
  // вже визначена — викликаємо патч синхронно без затримки
  if(typeof serializeGameState==='undefined'||typeof deserializeGameState==='undefined'){
    console.error('[expansions] КРИТИЧНО: serializeGameState не знайдено! Перевір порядок завантаження скриптів.');
    return;
  }
  let _origSer=serializeGameState;
  window.serializeGameState=function(){
    let s=_origSer();
    try{ s.expansions=serializeExpansions(); }catch(e){}
    return s;
  };
  let _origDeser=deserializeGameState;
  window.deserializeGameState=function(s){
    _origDeser(s);
    try{ if(s&&s.expansions) deserializeExpansions(s.expansions); }catch(e){}
  };
})();

// ============================================================
// МОБІЛЬНА НАВІГАЦІЯ — додаткова кнопка "СВІТ"
// ============================================================
function initExpansionMobNav(){
  let nav=document.getElementById('mob-nav');
  if(!nav || document.getElementById('nav-exp')) return;
  let btn=document.createElement('button');
  btn.className='mob-nav-btn';
  btn.id='nav-exp';
  btn.setAttribute('onclick','expMobNav()');
  btn.innerHTML='<span class="nav-icon">🌍</span><span class="nav-label">СВІТ</span>';
  nav.appendChild(btn);
}

function expMobNav(){
  if(typeof isMobile==='function' && !isMobile()) { switchTab('lore'); return; }
  const leftPanel  = document.querySelector('.left-panel');
  const centerArea = document.querySelector('.center-area');
  const rightPanel = document.querySelector('.right-panel');
  [leftPanel, centerArea, rightPanel].forEach(p => p && p.classList.remove('mob-active'));
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  let myBtn=document.getElementById('nav-exp');
  if(myBtn) myBtn.classList.add('active');
  leftPanel && leftPanel.classList.add('mob-active');
  switchTab('lore');
}

// ============================================================
// ПАТЧ ПЕРЕРОДЖЕННЯ — скидаємо прогрес розширень при prestige
// ============================================================
function resetExpansionSystems(){
  SOUL_SYSTEM.totalFound=0; SOUL_SYSTEM.lastSearch=0; SOUL_SYSTEM.searching=false; SOUL_SYSTEM.searchProgress=0;
  HUNTING_SYSTEM.huntsTotal=0; HUNTING_SYSTEM.lastHunt=0; HUNTING_SYSTEM.hunting=false;
  Object.values(HUNTING_SYSTEM.upgrades).forEach(u=>u.lvl=0);
  FISHING_SYSTEM.fishedTotal=0; FISHING_SYSTEM.fishCount=0; FISHING_SYSTEM.lastFish=0; FISHING_SYSTEM.fishing=false;
  Object.values(FISHING_SYSTEM.upgrades).forEach(u=>u.lvl=0);
  MUSHROOM_SYSTEM.gatheredTotal=0; MUSHROOM_SYSTEM.lastGather=0; MUSHROOM_SYSTEM.gathering=false;
  MUSHROOM_SYSTEM.basketLvl=0; MUSHROOM_SYSTEM.knowledgeLvl=0;
  HERB_SYSTEM.harvestedTotal=0; HERB_SYSTEM.lastHarvest=0; HERB_SYSTEM.harvesting=false;
  HERB_SYSTEM.dryingRackLvl=0; HERB_SYSTEM.alchemyLvl=0;
  GEOLOGY_SYSTEM.expeditionsTotal=0; GEOLOGY_SYSTEM.lastExpedition=0; GEOLOGY_SYSTEM.exploring=false;
  GEOLOGY_SYSTEM.expeditionLvl=0; GEOLOGY_SYSTEM.equipLvl=0; GEOLOGY_SYSTEM.discoveredDeposits=[]; GEOLOGY_SYSTEM.lastMined=0;
  RAID_SYSTEM.raidsTotal=0; RAID_SYSTEM.lastRaid=0; RAID_SYSTEM.raiding=false;
  RAID_SYSTEM.raidLevel=0; RAID_SYSTEM.victories=0; RAID_SYSTEM.defeats=0; RAID_SYSTEM.activeTarget='goblin_camp';
  Object.keys(TROOP_SYSTEM.garrison).forEach(k=>TROOP_SYSTEM.garrison[k]=0);
  TROOP_SYSTEM.xp=0; TROOP_SYSTEM.morale=100; TROOP_SYSTEM.lastFed=Date.now()/1000;
  TROOP_SYSTEM.barracks.lvl=0; TROOP_SYSTEM.academy.lvl=0; TROOP_SYSTEM.armory.lvl=0;
  TROOP_SYSTEM.trainingQueue=[]; TROOP_SYSTEM.trainingActive=false;
}

(function patchPrestigeReset(){
  // Синхронний патч — expansions.js вже завантажено після index.html
  if(typeof _fullPrestigeReset==='undefined'){
    console.error('[expansions] КРИТИЧНО: _fullPrestigeReset не знайдено! Перевір порядок завантаження скриптів.');
    return;
  }
  let _orig=_fullPrestigeReset;
  window._fullPrestigeReset=function(){
    _orig();
    try{ resetExpansionSystems(); }catch(e){}
  };
})();

// ============================================================
// ЗАПУСК
// ============================================================
document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=>{
    initExpansionTabs();
    initExpansionMobNav();
    injectResources();
  }, 300);
});
// Також спробуємо одразу якщо DOM вже готовий
if(document.readyState==='complete'||document.readyState==='interactive'){
  setTimeout(()=>{ initExpansionTabs(); initExpansionMobNav(); injectResources(); }, 400);
}

5. Пережити 50 хвиль гоблінів
6. Відкрити всі типи геологічних родовищ`,
  chapters: [
    { ep: [1,2],   name: "Виживання",         desc: "Перші кроки. Збери ресурси, побудуй табір." },
    { ep: [3,4],   name: "Ремесла та Бронза",  desc: "Навчися обробляти метали. Дослідж околиці." },
    { ep: [5,6],   name: "Королівство",        desc: "Зведи замок. Сформуй першу армію." },
    { ep: [7,8],   name: "Промисловість",      desc: "Фабрики, парова машина, масове виробництво." },
    { ep: [9,10],  name: "Хімічна ера",        desc: "Нафта, пластик, електрика. Місто зростає." },
    { ep: [11,12], name: "Синтез",             desc: "Мікросхеми, роботи, дрони. Шлях до перемоги." },
  ]
};

// ============================================================
// СПІЛЬНІ РЕСУРСИ РОЗШИРЕНЬ
// ============================================================
// Додаємо нові ресурси до RES якщо доступний
const EXPANSION_RES = {
  soul:        { n:"Душа Стародавніх", e:"👻", ep:1 },
  game_meat:   { n:"М'ясо дичини",     e:"🍖", ep:1 },
  hide:        { n:"Шкура",            e:"🦊", ep:1 },
  feather:     { n:"Пір'я",            e:"🪶", ep:2 },
  fish:        { n:"Риба",             e:"🐟", ep:1 },
  rare_fish:   { n:"Рідкісна риба",    e:"🐠", ep:4 },
  mushroom:    { n:"Гриби",            e:"🍄", ep:1 },
  truffle:     { n:"Трюфель",          e:"⚫", ep:5 },
  herb:        { n:"Трави",            e:"🌿", ep:1 },
  rare_herb:   { n:"Рідкісна трава",   e:"🌸", ep:3 },
  gem:         { n:"Дорогоцінний камінь", e:"💎", ep:3 },
  crystal:     { n:"Кристал",          e:"🔮", ep:5 },
  fossil:      { n:"Скам'янілість",    e:"🦴", ep:6 },
  goblin_loot: { n:"Трофей гобліна",   e:"🪙", ep:1 },
  goblin_relic:{ n:"Реліквія гоблінів",e:"🗿", ep:4 },
  troop_sword: { n:"Мечник",           e:"⚔️", ep:2 },
  troop_archer:{ n:"Лучник",           e:"🏹", ep:2 },
  troop_knight:{ n:"Лицар",            e:"🛡", ep:5 },
  troop_mage:  { n:"Маг",              e:"🧙", ep:6 },
  troop_elite: { n:"Елітний воїн",     e:"💂", ep:8 },
};

// Додаємо до глобального RES якщо він є
function injectResources(){
  if(typeof RES === 'undefined') return;
  Object.entries(EXPANSION_RES).forEach(([k,v])=>{ if(!RES[k]) RES[k]=v; });
  Object.keys(EXPANSION_RES).forEach(k=>{
    if(typeof storage !== 'undefined' && storage[k] === undefined) storage[k] = 0;
    if(typeof psCounters !== 'undefined' && psCounters[k] === undefined) psCounters[k] = 0;
    if(typeof resLifetimeTotal !== 'undefined' && resLifetimeTotal[k] === undefined) resLifetimeTotal[k] = 0;
  });
}
// Викликаємо одразу при завантаженні скрипта (RES вже визначений на цей момент)
injectResources();

// ============================================================
// 1. ПОШУК ДУШ
// ============================================================
const SOUL_SYSTEM = {
  totalFound: 0,
  totalTarget: 100,  // Ціль гри
  lastSearch: 0,
  cooldown: 60,      // секунд між пошуками
  searching: false,
  searchProgress: 0,
  searchDuration: 10, // секунд на пошук

  // Локації пошуку душ
  locations: [
    { id:'ruins',    name:'🏚 Руїни',        desc:'Стародавні будівлі приховують духів',  minEp:1, chance:0.25, reward:{soul:[1,2]},  rareChance:0.05, rareReward:{soul:[5,10]} },
    { id:'graveyard',name:'⚰️ Цвинтар',       desc:'Тут спочивають загиблі герої',         minEp:2, chance:0.35, reward:{soul:[1,3]},  rareChance:0.08, rareReward:{soul:[8,15]} },
    { id:'cave',     name:'🕳 Печера',        desc:'Глибокі печери зберігають таємниці',    minEp:3, chance:0.40, reward:{soul:[2,4]},  rareChance:0.10, rareReward:{soul:[10,20]} },
    { id:'altar',    name:'🗿 Стародавній вівтар',desc:'Місце сили. Духи тут сильні',       minEp:5, chance:0.50, reward:{soul:[3,6]},  rareChance:0.15, rareReward:{soul:[15,30]} },
    { id:'abyss',    name:'🌑 Безодня',       desc:'Найглибше місце. Ризик великий',        minEp:8, chance:0.60, reward:{soul:[5,10]}, rareChance:0.20, rareReward:{soul:[25,50]} },
  ],
  activeLocation: 'ruins',

  // Пасивний дохід від душ
  get passiveBonus(){ return Math.floor(this.totalFound / 10) * 0.01; }, // +1% до вироб. за кожні 10 душ
};

let soulSearchTimer = null;
let soulSearchProgressTimer = null;

function startSoulSearch(){
  let sys = SOUL_SYSTEM;
  if(sys.searching) return;
  let loc = sys.locations.find(l=>l.id===sys.activeLocation);
  if(!loc || (typeof epoch !== 'undefined' && epoch < loc.minEp)){
    showExpToast(`🔒 Потрібна Епоха ${loc?.minEp || 1}!`); return;
  }
  let now = Date.now()/1000;
  if(now - sys.lastSearch < sys.cooldown){
    let rem = Math.ceil(sys.cooldown - (now - sys.lastSearch));
    showExpToast(`⏳ Перезарядка: ${rem}с`); return;
  }
  sys.searching = true;
  sys.searchProgress = 0;
  renderSoulTab();

  let elapsed = 0;
  soulSearchProgressTimer = setInterval(()=>{
    elapsed++;
    sys.searchProgress = elapsed / sys.searchDuration * 100;
    let bar = document.getElementById('soul-search-bar');
    if(bar) bar.style.width = sys.searchProgress + '%';
    if(elapsed >= sys.searchDuration){
      clearInterval(soulSearchProgressTimer);
      finishSoulSearch();
    }
  }, 1000);
}

function finishSoulSearch(){
  let sys = SOUL_SYSTEM;
  sys.searching = false;
  sys.searchProgress = 0;
  sys.lastSearch = Date.now()/1000;
  let loc = sys.locations.find(l=>l.id===sys.activeLocation);
  if(!loc) { renderSoulTab(); return; }

  let roll = Math.random();
  let found = false;
  let logMsg = '';

  if(roll < loc.rareChance){
    // Рідкісна знахідка!
    let [min, max] = loc.rareReward.soul;
    let amt = Math.floor(Math.random()*(max-min+1))+min;
    if(typeof storage !== 'undefined') storage.soul = (storage.soul||0) + amt;
    sys.totalFound += amt;
    logMsg = `✨ РІДКІСНО! Знайдено ${amt} Душ у ${loc.name}!`;
    found = true;
  } else if(roll < loc.rareChance + loc.chance){
    let [min, max] = loc.reward.soul;
    let amt = Math.floor(Math.random()*(max-min+1))+min;
    if(typeof storage !== 'undefined') storage.soul = (storage.soul||0) + amt;
    sys.totalFound += amt;
    logMsg = `👻 Знайдено ${amt} Душ у ${loc.name}`;
    found = true;
  } else {
    logMsg = `😔 Нічого не знайдено у ${loc.name}...`;
  }

  if(typeof addLog === 'function') addLog(logMsg, found && roll < loc.rareChance);
  if(found) showExpToast(logMsg);

  // Перевірка перемоги
  if(sys.totalFound >= sys.totalTarget){
    if(typeof addLog === 'function') addLog('🏆 ПЕРЕМОЖЕЦЬ! Зібрано 100 Душ Стародавніх! Шлях Синтезу відкритий!', true);
    showExpToast('🏆 100 Душ! ПЕРЕМОГА НАБЛИЖАЄТЬСЯ!');
  }

  if(typeof markDirty === 'function') markDirty('full');
  renderSoulTab();
}

function renderSoulTab(){
  let div = document.getElementById('tab-souls-content');
  if(!div) return;
  let sys = SOUL_SYSTEM;
  let loc = sys.locations.find(l=>l.id===sys.activeLocation);
  let now = Date.now()/1000;
  let cdRem = Math.max(0, Math.ceil(sys.cooldown - (now - sys.lastSearch)));
  let pct = (sys.totalFound / sys.totalTarget * 100).toFixed(1);
  let passBonus = (sys.passiveBonus * 100).toFixed(0);

  let html = `
  <div style="padding:4px;">
    <div class="sh">👻 ПОШУК ДУШ СТАРОДАВНІХ</div>
    <div style="background:#0a0a1a;border:1px solid #5b2fd5;padding:8px;margin-bottom:6px;">
      <div style="font-size:11px;color:var(--purple);margin-bottom:4px;">⭐ ПРОГРЕС ДО ПЕРЕМОГИ</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
        <span>👻 Зібрано: <b style="color:var(--purple)">${sys.totalFound}</b> / ${sys.totalTarget}</span>
        <span style="color:var(--gold)">${pct}%</span>
      </div>
      <div style="height:8px;background:#070a0f;border:1px solid var(--border);margin-bottom:5px;">
        <div style="height:100%;background:linear-gradient(90deg,#5b2fd5,#a040ff);width:${Math.min(100,pct)}%;transition:width .5s;"></div>
      </div>
      <div style="font-size:10px;color:var(--teal);">✨ Бонус виробництва від Душ: +${passBonus}%</div>
    </div>

    <div class="sh">📍 ЛОКАЦІЯ ПОШУКУ</div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
    ${sys.locations.map(l=>{
      let avail = typeof epoch === 'undefined' || epoch >= l.minEp;
      let sel = sys.activeLocation === l.id;
      return `<div style="background:${sel?'#0d0a1a':'var(--panel2)'};border:1px solid ${sel?'var(--purple)':avail?'var(--border)':'#1a1a1a'};padding:7px;cursor:${avail?'pointer':'not-allowed'};opacity:${avail?1:.4};"
        onclick="${avail?`setSoulLocation('${l.id}')`:''}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:12px">${l.name}</span>
            ${sel?'<span style="font-size:9px;color:var(--purple);margin-left:6px;">◀ ВИБРАНО</span>':''}
          </div>
          <span style="font-size:9px;color:var(--dim)">Еп.${l.minEp}</span>
        </div>
        <div style="font-size:10px;color:var(--dim);margin-top:2px;">${l.desc}</div>
        <div style="font-size:10px;color:var(--teal);margin-top:2px;">
          Шанс: ${Math.round(l.chance*100)}% · 👻 ${l.reward.soul[0]}-${l.reward.soul[1]}
          <span style="color:var(--gold)"> · Рідко: ${Math.round(l.rareChance*100)}% → ${l.rareReward.soul[0]}-${l.rareReward.soul[1]}</span>
        </div>
      </div>`;
    }).join('')}
    </div>

    <div style="margin-bottom:6px;">
      ${sys.searching ? `
        <div style="font-size:11px;color:var(--purple);margin-bottom:4px;">🔍 Пошук у ${loc?.name || ''}...</div>
        <div style="height:8px;background:#070a0f;border:1px solid var(--purple);">
          <div id="soul-search-bar" style="height:100%;background:var(--purple);width:${sys.searchProgress}%;transition:width 1s linear;"></div>
        </div>
      ` : `
        <button onclick="startSoulSearch()" style="width:100%;font-family:var(--font);font-size:12px;padding:10px;border:1px solid var(--purple);background:rgba(91,47,213,.12);color:var(--purple);cursor:pointer;transition:all .15s;"
          ${cdRem>0?`disabled style="width:100%;font-family:var(--font);font-size:12px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--dim);cursor:not-allowed;"`:''}>
          ${cdRem>0 ? `⏳ ПЕРЕЗАРЯДКА: ${cdRem}с` : '🔍 ШУКАТИ ДУШІ'}
        </button>
      `}
    </div>

    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:6px;">
      💡 Душі Стародавніх потрібні для Перемоги. Кожні 10 душ дають +1% до виробництва. Пошук займає ${sys.searchDuration}с. Перезарядка: ${sys.cooldown}с.
    </div>
  </div>`;
  div.innerHTML = html;
}

function setSoulLocation(id){
  SOUL_SYSTEM.activeLocation = id;
  renderSoulTab();
}

// ============================================================
// 2. МИСЛИВСТВО
// ============================================================
const HUNTING_SYSTEM = {
  huntsTotal: 0,
  lastHunt: 0,
  cooldown: 90,
  hunting: false,
  huntProgress: 0,
  huntDuration: 15,
  heroBonus: 0, // бонус від героя-мисливця
  upgrades: {
    bow:    { name:'🏹 Лук',         lvl:0, maxLvl:10, cost:{wood:20,stone:10},       costMult:1.5, bonus:'Більше дичини' },
    trap:   { name:'🪤 Пастки',      lvl:0, maxLvl:10, cost:{logs:30,fiber:15},        costMult:1.6, bonus:'Пасивний видобуток' },
    dog:    { name:'🐕 Мисливський пес', lvl:0, maxLvl:5, cost:{wheat:50,water:20},    costMult:2.0, bonus:'Швидкість пошуку' },
    scope:  { name:'🔭 Оптика',      lvl:0, maxLvl:5, cost:{iron:40,tools:20},         costMult:2.0, bonus:'Точний постріл' },
  },
  // Пасивний дохід від пасток
  get trapPassive(){
    let t = this.upgrades.trap;
    return t.lvl * 0.05; // 0.05 м'яса/с за рівень
  },
  prey: [
    { id:'rabbit', name:'🐰 Кролик',  minEp:1, chance:0.6, meat:[1,3], hide:[0,1], feather:[0,0], rare:false },
    { id:'deer',   name:'🦌 Олень',   minEp:1, chance:0.4, meat:[3,6], hide:[1,2], feather:[0,0], rare:false },
    { id:'boar',   name:'🐗 Вепр',    minEp:2, chance:0.3, meat:[5,10],hide:[2,3], feather:[0,0], rare:false },
    { id:'wolf',   name:'🐺 Вовк',    minEp:3, chance:0.25,meat:[4,8], hide:[3,5], feather:[0,0], rare:true  },
    { id:'bear',   name:'🐻 Ведмідь', minEp:4, chance:0.15,meat:[8,15],hide:[4,6], feather:[0,0], rare:true  },
    { id:'eagle',  name:'🦅 Орел',    minEp:5, chance:0.1, meat:[3,5], hide:[1,2], feather:[5,10],rare:true  },
  ],
  lastPrey: null,
};

function startHunt(){
  let sys = HUNTING_SYSTEM;
  if(sys.hunting){ showExpToast('⚠️ Полювання вже йде!'); return; }
  let now = Date.now()/1000;
  let cd = sys.cooldown - (sys.upgrades.dog.lvl * 5);
  if(now - sys.lastHunt < cd){
    showExpToast(`⏳ ${Math.ceil(cd-(now-sys.lastHunt))}с до наступного полювання`); return;
  }
  sys.hunting = true;
  sys.huntProgress = 0;
  renderHuntingTab();

  let dur = Math.max(5, sys.huntDuration - sys.upgrades.scope.lvl * 2);
  let elapsed = 0;
  let timer = setInterval(()=>{
    elapsed++;
    sys.huntProgress = elapsed / dur * 100;
    let bar = document.getElementById('hunt-progress-bar');
    if(bar) bar.style.width = sys.huntProgress + '%';
    if(elapsed >= dur){
      clearInterval(timer);
      finishHunt();
    }
  }, 1000);
}

function finishHunt(){
  let sys = HUNTING_SYSTEM;
  sys.hunting = false;
  sys.huntProgress = 0;
  sys.lastHunt = Date.now()/1000;
  sys.huntsTotal++;

  let ep = typeof epoch !== 'undefined' ? epoch : 1;
  let available = sys.prey.filter(p => ep >= p.minEp);
  let bowBonus = sys.upgrades.bow.lvl * 0.05;

  let caught = [];
  available.forEach(p=>{
    if(Math.random() < p.chance + bowBonus){
      caught.push(p);
    }
  });

  if(caught.length === 0){
    if(typeof addLog === 'function') addLog('🏹 Полювання невдале — дичина розбіглась');
    sys.lastPrey = null;
    renderHuntingTab();
    return;
  }

  // Беремо найкращий трофей
  let prey = caught.sort((a,b)=>(b.meat[1]-a.meat[1]))[0];
  sys.lastPrey = prey;

  let meat = rndRange(prey.meat[0], prey.meat[1]);
  let hide = rndRange(prey.hide[0], prey.hide[1]);
  let feather = rndRange(prey.feather[0], prey.feather[1]);

  if(typeof storage !== 'undefined'){
    storage.game_meat = (storage.game_meat||0) + meat;
    storage.hide = (storage.hide||0) + hide;
    if(feather) storage.feather = (storage.feather||0) + feather;
  }

  let msg = `🏹 ${prey.name} здобутий! +${meat}🍖 ${hide?`+${hide}🦊`:''}${feather?` +${feather}🪶`:''}`;
  if(typeof addLog === 'function') addLog(msg, prey.rare);
  showExpToast(msg);
  if(typeof markDirty === 'function') markDirty('full');
  renderHuntingTab();
}

function upgradeHunting(id){
  let sys = HUNTING_SYSTEM;
  let upg = sys.upgrades[id];
  if(!upg || upg.lvl >= upg.maxLvl) return;
  let cost = {};
  Object.entries(upg.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(upg.costMult,upg.lvl)); });
  if(typeof storage !== 'undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){
      showExpToast('⚠️ Недостатньо ресурсів!'); return;
    }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  upg.lvl++;
  if(typeof addLog === 'function') addLog(`🏹 ${upg.name} → Рів.${upg.lvl}`);
  if(typeof markDirty === 'function') markDirty('full');
  renderHuntingTab();
}

function renderHuntingTab(){
  let div = document.getElementById('tab-hunting-content');
  if(!div) return;
  let sys = HUNTING_SYSTEM;
  let ep = typeof epoch !== 'undefined' ? epoch : 1;
  let cd = sys.cooldown - sys.upgrades.dog.lvl * 5;
  let now = Date.now()/1000;
  let cdRem = Math.max(0, Math.ceil(cd - (now - sys.lastHunt)));
  let trapP = sys.trapPassive;
  let meat = typeof storage !== 'undefined' ? (storage.game_meat||0) : 0;
  let hide = typeof storage !== 'undefined' ? (storage.hide||0) : 0;

  let html = `<div style="padding:4px;">
    <div class="sh">🏹 МИСЛИВСТВО</div>
    <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🍖</div>
        <div style="font-size:13px;color:var(--text)">${fmt2(meat)}</div>
        <div style="font-size:10px;color:var(--dim)">М'ясо дичини</div>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🦊</div>
        <div style="font-size:13px;color:var(--text)">${fmt2(hide)}</div>
        <div style="font-size:10px;color:var(--dim)">Шкури</div>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🏹</div>
        <div style="font-size:13px;color:var(--text)">${sys.huntsTotal}</div>
        <div style="font-size:10px;color:var(--dim)">Полювань</div>
      </div>
    </div>
    ${trapP > 0 ? `<div style="font-size:11px;color:var(--green);border:1px solid #1a3520;padding:5px 8px;margin-bottom:6px;">🪤 Пастки приносять +${(trapP*60).toFixed(1)} 🍖/хв пасивно</div>` : ''}
    ${sys.hunting ? `
      <div style="font-size:11px;color:var(--orange);margin-bottom:4px;">🏹 Полювання...</div>
      <div style="height:8px;background:#070a0f;border:1px solid var(--orange);margin-bottom:8px;">
        <div id="hunt-progress-bar" style="height:100%;background:var(--orange);width:${sys.huntProgress}%;transition:width 1s;"></div>
      </div>
    ` : `
      <button onclick="startHunt()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:10px;border:1px solid ${cdRem>0?'var(--border)':'var(--orange)'};background:rgba(212,128,74,.1);color:${cdRem>0?'var(--dim)':'var(--orange)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:8px;">
        ${cdRem>0 ? `⏳ ${cdRem}с` : '🏹 ПОЛЮВАТИ'}
      </button>
    `}
    ${sys.lastPrey ? `<div style="font-size:11px;color:var(--teal);margin-bottom:6px;">Останній трофей: ${sys.lastPrey.name}</div>` : ''}

    <div class="sh">⚙️ СПОРЯДЖЕННЯ</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
    ${Object.entries(sys.upgrades).map(([id,u])=>{
      let cost={};
      Object.entries(u.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(u.costMult,u.lvl)); });
      let canBuy = typeof storage==='undefined' || Object.keys(cost).every(k=>(storage[k]||0)>=cost[k]);
      let maxed = u.lvl >= u.maxLvl;
      return `<div style="background:var(--panel2);border:1px solid var(--border);padding:7px;display:flex;gap:7px;align-items:center;">
        <div style="font-size:20px">${u.name.split(' ')[0]}</div>
        <div style="flex:1;">
          <div style="font-size:11px;">${u.name.replace(/^[^\s]+ /,'')}</div>
          <div style="font-size:10px;color:var(--teal)">${u.bonus}</div>
          <div style="font-size:10px;color:var(--dim)">Рів.${u.lvl}/${u.maxLvl}</div>
          ${!maxed ? `<div style="font-size:10px;color:var(--orange)">${Object.entries(cost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>` : ''}
        </div>
        <button onclick="upgradeHunting('${id}')" ${maxed||!canBuy?'disabled':''} style="font-family:var(--font);font-size:10px;padding:5px 10px;border:1px solid ${maxed?'var(--gold)':canBuy?'var(--orange)':'var(--border)'};background:transparent;color:${maxed?'var(--gold)':canBuy?'var(--orange)':'var(--dim)'};cursor:${maxed||!canBuy?'not-allowed':'pointer'};">
          ${maxed ? 'МАКС' : '⬆ РІВ'}
        </button>
      </div>`;
    }).join('')}
    </div>

    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:6px;margin-top:6px;">
      💡 Дичина дає 🍖 та 🦊 для крафту. М'ясо живить воїнів гарнізону.
    </div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 3. РИБАЛКА
// ============================================================
const FISHING_SYSTEM = {
  fishedTotal: 0,
  lastFish: 0,
  cooldown: 45,
  fishing: false,
  fishProgress: 0,
  fishDuration: 8,
  fishCount: 0,
  upgrades: {
    rod:    { name:'🎣 Вудилище',     lvl:0, maxLvl:10, cost:{wood:15,fiber:10},       costMult:1.5 },
    bait:   { name:'🪱 Наживка',      lvl:0, maxLvl:10, cost:{vegetation:20,water:10}, costMult:1.5 },
    net:    { name:'🕸 Сіть',         lvl:0, maxLvl:5,  cost:{fiber:40,logs:20},        costMult:2.0 },
    boat:   { name:'⛵ Човен',        lvl:0, maxLvl:3,  cost:{boards:80,iron:30},       costMult:2.5 },
  },
  spots: [
    { id:'stream',  name:'💧 Струмок',      minEp:1, fish:[2,5],  rareFish:false, chance:0.8 },
    { id:'lake',    name:'🏞 Озеро',        minEp:2, fish:[4,8],  rareFish:false, chance:0.7 },
    { id:'river',   name:'🌊 Ріка',         minEp:3, fish:[6,12], rareFish:true,  chance:0.6 },
    { id:'sea',     name:'🌊 Море',         minEp:6, fish:[10,20],rareFish:true,  chance:0.5 },
    { id:'deep_sea',name:'🔵 Глибоке море', minEp:9, fish:[15,30],rareFish:true,  chance:0.4 },
  ],
  activeSpot: 'stream',
};

function startFishing(){
  let sys = FISHING_SYSTEM;
  if(sys.fishing){ showExpToast('🎣 Вже рибалимо!'); return; }
  let now = Date.now()/1000;
  let cd = sys.cooldown - sys.upgrades.bait.lvl * 3;
  if(now - sys.lastFish < cd){ showExpToast(`⏳ ${Math.ceil(cd-(now-sys.lastFish))}с`); return; }
  sys.fishing = true; sys.fishProgress = 0;
  renderFishingTab();
  let dur = Math.max(3, sys.fishDuration - sys.upgrades.rod.lvl);
  let el = 0;
  let timer = setInterval(()=>{
    el++;
    sys.fishProgress = el/dur*100;
    let b = document.getElementById('fish-progress-bar');
    if(b) b.style.width = sys.fishProgress+'%';
    if(el >= dur){ clearInterval(timer); finishFishing(); }
  }, 1000);
}

function finishFishing(){
  let sys = FISHING_SYSTEM;
  sys.fishing = false; sys.fishProgress = 0; sys.lastFish = Date.now()/1000;
  let spot = sys.spots.find(s=>s.id===sys.activeSpot);
  if(!spot){ renderFishingTab(); return; }
  let netBonus = sys.upgrades.net.lvl * 2;
  let boatBonus = sys.upgrades.boat.lvl * 0.1;
  if(Math.random() > spot.chance - boatBonus){ 
    if(typeof addLog==='function') addLog('🎣 Риба не клює...');
    renderFishingTab(); return;
  }
  let [min,max] = spot.fish;
  let amt = rndRange(min, max + netBonus);
  sys.fishedTotal += amt; sys.fishCount++;
  if(typeof storage!=='undefined') storage.fish = (storage.fish||0) + amt;
  let rareAmt = 0;
  if(spot.rareFish && Math.random() < 0.15){
    rareAmt = rndRange(1,3);
    if(typeof storage!=='undefined') storage.rare_fish = (storage.rare_fish||0) + rareAmt;
  }
  let msg = `🎣 +${amt}🐟${rareAmt?` +${rareAmt}🐠 (рідкісна!)`:''}`;
  if(typeof addLog==='function') addLog(msg, rareAmt > 0);
  showExpToast(msg);
  if(typeof markDirty==='function') markDirty('full');
  renderFishingTab();
}

function upgradeFishing(id){
  let sys = FISHING_SYSTEM;
  let u = sys.upgrades[id]; if(!u || u.lvl >= u.maxLvl) return;
  let cost={};
  Object.entries(u.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(u.costMult,u.lvl)); });
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  u.lvl++; if(typeof addLog==='function') addLog(`🎣 ${u.name} → Рів.${u.lvl}`);
  if(typeof markDirty==='function') markDirty('full');
  renderFishingTab();
}

function renderFishingTab(){
  let div = document.getElementById('tab-fishing-content');
  if(!div) return;
  let sys = FISHING_SYSTEM;
  let ep = typeof epoch!=='undefined'?epoch:1;
  let cd = sys.cooldown - sys.upgrades.bait.lvl * 3;
  let now = Date.now()/1000;
  let cdRem = Math.max(0,Math.ceil(cd-(now-sys.lastFish)));
  let fish = typeof storage!=='undefined'?(storage.fish||0):0;
  let rare = typeof storage!=='undefined'?(storage.rare_fish||0):0;
  let html = `<div style="padding:4px;">
    <div class="sh">🎣 РИБАЛКА</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🐟</div><b style="color:var(--blue)">${fmt2(fish)}</b><div style="font-size:9px;color:var(--dim)">Риба</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🐠</div><b style="color:var(--purple)">${fmt2(rare)}</b><div style="font-size:9px;color:var(--dim)">Рідкісна</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🎣</div><b>${sys.fishCount}</b><div style="font-size:9px;color:var(--dim)">Уловів</div></div>
    </div>
    <div class="sh">📍 МІСЦЕ РИБАЛКИ</div>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px;">
    ${sys.spots.map(s=>{ let av=ep>=s.minEp; let sel=sys.activeSpot===s.id;
      return `<div onclick="${av?`setFishSpot('${s.id}')`:''}" style="padding:5px 8px;border:1px solid ${sel?'var(--blue)':av?'var(--border)':'#0d0d0d'};background:${sel?'#0a0a20':'var(--panel2)'};cursor:${av?'pointer':'default'};opacity:${av?1:.4};display:flex;justify-content:space-between;">
        <span style="font-size:11px">${s.name} ${sel?'◀':''}</span>
        <span style="font-size:10px;color:var(--dim)">🐟 ${s.fish[0]}-${s.fish[1]+sys.upgrades.net.lvl*2} · Еп.${s.minEp}</span>
      </div>`;
    }).join('')}
    </div>
    ${sys.fishing ? `
      <div style="height:6px;background:#070a0f;border:1px solid var(--blue);margin-bottom:6px;">
        <div id="fish-progress-bar" style="height:100%;background:var(--blue);width:${sys.fishProgress}%;transition:width 1s;"></div>
      </div>
    ` : `
      <button onclick="startFishing()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--blue)'};background:rgba(91,155,213,.1);color:${cdRem>0?'var(--dim)':'var(--blue)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">
        ${cdRem>0?`⏳ ${cdRem}с`:'🎣 РИБАЛИТИ'}
      </button>
    `}
    <div class="sh">⚙️ СПОРЯДЖЕННЯ</div>
    <div style="display:flex;flex-direction:column;gap:3px;">
    ${Object.entries(sys.upgrades).map(([id,u])=>{
      let cost={}; Object.entries(u.cost).forEach(([k,v])=>{ cost[k]=Math.floor(v*Math.pow(u.costMult,u.lvl)); });
      let can=typeof storage==='undefined'||Object.keys(cost).every(k=>(storage[k]||0)>=cost[k]);
      let max=u.lvl>=u.maxLvl;
      return `<div style="background:var(--panel2);border:1px solid var(--border);padding:6px;display:flex;align-items:center;gap:6px;">
        <div style="font-size:18px">${u.name.split(' ')[0]}</div>
        <div style="flex:1;font-size:11px;">${u.name.replace(/^[^\s]+ /,'')} <span style="color:var(--dim)">Рів.${u.lvl}/${u.maxLvl}</span></div>
        ${!max?`<div style="font-size:10px;color:var(--orange)">${Object.entries(cost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>`:''}
        <button onclick="upgradeFishing('${id}')" ${max||!can?'disabled':''} style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid ${max?'var(--gold)':can?'var(--blue)':'var(--border)'};background:transparent;color:${max?'var(--gold)':can?'var(--blue)':'var(--dim)'};cursor:${max||!can?'not-allowed':'pointer'};">${max?'MAX':'⬆'}</button>
      </div>`;
    }).join('')}
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;margin-top:5px;">💡 Риба — їжа для воїнів і ресурс для торгівлі. Рідкісна риба дає бонуси до досліджень.</div>
  </div>`;
  div.innerHTML = html;
}

function setFishSpot(id){ FISHING_SYSTEM.activeSpot = id; renderFishingTab(); }

// ============================================================
// 4. ГРИБНИЦТВО
// ============================================================
const MUSHROOM_SYSTEM = {
  gatheredTotal: 0,
  lastGather: 0,
  cooldown: 30,
  gathering: false,
  gatherProgress: 0,
  gatherDuration: 6,
  basketLvl: 0, // покращення кошика
  knowledgeLvl: 0, // знання грибів (шанс рідкісних)
  basketMax: 10, knowledgeMax: 8,
  types: [
    { id:'common',   name:'🍄 Звичайні гриби', minEp:1, chance:0.9, amt:[3,8],   truffle:false },
    { id:'forest',   name:'🌲 Лісові гриби',   minEp:1, chance:0.7, amt:[2,6],   truffle:false },
    { id:'chanterelle',name:'🟡 Лисички',       minEp:2, chance:0.5, amt:[2,5],   truffle:false },
    { id:'porcini',  name:'🟫 Білі гриби',     minEp:3, chance:0.35,amt:[1,3],   truffle:false },
    { id:'truffle',  name:'⚫ Трюфель',        minEp:5, chance:0.1, amt:[1,2],   truffle:true  },
  ],
};

function startMushroomGather(){
  let sys = MUSHROOM_SYSTEM;
  if(sys.gathering){ showExpToast('🍄 Вже збираємо!'); return; }
  let now = Date.now()/1000;
  if(now - sys.lastGather < sys.cooldown){ showExpToast(`⏳ ${Math.ceil(sys.cooldown-(now-sys.lastGather))}с`); return; }
  sys.gathering = true; sys.gatherProgress = 0;
  renderMushroomTab();
  let dur = Math.max(3, sys.gatherDuration - Math.floor(sys.basketLvl/2));
  let el=0;
  let timer = setInterval(()=>{
    el++; sys.gatherProgress=el/dur*100;
    let b=document.getElementById('mush-progress-bar'); if(b) b.style.width=sys.gatherProgress+'%';
    if(el>=dur){ clearInterval(timer); finishMushroomGather(); }
  },1000);
}

function finishMushroomGather(){
  let sys = MUSHROOM_SYSTEM;
  sys.gathering=false; sys.gatherProgress=0; sys.lastGather=Date.now()/1000;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let available=sys.types.filter(t=>ep>=t.minEp);
  let knowledgeBonus = sys.knowledgeLvl * 0.03;
  let basketBonus = sys.basketLvl;
  let totalMush=0, totalTruffle=0;
  available.forEach(t=>{
    if(Math.random()<t.chance+knowledgeBonus){
      let amt=rndRange(t.amt[0],t.amt[1]+basketBonus);
      if(t.truffle){ totalTruffle+=amt; if(typeof storage!=='undefined') storage.truffle=(storage.truffle||0)+amt; }
      else { totalMush+=amt; if(typeof storage!=='undefined') storage.mushroom=(storage.mushroom||0)+amt; }
    }
  });
  sys.gatheredTotal += totalMush + totalTruffle;
  let msg = totalMush||totalTruffle ? `🍄 +${totalMush}🍄${totalTruffle?` +${totalTruffle}⚫ Трюфель!`:''}` : '🍄 Нічого не знайдено';
  if(typeof addLog==='function') addLog(msg, totalTruffle>0);
  if(totalMush||totalTruffle) showExpToast(msg);
  if(typeof markDirty==='function') markDirty('full');
  renderMushroomTab();
}

function upgradeMushroomBasket(){
  let sys = MUSHROOM_SYSTEM;
  if(sys.basketLvl>=sys.basketMax){ showExpToast('Максимум!'); return; }
  let cost={logs:Math.floor(20*Math.pow(1.6,sys.basketLvl)), fiber:Math.floor(15*Math.pow(1.6,sys.basketLvl))};
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  sys.basketLvl++;
  if(typeof addLog==='function') addLog(`🧺 Кошик → Рів.${sys.basketLvl}`);
  if(typeof markDirty==='function') markDirty('full');
  renderMushroomTab();
}

function upgradeMushroomKnowledge(){
  let sys = MUSHROOM_SYSTEM;
  if(sys.knowledgeLvl>=sys.knowledgeMax){ showExpToast('Максимум!'); return; }
  let cost={books:Math.floor(10*Math.pow(1.8,sys.knowledgeLvl)), paper:Math.floor(8*Math.pow(1.8,sys.knowledgeLvl))};
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  sys.knowledgeLvl++;
  if(typeof addLog==='function') addLog(`📚 Знання грибів → Рів.${sys.knowledgeLvl}`);
  if(typeof markDirty==='function') markDirty('full');
  renderMushroomTab();
}

function renderMushroomTab(){
  let div=document.getElementById('tab-mushroom-content'); if(!div) return;
  let sys=MUSHROOM_SYSTEM;
  let now=Date.now()/1000;
  let cdRem=Math.max(0,Math.ceil(sys.cooldown-(now-sys.lastGather)));
  let mush=typeof storage!=='undefined'?(storage.mushroom||0):0;
  let truf=typeof storage!=='undefined'?(storage.truffle||0):0;
  let bCost={logs:Math.floor(20*Math.pow(1.6,sys.basketLvl)),fiber:Math.floor(15*Math.pow(1.6,sys.basketLvl))};
  let kCost={books:Math.floor(10*Math.pow(1.8,sys.knowledgeLvl)),paper:Math.floor(8*Math.pow(1.8,sys.knowledgeLvl))};
  let canB=typeof storage==='undefined'||Object.keys(bCost).every(k=>(storage[k]||0)>=bCost[k]);
  let canK=typeof storage==='undefined'||Object.keys(kCost).every(k=>(storage[k]||0)>=kCost[k]);
  let html=`<div style="padding:4px;">
    <div class="sh">🍄 ГРИБНИЦТВО</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🍄</div><b style="color:var(--green)">${fmt2(mush)}</b><div style="font-size:9px;color:var(--dim)">Гриби</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>⚫</div><b style="color:var(--purple)">${fmt2(truf)}</b><div style="font-size:9px;color:var(--dim)">Трюфелі</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🍄</div><b>${sys.gatheredTotal}</b><div style="font-size:9px;color:var(--dim)">Всього</div></div>
    </div>
    ${sys.gathering?`<div style="height:6px;background:#070a0f;border:1px solid var(--green);margin-bottom:6px;"><div id="mush-progress-bar" style="height:100%;background:var(--green);width:${sys.gatherProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startMushroomGather()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--green)'};background:rgba(78,203,113,.1);color:${cdRem>0?'var(--dim)':'var(--green)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🍄 ЗБИРАТИ ГРИБИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">🧺 Кошик Рів.${sys.basketLvl}/${sys.basketMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${sys.basketLvl} до кількості</div>
        ${sys.basketLvl<sys.basketMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(bCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeMushroomBasket()" ${!canB?'disabled':''} style="width:100%;font-family:var(--font);font-size:10px;padding:4px;border:1px solid ${canB?'var(--green)':'var(--border)'};background:transparent;color:${canB?'var(--green)':'var(--dim)'};cursor:${canB?'pointer':'not-allowed'};margin-top:4px;">⬆ ПОКРАЩИТИ</button>`:'<div style="font-size:10px;color:var(--gold)">✅ МАКСИМУМ</div>'}
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">📚 Знання Рів.${sys.knowledgeLvl}/${sys.knowledgeMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${(sys.knowledgeLvl*3)}% рідкісних</div>
        ${sys.knowledgeLvl<sys.knowledgeMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(kCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeMushroomKnowledge()" ${!canK?'disabled':''} style="width:100%;font-family:var(--font);font-size:10px;padding:4px;border:1px solid ${canK?'var(--blue)':'var(--border)'};background:transparent;color:${canK?'var(--blue)':'var(--dim)'};cursor:${canK?'pointer':'not-allowed'};margin-top:4px;">⬆ ВЧИТИСЬ</button>`:'<div style="font-size:10px;color:var(--gold)">✅ МАКСИМУМ</div>'}
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 Гриби — їжа та інгредієнт для зілля. Трюфелі — рідкісний делікатес, +5% до Синтезу за 1 трюфель.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 5. ТРАВНИЦТВО
// ============================================================
const HERB_SYSTEM = {
  harvestedTotal: 0,
  lastHarvest: 0,
  cooldown: 40,
  harvesting: false,
  harvestProgress: 0,
  harvestDuration: 8,
  dryingRackLvl: 0, // покращення сушарки
  alchemyLvl: 0,    // знання алхімії
  dryingMax: 8, alchemyMax: 8,
  herbs: [
    { id:'nettle',   name:'🌿 Кропива',       minEp:1, chance:0.85, amt:[3,7],  rare:false },
    { id:'mint',     name:'🌱 М\'ята',          minEp:1, chance:0.7,  amt:[2,5],  rare:false },
    { id:'lavender', name:'💜 Лаванда',         minEp:2, chance:0.5,  amt:[2,4],  rare:false },
    { id:'chamomile',name:'🌼 Ромашка',         minEp:2, chance:0.55, amt:[2,5],  rare:false },
    { id:'valerian', name:'🌸 Рідкісна трава',  minEp:3, chance:0.2,  amt:[1,3],  rare:true  },
    { id:'mandrake', name:'🌺 Мандрагора',      minEp:5, chance:0.1,  amt:[1,2],  rare:true  },
  ],
};

function startHerbHarvest(){
  let sys=HERB_SYSTEM;
  if(sys.harvesting){ showExpToast('🌿 Вже збираємо!'); return; }
  let now=Date.now()/1000;
  if(now-sys.lastHarvest<sys.cooldown){ showExpToast(`⏳ ${Math.ceil(sys.cooldown-(now-sys.lastHarvest))}с`); return; }
  sys.harvesting=true; sys.harvestProgress=0;
  renderHerbTab();
  let dur=Math.max(3,sys.harvestDuration-Math.floor(sys.dryingRackLvl/2));
  let el=0;
  let timer=setInterval(()=>{
    el++; sys.harvestProgress=el/dur*100;
    let b=document.getElementById('herb-progress-bar'); if(b) b.style.width=sys.harvestProgress+'%';
    if(el>=dur){ clearInterval(timer); finishHerbHarvest(); }
  },1000);
}

function finishHerbHarvest(){
  let sys=HERB_SYSTEM;
  sys.harvesting=false; sys.harvestProgress=0; sys.lastHarvest=Date.now()/1000;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let alchBonus=sys.alchemyLvl*0.04;
  let rackBonus=sys.dryingRackLvl;
  let totalHerb=0, totalRare=0;
  sys.herbs.filter(h=>ep>=h.minEp).forEach(h=>{
    if(Math.random()<h.chance+alchBonus){
      let amt=rndRange(h.amt[0],h.amt[1]+rackBonus);
      if(h.rare){ totalRare+=amt; if(typeof storage!=='undefined') storage.rare_herb=(storage.rare_herb||0)+amt; }
      else { totalHerb+=amt; if(typeof storage!=='undefined') storage.herb=(storage.herb||0)+amt; }
    }
  });
  sys.harvestedTotal+=totalHerb+totalRare;
  let msg=totalHerb||totalRare?`🌿 +${totalHerb}🌿${totalRare?` +${totalRare}🌸 Рідкісна!`:''}`:'🌿 Нічого не знайдено';
  if(typeof addLog==='function') addLog(msg,totalRare>0);
  if(totalHerb||totalRare) showExpToast(msg);
  if(typeof markDirty==='function') markDirty('full');
  renderHerbTab();
}

function upgradeHerbDrying(){
  let sys=HERB_SYSTEM;
  if(sys.dryingRackLvl>=sys.dryingMax) return;
  let cost={wood:Math.floor(15*Math.pow(1.5,sys.dryingRackLvl)),fiber:Math.floor(20*Math.pow(1.5,sys.dryingRackLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.dryingRackLvl++; if(typeof addLog==='function') addLog(`🌿 Сушарка → Рів.${sys.dryingRackLvl}`);
  if(typeof markDirty==='function') markDirty('full'); renderHerbTab();
}

function upgradeHerbAlchemy(){
  let sys=HERB_SYSTEM;
  if(sys.alchemyLvl>=sys.alchemyMax) return;
  let cost={books:Math.floor(15*Math.pow(1.7,sys.alchemyLvl)),paper:Math.floor(10*Math.pow(1.7,sys.alchemyLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.alchemyLvl++; if(typeof addLog==='function') addLog(`⚗️ Алхімія → Рів.${sys.alchemyLvl}`);
  if(typeof markDirty==='function') markDirty('full'); renderHerbTab();
}

function renderHerbTab(){
  let div=document.getElementById('tab-herb-content'); if(!div) return;
  let sys=HERB_SYSTEM;
  let now=Date.now()/1000; let cdRem=Math.max(0,Math.ceil(sys.cooldown-(now-sys.lastHarvest)));
  let herb=typeof storage!=='undefined'?(storage.herb||0):0;
  let rare=typeof storage!=='undefined'?(storage.rare_herb||0):0;
  let dCost={wood:Math.floor(15*Math.pow(1.5,sys.dryingRackLvl)),fiber:Math.floor(20*Math.pow(1.5,sys.dryingRackLvl))};
  let aCost={books:Math.floor(15*Math.pow(1.7,sys.alchemyLvl)),paper:Math.floor(10*Math.pow(1.7,sys.alchemyLvl))};
  let canD=typeof storage==='undefined'||Object.keys(dCost).every(k=>(storage[k]||0)>=dCost[k]);
  let canA=typeof storage==='undefined'||Object.keys(aCost).every(k=>(storage[k]||0)>=aCost[k]);
  let html=`<div style="padding:4px;">
    <div class="sh">🌿 ТРАВНИЦТВО</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🌿</div><b style="color:var(--green)">${fmt2(herb)}</b><div style="font-size:9px;color:var(--dim)">Трави</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🌸</div><b style="color:var(--purple)">${fmt2(rare)}</b><div style="font-size:9px;color:var(--dim)">Рідкісні</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🌿</div><b>${sys.harvestedTotal}</b><div style="font-size:9px;color:var(--dim)">Всього</div></div>
    </div>
    ${sys.harvesting?`<div style="height:6px;background:#070a0f;border:1px solid var(--teal);margin-bottom:6px;"><div id="herb-progress-bar" style="height:100%;background:var(--teal);width:${sys.harvestProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startHerbHarvest()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--teal)'};background:rgba(74,184,160,.1);color:${cdRem>0?'var(--dim)':'var(--teal)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🌿 ЗБИРАТИ ТРАВИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">🌿 Сушарка Рів.${sys.dryingRackLvl}/${sys.dryingMax}</div>
        ${sys.dryingRackLvl<sys.dryingMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(dCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeHerbDrying()" ${!canD?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:4px;border:1px solid ${canD?'var(--teal)':'var(--border)'};background:transparent;color:${canD?'var(--teal)':'var(--dim)'};cursor:${canD?'pointer':'not-allowed'};margin-top:4px;">⬆</button>`:'<div style="font-size:10px;color:var(--gold)">MAX</div>'}
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">⚗️ Алхімія Рів.${sys.alchemyLvl}/${sys.alchemyMax}</div>
        ${sys.alchemyLvl<sys.alchemyMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(aCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeHerbAlchemy()" ${!canA?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:4px;border:1px solid ${canA?'var(--purple)':'var(--border)'};background:transparent;color:${canA?'var(--purple)':'var(--dim)'};cursor:${canA?'pointer':'not-allowed'};margin-top:4px;">⬆</button>`:'<div style="font-size:10px;color:var(--gold)">MAX</div>'}
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 Трави використовуються в алхімії та медицині. Рідкісні трави дають бонуси до HP воїнів.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 6. ГЕОЛОГІЧНА РОЗВІДКА
// ============================================================
const GEOLOGY_SYSTEM = {
  expeditionsTotal: 0,
  lastExpedition: 0,
  cooldown: 120,
  exploring: false,
  exploreProgress: 0,
  exploreDuration: 20,
  expeditionLvl: 0, // рівень команди геологів
  equipLvl: 0,      // рівень обладнання
  expeditionMax: 10, equipMax: 10,
  discoveredDeposits: [],
  maxDeposits: 20,
  deposits: [
    { id:'coal_vein',  name:'🕳 Вугільна жила',  minEp:2, chance:0.4, resource:'charcoal', min:20, max:50,  rarity:'звичайна' },
    { id:'iron_vein',  name:'🔩 Залізна жила',   minEp:3, chance:0.3, resource:'iron',     min:15, max:40,  rarity:'рідкісна' },
    { id:'copper_ore', name:'🟤 Мідна руда',      minEp:3, chance:0.35,resource:'copper',   min:15, max:35,  rarity:'рідкісна' },
    { id:'gem_deposit',name:'💎 Коштовне каміння',minEp:3, chance:0.15,resource:'gem',      min:3,  max:8,   rarity:'цінна'    },
    { id:'oil_pocket', name:'🛢 Нафтова кишеня', minEp:7, chance:0.25,resource:'oil',      min:30, max:80,  rarity:'цінна'    },
    { id:'crystal_cave',name:'🔮 Кристальна печера',minEp:5,chance:0.1,resource:'crystal', min:5,  max:15,  rarity:'рідкісна' },
    { id:'fossil_site',name:'🦴 Скам\'янілості',   minEp:6, chance:0.2, resource:'fossil',  min:10, max:25,  rarity:'звичайна' },
    { id:'silicon_vein',name:'💎 Кремнієва жила',  minEp:9, chance:0.15,resource:'silicon', min:5,  max:15,  rarity:'цінна'    },
  ],
  activeDeposit: null,  // поточне активне родовище для видобутку
  miningCooldown: 30,
  lastMined: 0,
};

function startGeologyExpedition(){
  let sys=GEOLOGY_SYSTEM;
  if(sys.exploring){ showExpToast('🔍 Вже досліджуємо!'); return; }
  let now=Date.now()/1000; let cd=sys.cooldown-sys.expeditionLvl*5;
  if(now-sys.lastExpedition<cd){ showExpToast(`⏳ ${Math.ceil(cd-(now-sys.lastExpedition))}с`); return; }
  if(sys.discoveredDeposits.length>=sys.maxDeposits){ showExpToast('🗺 Усі родовища вже знайдено!'); return; }
  sys.exploring=true; sys.exploreProgress=0;
  renderGeologyTab();
  let dur=Math.max(8,sys.exploreDuration-sys.equipLvl*2);
  let el=0;
  let timer=setInterval(()=>{
    el++; sys.exploreProgress=el/dur*100;
    let b=document.getElementById('geo-progress-bar'); if(b) b.style.width=sys.exploreProgress+'%';
    if(el>=dur){ clearInterval(timer); finishGeologyExpedition(); }
  },1000);
}

function finishGeologyExpedition(){
  let sys=GEOLOGY_SYSTEM;
  sys.exploring=false; sys.exploreProgress=0; sys.lastExpedition=Date.now()/1000; sys.expeditionsTotal++;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let available=sys.deposits.filter(d=>ep>=d.minEp&&!sys.discoveredDeposits.find(dd=>dd.id===d.id));
  if(!available.length){ if(typeof addLog==='function') addLog('🗺 Всі можливі родовища вже знайдено!'); renderGeologyTab(); return; }
  let eqBonus=sys.equipLvl*0.05;
  let found=available.filter(d=>Math.random()<d.chance+eqBonus);
  if(!found.length){ if(typeof addLog==='function') addLog('🔍 Нічого не знайдено. Продовжуйте дослідження!'); renderGeologyTab(); return; }
  found.forEach(d=>{
    sys.discoveredDeposits.push({...d, mined:0, totalReserve:rndRange(d.min*10, d.max*20)});
    if(typeof addLog==='function') addLog(`⛏️ ЗНАЙДЕНО: ${d.name} (${d.rarity})!`, true);
    showExpToast(`⛏️ ${d.name}!`);
  });
  if(typeof markDirty==='function') markDirty('full');
  renderGeologyTab();
}

function mineGeologyDeposit(idx){
  let sys=GEOLOGY_SYSTEM;
  let dep=sys.discoveredDeposits[idx]; if(!dep) return;
  let now=Date.now()/1000;
  if(now-sys.lastMined<sys.miningCooldown){ showExpToast(`⏳ ${Math.ceil(sys.miningCooldown-(now-sys.lastMined))}с`); return; }
  let ep=typeof epoch!=='undefined'?epoch:1;
  let toolBonus=1+sys.equipLvl*0.1;
  let amt=Math.floor(rndRange(dep.min,dep.max)*toolBonus);
  amt=Math.min(amt, dep.totalReserve-dep.mined);
  if(amt<=0){ showExpToast('🪨 Родовище вичерпано!'); return; }
  dep.mined+=amt; sys.lastMined=now;
  if(typeof storage!=='undefined') storage[dep.resource]=(storage[dep.resource]||0)+amt;
  let resName=typeof RES!=='undefined'?RES[dep.resource]?.n||dep.resource:dep.resource;
  let resEmoji=typeof RES!=='undefined'?RES[dep.resource]?.e||'📦':'📦';
  if(typeof addLog==='function') addLog(`⛏️ ${dep.name}: +${amt} ${resEmoji}`);
  showExpToast(`⛏️ +${amt} ${resEmoji}`);
  if(dep.mined>=dep.totalReserve){ if(typeof addLog==='function') addLog(`🪨 ${dep.name} — вичерпано!`); }
  if(typeof markDirty==='function') markDirty('full');
  renderGeologyTab();
}

function upgradeGeologyExpedition(){
  let sys=GEOLOGY_SYSTEM;
  if(sys.expeditionLvl>=sys.expeditionMax) return;
  let cost={iron:Math.floor(30*Math.pow(1.6,sys.expeditionLvl)),tools:Math.floor(20*Math.pow(1.6,sys.expeditionLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.expeditionLvl++; if(typeof markDirty==='function') markDirty('full'); renderGeologyTab();
}

function upgradeGeologyEquip(){
  let sys=GEOLOGY_SYSTEM;
  if(sys.equipLvl>=sys.equipMax) return;
  let cost={steel:Math.floor(25*Math.pow(1.7,sys.equipLvl)),iron:Math.floor(40*Math.pow(1.7,sys.equipLvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.equipLvl++; if(typeof markDirty==='function') markDirty('full'); renderGeologyTab();
}

function renderGeologyTab(){
  let div=document.getElementById('tab-geology-content'); if(!div) return;
  let sys=GEOLOGY_SYSTEM;
  let now=Date.now()/1000; let cd=sys.cooldown-sys.expeditionLvl*5;
  let cdRem=Math.max(0,Math.ceil(cd-(now-sys.lastExpedition)));
  let mineCd=Math.max(0,Math.ceil(sys.miningCooldown-(now-sys.lastMined)));
  let html=`<div style="padding:4px;">
    <div class="sh">⛏️ ГЕОЛОГІЧНА РОЗВІДКА</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🗺</div><b style="color:var(--gold)">${sys.discoveredDeposits.length}</b><div style="font-size:9px;color:var(--dim)">Родовищ</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>⛏️</div><b>${sys.expeditionsTotal}</b><div style="font-size:9px;color:var(--dim)">Експедицій</div></div>
    </div>
    ${sys.exploring?`<div style="height:6px;background:#070a0f;border:1px solid var(--gold);margin-bottom:6px;"><div id="geo-progress-bar" style="height:100%;background:var(--gold);width:${sys.exploreProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startGeologyExpedition()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--gold)'};background:rgba(232,184,75,.1);color:${cdRem>0?'var(--dim)':'var(--gold)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🔍 РОЗВІДАТИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;">
        <div style="font-size:11px;">👥 Геологи Рів.${sys.expeditionLvl}/${sys.expeditionMax}</div>
        <button onclick="upgradeGeologyExpedition()" ${sys.expeditionLvl>=sys.expeditionMax?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:3px;border:1px solid var(--gold);background:transparent;color:var(--gold);cursor:pointer;margin-top:4px;">⬆ НАЙНЯТИ</button>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;">
        <div style="font-size:11px;">⛏️ Обладнання Рів.${sys.equipLvl}/${sys.equipMax}</div>
        <button onclick="upgradeGeologyEquip()" ${sys.equipLvl>=sys.equipMax?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:3px;border:1px solid var(--orange);background:transparent;color:var(--orange);cursor:pointer;margin-top:4px;">⬆ ОНОВИТИ</button>
      </div>
    </div>
    ${sys.discoveredDeposits.length>0?`
    <div class="sh">🗺 ЗНАЙДЕНІ РОДОВИЩА ${mineCd>0?`<span style="font-size:9px;color:var(--dim)">⏳ ${mineCd}с</span>`:''}</div>
    <div style="display:flex;flex-direction:column;gap:3px;">
    ${sys.discoveredDeposits.map((dep,i)=>{
      let pct=Math.min(100,(dep.mined/dep.totalReserve*100));
      let exhausted=dep.mined>=dep.totalReserve;
      let res=typeof RES!=='undefined'?RES[dep.resource]:null;
      return `<div style="background:var(--panel2);border:1px solid ${exhausted?'var(--dim)':'var(--border)'};padding:7px;opacity:${exhausted?.5:1};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span style="font-size:11px;">${dep.name}</span>
          <span style="font-size:10px;color:var(--dim)">${dep.rarity}</span>
        </div>
        <div style="height:4px;background:#070a0f;border:1px solid var(--border);margin-bottom:4px;">
          <div style="height:100%;background:${exhausted?'var(--dim)':'var(--gold)'};width:${100-pct}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;color:var(--dim)">${res?.e||'📦'} Залишок: ${dep.totalReserve-dep.mined}</span>
          <button onclick="mineGeologyDeposit(${i})" ${exhausted||mineCd>0?'disabled':''} style="font-family:var(--font);font-size:9px;padding:3px 8px;border:1px solid ${exhausted?'var(--dim)':mineCd>0?'var(--border)':'var(--orange)'};background:transparent;color:${exhausted?'var(--dim)':mineCd>0?'var(--dim)':'var(--orange)'};cursor:${exhausted||mineCd>0?'not-allowed':'pointer'};">${exhausted?'ВИЧЕРПАНО':'⛏️ КОПАТИ'}</button>
        </div>
      </div>`;
    }).join('')}
    </div>`:'<div style="font-size:11px;color:var(--dim);padding:10px;text-align:center;">Проведіть розвідку щоб знайти родовища</div>'}
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;margin-top:5px;">💡 Геологічна розвідка відкриває родовища корисних копалин. Видобуток можливий кожні ${sys.miningCooldown}с.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 7. РЕЙДИ НА ГОБЛІНСЬКІ УГІДДЯ
// ============================================================
const RAID_SYSTEM = {
  raidsTotal: 0,
  lastRaid: 0,
  cooldown: 300, // 5 хвилин між рейдами
  raiding: false,
  raidProgress: 0,
  raidDuration: 30,
  raidPower: 0,   // сила рейду (залежить від гарнізону)
  raidLevel: 0,   // рівень тактики рейдів
  raidMax: 10,
  victories: 0,
  defeats: 0,
  targets: [
    { id:'goblin_camp',   name:'🏕 Гоблінський табір', minEp:1, power:20,  loot:{goblin_loot:[5,15], wood:[20,50]},    chance:0.85 },
    { id:'goblin_village',name:'🏘 Гоблінське село',   minEp:2, power:50,  loot:{goblin_loot:[15,30],iron:[10,25]},    chance:0.7  },
    { id:'goblin_fortress',name:'🏰 Фортеця гоблінів', minEp:4, power:120, loot:{goblin_relic:[2,5], bronze:[20,40]},  chance:0.55 },
    { id:'goblin_temple', name:'⛩ Храм гоблінів',     minEp:6, power:300, loot:{goblin_relic:[5,10],gold_ore:[10,20]},chance:0.4  },
    { id:'goblin_lair',   name:'💀 Лігво вождя',       minEp:8, power:800, loot:{goblin_relic:[10,20],soul:[3,8]},     chance:0.3  },
  ],
  activeTarget: 'goblin_camp',
};

function getRaidPower(){
  let sys=RAID_SYSTEM;
  let tp=TROOP_SYSTEM;
  let base=0;
  base+=tp.garrison.sword*10+tp.garrison.archer*15+tp.garrison.knight*50+tp.garrison.mage*80+tp.garrison.elite*150;
  base*=(1+sys.raidLevel*0.1);
  return Math.floor(base);
}

function startRaid(){
  let sys=RAID_SYSTEM;
  if(sys.raiding){ showExpToast('⚔️ Рейд вже йде!'); return; }
  let now=Date.now()/1000;
  if(now-sys.lastRaid<sys.cooldown){ showExpToast(`⏳ ${Math.ceil(sys.cooldown-(now-sys.lastRaid))}с`); return; }
  let target=sys.targets.find(t=>t.id===sys.activeTarget);
  if(!target){ return; }
  let ep=typeof epoch!=='undefined'?epoch:1;
  if(ep<target.minEp){ showExpToast(`🔒 Потрібна Епоха ${target.minEp}!`); return; }
  let power=getRaidPower();
  if(power<target.power*0.5){ showExpToast(`⚔️ Недостатньо військ! Потрібна сила: ${target.power}, є: ${power}`); return; }
  sys.raiding=true; sys.raidProgress=0; sys.raidPower=power;
  renderRaidTab();
  let dur=Math.max(10,sys.raidDuration-sys.raidLevel*2);
  let el=0;
  let timer=setInterval(()=>{
    el++; sys.raidProgress=el/dur*100;
    let b=document.getElementById('raid-progress-bar'); if(b) b.style.width=sys.raidProgress+'%';
    if(el>=dur){ clearInterval(timer); finishRaid(); }
  },1000);
}

function finishRaid(){
  let sys=RAID_SYSTEM;
  sys.raiding=false; sys.raidProgress=0; sys.lastRaid=Date.now()/1000; sys.raidsTotal++;
  let target=sys.targets.find(t=>t.id===sys.activeTarget);
  if(!target){ renderRaidTab(); return; }
  let power=sys.raidPower;
  let ratio=Math.min(2, power/target.power);
  let successChance=target.chance * Math.min(1.5, ratio);
  if(Math.random()<successChance){
    sys.victories++;
    let lootStr='';
    Object.entries(target.loot).forEach(([res,[min,max]])=>{
      let mult=1+sys.raidLevel*0.1;
      let amt=Math.floor(rndRange(min,max)*mult);
      if(typeof storage!=='undefined') storage[res]=(storage[res]||0)+amt;
      let e=typeof RES!=='undefined'?RES[res]?.e||'📦':'📦';
      lootStr+=`+${amt}${e} `;
    });
    if(typeof addLog==='function') addLog(`⚔️ ПЕРЕМОГА! Рейд на ${target.name}: ${lootStr}`, true);
    showExpToast(`⚔️ ПЕРЕМОГА! ${lootStr}`);
  } else {
    sys.defeats++;
    // Втрати — рандомна часина військ
    let tp=TROOP_SYSTEM;
    let loss=Math.floor(tp.getTotalTroops()*0.05);
    if(typeof addLog==='function') addLog(`💀 Поразка в рейді! Втрати: ~${loss} воїнів`);
    showExpToast('💀 Рейд провалився!');
    // Зменшуємо трупи
    ['sword','archer','knight','mage','elite'].forEach(t=>{
      let rem=Math.floor(tp.garrison[t]*0.05);
      tp.garrison[t]=Math.max(0,tp.garrison[t]-rem);
    });
  }
  if(typeof markDirty==='function') markDirty('full');
  renderRaidTab();
}

function upgradeRaidTactics(){
  let sys=RAID_SYSTEM;
  if(sys.raidLevel>=sys.raidMax) return;
  let cost={iron:Math.floor(50*Math.pow(1.7,sys.raidLevel)),books:Math.floor(20*Math.pow(1.7,sys.raidLevel))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.raidLevel++; if(typeof addLog==='function') addLog(`⚔️ Тактика рейдів → Рів.${sys.raidLevel}`);
  if(typeof markDirty==='function') markDirty('full'); renderRaidTab();
}

function renderRaidTab(){
  let div=document.getElementById('tab-raids-content'); if(!div) return;
  let sys=RAID_SYSTEM;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let now=Date.now()/1000; let cdRem=Math.max(0,Math.ceil(sys.cooldown-(now-sys.lastRaid)));
  let power=getRaidPower();
  let loot=typeof storage!=='undefined'?(storage.goblin_loot||0):0;
  let relic=typeof storage!=='undefined'?(storage.goblin_relic||0):0;
  let html=`<div style="padding:4px;">
    <div class="sh">⚔️ РЕЙДИ НА ГОБЛІНІВ</div>
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>⚔️</div><b style="color:var(--orange)">${power}</b><div style="font-size:9px;color:var(--dim)">Сила рейду</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🏆</div><b style="color:var(--green)">${sys.victories}</b><div style="font-size:9px;color:var(--dim)">Перемог</div></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>💀</div><b style="color:var(--red)">${sys.defeats}</b><div style="font-size:9px;color:var(--dim)">Поразок</div></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:5px 8px;flex:1;text-align:center;font-size:11px;">🪙 Трофеї: <b style="color:var(--gold)">${fmt2(loot)}</b></div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:5px 8px;flex:1;text-align:center;font-size:11px;">🗿 Реліквії: <b style="color:var(--purple)">${fmt2(relic)}</b></div>
    </div>
    <div class="sh">🎯 ЦІЛЬ РЕЙДУ</div>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px;">
    ${sys.targets.map(t=>{
      let av=ep>=t.minEp; let sel=sys.activeTarget===t.id;
      let sufficient=power>=t.power*0.5;
      return `<div onclick="${av?`setRaidTarget('${t.id}')`:''}" style="padding:6px 8px;border:1px solid ${sel?'var(--red)':av?'var(--border)':'#0d0d0d'};background:${sel?'#1a0a0a':'var(--panel2)'};cursor:${av?'pointer':'default'};opacity:${av?1:.4};">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:11px">${t.name} ${sel?'◀':''}</span>
          <span style="font-size:9px;color:var(--dim)">Еп.${t.minEp}</span>
        </div>
        <div style="font-size:10px;color:${sufficient?'var(--teal)':'var(--red)'};margin-top:2px;">💪 Сила: ${t.power} ${sufficient?'✓':'← недостатньо'}</div>
      </div>`;
    }).join('')}
    </div>
    ${sys.raiding?`<div style="height:6px;background:#070a0f;border:1px solid var(--red);margin-bottom:6px;"><div id="raid-progress-bar" style="height:100%;background:var(--red);width:${sys.raidProgress}%;transition:width 1s;"></div></div><div style="font-size:11px;color:var(--red);text-align:center;margin-bottom:6px;">⚔️ Рейд...</div>`
    :`<button onclick="startRaid()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--red)'};background:rgba(224,85,85,.1);color:${cdRem>0?'var(--dim)':'var(--red)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'⚔️ ЗДІЙСНИТИ РЕЙД'}</button>`}
    <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
      <div style="font-size:11px;margin-bottom:4px;">🗡 Тактика рейдів Рів.${sys.raidLevel}/${sys.raidMax}</div>
      <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${sys.raidLevel*10}% до видобутку, -${sys.raidLevel*2}с часу</div>
      <button onclick="upgradeRaidTactics()" ${sys.raidLevel>=sys.raidMax?'disabled':''} style="font-family:var(--font);font-size:10px;padding:4px 12px;border:1px solid ${sys.raidLevel>=sys.raidMax?'var(--gold)':'var(--red)'};background:transparent;color:${sys.raidLevel>=sys.raidMax?'var(--gold)':'var(--red)'};cursor:${sys.raidLevel>=sys.raidMax?'not-allowed':'pointer'};">${sys.raidLevel>=sys.raidMax?'MAX':'⬆ ПОКРАЩИТИ ТАКТИКУ'}</button>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;margin-top:5px;">💡 Для рейдів потрібні воїни у Гарнізоні. Трофеї продаються або обмінюються. Реліквії дають постійні бонуси.</div>
  </div>`;
  div.innerHTML = html;
}

function setRaidTarget(id){ RAID_SYSTEM.activeTarget=id; renderRaidTab(); }

// ============================================================
// 8. РОЗВИТОК ВІЙСЬК ТА ГАРНІЗОН
// ============================================================
const TROOP_SYSTEM = {
  garrison: {
    sword: 0,   // мечники
    archer: 0,  // лучники
    knight: 0,  // лицарі
    mage: 0,    // маги
    elite: 0,   // елітні воїни
  },
  garrisonMax: 500, // ціль гри
  trainingQueue: [], // черга навчання
  trainingActive: false,
  trainingProgress: 0,
  barracks: { lvl:0, maxLvl:10 },   // казарма
  academy: { lvl:0, maxLvl:8 },     // академія
  armory: { lvl:0, maxLvl:10 },     // зброярня
  morale: 100, // моральний дух (0-100)
  moraleDecayRate: 0.1, // деградація моралі за секунду без їжі
  lastFed: Date.now()/1000,
  feedInterval: 120, // секунд між годуванням
  xp: 0,   // досвід армії
  tier: 0, // тир армії

  // Вартість і характеристики загонів
  troopDefs: {
    sword:  { name:'⚔️ Мечник',    cost:{wood:20,iron:10},       trainTime:10, power:10,  minEp:2, upkeep:{game_meat:0.01}, desc:'Базова піхота' },
    archer: { name:'🏹 Лучник',    cost:{wood:15,fiber:10,stone:5},trainTime:12, power:15,  minEp:2, upkeep:{game_meat:0.01}, desc:'Дистанційний бій' },
    knight: { name:'🛡 Лицар',     cost:{iron:30,bronze:15},      trainTime:30, power:50,  minEp:5, upkeep:{game_meat:0.02}, desc:'Важка кавалерія' },
    mage:   { name:'🧙 Маг',       cost:{books:20,synth_energy:30},trainTime:45, power:80,  minEp:6, upkeep:{herb:0.01},      desc:'Магічна підтримка' },
    elite:  { name:'💂 Елітний',   cost:{steel:25,chips:10},      trainTime:60, power:150, minEp:8, upkeep:{game_meat:0.03}, desc:'Найкраще спорядження' },
  },

  getTotalTroops(){ return Object.values(this.garrison).reduce((s,v)=>s+v,0); },
  getCombatPower(){
    let p=0;
    Object.entries(this.garrison).forEach(([t,n])=>{
      p+=n*(this.troopDefs[t]?.power||0);
    });
    return Math.floor(p*(1+this.morale/200)*(1+this.armory.lvl*0.05)*(1+this.xp/1000));
  },
};

function trainTroop(type){
  let sys=TROOP_SYSTEM;
  let def=sys.troopDefs[type]; if(!def) return;
  let ep=typeof epoch!=='undefined'?epoch:1;
  if(ep<def.minEp){ showExpToast(`🔒 Потрібна Епоха ${def.minEp}!`); return; }
  if(sys.getTotalTroops()>=sys.garrisonMax){ showExpToast('⚠️ Гарнізон повний!'); return; }
  let barBonus=sys.barracks.lvl;
  let cost={}; Object.entries(def.cost).forEach(([k,v])=>cost[k]=Math.max(1,Math.floor(v*(1-barBonus*0.03))));
  if(typeof storage!=='undefined'){
    if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️ Недостатньо ресурсів!'); return; }
    Object.keys(cost).forEach(k=>storage[k]-=cost[k]);
  }
  let time=Math.max(3,def.trainTime-sys.academy.lvl*2);
  sys.trainingQueue.push({type, timeLeft:time, totalTime:time});
  if(!sys.trainingActive) processTrainingQueue();
  if(typeof addLog==='function') addLog(`🎖 ${def.name} набраний до черги`);
  if(typeof markDirty==='function') markDirty('full');
  renderTroopTab();
}

function trainTroopBulk(type, n){
  for(let i=0;i<n;i++) trainTroop(type);
}

let _trainingTimer=null;
function processTrainingQueue(){
  let sys=TROOP_SYSTEM;
  if(!sys.trainingQueue.length){ sys.trainingActive=false; return; }
  sys.trainingActive=true;
  let current=sys.trainingQueue[0];
  _trainingTimer=setInterval(()=>{
    current.timeLeft--;
    sys.trainingProgress=(1-current.timeLeft/current.totalTime)*100;
    let b=document.getElementById('troop-train-bar'); if(b) b.style.width=sys.trainingProgress+'%';
    if(current.timeLeft<=0){
      clearInterval(_trainingTimer);
      sys.garrison[current.type]=(sys.garrison[current.type]||0)+1;
      sys.xp+=sys.troopDefs[current.type]?.power||10;
      sys.trainingQueue.shift();
      if(typeof addLog==='function') addLog(`🎖 ${sys.troopDefs[current.type]?.name} готовий до бою!`);
      if(sys.getTotalTroops()>=sys.garrisonMax && sys.xp>500){
        if(typeof addLog==='function') addLog('🏆 ГАРНІЗОН УКОМПЛЕКТОВАНО! Ціль виконана!', true);
      }
      sys.trainingProgress=0;
      if(typeof markDirty==='function') markDirty('full');
      renderTroopTab();
      if(sys.trainingQueue.length) processTrainingQueue();
      else sys.trainingActive=false;
    }
  },1000);
}

function upgradeBarracks(){
  let sys=TROOP_SYSTEM;
  if(sys.barracks.lvl>=sys.barracks.maxLvl) return;
  let cost={boards:Math.floor(40*Math.pow(1.6,sys.barracks.lvl)),stone:Math.floor(50*Math.pow(1.6,sys.barracks.lvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.barracks.lvl++; if(typeof markDirty==='function') markDirty('full'); renderTroopTab();
}

function upgradeAcademy(){
  let sys=TROOP_SYSTEM;
  if(sys.academy.lvl>=sys.academy.maxLvl) return;
  let cost={books:Math.floor(30*Math.pow(1.7,sys.academy.lvl)),iron:Math.floor(40*Math.pow(1.7,sys.academy.lvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.academy.lvl++; if(typeof markDirty==='function') markDirty('full'); renderTroopTab();
}

function upgradeArmory(){
  let sys=TROOP_SYSTEM;
  if(sys.armory.lvl>=sys.armory.maxLvl) return;
  let cost={steel:Math.floor(30*Math.pow(1.7,sys.armory.lvl)),tools:Math.floor(30*Math.pow(1.7,sys.armory.lvl))};
  if(typeof storage!=='undefined'){ if(!Object.keys(cost).every(k=>(storage[k]||0)>=cost[k])){ showExpToast('⚠️'); return; } Object.keys(cost).forEach(k=>storage[k]-=cost[k]); }
  sys.armory.lvl++; if(typeof markDirty==='function') markDirty('full'); renderTroopTab();
}

function feedTroops(){
  let sys=TROOP_SYSTEM;
  let n=sys.getTotalTroops();
  if(!n){ showExpToast('ℹ️ Немає воїнів'); return; }
  let meatNeeded=Math.ceil(n*0.5);
  if(typeof storage!=='undefined'&&(storage.game_meat||0)<meatNeeded){ showExpToast(`⚠️ Потрібно ${meatNeeded} 🍖`); return; }
  if(typeof storage!=='undefined') storage.game_meat=(storage.game_meat||0)-meatNeeded;
  sys.morale=Math.min(100,sys.morale+20);
  sys.lastFed=Date.now()/1000;
  if(typeof addLog==='function') addLog(`🍖 Воїнів нагодовано. Моральний дух: ${sys.morale}%`);
  if(typeof markDirty==='function') markDirty('full');
  renderTroopTab();
}

function dismissTroop(type, n){
  let sys=TROOP_SYSTEM;
  sys.garrison[type]=Math.max(0,(sys.garrison[type]||0)-n);
  if(typeof addLog==='function') addLog(`🏠 ${n} ${sys.troopDefs[type]?.name} відпущені`);
  if(typeof markDirty==='function') markDirty('full');
  renderTroopTab();
}

function renderTroopTab(){
  let div=document.getElementById('tab-troops-content'); if(!div) return;
  let sys=TROOP_SYSTEM;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let total=sys.getTotalTroops();
  let power=sys.getCombatPower();
  let pct=(total/sys.garrisonMax*100).toFixed(1);
  let moraleColor=sys.morale>70?'var(--green)':sys.morale>40?'var(--orange)':'var(--red)';
  let html=`<div style="padding:4px;">
    <div class="sh">⚔️ ГАРНІЗОН ТА АРМІЯ</div>
    <div style="background:#0a0808;border:1px solid var(--red);padding:8px;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:11px;">🎖 Гарнізон: <b style="color:var(--orange)">${total}</b> / ${sys.garrisonMax}</span>
        <span style="font-size:11px;color:var(--red)">💪 Сила: <b>${power}</b></span>
      </div>
      <div style="height:6px;background:#070a0f;border:1px solid var(--border);margin-bottom:5px;">
        <div style="height:100%;background:${total>=sys.garrisonMax?'var(--gold)':'var(--orange)'};width:${Math.min(100,pct)}%;transition:width .5s;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);">
        <span>😤 Моральний дух: <b style="color:${moraleColor}">${sys.morale}%</b></span>
        <span>⚔️ Досвід: ${sys.xp}</span>
      </div>
      ${total>0?`<button onclick="feedTroops()" style="margin-top:6px;width:100%;font-family:var(--font);font-size:10px;padding:5px;border:1px solid var(--green);background:rgba(78,203,113,.1);color:var(--green);cursor:pointer;">🍖 НАГОДУВАТИ (${Math.ceil(total*0.5)}🍖)</button>`:''}
    </div>
    <div class="sh">🎖 ЗАГОНИ</div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
    ${Object.entries(sys.troopDefs).map(([type,def])=>{
      let av=ep>=def.minEp;
      let cnt=sys.garrison[type]||0;
      let bCost={};Object.entries(def.cost).forEach(([k,v])=>bCost[k]=Math.max(1,Math.floor(v*(1-sys.barracks.lvl*0.03))));
      let can=av&&typeof storage==='undefined'||Object.keys(bCost).every(k=>(storage[k]||0)>=bCost[k]);
      let canAfford=typeof storage==='undefined'||Object.keys(bCost).every(k=>(storage[k]||0)>=bCost[k]);
      return `<div style="background:var(--panel2);border:1px solid var(--border);padding:7px;opacity:${av?1:.4};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <div>
            <span style="font-size:11px">${def.name}</span>
            <span style="font-size:10px;color:var(--dim);margin-left:6px">${def.desc}</span>
          </div>
          <span style="font-size:12px;color:var(--orange);font-weight:bold;">${cnt}</span>
        </div>
        <div style="font-size:10px;color:var(--dim);margin-bottom:4px;">💪 Сила: ${def.power} · ⏱ ${Math.max(3,def.trainTime-sys.academy.lvl*2)}с · Еп.${def.minEp}</div>
        <div style="font-size:10px;color:var(--orange);margin-bottom:4px;">${Object.entries(bCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        ${av?`<div style="display:flex;gap:3px;flex-wrap:wrap;">
          <button onclick="trainTroop('${type}')" ${!canAfford||total>=sys.garrisonMax?'disabled':''} style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid ${canAfford?'var(--green)':'var(--border)'};background:transparent;color:${canAfford?'var(--green)':'var(--dim)'};cursor:${canAfford&&total<sys.garrisonMax?'pointer':'not-allowed'};">+1</button>
          <button onclick="trainTroopBulk('${type}',5)" ${!canAfford||total+5>sys.garrisonMax?'disabled':''} style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid ${canAfford?'var(--blue)':'var(--border)'};background:transparent;color:${canAfford?'var(--blue)':'var(--dim)'};cursor:${canAfford?'pointer':'not-allowed'};">+5</button>
          ${cnt>0?`<button onclick="dismissTroop('${type}',1)" style="font-family:var(--font);font-size:9px;padding:4px 8px;border:1px solid var(--red);background:transparent;color:var(--red);cursor:pointer;">-1</button>`:''}
        </div>`:'<div style="font-size:10px;color:var(--dim)">🔒 Відкривається в Еп.'+def.minEp+'</div>'}
      </div>`;
    }).join('')}
    </div>
    ${sys.trainingActive?`<div style="margin-bottom:6px;"><div style="font-size:11px;color:var(--gold);margin-bottom:3px;">⚔️ Навчання: ${sys.troopDefs[sys.trainingQueue[0]?.type]?.name||''} (черга: ${sys.trainingQueue.length})</div><div style="height:6px;background:#070a0f;border:1px solid var(--gold);"><div id="troop-train-bar" style="height:100%;background:var(--gold);width:${sys.trainingProgress}%;transition:width 1s;"></div></div></div>`:''}
    <div class="sh">🏰 СПОРУДИ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;text-align:center;">
        <div style="font-size:12px;">🏟</div>
        <div style="font-size:10px;">Казарма Рів.${sys.barracks.lvl}</div>
        <button onclick="upgradeBarracks()" ${sys.barracks.lvl>=sys.barracks.maxLvl?'disabled':''} style="width:100%;font-family:var(--font);font-size:8px;padding:3px;border:1px solid var(--orange);background:transparent;color:var(--orange);cursor:pointer;margin-top:3px;">${sys.barracks.lvl>=sys.barracks.maxLvl?'MAX':'⬆'}</button>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;text-align:center;">
        <div style="font-size:12px;">📚</div>
        <div style="font-size:10px;">Академія Рів.${sys.academy.lvl}</div>
        <button onclick="upgradeAcademy()" ${sys.academy.lvl>=sys.academy.maxLvl?'disabled':''} style="width:100%;font-family:var(--font);font-size:8px;padding:3px;border:1px solid var(--blue);background:transparent;color:var(--blue);cursor:pointer;margin-top:3px;">${sys.academy.lvl>=sys.academy.maxLvl?'MAX':'⬆'}</button>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;text-align:center;">
        <div style="font-size:12px;">⚒️</div>
        <div style="font-size:10px;">Зброярня Рів.${sys.armory.lvl}</div>
        <button onclick="upgradeArmory()" ${sys.armory.lvl>=sys.armory.maxLvl?'disabled':''} style="width:100%;font-family:var(--font);font-size:8px;padding:3px;border:1px solid var(--purple);background:transparent;color:var(--purple);cursor:pointer;margin-top:3px;">${sys.armory.lvl>=sys.armory.maxLvl?'MAX':'⬆'}</button>
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 ЦІЛЬ: сформуйте Гарнізон з ${sys.garrisonMax} воїнів. Воїни потрібні для Рейдів та захисту від Гоблінів.</div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// 9. ЦІЛ ГРАВЦЯ (Лор та прогрес до перемоги)
// ============================================================
function renderLoreTab(){
  let div=document.getElementById('tab-lore-content'); if(!div) return;
  let ep=typeof epoch!=='undefined'?epoch:1;
  let souls=SOUL_SYSTEM.totalFound;
  let troops=TROOP_SYSTEM.getTotalTroops();
  let gobWaves=typeof goblinWave!=='undefined'?goblinWave.totalWaves:0;
  let geoDeposits=GEOLOGY_SYSTEM.discoveredDeposits.length;
  
  let victories=[
    { text:'Пройдено 12 Епох',      done:ep>=12,  prog:`Еп.${ep}/12` },
    { text:'100 Душ Стародавніх',   done:souls>=100, prog:`${souls}/100` },
    { text:'Гарнізон 500 воїнів',   done:troops>=500, prog:`${troops}/500` },
    { text:'50 хвиль гоблінів',     done:gobWaves>=50, prog:`${gobWaves}/50` },
    { text:'10 родовищ георозвідки',done:geoDeposits>=10, prog:`${geoDeposits}/10` },
  ];
  let doneCnt=victories.filter(v=>v.done).length;
  
  let html=`<div style="padding:4px;">
    <div style="background:linear-gradient(135deg,#0a050f,#050a15);border:2px solid var(--purple);padding:10px;margin-bottom:8px;">
      <div style="font-family:var(--font2);font-size:9px;color:var(--gold);margin-bottom:6px;">📖 ${GAME_LORE.title}</div>
      <div style="font-size:10px;color:var(--dim);line-height:1.6;margin-bottom:6px;">${GAME_LORE.subtitle}</div>
      <div style="font-size:11px;color:var(--text);line-height:1.6;">${GAME_LORE.intro}</div>
    </div>
    
    <div class="sh">🏆 ЦІЛЬ ГРИ <span class="sh-badge">${doneCnt}/${victories.length}</span></div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
    ${victories.map(v=>`<div style="background:var(--panel2);border:1px solid ${v.done?'var(--gold)':'var(--border)'};padding:7px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:11px;color:${v.done?'var(--gold)':'var(--text)'}">${v.done?'✅':'◻️'} ${v.text}</span>
      <span style="font-size:11px;color:${v.done?'var(--gold)':'var(--dim)'}">${v.done?'ВИКОНАНО':v.prog}</span>
    </div>`).join('')}
    </div>
    ${doneCnt>=victories.length?`<div style="background:linear-gradient(135deg,#1a0a00,#0a100a);border:2px solid var(--gold);padding:12px;text-align:center;">
      <div style="font-family:var(--font2);font-size:11px;color:var(--gold);margin-bottom:6px;">🏆 ПЕРЕМОГА!</div>
      <div style="font-size:11px;color:var(--text);">Ти досяг вершини Кубічної Еволюції! Легенда записана у зірках.</div>
    </div>`:''}
    
    <div class="sh">📖 РОЗДІЛИ</div>
    <div style="display:flex;flex-direction:column;gap:3px;">
    ${GAME_LORE.chapters.map(ch=>{
      let done=ep>=ch.ep[1]; let active=ep>=ch.ep[0]&&ep<=ch.ep[1];
      return `<div style="background:${active?'#0a1a08':done?'var(--panel2)':'#070a0f'};border:1px solid ${active?'var(--green)':done?'var(--border)':'#0d0d0d'};padding:6px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:11px;color:${active?'var(--green)':done?'var(--dim)':'#333'}">${done?'✅':active?'▶':''} ${ch.name}</span>
          <span style="font-size:10px;color:var(--dim)">Еп.${ch.ep[0]}-${ch.ep[1]}</span>
        </div>
        <div style="font-size:10px;color:var(--dim);margin-top:2px;">${ch.desc}</div>
      </div>`;
    }).join('')}
    </div>
  </div>`;
  div.innerHTML = html;
}

// ============================================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ============================================================
function rndRange(min,max){ return min + Math.floor(Math.random()*(max-min+1)); }
function fmt2(n){ if(typeof fmt==='function') return fmt(n); return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':Math.floor(n)+''; }
function showExpToast(msg){
  if(typeof showToast==='function'){ showToast(msg); return; }
  // Fallback
  let el=document.getElementById('toast');
  if(el){ el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2500); }
}

// ============================================================
// ПАСИВНИЙ ДОХІД ВІД РОЗШИРЕНЬ (інтегрується в основний тік)
// ============================================================
setInterval(()=>{
  // Пастки для мисливства
  let ht=HUNTING_SYSTEM;
  let trap=ht.trapPassive;
  if(trap>0&&typeof storage!=='undefined'){
    storage.game_meat=(storage.game_meat||0)+trap;
  }
  // Годування воїнів — деградація моралі
  let tr=TROOP_SYSTEM;
  let now=Date.now()/1000;
  if(tr.getTotalTroops()>0&&now-tr.lastFed>tr.feedInterval){
    tr.morale=Math.max(0,tr.morale-1);
    if(tr.morale===0&&typeof addLog==='function'){ addLog('😟 Моральний дух воїнів впав до нуля!'); }
  }
}, 1000);

// ============================================================
// ІНТЕГРАЦІЯ: бонус від Душ Стародавніх множить виробничий мультиплікатор
// ============================================================
(function patchProductionMult(){
  function tryPatch(){
    if(typeof getCityProductionMult==='undefined'){ setTimeout(tryPatch,500); return; }
    let _orig=getCityProductionMult;
    window.getCityProductionMult=function(){
      let base=_orig();
      let soulBonus=1+SOUL_SYSTEM.passiveBonus;
      return base*soulBonus;
    };
  }
  setTimeout(tryPatch,800);
})();

// ============================================================
// ІНІЦІАЛІЗАЦІЯ UI ВКЛАДОК
// ============================================================
function initExpansionTabs(){
  // Додаємо нові вкладки до лівої панелі
  let tabsEl=document.querySelector('.panel-tabs');
  if(!tabsEl) return;

  const newTabs=[
    { id:'lore',    label:'📖 ЛОР',      fn:'renderLoreTab' },
    { id:'souls',   label:'👻 ДУШІ',     fn:'renderSoulTab' },
    { id:'hunting', label:'🏹 МИСЛ.',    fn:'renderHuntingTab' },
    { id:'fishing', label:'🎣 РИБА',     fn:'renderFishingTab' },
    { id:'mushroom',label:'🍄 ГРИБИ',    fn:'renderMushroomTab' },
    { id:'herb',    label:'🌿 ТРАВИ',    fn:'renderHerbTab' },
    { id:'geology', label:'⛏️ ГЕО',      fn:'renderGeologyTab' },
    { id:'raids',   label:'⚔️ РЕЙДИ',    fn:'renderRaidTab' },
    { id:'troops',  label:'🎖 АРМІЯ',    fn:'renderTroopTab' },
  ];

  newTabs.forEach(t=>{
    // Кнопка вкладки
    let btn=document.createElement('button');
    btn.className='ptab';
    btn.id=`tab-btn-${t.id}`;
    btn.setAttribute('onclick',`switchTab('${t.id}')`);
    btn.textContent=t.label;
    tabsEl.appendChild(btn);
    // Контент вкладки
    let content=document.createElement('div');
    content.className='tab-content';
    content.id=`tab-${t.id}`;
    content.innerHTML=`<div id="tab-${t.id}-content" style="width:100%;"></div>`;
    let leftPanel=document.querySelector('.left-panel');
    if(leftPanel) leftPanel.appendChild(content);
  });

  const EXP_TAB_IDS = newTabs.map(t=>t.id);

  // Патчимо switchTab щоб рендерити нові вкладки і коректно перемикати active клас
  let _origSwitch=window.switchTab;
  window.switchTab=function(name){
    if(EXP_TAB_IDS.includes(name)){
      // Власна логіка перемикання для нових вкладок
      document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
      document.querySelectorAll('.ptab').forEach(el=>el.classList.remove('active'));
      let tabEl=document.getElementById('tab-'+name);
      if(tabEl) tabEl.classList.add('active');
      let btn=document.getElementById('tab-btn-'+name);
      if(btn) btn.classList.add('active');
    } else {
      _origSwitch&&_origSwitch(name);
    }
    switch(name){
      case 'lore':     renderLoreTab();     break;
      case 'souls':    renderSoulTab();     break;
      case 'hunting':  renderHuntingTab();  break;
      case 'fishing':  renderFishingTab();  break;
      case 'mushroom': renderMushroomTab(); break;
      case 'herb':     renderHerbTab();     break;
      case 'geology':  renderGeologyTab();  break;
      case 'raids':    renderRaidTab();     break;
      case 'troops':   renderTroopTab();    break;
    }
  };
}

// ============================================================
// ЗБЕРЕЖЕННЯ / ЗАВАНТАЖЕННЯ РОЗШИРЕНЬ
// ============================================================
function serializeExpansions(){
  return {
    souls: { totalFound:SOUL_SYSTEM.totalFound, lastSearch:SOUL_SYSTEM.lastSearch, activeLocation:SOUL_SYSTEM.activeLocation },
    hunting: { huntsTotal:HUNTING_SYSTEM.huntsTotal, lastHunt:HUNTING_SYSTEM.lastHunt, upgrades: Object.fromEntries(Object.entries(HUNTING_SYSTEM.upgrades).map(([k,u])=>[k,u.lvl])) },
    fishing: { fishedTotal:FISHING_SYSTEM.fishedTotal, lastFish:FISHING_SYSTEM.lastFish, fishCount:FISHING_SYSTEM.fishCount, activeSpot:FISHING_SYSTEM.activeSpot, upgrades:Object.fromEntries(Object.entries(FISHING_SYSTEM.upgrades).map(([k,u])=>[k,u.lvl])) },
    mushroom: { gatheredTotal:MUSHROOM_SYSTEM.gatheredTotal, lastGather:MUSHROOM_SYSTEM.lastGather, basketLvl:MUSHROOM_SYSTEM.basketLvl, knowledgeLvl:MUSHROOM_SYSTEM.knowledgeLvl },
    herb: { harvestedTotal:HERB_SYSTEM.harvestedTotal, lastHarvest:HERB_SYSTEM.lastHarvest, dryingRackLvl:HERB_SYSTEM.dryingRackLvl, alchemyLvl:HERB_SYSTEM.alchemyLvl },
    geology: { expeditionsTotal:GEOLOGY_SYSTEM.expeditionsTotal, lastExpedition:GEOLOGY_SYSTEM.lastExpedition, expeditionLvl:GEOLOGY_SYSTEM.expeditionLvl, equipLvl:GEOLOGY_SYSTEM.equipLvl, discoveredDeposits:GEOLOGY_SYSTEM.discoveredDeposits, lastMined:GEOLOGY_SYSTEM.lastMined },
    raids: { raidsTotal:RAID_SYSTEM.raidsTotal, lastRaid:RAID_SYSTEM.lastRaid, raidLevel:RAID_SYSTEM.raidLevel, victories:RAID_SYSTEM.victories, defeats:RAID_SYSTEM.defeats, activeTarget:RAID_SYSTEM.activeTarget },
    troops: { garrison:{...TROOP_SYSTEM.garrison}, xp:TROOP_SYSTEM.xp, morale:TROOP_SYSTEM.morale, lastFed:TROOP_SYSTEM.lastFed, barracks:TROOP_SYSTEM.barracks.lvl, academy:TROOP_SYSTEM.academy.lvl, armory:TROOP_SYSTEM.armory.lvl },
  };
}

function deserializeExpansions(data){
  if(!data) return;
  if(data.souls){ SOUL_SYSTEM.totalFound=data.souls.totalFound||0; SOUL_SYSTEM.lastSearch=data.souls.lastSearch||0; SOUL_SYSTEM.activeLocation=data.souls.activeLocation||'ruins'; }
  if(data.hunting){ HUNTING_SYSTEM.huntsTotal=data.hunting.huntsTotal||0; HUNTING_SYSTEM.lastHunt=data.hunting.lastHunt||0; if(data.hunting.upgrades) Object.entries(data.hunting.upgrades).forEach(([k,v])=>{ if(HUNTING_SYSTEM.upgrades[k]) HUNTING_SYSTEM.upgrades[k].lvl=v||0; }); }
  if(data.fishing){ FISHING_SYSTEM.fishedTotal=data.fishing.fishedTotal||0; FISHING_SYSTEM.lastFish=data.fishing.lastFish||0; FISHING_SYSTEM.fishCount=data.fishing.fishCount||0; FISHING_SYSTEM.activeSpot=data.fishing.activeSpot||'stream'; if(data.fishing.upgrades) Object.entries(data.fishing.upgrades).forEach(([k,v])=>{ if(FISHING_SYSTEM.upgrades[k]) FISHING_SYSTEM.upgrades[k].lvl=v||0; }); }
  if(data.mushroom){ MUSHROOM_SYSTEM.gatheredTotal=data.mushroom.gatheredTotal||0; MUSHROOM_SYSTEM.lastGather=data.mushroom.lastGather||0; MUSHROOM_SYSTEM.basketLvl=data.mushroom.basketLvl||0; MUSHROOM_SYSTEM.knowledgeLvl=data.mushroom.knowledgeLvl||0; }
  if(data.herb){ HERB_SYSTEM.harvestedTotal=data.herb.harvestedTotal||0; HERB_SYSTEM.lastHarvest=data.herb.lastHarvest||0; HERB_SYSTEM.dryingRackLvl=data.herb.dryingRackLvl||0; HERB_SYSTEM.alchemyLvl=data.herb.alchemyLvl||0; }
  if(data.geology){ GEOLOGY_SYSTEM.expeditionsTotal=data.geology.expeditionsTotal||0; GEOLOGY_SYSTEM.lastExpedition=data.geology.lastExpedition||0; GEOLOGY_SYSTEM.expeditionLvl=data.geology.expeditionLvl||0; GEOLOGY_SYSTEM.equipLvl=data.geology.equipLvl||0; GEOLOGY_SYSTEM.discoveredDeposits=data.geology.discoveredDeposits||[]; GEOLOGY_SYSTEM.lastMined=data.geology.lastMined||0; }
  if(data.raids){ RAID_SYSTEM.raidsTotal=data.raids.raidsTotal||0; RAID_SYSTEM.lastRaid=data.raids.lastRaid||0; RAID_SYSTEM.raidLevel=data.raids.raidLevel||0; RAID_SYSTEM.victories=data.raids.victories||0; RAID_SYSTEM.defeats=data.raids.defeats||0; RAID_SYSTEM.activeTarget=data.raids.activeTarget||'goblin_camp'; }
  if(data.troops){ Object.assign(TROOP_SYSTEM.garrison,data.troops.garrison||{}); TROOP_SYSTEM.xp=data.troops.xp||0; TROOP_SYSTEM.morale=data.troops.morale||100; TROOP_SYSTEM.lastFed=data.troops.lastFed||Date.now()/1000; TROOP_SYSTEM.barracks.lvl=data.troops.barracks||0; TROOP_SYSTEM.academy.lvl=data.troops.academy||0; TROOP_SYSTEM.armory.lvl=data.troops.armory||0; }
}

// Патчуємо серіалізацію/десеріалізацію основної гри
(function patchSaveSystem(){
  function tryPatch(){
    if(typeof serializeGameState==='undefined'||typeof deserializeGameState==='undefined'){ setTimeout(tryPatch,500); return; }
    let _origSer=serializeGameState;
    window.serializeGameState=function(){
      let s=_origSer();
      try{ s.expansions=serializeExpansions(); }catch(e){}
      return s;
    };
    let _origDeser=deserializeGameState;
    window.deserializeGameState=function(s){
      _origDeser(s);
      try{ if(s&&s.expansions) deserializeExpansions(s.expansions); }catch(e){}
    };
  }
  setTimeout(tryPatch,800);
})();

// ============================================================
// МОБІЛЬНА НАВІГАЦІЯ — додаткова кнопка "СВІТ"
// ============================================================
function initExpansionMobNav(){
  let nav=document.getElementById('mob-nav');
  if(!nav || document.getElementById('nav-exp')) return;
  let btn=document.createElement('button');
  btn.className='mob-nav-btn';
  btn.id='nav-exp';
  btn.setAttribute('onclick','expMobNav()');
  btn.innerHTML='<span class="nav-icon">🌍</span><span class="nav-label">СВІТ</span>';
  nav.appendChild(btn);
}

function expMobNav(){
  if(typeof isMobile==='function' && !isMobile()) { switchTab('lore'); return; }
  const leftPanel  = document.querySelector('.left-panel');
  const centerArea = document.querySelector('.center-area');
  const rightPanel = document.querySelector('.right-panel');
  [leftPanel, centerArea, rightPanel].forEach(p => p && p.classList.remove('mob-active'));
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  let myBtn=document.getElementById('nav-exp');
  if(myBtn) myBtn.classList.add('active');
  leftPanel && leftPanel.classList.add('mob-active');
  switchTab('lore');
}

// ============================================================
// ПАТЧ ПЕРЕРОДЖЕННЯ — скидаємо прогрес розширень при prestige
// ============================================================
function resetExpansionSystems(){
  SOUL_SYSTEM.totalFound=0; SOUL_SYSTEM.lastSearch=0; SOUL_SYSTEM.searching=false; SOUL_SYSTEM.searchProgress=0;
  HUNTING_SYSTEM.huntsTotal=0; HUNTING_SYSTEM.lastHunt=0; HUNTING_SYSTEM.hunting=false;
  Object.values(HUNTING_SYSTEM.upgrades).forEach(u=>u.lvl=0);
  FISHING_SYSTEM.fishedTotal=0; FISHING_SYSTEM.fishCount=0; FISHING_SYSTEM.lastFish=0; FISHING_SYSTEM.fishing=false;
  Object.values(FISHING_SYSTEM.upgrades).forEach(u=>u.lvl=0);
  MUSHROOM_SYSTEM.gatheredTotal=0; MUSHROOM_SYSTEM.lastGather=0; MUSHROOM_SYSTEM.gathering=false;
  MUSHROOM_SYSTEM.basketLvl=0; MUSHROOM_SYSTEM.knowledgeLvl=0;
  HERB_SYSTEM.harvestedTotal=0; HERB_SYSTEM.lastHarvest=0; HERB_SYSTEM.harvesting=false;
  HERB_SYSTEM.dryingRackLvl=0; HERB_SYSTEM.alchemyLvl=0;
  GEOLOGY_SYSTEM.expeditionsTotal=0; GEOLOGY_SYSTEM.lastExpedition=0; GEOLOGY_SYSTEM.exploring=false;
  GEOLOGY_SYSTEM.expeditionLvl=0; GEOLOGY_SYSTEM.equipLvl=0; GEOLOGY_SYSTEM.discoveredDeposits=[]; GEOLOGY_SYSTEM.lastMined=0;
  RAID_SYSTEM.raidsTotal=0; RAID_SYSTEM.lastRaid=0; RAID_SYSTEM.raiding=false;
  RAID_SYSTEM.raidLevel=0; RAID_SYSTEM.victories=0; RAID_SYSTEM.defeats=0; RAID_SYSTEM.activeTarget='goblin_camp';
  Object.keys(TROOP_SYSTEM.garrison).forEach(k=>TROOP_SYSTEM.garrison[k]=0);
  TROOP_SYSTEM.xp=0; TROOP_SYSTEM.morale=100; TROOP_SYSTEM.lastFed=Date.now()/1000;
  TROOP_SYSTEM.barracks.lvl=0; TROOP_SYSTEM.academy.lvl=0; TROOP_SYSTEM.armory.lvl=0;
  TROOP_SYSTEM.trainingQueue=[]; TROOP_SYSTEM.trainingActive=false;
}

(function patchPrestigeReset(){
  function tryPatch(){
    if(typeof _fullPrestigeReset==='undefined'){ setTimeout(tryPatch,500); return; }
    let _orig=_fullPrestigeReset;
    window._fullPrestigeReset=function(){
      _orig();
      try{ resetExpansionSystems(); }catch(e){}
    };
  }
  setTimeout(tryPatch,800);
})();

// ============================================================
// ЗАПУСК
// ============================================================
document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=>{
    initExpansionTabs();
    initExpansionMobNav();
    injectResources();
  }, 300);
});
// Також спробуємо одразу якщо DOM вже готовий
if(document.readyState==='complete'||document.readyState==='interactive'){
  setTimeout(()=>{ initExpansionTabs(); initExpansionMobNav(); injectResources(); }, 400);
}
