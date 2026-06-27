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
// Лише ресурси, що реально є "будівельними" і мають сенс у вкладці ресурсів.
// Активності (душі, м'ясо, риба, гриби тощо) — окремий блок, не тут.
const EXPANSION_RES = {
  gem:         { n:"Дорогоцінний камінь", e:"💎", ep:3 },
  crystal:     { n:"Кристал",             e:"🔮", ep:5 },
  fossil:      { n:"Скам'янілість",        e:"🦴", ep:6 },
  troop_knight:{ n:"Лицар",               e:"🛡", ep:5 },
  troop_mage:  { n:"Маг",                 e:"🧙", ep:6 },
  troop_elite: { n:"Елітний воїн",        e:"💂", ep:8 },
};

// Ресурси активностей — окрема таблиця (НЕ додаються до RES і не видно у вкладці ресурсів)
const ACTIVITY_RES = {
  soul:        { n:"Душа Стародавніх", e:"👻" },
  game_meat:   { n:"М'ясо дичини",     e:"🍖" },
  hide:        { n:"Шкура",            e:"🦊" },
  feather:     { n:"Пір'я",            e:"🪶" },
  fish:        { n:"Риба",             e:"🐟" },
  rare_fish:   { n:"Рідкісна риба",    e:"🐠" },
  mushroom:    { n:"Гриби",            e:"🍄" },
  truffle:     { n:"Трюфель",          e:"⚫" },
  herb:        { n:"Трави",            e:"🌿" },
  rare_herb:   { n:"Рідкісна трава",   e:"🌸" },
  goblin_loot: { n:"Трофей гобліна",   e:"🪙" },
  goblin_relic:{ n:"Реліквія гоблінів",e:"🗿" },
  troop_sword: { n:"Мечник",           e:"⚔️" },
  troop_archer:{ n:"Лучник",           e:"🏹" },
};

// Додаємо до глобального RES тільки будівельні ресурси (EXPANSION_RES).
// Ресурси активностей (ACTIVITY_RES) ініціалізуємо у storage, але НЕ в RES.
function injectResources(){
  if(typeof RES !== 'undefined'){
    Object.entries(EXPANSION_RES).forEach(([k,v])=>{ if(!RES[k]) RES[k]={...v, ep:v.ep||1}; });
  }
  // storage ініціалізація для ОБОХ таблиць
  let allKeys = [...Object.keys(EXPANSION_RES), ...Object.keys(ACTIVITY_RES)];
  allKeys.forEach(k=>{
    if(typeof storage !== 'undefined' && storage[k] === undefined) storage[k] = 0;
    if(typeof psCounters !== 'undefined' && psCounters[k] === undefined) psCounters[k] = 0;
    if(typeof resLifetimeTotal !== 'undefined' && resLifetimeTotal[k] === undefined) resLifetimeTotal[k] = 0;
  });
}
// Викликаємо одразу при завантаженні скрипта (RES вже визначений на цей момент)
injectResources();

// ============================================================
// СИСТЕМА КОЛЕКЦІОНУВАННЯ
// ============================================================
// Кожна побічна активність (душі/мисливство/рибалка/гриби/трави/геологія)
// видає ТІЛЬКИ колекційні предмети (не сирі ресурси).
// Кожен унікальний предмет дає невеликий пасивний бонус до виробництва.
// Повний набір (сет) дає значний бонус.
// Різні предмети здобуваються РІЗНИМИ методами (конкретна локація/трофей/
// місце рибалки/гриб/трава/родовище) — це й є "методики добування".

const COLLECTIBLE_SETS = {
  souls: {
    name: 'Фрагменти Вічності', icon: '👻', color: 'var(--purple)',
    desc: 'Уламки душ стародавніх істот, що зберігають їхню пам\'ять.',
    setBonus: { globalResMult: 0.05, label: '+5% до всього виробництва' },
    items: [
      { id:'soul_shard_ruins',    name:'Уламок з Руїн',        icon:'🏚', method:'ruins',     methodLabel:'Руїни',             chance:0.12, itemBonus:0.005 },
      { id:'soul_shard_grave',    name:'Кістяний амулет',      icon:'⚰️', method:'graveyard', methodLabel:'Цвинтар',           chance:0.14, itemBonus:0.005 },
      { id:'soul_shard_cave',     name:'Світний кристал',      icon:'🕳', method:'cave',      methodLabel:'Печера',            chance:0.16, itemBonus:0.005 },
      { id:'soul_shard_altar',    name:'Печатка вівтаря',      icon:'🗿', method:'altar',     methodLabel:'Стародавній вівтар', chance:0.18, itemBonus:0.01  },
      { id:'soul_shard_abyss',    name:'Серце Безодні',        icon:'🌑', method:'abyss',     methodLabel:'Безодня',           chance:0.20, itemBonus:0.015 },
    ]
  },
  hunting: {
    name: 'Мисливські трофеї', icon: '🏹', color: 'var(--orange)',
    desc: 'Кожна здобута тварина може залишити унікальний трофей у колекцію.',
    setBonus: { globalResMult: 0.1, label: '+10% до всього виробництва' },
    items: [
      // 🟢 (common)
      { id:'hunt_001', name:'Заєць-русак', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_002', name:'Кріль дикий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_003', name:'Перепілка звичайна', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_004', name:'Качка-крижень', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_005', name:'Фазан звичайний', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_006', name:'Лисиця руда', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_007', name:'Куріпка сіра', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_008', name:'Бабак степовий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_009', name:'Тхір лісовий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_010', name:'Ондатра', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_011', name:'Голуб-припутень', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_012', name:'Куниця кам\'яна', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_013', name:'Ласка звичайна', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_014', name:'Дика гуска', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_015', name:'Нутрія', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_016', name:'Лиска (водяна курка)', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_017', name:'Білка руда', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_018', name:'Хом\'як звичайний', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_019', name:'Полівка лугова', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_020', name:'Ховрах плямистий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_021', name:'Єнот-полоскун', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_022', name:'Бурундук', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_023', name:'Ондатра прибережна', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_024', name:'Вальдшнеп (лісовий кулик)', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'hunt_025', name:'Дикий індик', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      // 🔵 (rare)
      { id:'hunt_026', name:'Козуля європейська', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_027', name:'Кабан дикий (вепр)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_028', name:'Вовк сірий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_029', name:'Борсук європейський', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_030', name:'Шакал золотистий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_031', name:'Бобер річковий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_032', name:'Глушець (глухар)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_033', name:'Тетерук', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_034', name:'Чапля сіра', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_035', name:'Олень плямистий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_036', name:'Лань', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_037', name:'Корсак (степова лисиця)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_038', name:'Шакал чепрачний', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_039', name:'Койот', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_040', name:'Видра річкова', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_041', name:'Муфлон європейський', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_042', name:'Опосум', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_043', name:'Дикобраз хохлатий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_044', name:'Кріт європейський', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_045', name:'Чорний заєць', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_046', name:'Дикий кіт (лісовий)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_047', name:'Лебідь-шипун', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_048', name:'Дрохва', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_049', name:'Норка американська', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'hunt_050', name:'Песець (полярна лисиця)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      // 🟣 (epic)
      { id:'hunt_051', name:'Ведмідь бурий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_052', name:'Лось європейський', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_053', name:'Благородний олень', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_054', name:'Рись євразійська', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_055', name:'Зубр (європейський бізон)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_056', name:'Росомаха', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_057', name:'Пума (кугуар)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_058', name:'Леопард (пантера)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_059', name:'Сніговий барс (ірбіс)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_060', name:'Смугаста гієна', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_061', name:'Кенгуру гігантський', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_062', name:'Беркут (королівський орел)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_063', name:'Алігатор міссісіпський', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_064', name:'Гімалайський ведмідь', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_065', name:'Чорний вовк (альфа-самець)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_066', name:'Анаконда зелена', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_067', name:'Гриф-ягнятник', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_068', name:'Сніжний баран', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_069', name:'Антилопа гну', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'hunt_070', name:'Оцелот', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      // 🟡 (legendary)
      { id:'hunt_071', name:'Ведмідь-гризлі', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_072', name:'Білий ведмідь (полярний гігант)', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_073', name:'Бенгальський тигр', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_074', name:'Лев африканський', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_075', name:'Саванний слон', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_076', name:'Чорний носоріг', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_077', name:'Овцебик (мускусний бик)', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_078', name:'Гігантський лісовий кабан', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_079', name:'Комодський варан', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_080', name:'Крокодил нільський', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_081', name:'Гриф-кондор андійський', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_082', name:'Олень-альбінос', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_083', name:'Панда гігантська', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_084', name:'Ягуар чорний', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'hunt_085', name:'Гігантський лінивець', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      // 🔮 (mythic)
      { id:'hunt_086', name:'Срібний Єдиноріг', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_087', name:'Огненний Фенікс', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_088', name:'Тіньовий Пантер', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_089', name:'Смарагдова Гідра', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_090', name:'Крижаний Лютововк', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_091', name:'Золоторогий Олень', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_092', name:'Пекельний Гончак', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_093', name:'Громовий Птах', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_094', name:'Скритний Гриффон', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_095', name:'Туманний Стриж', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_096', name:'Хрустальний Скорпіон', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_097', name:'Лунний Заєць', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_098', name:'Залізошкірий Вепр', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_099', name:'Лісовий Дух-Обережник', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'hunt_100', name:'Хроно-Сфінкс', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
    ]
  },
  fishing: {
    name: 'Скарби глибин', icon: '🎣', color: 'var(--blue)',
    desc: 'Кожна виловлена риба — це шанс на рідкісний експонат.',
    setBonus: { globalResMult: 0.1, label: '+10% до всього виробництва' },
    items: [
      // 🟢 Звичайні
      { id:'fish_001', name:'Карась сріблястий',        img:'assets/collectibles/fish/fish_001_carp_silver.png',      rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_002', name:'Карась золотий',            img:'assets/collectibles/fish/fish_002_carp_gold.png',        rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_003', name:'Плітка звичайна',           img:'assets/collectibles/fish/fish_003_roach.png',            rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_004', name:'Окунь річковий',            img:'assets/collectibles/fish/fish_004_perch_river.png',      rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_005', name:'Верховодка (уклейка)',      img:'assets/collectibles/fish/fish_005_bleak.png',            rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_006', name:'Краснопірка',               img:'assets/collectibles/fish/fish_006_rudd.png',             rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_007', name:'Йорж звичайний',            img:'assets/collectibles/fish/fish_007_ruff.png',             rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_008', name:'Лин',                       img:'assets/collectibles/fish/fish_008_tench.png',            rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_009', name:'Густера',                   img:'assets/collectibles/fish/fish_009_bream_white.png',      rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_010', name:'Бичок-кругляк',             img:'assets/collectibles/fish/fish_010_goby_round.png',       rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_011', name:'Бичок-пісочник',            img:'assets/collectibles/fish/fish_011_goby_sand.png',        rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_012', name:'Тріска атлантична',         img:'assets/collectibles/fish/fish_012_cod_atlantic.png',     rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_013', name:'Оселедець балтійський',     img:'assets/collectibles/fish/fish_013_herring_baltic.png',   rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_014', name:'Сардина європейська',       img:'assets/collectibles/fish/fish_014_sardine.png',          rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_015', name:'Скумбрія атлантична',       img:'assets/collectibles/fish/fish_015_mackerel.png',         rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_016', name:'Ставрида',                  img:'assets/collectibles/fish/fish_016_horse_mackerel.png',   rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_017', name:'Камбала річкова',           img:'assets/collectibles/fish/fish_017_flounder_river.png',   rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_018', name:'Клець (ялець)',              img:'assets/collectibles/fish/fish_018_chub.png',             rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_019', name:'Чехоня',                    img:'assets/collectibles/fish/fish_019_sabrefish.png',        rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_020', name:'Тюлька',                    img:'assets/collectibles/fish/fish_020_sprat.png',            rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_021', name:'Гольян річковий',           img:'assets/collectibles/fish/fish_021_minnow.png',           rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_022', name:'Сріблянка',                 img:'assets/collectibles/fish/fish_022_silverside.png',       rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_023', name:'Барабуля (султанка)',        img:'assets/collectibles/fish/fish_023_red_mullet.png',       rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_024', name:'Кефаль-сингіль',            img:'assets/collectibles/fish/fish_024_mullet_thin.png',      rarity:'common',    chance:0.35, itemBonus:0.001 },
      { id:'fish_025', name:'Сарган',                    img:'assets/collectibles/fish/fish_025_garfish.png',          rarity:'common',    chance:0.35, itemBonus:0.001 },
      // 🔵 Рідкісні
      { id:'fish_026', name:'Короп дзеркальний',         img:'assets/collectibles/fish/fish_026_carp_mirror.png',      rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_027', name:'Короп лускатий (сазан)',    img:'assets/collectibles/fish/fish_027_carp_wild.png',        rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_028', name:'Щука звичайна',             img:'assets/collectibles/fish/fish_028_pike.png',             rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_029', name:'Судак звичайний',           img:'assets/collectibles/fish/fish_029_zander.png',           rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_030', name:'Голавль (клен)',             img:'assets/collectibles/fish/fish_030_chub_river.png',       rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_031', name:'Жерех (білизна)',            img:'assets/collectibles/fish/fish_031_asp.png',              rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_032', name:'Лящ річковий',              img:'assets/collectibles/fish/fish_032_bream_river.png',      rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_033', name:'Білий амур',                img:'assets/collectibles/fish/fish_033_grass_carp.png',       rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_034', name:'Товстолобик плямистий',     img:'assets/collectibles/fish/fish_034_silver_carp.png',      rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_035', name:'Минь річковий',             img:'assets/collectibles/fish/fish_035_burbot.png',           rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_036', name:'Сом європейський',          img:'assets/collectibles/fish/fish_036_catfish.png',          rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_037', name:'Харіус європейський',       img:'assets/collectibles/fish/fish_037_grayling.png',         rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_038', name:'Форель струмкова',          img:'assets/collectibles/fish/fish_038_trout_brook.png',      rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_039', name:'Форель радужна',            img:'assets/collectibles/fish/fish_039_trout_rainbow.png',    rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_040', name:'Камбала-калкан',            img:'assets/collectibles/fish/fish_040_turbot.png',           rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_041', name:'Дорадо',                    img:'assets/collectibles/fish/fish_041_dorado.png',           rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_042', name:'Лаврак (морський вовк)',    img:'assets/collectibles/fish/fish_042_seabass.png',          rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_043', name:'Луфар',                     img:'assets/collectibles/fish/fish_043_bluefish.png',         rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_044', name:'Морський окунь (червоний)', img:'assets/collectibles/fish/fish_044_rockfish_red.png',     rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_045', name:'Сиг озерний',               img:'assets/collectibles/fish/fish_045_whitefish.png',        rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_046', name:'Вугор річковий',            img:'assets/collectibles/fish/fish_046_eel_river.png',        rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_047', name:'Вугор морський (конгер)',   img:'assets/collectibles/fish/fish_047_eel_sea.png',          rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_048', name:'Палія арктична',            img:'assets/collectibles/fish/fish_048_char_arctic.png',      rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_049', name:'Сніток',                    img:'assets/collectibles/fish/fish_049_smelt.png',            rarity:'rare',      chance:0.18, itemBonus:0.002 },
      { id:'fish_050', name:'Риба-папуга',               img:'assets/collectibles/fish/fish_050_parrotfish.png',       rarity:'rare',      chance:0.18, itemBonus:0.002 },
      // 🟣 Епічні
      { id:'fish_051', name:'Щука-маскінонг',            img:'assets/collectibles/fish/fish_051_muskellunge.png',      rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_052', name:'Таймень сибірський',        img:'assets/collectibles/fish/fish_052_taimen.png',           rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_053', name:'Лосось атлантичний',        img:'assets/collectibles/fish/fish_053_salmon_atlantic.png',  rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_054', name:'Кумжа',                     img:'assets/collectibles/fish/fish_054_sea_trout.png',        rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_055', name:'Стерлядь',                  img:'assets/collectibles/fish/fish_055_sterlet.png',          rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_056', name:'Чорний амур',               img:'assets/collectibles/fish/fish_056_black_carp.png',       rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_057', name:'Тунець жовтоперий',         img:'assets/collectibles/fish/fish_057_tuna_yellowfin.png',   rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_058', name:'Тунець блакитний',          img:'assets/collectibles/fish/fish_058_tuna_bluefin.png',     rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_059', name:'Риба-меч',                  img:'assets/collectibles/fish/fish_059_swordfish.png',        rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_060', name:'Вітрильник',                img:'assets/collectibles/fish/fish_060_sailfish.png',         rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_061', name:'Марлін синій',              img:'assets/collectibles/fish/fish_061_marlin_blue.png',      rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_062', name:'Арапаїма',                  img:'assets/collectibles/fish/fish_062_arapaima.png',         rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_063', name:'Риба-тигр',                 img:'assets/collectibles/fish/fish_063_tigerfish.png',        rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_064', name:'Панцирник міссісіпський',   img:'assets/collectibles/fish/fish_064_alligator_gar.png',    rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_065', name:'Камбала-палтус',            img:'assets/collectibles/fish/fish_065_halibut.png',          rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_066', name:'Скат-хвостокол',            img:'assets/collectibles/fish/fish_066_stingray.png',         rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_067', name:'Риба-крапля',               img:'assets/collectibles/fish/fish_067_blobfish.png',         rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_068', name:'Риба-вудильник',            img:'assets/collectibles/fish/fish_068_anglerfish.png',       rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_069', name:'Мурена плямиста',           img:'assets/collectibles/fish/fish_069_moray_spotted.png',    rarity:'epic',      chance:0.09, itemBonus:0.004 },
      { id:'fish_070', name:'Баракуда велика',           img:'assets/collectibles/fish/fish_070_barracuda.png',        rarity:'epic',      chance:0.09, itemBonus:0.004 },
      // 🟡 Легендарні
      { id:'fish_071', name:'Осетр руський',             img:'assets/collectibles/fish/fish_071_sturgeon_russian.png', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_072', name:'Білуга',                    img:'assets/collectibles/fish/fish_072_beluga.png',           rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_073', name:'Севрюга',                   img:'assets/collectibles/fish/fish_073_sevruga.png',          rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_074', name:'Веслоніс',                  img:'assets/collectibles/fish/fish_074_paddlefish.png',       rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_075', name:'Короп Кої',                 img:'assets/collectibles/fish/fish_075_koi.png',              rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_076', name:'Королівський лосось',       img:'assets/collectibles/fish/fish_076_salmon_king.png',      rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_077', name:'Риба-луна (Мола-мола)',     img:'assets/collectibles/fish/fish_077_sunfish_mola.png',     rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_078', name:'Риба-ремінь',               img:'assets/collectibles/fish/fish_078_oarfish.png',          rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_079', name:'Велика біла акула',         img:'assets/collectibles/fish/fish_079_great_white_shark.png',rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_080', name:'Акула-молот',               img:'assets/collectibles/fish/fish_080_hammerhead_shark.png', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_081', name:'Китова акула',              img:'assets/collectibles/fish/fish_081_whale_shark.png',      rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_082', name:'Целакант',                  img:'assets/collectibles/fish/fish_082_coelacanth.png',       rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_083', name:'Електричний вугор',         img:'assets/collectibles/fish/fish_083_electric_eel.png',     rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_084', name:'Риба-пилка',                img:'assets/collectibles/fish/fish_084_sawfish.png',          rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'fish_085', name:'Гігантський кальмар',       img:'assets/collectibles/fish/fish_085_giant_squid.png',      rarity:'legendary', chance:0.04, itemBonus:0.008 },
      // 🔮 Міфічні
      { id:'fish_086', name:'Золота Рибка',              img:'assets/collectibles/fish/fish_086_goldfish_magic.png',   rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_087', name:'Примарний Окунь',           img:'assets/collectibles/fish/fish_087_phantom_perch.png',    rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_088', name:'Вулканічний Магма-салмон',  img:'assets/collectibles/fish/fish_088_magma_salmon.png',     rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_089', name:'Небесний Скат',             img:'assets/collectibles/fish/fish_089_sky_ray.png',          rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_090', name:'Смарагдовий Короп',         img:'assets/collectibles/fish/fish_090_emerald_carp.png',     rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_091', name:'Місячний Неон',             img:'assets/collectibles/fish/fish_091_moon_neon.png',        rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_092', name:'Глибоководний Левіафанчик', img:'assets/collectibles/fish/fish_092_mini_leviathan.png',   rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_093', name:'Бездонний Глотач',          img:'assets/collectibles/fish/fish_093_void_swallower.png',   rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_094', name:'Шепочуща Сирена',           img:'assets/collectibles/fish/fish_094_siren_whisper.png',    rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_095', name:'Хрустальний Плавниковець',  img:'assets/collectibles/fish/fish_095_crystal_fin.png',      rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_096', name:"Рунічний В'юн",             img:'assets/collectibles/fish/fish_096_runic_loach.png',      rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_097', name:'Тіньова Піранья',           img:'assets/collectibles/fish/fish_097_shadow_piranha.png',   rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_098', name:'Хроно-риба',                img:'assets/collectibles/fish/fish_098_chrono_fish.png',      rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_099', name:'Кораловий Дракончик',       img:'assets/collectibles/fish/fish_099_coral_dragon.png',     rarity:'mythic',    chance:0.02, itemBonus:0.016 },
      { id:'fish_100', name:'Серце Océану',              img:'assets/collectibles/fish/fish_100_heart_ocean.png',      rarity:'mythic',    chance:0.02, itemBonus:0.016 },
    ]
  },
  mushroom: {
    name: 'Грибний гербарій', icon: '🍄', color: 'var(--green)',
    desc: 'Засушені зразки всіх видів грибів від звичайних до легендарних.',
    setBonus: { globalResMult: 0.1, label: '+10% до всього виробництва' },
    items: [
      // 🟢 (common)
      { id:'mush_001', name:'Печериця звичайна', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_002', name:'Сироїжка зелена', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_003', name:'Сироїжка світло-жовта', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_004', name:'Опеньок осінній', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_005', name:'Опеньок літній', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_006', name:'Маслюк звичайний', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_007', name:'Маслюк зернистий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_008', name:'Лисичка справжня', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_009', name:'Дощовик їстівний', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_010', name:'Свинушка тонка', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_011', name:'Гнойовик білий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_012', name:'Глива звичайна', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_013', name:'Глива легенева', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_014', name:'Підберезовик', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_015', name:'Підосичник сірий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_016', name:'Рядовка травнева', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_017', name:'Рядовка фіолетова', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_018', name:'Моховик зелений', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_019', name:'Моховик тріщинуватий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_020', name:'Хрящ-перцевець', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_021', name:'Трутовик лускатий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_022', name:'Трутовик сірчано-жовтий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_023', name:'Вовнянка рожева', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_024', name:'Сморж конічний', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'mush_025', name:'Сморжова шапочка', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      // 🔵 (rare)
      { id:'mush_026', name:'Боровик (Білий гриб дубовий)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_027', name:'Боровик боровий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_028', name:'Лисичка трубчаста', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_029', name:'Лисичка аметистова', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_030', name:'Рижик смачний (сосновий)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_031', name:'Рижик ялиновий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_032', name:'Гігрофор ранній', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_033', name:'Парасолька строката', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_034', name:'Парасолька дівоча', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_035', name:'Польський гриб', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_036', name:'Хрящ-молочник справжній (Груздь)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_037', name:'Груздь чорний', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_038', name:'Польовик ранній', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_039', name:'Клітоцибе підігнутий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_040', name:'Кораловий гриб (Рамарія золотиста)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_041', name:'Ежовик жовтий (Гіднум)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_042', name:'Павутинник фіолетовий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_043', name:'Печіночниця звичайна', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_044', name:'Гіропор каштановий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_045', name:'Гіропор синіючий (Синяк)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_046', name:'Строчок звичайний', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_047', name:'Лепіота щитоподібна', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_048', name:'Чешуйчатка ворсиста', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_049', name:'Панеолус', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'mush_050', name:'Вороночник ріжкоподібний', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      // 🟣 (epic)
      { id:'mush_051', name:'Мухомор червоний', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_052', name:'Мухомор пантерний', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_053', name:'Бліда поганка', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_054', name:'Клітоцибе помаранчево-червоний', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_055', name:'Білий гриб сітчастий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_056', name:'Трюфель літній (чорний)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_057', name:'Клаварія блідо-бузкова', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_058', name:'Трутовик лакований (Гриб Рейші)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_059', name:'Веселка звичайна', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_060', name:'Зірочник бахромистий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_061', name:'Стробілюрус шпагатоногий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_062', name:'Келишок смугастий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_063', name:'Саркосцифа яскраво-червона', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_064', name:'Траметес різнокольоровий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_065', name:'Герицій коралоподібний', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_066', name:'Кордицепс однобокий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_067', name:'Опеньок темний', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_068', name:'Свинушка товста', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_069', name:'Волоконниця патуйяра', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'mush_070', name:'Грифола кучерява', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      // 🟡 (legendary)
      { id:'mush_071', name:'Трюфель білий (італійський)', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_072', name:'Гриб Мацутаке', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_073', name:'Мухомор Цезаря', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_074', name:'Кровоточивий зуб', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_075', name:'Гігроцибе пунцова', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_076', name:'Світлоносний гриб', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_077', name:'Синій гриб', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_078', name:'Рожевий пухирник', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_079', name:'Дама з вуаллю', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_080', name:'Фавулас пористий', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_081', name:'Хрящ-молочник блакитний', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_082', name:'Золотавий боровик', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_083', name:'Аметистовий обманщик', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_084', name:'Гриб-восьминіг', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'mush_085', name:'Чага', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      // 🔮 (mythic)
      { id:'mush_086', name:'Ефірний Світляк', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_087', name:'Пекельний Попіряник', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_088', name:'Тіньова Споровиця', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_089', name:'Крижаний Кристальник', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_090', name:'Шепіт Шамана', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_091', name:'Око Дракона', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_092', name:'Місячний Сморовик', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_093', name:'Пустотний Кордицепс', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_094', name:'Смарагдовий Дріадовець', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_095', name:'Гнилобород Абаддона', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_096', name:'Золотоносний Міцелій', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_097', name:'Туманний Сновидець', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_098', name:'Залізошкірий Трутовик', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_099', name:'Кров Німфи', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'mush_100', name:'Серце Лісу', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
    ]
  },
  geology: {
    name: 'Мінералогічна колекція', icon: '⛏️', color: 'var(--gold)',
    desc: 'Зразки порід, руд та мінералів від базальту до Філософського Каменю.',
    setBonus: { globalResMult: 0.15, label: '+15% до всього виробництва' },
    items: [
      // 🟢 (common)
      { id:'geo_001', name:'Граніт сірий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_002', name:'Базальт', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_003', name:'Вапняк', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_004', name:'Пісковик', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_005', name:'Мармур білий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_006', name:'Глина вогнетривка', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_007', name:'Сланцева порода', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_008', name:'Кремній (іскра-камінь)', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_009', name:'Кам\'яне вугілля', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_010', name:'Буре вугілля', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_011', name:'Залізна руда (гематит)', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_012', name:'Боксит', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_013', name:'Мідна руда (халькопірит)', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_014', name:'Кварц жильний', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_015', name:'Гіпс', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_016', name:'Польовий шпат', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_017', name:'Доломіт', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_018', name:'Туф вулканічний', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_019', name:'Гравій річковий', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_020', name:'Обсидіан', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_021', name:'Пемза', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_022', name:'Мергель', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_023', name:'Серпентиніт (змійовик)', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_024', name:'Галька яшмова', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      { id:'geo_025', name:'Дикун', icon:'🟢', rarity:'common', chance:0.35, itemBonus:0.001 },
      // 🔵 (rare)
      { id:'geo_026', name:'Олово (каситерит)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_027', name:'Свинцева руда (галеніт)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_028', name:'Цинкова руда (сфалерит)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_029', name:'Нікелева руда', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_030', name:'Малахіт', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_031', name:'Лазурит', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_032', name:'Нефрит', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_033', name:'Агат моховий', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_034', name:'Аметист', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_035', name:'Опал благородний', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_036', name:'Сердолік', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_037', name:'Онікс чорний', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_038', name:'Бірюза', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_039', name:'Хризоліт', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_040', name:'Топаз блакитний', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_041', name:'Гірський кришталь', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_042', name:'Цитрин', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_043', name:'Бурштин', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_044', name:'Яшма кривава (геліотроп)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_045', name:'Флюорит', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_046', name:'Чароїт', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_047', name:'Родоніт', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_048', name:'Лабрадорит', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_049', name:'Слюда (мусковіт)', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      { id:'geo_050', name:'Гранат піроп', icon:'🔵', rarity:'rare', chance:0.18, itemBonus:0.002 },
      // 🟣 (epic)
      { id:'geo_051', name:'Самородне Золото', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_052', name:'Самородне Срібло', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_053', name:'Ртутна руда (кіновар)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_054', name:'Титанова руда (ільменіт)', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_055', name:'Уранініт', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_056', name:'Кобальтин', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_057', name:'Рубін іскристий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_058', name:'Сапфір волошковий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_059', name:'Смарагд чистий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_060', name:'Олександрит', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_061', name:'Чорний опал', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_062', name:'Рожевий кварц мадагаскарський', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_063', name:'Аквамарин морський', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_064', name:'Турмалін кавуновий', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_065', name:'Шпінель благородна', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_066', name:'Кунцит', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_067', name:'Танзаніт', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_068', name:'Метеоритне залізо', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_069', name:'Вісмут', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      { id:'geo_070', name:'Пірит', icon:'🟣', rarity:'epic', chance:0.09, itemBonus:0.004 },
      // 🟡 (legendary)
      { id:'geo_071', name:'Платиновий самородок', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_072', name:'Алмаз необроблений', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_073', name:'Чорний Алмаз (Карбонадо)', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_074', name:'Червоний Діамант', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_075', name:'Вольфраміт', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_076', name:'Султаніт', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_077', name:'Пейніт', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_078', name:'Тааффеїт', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_079', name:'Паладій', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_080', name:'Іридій', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_081', name:'Родій', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_082', name:'Муасаніт', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_083', name:'Грандидьєрит', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_084', name:'Кеммерерит', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      { id:'geo_085', name:'Окаменіле серце дерева', icon:'🟡', rarity:'legendary', chance:0.04, itemBonus:0.008 },
      // 🔮 (mythic)
      { id:'geo_086', name:'Мітрилова жила', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_087', name:'Оріхалк', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_088', name:'Кристал Мани', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_089', name:'Вулканічний Магматит', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_090', name:'Ефірний Кварц', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_091', name:'Пустотний Сланець', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_092', name:'Астральний Метеорит', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_093', name:'Руда Крові', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_094', name:'Хроно-кінетичний кристал', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_095', name:'Глушильний Сланець', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_096', name:'Ельфійський Смарагд', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_097', name:'Тіньова ртуть', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_098', name:'Кристал сонячного спалаху', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_099', name:'Душа Голема', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
      { id:'geo_100', name:'Філософський Камінь', icon:'🔮', rarity:'mythic', chance:0.02, itemBonus:0.016 },
    ]
  },

};

const COLLECTION_SYSTEM = {
  owned: {}, // { itemId: count }

  isOwned(itemId){ return (this.owned[itemId]||0) > 0; },
  count(itemId){ return this.owned[itemId]||0; },

  // Чи зібраний повний сет
  isSetComplete(setId){
    let set = COLLECTIBLE_SETS[setId];
    if(!set) return false;
    return set.items.every(it=>this.isOwned(it.id));
  },

  // Кількість зібраних унікальних предметів у сеті
  setProgress(setId){
    let set = COLLECTIBLE_SETS[setId];
    if(!set) return {owned:0, total:0};
    return { owned: set.items.filter(it=>this.isOwned(it.id)).length, total: set.items.length };
  },

  // Сумарний бонус до глобального виробництва від УСІХ зібраних предметів + завершених сетів
  getGlobalResMult(){
    let total = 0;
    Object.entries(COLLECTIBLE_SETS).forEach(([setId, set])=>{
      set.items.forEach(it=>{
        if(this.isOwned(it.id)) total += it.itemBonus||0;
      });
      if(this.isSetComplete(setId)) total += set.setBonus.globalResMult||0;
    });
    return total;
  },

  // Бонус конкретно для однієї активності (сума itemBonus тільки цього сету + setBonus якщо завершено)
  getActivityMult(setId){
    let set = COLLECTIBLE_SETS[setId];
    if(!set) return 1;
    let bonus = 0;
    set.items.forEach(it=>{ if(this.isOwned(it.id)) bonus += (it.itemBonus||0); });
    if(this.isSetComplete(setId)) bonus += (set.setBonus.globalResMult||0);
    return 1 + bonus;
  },
};

// Спроба здобути колекційний предмет за результатами активності.
// setId      — який набір (souls/hunting/fishing/mushroom/herb/geology)
// itemId     — конкретний id предмета, який "випав" від активності
// equipBonus — додатковий шанс від спорядження (0..1)
// Повертає предмет якщо здобуто, інакше null.
// Механіка дублікатів: кожен дублікат підвищує рівень, який збільшує шанс на
// наступне відкриття (але бонус до виробництва дає лише перший унікальний).
function rollCollectible(setId, itemId, equipBonus=0){
  let set = COLLECTIBLE_SETS[setId];
  if(!set) return null;
  let item = set.items.find(it=>it.id===itemId);
  if(!item) return null;

  // Рівень предмета (кількість дублікатів вже зібраних) збільшує шанс
  let lvl = COLLECTION_SYSTEM.count(item.id);
  let lvlBonus = lvl * 0.03; // +3% за кожен рівень
  let chance = Math.min(0.95, item.chance + equipBonus + lvlBonus);
  if(Math.random() >= chance) return null;

  let wasNew = !COLLECTION_SYSTEM.isOwned(item.id);
  COLLECTION_SYSTEM.owned[item.id] = (COLLECTION_SYSTEM.owned[item.id]||0) + 1;
  let newLvl = COLLECTION_SYSTEM.owned[item.id];

  if(wasNew){
    if(typeof addLog==='function') addLog(`📚 НОВИЙ: ${item.icon||'🐟'} ${item.name} [${item.rarity}]!`, true);
    showExpToast(`📚 ${item.icon||'🐟'} ${item.name}!`);
    if(COLLECTION_SYSTEM.isSetComplete(setId)){
      if(typeof addLog==='function') addLog(`🏅 НАБІР «${set.name}» ЗАВЕРШЕНО! ${set.setBonus.label}`, true);
      showExpToast(`🏅 Набір «${set.name}» завершено!`);
    }
  } else {
    if(typeof addLog==='function') addLog(`📚 ${item.icon||'🐟'} ${item.name} ×${newLvl} (+${(lvlBonus*100).toFixed(0)}% до шансу)`);
  }
  return item;
}

// Випадковий вибір предмета з набору за рідкістю.
// Спочатку перевіряє загальний шанс знахідки (baseChance + equipBonus),
// потім зважено обирає конкретний предмет серед не-знайдених (або повторів).
// Повертає id предмета або null якщо шанс не спрацював.
function pickCollectible(setId, rarityWeights, equipBonus=0){
  let set = COLLECTIBLE_SETS[setId];
  if(!set) return null;

  // Загальний шанс знайти щось за одну дію
  let baseChance = 0.40;
  let totalChance = Math.min(0.95, baseChance + (equipBonus||0));
  if(Math.random() >= totalChance) return null;

  let weights = rarityWeights || {common:1,rare:0.5,epic:0.2,legendary:0.08,mythic:0.03};
  // Пріоритет — не-знайдені предмети; якщо всі є — беремо повтори
  let pool = set.items.filter(it=>!COLLECTION_SYSTEM.isOwned(it.id));
  if(!pool.length) pool = set.items;
  let total = pool.reduce((s,it)=>s+(weights[it.rarity]||0),0);
  if(!total) return null;
  let r = Math.random()*total, cum=0;
  for(let it of pool){ cum += weights[it.rarity]||0; if(r<cum) return it.id; }
  return pool[pool.length-1].id;
}

// Нарахувати предмет без перевірки шансу (після pickCollectible)
function awardCollectible(setId, itemId){
  let set = COLLECTIBLE_SETS[setId];
  if(!set) return null;
  let item = set.items.find(it=>it.id===itemId);
  if(!item) return null;
  let wasNew = !COLLECTION_SYSTEM.isOwned(item.id);
  COLLECTION_SYSTEM.owned[item.id] = (COLLECTION_SYSTEM.owned[item.id]||0) + 1;
  let newLvl = COLLECTION_SYSTEM.owned[item.id];
  if(wasNew){
    if(typeof addLog==='function') addLog(`📚 НОВИЙ: ${item.icon||'🐟'} ${item.name} [${item.rarity}]!`, true);
    showExpToast(`📚 ${item.icon||'🐟'} ${item.name}!`);
    if(COLLECTION_SYSTEM.isSetComplete(setId)){
      if(typeof addLog==='function') addLog(`🏅 НАБІР «${set.name}» ЗАВЕРШЕНО! ${set.setBonus.label}`, true);
      showExpToast(`🏅 Набір «${set.name}» завершено!`);
    }
  } else {
    let lvlBonus = (newLvl-1)*0.03;
    if(typeof addLog==='function') addLog(`📚 ${item.icon||'🐟'} ${item.name} ×${newLvl} (+${(lvlBonus*100).toFixed(0)}% до шансу)`);
  }
  return item;
}
function renderCollectionMiniWidget(setId){
  let set = COLLECTIBLE_SETS[setId];
  if(!set) return '';
  let p = COLLECTION_SYSTEM.setProgress(setId);
  let done = COLLECTION_SYSTEM.isSetComplete(setId);
  let bonus = ((COLLECTION_SYSTEM.getActivityMult(setId)-1)*100).toFixed(1);
  return `<div style="background:var(--panel2);border:1px solid ${done?set.color:'var(--border)'};padding:6px 8px;margin-bottom:6px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <span style="font-size:11px;color:${set.color}">${set.icon} ${set.name}</span>
      <span style="font-size:10px;color:${done?'var(--gold)':'var(--dim)'}">${p.owned}/${p.total}${done?' 🏅':''}</span>
    </div>
    <div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:3px;">
    ${set.items.map(it=>{
      let owned = COLLECTION_SYSTEM.isOwned(it.id);
      let cnt = COLLECTION_SYSTEM.count(it.id);
      return `<div title="${it.name} (${it.methodLabel})" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;background:${owned?'rgba(232,184,75,.08)':'#0a0a0a'};border:1px solid ${owned?set.color:'#1a1a1a'};opacity:${owned?1:.25};position:relative;">
        ${it.img?`<img src="${it.img}" style="width:22px;height:22px;object-fit:contain;image-rendering:pixelated;" onerror="this.outerHTML='🐟'">`:(it.icon||'❓')}${cnt>1?`<span style="position:absolute;bottom:-2px;right:-1px;font-size:6px;color:var(--gold);">×${cnt}</span>`:''}
      </div>`;
    }).join('')}
    </div>
    <div style="font-size:9px;color:var(--teal)">✨ Бонус від колекції: +${bonus}% до шансів та виробництва</div>
  </div>`;
}

// Рендер вкладки колекції
// Стан фільтра колекції (зберігається між перерендерами)
let _collTabFilter = {}; // setId -> rarity | 'all' | 'owned' | 'new'

function renderCollectionTab(){
  let div = document.getElementById('tab-collection-content');
  if(!div) return;

  const RARITY_ORDER = ['common','rare','epic','legendary','mythic'];
  const RARITY_LABEL = {common:'🟢 Звичайні',rare:'🔵 Рідкісні',epic:'🟣 Епічні',legendary:'🟡 Легендарні',mythic:'🔮 Міфічні'};
  const RARITY_COLOR = {common:'var(--green)',rare:'var(--blue)',epic:'var(--purple)',legendary:'var(--gold)',mythic:'var(--synth)'};

  let totalItems=0, totalOwned=0, totalSets=0, totalSetsDone=0;
  Object.keys(COLLECTIBLE_SETS).forEach(setId=>{
    let p=COLLECTION_SYSTEM.setProgress(setId);
    totalItems+=p.total; totalOwned+=p.owned; totalSets++;
    if(COLLECTION_SYSTEM.isSetComplete(setId)) totalSetsDone++;
  });
  let totalBonus = (COLLECTION_SYSTEM.getGlobalResMult()*100).toFixed(1);

  let html = `<div style="padding:4px;">
    <div class="sh">📚 КОЛЕКЦІЯ</div>
    <div style="background:#0a0a1a;border:1px solid var(--gold);padding:8px;margin-bottom:8px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:6px;">
        <div style="text-align:center;background:var(--panel2);padding:5px;">
          <div style="font-size:18px;">📦</div>
          <b style="color:var(--gold)">${totalOwned}</b><span style="color:var(--dim)">/${totalItems}</span>
          <div style="font-size:9px;color:var(--dim)">Унікальних</div>
        </div>
        <div style="text-align:center;background:var(--panel2);padding:5px;">
          <div style="font-size:18px;">🏅</div>
          <b style="color:var(--gold)">${totalSetsDone}</b><span style="color:var(--dim)">/${totalSets}</span>
          <div style="font-size:9px;color:var(--dim)">Наборів</div>
        </div>
        <div style="text-align:center;background:var(--panel2);padding:5px;">
          <div style="font-size:18px;">✨</div>
          <b style="color:var(--teal)">+${totalBonus}%</b>
          <div style="font-size:9px;color:var(--dim)">Бонус</div>
        </div>
      </div>
    </div>`;

  Object.entries(COLLECTIBLE_SETS).forEach(([setId, set])=>{
    let p=COLLECTION_SYSTEM.setProgress(setId);
    let done=COLLECTION_SYSTEM.isSetComplete(setId);
    let activeF = _collTabFilter[setId] || 'all';

    // Фільтр по рідкості
    let filterBar = `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:5px;">
      ${['all','owned',...RARITY_ORDER].map(f=>{
        let label = f==='all'?'Всі':f==='owned'?'Знайдені':RARITY_LABEL[f];
        let active = f===activeF;
        let col = f==='all'||f==='owned'?'var(--text)':RARITY_COLOR[f];
        return `<button onclick="_collTabFilter['${setId}']='${f}';renderCollectionTab();"
          style="font-family:var(--font);font-size:9px;padding:2px 6px;border:1px solid ${active?col:'var(--border)'};
          background:${active?'rgba(255,255,255,0.05)':'transparent'};color:${active?col:'var(--dim)'};cursor:pointer;">${label}</button>`;
      }).join('')}
    </div>`;

    // Предмети з фільтром
    let filteredItems = set.items.filter(it=>{
      if(activeF==='all') return true;
      if(activeF==='owned') return COLLECTION_SYSTEM.isOwned(it.id);
      return it.rarity===activeF;
    });

    // Прогрес-бар
    let pct = p.total>0?Math.round(p.owned/p.total*100):0;
    let progressBar = `<div style="height:3px;background:#111;margin-bottom:5px;">
      <div style="height:100%;width:${pct}%;background:${done?'var(--gold)':set.color};transition:width .3s;"></div>
    </div>`;

    // Сітка предметів
    let grid = `<div style="display:flex;gap:3px;flex-wrap:wrap;max-height:200px;overflow-y:auto;">
    ${filteredItems.map(it=>{
      let owned=COLLECTION_SYSTEM.isOwned(it.id);
      let cnt=COLLECTION_SYSTEM.count(it.id);
      let rCol=RARITY_COLOR[it.rarity]||'var(--dim)';
      let lvlTxt=cnt>1?`×${cnt}`:'';
      return `<div title="${it.name}\nРідкість: ${RARITY_LABEL[it.rarity]}\n${owned?`Знайдено: ${cnt}×\n+${(it.itemBonus*100).toFixed(1)}% бонус`:'Не знайдено'}"
        style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;
        background:${owned?'rgba(255,255,255,.04)':'#080a0f'};border:1px solid ${owned?rCol:'#161a22'};
        opacity:${owned?1:.2};position:relative;cursor:default;flex-shrink:0;">
        ${it.img?`<img src="${it.img}" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;" onerror="this.outerHTML='🐟'">`:(it.icon||'❓')}
        ${lvlTxt?`<span style="position:absolute;bottom:-1px;right:-1px;font-size:7px;color:var(--gold);
          background:#000;padding:0 1px;line-height:1.2;">${lvlTxt}</span>`:''}
      </div>`;
    }).join('')}
    ${!filteredItems.length?`<div style="font-size:10px;color:var(--dim);padding:8px;">Немає предметів</div>`:''}
    </div>`;

    html += `<div style="background:var(--panel2);border:1px solid ${done?set.color:'var(--border)'};padding:8px;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
        <span style="font-size:12px;color:${set.color}">${set.icon} ${set.name}</span>
        <span style="font-size:10px;color:${done?'var(--gold)':'var(--dim)'}">${p.owned}/${p.total} (${pct}%)${done?' ✅':''}</span>
      </div>
      <div style="font-size:9px;color:var(--dim);margin-bottom:4px;">${set.desc}</div>
      ${progressBar}
      ${filterBar}
      ${grid}
      <div style="font-size:9px;color:${done?'var(--teal)':'var(--dim)'};margin-top:5px;">
        ${done?`🏅 Сет завершено: ${set.setBonus.label}`:`Бонус за повний набір: ${set.setBonus.label}`}
      </div>
    </div>`;
  });

  html += `<div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:6px;">
    💡 Дублікати підвищують рівень предмета (×N) і збільшують шанс знайти нові у тій же активності (+3%/рів).
    Бонус до виробництва дає лише <b>перше відкриття</b>. Рідкісніша здобич → вища ймовірність рідкісних предметів.
  </div></div>`;

  div.innerHTML = html;
}


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

  // Шанс отримати колекційний предмет (незалежно від результату пошуку душі)
  rollCollectible('souls', loc.id, COLLECTION_SYSTEM.getActivityMult('souls')-1);

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

    ${renderCollectionMiniWidget('souls')}

    <div class="sh">📍 ЛОКАЦІЯ ПОШУКУ</div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
    ${sys.locations.map(l=>{
      let avail = typeof epoch === 'undefined' || epoch >= l.minEp;
      let sel = sys.activeLocation === l.id;
      let item = COLLECTIBLE_SETS.souls.items.find(it=>it.method===l.id);
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
          ${item?` · ${item.icon} Колекція: ${Math.round(item.chance*100)}%`:''}
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
      💡 Душі Стародавніх потрібні для Перемоги. Кожна локація також дає шанс на унікальний колекційний предмет. Пошук займає ${sys.searchDuration}с. Перезарядка: ${sys.cooldown}с.
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

  // Беремо найкращий трофей (за рідкістю)
  let prey = caught.sort((a,b)=>(b.rare?1:0)-(a.rare?1:0))[0];
  sys.lastPrey = prey;

  let msg = `🏹 ${prey.name} здобутий!`;
  if(typeof addLog === 'function') addLog(msg, prey.rare);
  showExpToast(msg);

  // Колекційний предмет: вибираємо зі списку за рідкістю відповідно до здобутої дичини
  let scopeBonus = sys.upgrades.scope.lvl * 0.02;
  // Вага рідкостей залежить від того, яку дичину здобули (рідша дичина → вища ймовірність рідкісного предмета)
  let preyRarityWeights = prey.rare
    ? {common:0.3, rare:0.5, epic:0.3, legendary:0.1, mythic:0.05}
    : {common:1.0, rare:0.4, epic:0.1, legendary:0.02, mythic:0.005};
  // pickCollectible виконує одну перевірку шансу (вага рідкості * equipBonus), awardCollectible зараховує
  let collectId = pickCollectible('hunting', preyRarityWeights, scopeBonus + COLLECTION_SYSTEM.getActivityMult('hunting')-1);
  if(collectId) awardCollectible('hunting', collectId);

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

  let html = `<div style="padding:4px;">
    <div class="sh">🏹 МИСЛИВСТВО</div>
    ${renderCollectionMiniWidget('hunting')}
    <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🍖</div>
        <div style="font-size:13px;color:var(--text)">${fmt2(meat)}</div>
        <div style="font-size:10px;color:var(--dim)">М'ясо (з пасток)</div>
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px 10px;flex:1;text-align:center;">
        <div style="font-size:18px;">🏹</div>
        <div style="font-size:13px;color:var(--text)">${sys.huntsTotal}</div>
        <div style="font-size:10px;color:var(--dim)">Полювань</div>
      </div>
    </div>
    ${trapP > 0 ? `<div style="font-size:11px;color:var(--green);border:1px solid #1a3520;padding:5px 8px;margin-bottom:6px;">🪤 Пастки приносять +${(trapP*60).toFixed(1)} 🍖/хв пасивно (для гарнізону)</div>` : ''}
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
      💡 Кожне успішне полювання дає шанс на унікальний трофей у колекцію. Конкретна тварина визначає, який трофей можливий. Пастки пасивно годують гарнізон.
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
  let netBonus = sys.upgrades.net.lvl * 0.02;
  let boatBonus = sys.upgrades.boat.lvl * 0.1;
  if(Math.random() > spot.chance - boatBonus){
    if(typeof addLog==='function') addLog('🎣 Риба не клює...');
    renderFishingTab(); return;
  }
  sys.fishedTotal++; sys.fishCount++;
  let msg = `🎣 Улов у "${spot.name}"!`;
  if(typeof addLog==='function') addLog(msg);
  showExpToast(msg);

  // Колекційний предмет: вага рідкостей залежить від місця рибалки (глибше = рідкісніше)
  let spotDepthWeights = {
    stream:  {common:1.0, rare:0.3, epic:0.05, legendary:0.01, mythic:0.002},
    lake:    {common:0.8, rare:0.5, epic:0.12, legendary:0.03, mythic:0.005},
    river:   {common:0.6, rare:0.6, epic:0.20, legendary:0.06, mythic:0.010},
    sea:     {common:0.3, rare:0.5, epic:0.30, legendary:0.12, mythic:0.030},
    deep_sea:{common:0.1, rare:0.3, epic:0.35, legendary:0.20, mythic:0.080},
  };
  let fw = spotDepthWeights[spot.id] || spotDepthWeights.stream;
  let fishCollectId = pickCollectible('fishing', fw, netBonus + COLLECTION_SYSTEM.getActivityMult('fishing')-1);
  if(fishCollectId) awardCollectible('fishing', fishCollectId);

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
  let html = `<div style="padding:4px;">
    <div class="sh">🎣 РИБАЛКА</div>
    ${renderCollectionMiniWidget('fishing')}
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🎣</div><b>${sys.fishCount}</b><div style="font-size:9px;color:var(--dim)">Уловів</div></div>
    </div>
    <div class="sh">📍 МІСЦЕ РИБАЛКИ</div>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px;">
    ${sys.spots.map(s=>{ let av=ep>=s.minEp; let sel=sys.activeSpot===s.id;
      let item=COLLECTIBLE_SETS.fishing.items.find(it=>it.method===s.id);
      return `<div onclick="${av?`setFishSpot('${s.id}')`:''}" style="padding:5px 8px;border:1px solid ${sel?'var(--blue)':av?'var(--border)':'#0d0d0d'};background:${sel?'#0a0a20':'var(--panel2)'};cursor:${av?'pointer':'default'};opacity:${av?1:.4};display:flex;justify-content:space-between;">
        <span style="font-size:11px">${s.name} ${sel?'◀':''}</span>
        <span style="font-size:10px;color:var(--dim)">${item?.icon||''} Шанс: ${Math.round(s.chance*100)}% · Еп.${s.minEp}</span>
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
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;margin-top:5px;">💡 Кожне місце рибалки дає шанс на свій унікальний скарб у колекцію. Спорядження підвищує шанс улову та зменшує час.</div>
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
  let basketBonus = sys.basketLvl * 0.01;
  let found=[];
  available.forEach(t=>{
    if(Math.random()<t.chance+knowledgeBonus){
      found.push(t);
      // Вага рідкостей предметів колекції залежить від типу знайденого гриба
      let mushWeights = {
        common:     {common:1.0, rare:0.3, epic:0.05, legendary:0.01, mythic:0.002},
        forest:     {common:0.8, rare:0.5, epic:0.10, legendary:0.02, mythic:0.004},
        chanterelle:{common:0.5, rare:0.6, epic:0.20, legendary:0.05, mythic:0.010},
        porcini:    {common:0.3, rare:0.5, epic:0.30, legendary:0.10, mythic:0.025},
        truffle:    {common:0.1, rare:0.3, epic:0.35, legendary:0.20, mythic:0.080},
      };
      let mw = mushWeights[t.id] || mushWeights.common;
      let mushId = pickCollectible('mushroom', mw, basketBonus + COLLECTION_SYSTEM.getActivityMult('mushroom')-1);
      if(mushId) awardCollectible('mushroom', mushId);
    }
  });
  sys.gatheredTotal += found.length;
  let msg = found.length ? `🍄 Знайдено: ${found.map(t=>t.name).join(', ')}` : '🍄 Нічого не знайдено';
  if(typeof addLog==='function') addLog(msg, found.some(t=>t.truffle));
  if(found.length) showExpToast(msg);
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
  let bCost={logs:Math.floor(20*Math.pow(1.6,sys.basketLvl)),fiber:Math.floor(15*Math.pow(1.6,sys.basketLvl))};
  let kCost={books:Math.floor(10*Math.pow(1.8,sys.knowledgeLvl)),paper:Math.floor(8*Math.pow(1.8,sys.knowledgeLvl))};
  let canB=typeof storage==='undefined'||Object.keys(bCost).every(k=>(storage[k]||0)>=bCost[k]);
  let canK=typeof storage==='undefined'||Object.keys(kCost).every(k=>(storage[k]||0)>=kCost[k]);
  let html=`<div style="padding:4px;">
    <div class="sh">🍄 ГРИБНИЦТВО</div>
    ${renderCollectionMiniWidget('mushroom')}
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🍄</div><b>${sys.gatheredTotal}</b><div style="font-size:9px;color:var(--dim)">Знахідок</div></div>
    </div>
    ${sys.gathering?`<div style="height:6px;background:#070a0f;border:1px solid var(--green);margin-bottom:6px;"><div id="mush-progress-bar" style="height:100%;background:var(--green);width:${sys.gatherProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startMushroomGather()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--green)'};background:rgba(78,203,113,.1);color:${cdRem>0?'var(--dim)':'var(--green)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🍄 ЗБИРАТИ ГРИБИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">🧺 Кошик Рів.${sys.basketLvl}/${sys.basketMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${sys.basketLvl}% до шансу колекційних</div>
        ${sys.basketLvl<sys.basketMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(bCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeMushroomBasket()" ${!canB?'disabled':''} style="width:100%;font-family:var(--font);font-size:10px;padding:4px;border:1px solid ${canB?'var(--green)':'var(--border)'};background:transparent;color:${canB?'var(--green)':'var(--dim)'};cursor:${canB?'pointer':'not-allowed'};margin-top:4px;">⬆ ПОКРАЩИТИ</button>`:'<div style="font-size:10px;color:var(--gold)">✅ МАКСИМУМ</div>'}
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">📚 Знання Рів.${sys.knowledgeLvl}/${sys.knowledgeMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${(sys.knowledgeLvl*3)}% до шансу знахідок</div>
        ${sys.knowledgeLvl<sys.knowledgeMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(kCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeMushroomKnowledge()" ${!canK?'disabled':''} style="width:100%;font-family:var(--font);font-size:10px;padding:4px;border:1px solid ${canK?'var(--blue)':'var(--border)'};background:transparent;color:${canK?'var(--blue)':'var(--dim)'};cursor:${canK?'pointer':'not-allowed'};margin-top:4px;">⬆ ВЧИТИСЬ</button>`:'<div style="font-size:10px;color:var(--gold)">✅ МАКСИМУМ</div>'}
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 Кожен знайдений вид гриба дає шанс на унікальний зразок у колекцію. Трюфель — найрідкісніший зразок.</div>
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
  let rackBonus=sys.dryingRackLvl*0.01;
  let found=[];
  sys.herbs.filter(h=>ep>=h.minEp).forEach(h=>{
    if(Math.random()<h.chance+alchBonus){
      found.push(h);
      // Вага рідкостей залежить від виду зібраної трави
      let herbWeights = {
        nettle:   {common:1.0, rare:0.3, epic:0.05, legendary:0.01, mythic:0.002},
        mint:     {common:0.9, rare:0.4, epic:0.08, legendary:0.02, mythic:0.003},
        lavender: {common:0.6, rare:0.5, epic:0.18, legendary:0.05, mythic:0.008},
        chamomile:{common:0.6, rare:0.5, epic:0.18, legendary:0.05, mythic:0.008},
        valerian: {common:0.3, rare:0.5, epic:0.28, legendary:0.12, mythic:0.030},
        mandrake: {common:0.1, rare:0.3, epic:0.35, legendary:0.20, mythic:0.080},
      };
      let hw = herbWeights[h.id] || herbWeights.nettle;
      let herbId = pickCollectible('herb', hw, rackBonus + COLLECTION_SYSTEM.getActivityMult('herb')-1);
      if(herbId) awardCollectible('herb', herbId);
    }
  });
  sys.harvestedTotal += found.length;
  let msg = found.length ? `🌿 Знайдено: ${found.map(h=>h.name).join(', ')}` : '🌿 Нічого не знайдено';
  if(typeof addLog==='function') addLog(msg, found.some(h=>h.rare));
  if(found.length) showExpToast(msg);
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
  let dCost={wood:Math.floor(15*Math.pow(1.5,sys.dryingRackLvl)),fiber:Math.floor(20*Math.pow(1.5,sys.dryingRackLvl))};
  let aCost={books:Math.floor(15*Math.pow(1.7,sys.alchemyLvl)),paper:Math.floor(10*Math.pow(1.7,sys.alchemyLvl))};
  let canD=typeof storage==='undefined'||Object.keys(dCost).every(k=>(storage[k]||0)>=dCost[k]);
  let canA=typeof storage==='undefined'||Object.keys(aCost).every(k=>(storage[k]||0)>=aCost[k]);
  let html=`<div style="padding:4px;">
    <div class="sh">🌿 ТРАВНИЦТВО</div>
    ${renderCollectionMiniWidget('herb')}
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:6px;flex:1;text-align:center;"><div>🌿</div><b>${sys.harvestedTotal}</b><div style="font-size:9px;color:var(--dim)">Знахідок</div></div>
    </div>
    ${sys.harvesting?`<div style="height:6px;background:#070a0f;border:1px solid var(--teal);margin-bottom:6px;"><div id="herb-progress-bar" style="height:100%;background:var(--teal);width:${sys.harvestProgress}%;transition:width 1s;"></div></div>`
    :`<button onclick="startHerbHarvest()" ${cdRem>0?'disabled':''} style="width:100%;font-family:var(--font);font-size:12px;padding:9px;border:1px solid ${cdRem>0?'var(--border)':'var(--teal)'};background:rgba(74,184,160,.1);color:${cdRem>0?'var(--dim)':'var(--teal)'};cursor:${cdRem>0?'not-allowed':'pointer'};margin-bottom:6px;">${cdRem>0?`⏳ ${cdRem}с`:'🌿 ЗБИРАТИ ТРАВИ'}</button>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px;">
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">🌿 Сушарка Рів.${sys.dryingRackLvl}/${sys.dryingMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${sys.dryingRackLvl}% до шансу колекційних</div>
        ${sys.dryingRackLvl<sys.dryingMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(dCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeHerbDrying()" ${!canD?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:4px;border:1px solid ${canD?'var(--teal)':'var(--border)'};background:transparent;color:${canD?'var(--teal)':'var(--dim)'};cursor:${canD?'pointer':'not-allowed'};margin-top:4px;">⬆</button>`:'<div style="font-size:10px;color:var(--gold)">MAX</div>'}
      </div>
      <div style="background:var(--panel2);border:1px solid var(--border);padding:7px;">
        <div style="font-size:11px;margin-bottom:3px;">⚗️ Алхімія Рів.${sys.alchemyLvl}/${sys.alchemyMax}</div>
        <div style="font-size:10px;color:var(--teal);margin-bottom:4px;">+${(sys.alchemyLvl*4)}% до шансу знахідок</div>
        ${sys.alchemyLvl<sys.alchemyMax?`<div style="font-size:10px;color:var(--orange)">${Object.entries(aCost).map(([k,v])=>v+(typeof RES!=='undefined'?RES[k]?.e||k:k)).join(' ')}</div>
        <button onclick="upgradeHerbAlchemy()" ${!canA?'disabled':''} style="width:100%;font-family:var(--font);font-size:9px;padding:4px;border:1px solid ${canA?'var(--purple)':'var(--border)'};background:transparent;color:${canA?'var(--purple)':'var(--dim)'};cursor:${canA?'pointer':'not-allowed'};margin-top:4px;">⬆</button>`:'<div style="font-size:10px;color:var(--gold)">MAX</div>'}
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);border:1px solid var(--border);padding:5px;">💡 Кожен зібраний вид трави дає шанс на унікальний пресований зразок у колекцію. Мандрагора — найрідкісніший зразок.</div>
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
    sys.discoveredDeposits.push({...d, mined:0, totalReserve:rndRange(10, 30)});
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
  if(dep.mined>=dep.totalReserve){ showExpToast('🪨 Родовище вичерпано!'); return; }
  let toolBonus=sys.equipLvl*0.01;
  dep.mined+=1; sys.lastMined=now;
  if(typeof addLog==='function') addLog(`⛏️ Видобуток у "${dep.name}"...`);

  // Вага рідкостей геологічного предмету залежить від типу родовища
  let geoDepositWeights = {
    coal_vein:   {common:1.0, rare:0.30, epic:0.06, legendary:0.01, mythic:0.002},
    iron_vein:   {common:0.7, rare:0.50, epic:0.15, legendary:0.03, mythic:0.005},
    copper_ore:  {common:0.7, rare:0.50, epic:0.15, legendary:0.03, mythic:0.005},
    fossil_site: {common:0.8, rare:0.40, epic:0.12, legendary:0.02, mythic:0.004},
    crystal_cave:{common:0.4, rare:0.50, epic:0.25, legendary:0.08, mythic:0.020},
    gem_deposit: {common:0.2, rare:0.40, epic:0.30, legendary:0.15, mythic:0.050},
    oil_pocket:  {common:0.3, rare:0.45, epic:0.22, legendary:0.07, mythic:0.015},
    silicon_vein:{common:0.2, rare:0.40, epic:0.28, legendary:0.12, mythic:0.040},
  };
  let gw = geoDepositWeights[dep.id] || geoDepositWeights.coal_vein;
  let geoId = pickCollectible('geology', gw, toolBonus + COLLECTION_SYSTEM.getActivityMult('geology')-1);
  if(geoId) awardCollectible('geology', geoId);

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
      let collectibleItem=COLLECTIBLE_SETS.geology.items.find(it=>it.method===dep.id);
      return `<div style="background:var(--panel2);border:1px solid ${exhausted?'var(--dim)':'var(--border)'};padding:7px;opacity:${exhausted?.5:1};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span style="font-size:11px;">${dep.name}</span>
          <span style="font-size:10px;color:var(--dim)">${dep.rarity}</span>
        </div>
        <div style="height:4px;background:#070a0f;border:1px solid var(--border);margin-bottom:4px;">
          <div style="height:100%;background:${exhausted?'var(--dim)':'var(--gold)'};width:${100-pct}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;color:var(--dim)">${collectibleItem?.icon||'📦'} Спроб лишилось: ${dep.totalReserve-dep.mined}</span>
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
    let collectionBonus=1+COLLECTION_SYSTEM.getGlobalResMult();
    return base*soulBonus*collectionBonus;
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
    { id:'lore',       label:'📖 ЛОР',      fn:'renderLoreTab' },
    { id:'collection', label:'📚 КОЛЕКЦІЯ', fn:'renderCollectionTab' },
    { id:'souls',      label:'👻 ДУШІ',     fn:'renderSoulTab' },
    { id:'hunting',    label:'🏹 МИСЛ.',    fn:'renderHuntingTab' },
    { id:'fishing',    label:'🎣 РИБА',     fn:'renderFishingTab' },
    { id:'mushroom',   label:'🍄 ГРИБИ',    fn:'renderMushroomTab' },
    { id:'herb',       label:'🌿 ТРАВИ',    fn:'renderHerbTab' },
    { id:'geology',    label:'⛏️ ГЕО',      fn:'renderGeologyTab' },
    { id:'raids',      label:'⚔️ РЕЙДИ',    fn:'renderRaidTab' },
    { id:'troops',     label:'🎖 АРМІЯ',    fn:'renderTroopTab' },
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
      case 'lore':       renderLoreTab();       break;
      case 'collection': renderCollectionTab(); break;
      case 'souls':      renderSoulTab();       break;
      case 'hunting':    renderHuntingTab();    break;
      case 'fishing':    renderFishingTab();    break;
      case 'mushroom':   renderMushroomTab();   break;
      case 'herb':       renderHerbTab();       break;
      case 'geology':    renderGeologyTab();    break;
      case 'raids':      renderRaidTab();       break;
      case 'troops':     renderTroopTab();      break;
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
    collection: { owned: {...COLLECTION_SYSTEM.owned} },
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
  if(data.collection){ COLLECTION_SYSTEM.owned = {...(data.collection.owned||{})}; }
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
  // ПРИМІТКА: COLLECTION_SYSTEM.owned НЕ скидається при переродженні —
  // колекція є постійним meta-прогресом, як ачівки.
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
// ЗАПУСК — викликається явно з index.html після init()
// ============================================================
window.initExpansions = function(){
  initExpansionTabs();
  initExpansionMobNav();
  injectResources();
};
