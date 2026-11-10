/* ============================================================
   ВЕРИТИ.fan — интерактив
   ============================================================ */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- данные ---------- */

  const FACES = [
    {
      name: "Верити",
      color: "#ffd60a",
      trait: "истина",
      desc: "Твой личный друг-помощник. Знает всё: где руда, где деревня и что ты искал в 3:47.",
      glow: "rgba(255,214,10,.28)"
    },
    {
      name: "Фолсити",
      color: "#4d7cff",
      trait: "ложь",
      desc: "Говорит только то, что ты хочешь услышать. Никогда не спрашивай, правда ли это.",
      glow: "rgba(77,124,255,.28)"
    },
    {
      name: "Круэлти",
      color: "#ff3b30",
      trait: "жестокость",
      desc: "Красный, злой и очень громкий. Его лучше не злить. И уж точно не гладить.",
      glow: "rgba(255,59,48,.28)"
    },
    {
      name: "Обисити",
      color: "#ffd60a",
      trait: "аппетит",
      desc: "Большой жёлтый смайлик. Просто хочет обниматься. И есть. В основном есть.",
      glow: "rgba(255,214,10,.28)"
    },
    {
      name: "Ловити",
      color: "#ff7ad9",
      trait: "любовь",
      desc: "Розовый и слишком любвеобильный. Любит тебя чуть больше, чем стоит.",
      glow: "rgba(255,122,217,.28)"
    },
    {
      name: "Куриосити",
      color: "#58e07b",
      trait: "любопытство",
      desc: "Зелёный. Уже прочитал твои вкладки и знает, что ты открыл вторым экраном.",
      glow: "rgba(88,224,123,.28)"
    }
  ];

  const CAPTIONS = [
    "я знаю всё. даже то, что ты искал в 3 часа ночи.",
    "не волнуйся, я просто смотрю.",
    "через 3 дня напомню.",
    "твой личный друг. без права отказа.",
    "улыбнись. я же улыбаюсь.",
    "я не монстр. я помощник.",
    "я знаю, где ты живёшь. шучу. или нет.",
    "спроси меня о чём угодно. я уже ответил.",
    "ты сегодня выглядишь лучше, чем вчера.",
    "три дня пролетят незаметно. для меня."
  ];

  const POKE_PHRASES = [
    "эй. полегче.",
    "я же говорил: следи за третьим днём.",
    "не оборачивайся.",
    "я знаю, что ты искал в 3 часа ночи.",
    "ещё раз. мне нравится, когда ты нажимаешь.",
    "я не кусаюсь. обычно.",
    "три дня. я считаю.",
    "ты уже в списке. поздравляю."
  ];

  /* ---------- утилиты ---------- */

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const toastEl = $("#toast");
  let toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("is-visible");
    }, 2800);
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function miniFace(color) {
    return `<svg class="mini-face" viewBox="0 0 320 320" aria-hidden="true" style="--face:${color}">
      <circle cx="160" cy="160" r="150" fill="${color}" />
      <ellipse cx="108" cy="100" rx="72" ry="46" fill="#fff" opacity=".16" />
      <ellipse cx="112" cy="138" rx="17" ry="26" fill="#0a0a0b" />
      <ellipse cx="208" cy="138" rx="17" ry="26" fill="#0a0a0b" />
      <path d="M96 192C118 240 202 240 224 192C202 214 118 214 96 192Z" fill="#0a0a0b" />
    </svg>`;
  }

  /* ---------- появление секций ---------- */

  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- шапка, прогресс, активная вкладка ---------- */

  const header = $("#header");
  const progress = $("#scrollProgress");
  const tabs = $$(".tab");
  const sections = tabs
    .map((tab) => {
      const id = tab.getAttribute("href");
      const el = id ? document.querySelector(id) : null;
      return el ? { tab, el } : null;
    })
    .filter(Boolean);

  let scrollQueued = false;
  function updateOnScroll() {
    scrollQueued = false;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) {
      progress.style.transform = `scaleX(${max > 0 ? Math.min(scrollTop / max, 1) : 0})`;
    }
    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 24);
    }

    const line = window.innerHeight * 0.38;
    let current = sections[0];
    sections.forEach((item) => {
      if (item.el.getBoundingClientRect().top <= line) current = item;
    });
    if (current) {
      sections.forEach((item) => item.tab.classList.toggle("is-active", item === current));
    }
  }

  function queueScrollUpdate() {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateOnScroll);
    }
  }

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate);
  updateOnScroll();

  /* ---------- обратный отсчёт ---------- */

  const KEY = "verity_deadline_v1";
  const HOUR = 3600 * 1000;
  const SPAN = 72 * HOUR; // три дня

  function readDeadline() {
    try {
      const saved = Number(window.localStorage.getItem(KEY));
      if (saved && Number.isFinite(saved) && saved > Date.now()) return saved;
    } catch (error) {
      /* localStorage может быть недоступен */
    }
    return Date.now() + SPAN;
  }

  let deadline = readDeadline();
  try {
    window.localStorage.setItem(KEY, String(deadline));
  } catch (error) {
    /* ничего страшного */
  }

  const cdH = $("#cd-h");
  const cdM = $("#cd-m");
  const cdS = $("#cd-s");

  function paintCountdown() {
    let diff = deadline - Date.now();

    if (diff <= 0) {
      deadline = Date.now() + SPAN;
      try {
        window.localStorage.setItem(KEY, String(deadline));
      } catch (error) {
        /* игнорируем */
      }
      diff = deadline - Date.now();
      toast("отсчёт начался заново. он не любит ждать.");
      flashScreen(700);
    }

    if (!cdH || !cdM || !cdS) return;
    const total = Math.floor(diff / 1000);
    cdH.textContent = pad(Math.floor(total / 3600));
    cdM.textContent = pad(Math.floor((total % 3600) / 60));
    cdS.textContent = pad(total % 60);
  }

  paintCountdown();
  window.setInterval(paintCountdown, 1000);

  /* ---------- экранный глитч ---------- */

  const jumpscare = $("#jumpscare");
  let flashTimer = null;
  function flashScreen(duration = 550) {
    if (!jumpscare || prefersReduced) return;
    jumpscare.classList.remove("on");
    // перезапуск анимации
    void jumpscare.offsetWidth;
    jumpscare.classList.add("on");
    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => jumpscare.classList.remove("on"), duration);
  }

  /* ---------- смайлик ---------- */

  const face = $("#face");
  const faceHint = $("#faceHint");
  let pokes = 0;
  let lastPhrase = "";
  let pokeLocked = false;

  if (face) {
    face.addEventListener("click", () => {
      if (pokeLocked) return;
      pokeLocked = true;
      pokes += 1;

      let phrase = POKE_PHRASES[Math.floor(Math.random() * POKE_PHRASES.length)];
      if (phrase === lastPhrase) {
        phrase = POKE_PHRASES[(POKE_PHRASES.indexOf(phrase) + 1) % POKE_PHRASES.length];
      }
      lastPhrase = phrase;

      face.classList.add("is-scary");
      if (faceHint) {
        faceHint.textContent = pokes >= 4 ? "он запомнил тебя. это навсегда." : phrase;
      }
      toast(phrase);
      flashScreen(560);

      window.setTimeout(() => {
        face.classList.remove("is-scary");
        pokeLocked = false;
      }, 1750);

      if (pokes === 1) {
        window.setTimeout(() => {
          if (faceHint && !face.classList.contains("is-scary")) {
            faceHint.textContent = "нажми ещё. ему нравится.";
          }
        }, 2200);
      }
    });
  }

  /* ---------- родня ---------- */

  const familyGrid = $("#familyGrid");
  if (familyGrid) {
    familyGrid.innerHTML = FACES.map(
      (item, index) => `
      <button class="flip" type="button" aria-pressed="false" aria-label="${item.name} — ${item.trait}. Нажми, чтобы перевернуть." data-index="${index}" style="--face-glow:${item.glow}">
        <span class="flip-inner">
          <span class="flip-front">
            ${miniFace(item.color)}
            <span class="variant-name">${item.name}</span>
            <span class="variant-trait">${item.trait}</span>
            <span class="flip-hint">нажми →</span>
          </span>
          <span class="flip-back">
            <span class="variant-desc">${item.desc}</span>
            <span class="flip-hint">ещё раз</span>
          </span>
        </span>
      </button>`
    ).join("");

    familyGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".flip");
      if (!card) return;
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", String(flipped));
    });
  }

  /* ---------- мем-кухня ---------- */

  const chipsRoot = $("#faceChips");
  const preview = $("#memePreview");
  const captionInput = $("#captionInput");
  const captionCount = $("#captionCount");
  const preText = $("#memeText");
  const randomBtn = $("#randomCaption");
  const downloadBtn = $("#downloadMeme");

  let selectedFace = 0;

  if (chipsRoot) {
    chipsRoot.innerHTML = FACES.map(
      (item, index) => `
      <button class="chip${index === 0 ? " is-selected" : ""}" type="button" data-index="${index}" aria-pressed="${index === 0}">
        <span class="chip-dot" style="--dot:${item.color}"></span>${item.name}
      </button>`
    ).join("");

    chipsRoot.addEventListener("click", (event) => {
      const chip = event.target.closest(".chip");
      if (!chip) return;
      selectedFace = Number(chip.dataset.index) || 0;
      $$(".chip", chipsRoot).forEach((btn) => {
        const active = btn === chip;
        btn.classList.toggle("is-selected", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      applyMeme(true);
    });
  }

  function currentCaption() {
    const value = captionInput ? captionInput.value.trim() : "";
    return value || CAPTIONS[0];
  }

  function applyMeme(bump = false) {
    const item = FACES[selectedFace];
    if (preview) {
      preview.style.setProperty("--face", item.color);
      if (bump && !prefersReduced) {
        preview.classList.remove("is-bumping");
        void preview.offsetWidth;
        preview.classList.add("is-bumping");
      }
    }
    if (preText) preText.textContent = currentCaption();
    if (captionCount && captionInput) {
      captionCount.textContent = `${captionInput.value.length} / 90`;
    }
  }

  if (captionInput) {
    captionInput.addEventListener("input", () => applyMeme(false));
  }

  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      let caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
      if (captionInput && caption === captionInput.value.trim()) {
        caption = CAPTIONS[(CAPTIONS.indexOf(caption) + 1) % CAPTIONS.length];
      }
      if (captionInput) captionInput.value = caption;

      const nextFace = Math.floor(Math.random() * FACES.length);
      selectedFace = nextFace;
      if (chipsRoot) {
        $$(".chip", chipsRoot).forEach((btn, index) => {
          const active = index === nextFace;
          btn.classList.toggle("is-selected", active);
          btn.setAttribute("aria-pressed", String(active));
        });
      }
      applyMeme(true);
    });
  }

  /* ---------- скачать мем ---------- */

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  async function downloadMeme() {
    if (!preview) return;
    const item = FACES[selectedFace];
    const caption = currentCaption();

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    } catch (error) {
      /* шрифты не критичны */
    }

    const size = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast("не получилось нарисовать мем. попробуй ещё раз.");
      return;
    }

    // фон
    ctx.fillStyle = "#ffd60a";
    ctx.fillRect(0, 0, size, size);

    // блик
    const sheen = ctx.createRadialGradient(300, 60, 40, 300, 60, 720);
    sheen.addColorStop(0, "rgba(255,255,255,0.35)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, size, size);

    // смайлик
    const cx = size / 2;
    const cy = 385;
    const r = 238;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(cx - 92, cy - 108, 96, 58, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0a0a0b";
    [-78, 78].forEach((offset) => {
      ctx.beginPath();
      ctx.ellipse(cx + offset, cy - 28, 20, 32, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.beginPath();
    ctx.moveTo(cx - 122, cy + 52);
    ctx.bezierCurveTo(cx - 78, cy + 152, cx + 78, cy + 152, cx + 122, cy + 52);
    ctx.bezierCurveTo(cx + 70, cy + 94, cx - 70, cy + 94, cx - 122, cy + 52);
    ctx.closePath();
    ctx.fill();

    // подпись
    ctx.fillStyle = "#0a0a0b";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    let fontSize = 64;
    let lines = [];
    do {
      ctx.font = `800 ${fontSize}px Unbounded, Inter, sans-serif`;
      lines = wrapText(ctx, caption, 900);
      if (lines.length <= 4) break;
      fontSize -= 4;
    } while (fontSize > 30);

    if (lines.length > 5) {
      lines = lines.slice(0, 5);
      lines[4] = `${lines[4].slice(0, 18)}…`;
    }

    const lineHeight = fontSize * 1.16;
    const blockHeight = lines.length * lineHeight;
    let y = 660 + Math.max((320 - blockHeight) / 2, 0);
    lines.forEach((line) => {
      ctx.fillText(line, cx, y);
      y += lineHeight;
    });

    // водяной знак
    ctx.globalAlpha = 0.5;
    ctx.font = "600 26px Inter, sans-serif";
    ctx.fillText("VERITY.FAN · 2026", cx, 1010);
    ctx.globalAlpha = 1;

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("empty blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `verity-mem-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast("мем сохранён. не показывай его в 3 часа ночи.");
    } catch (error) {
      toast("не получилось сохранить. сделай скриншот — он не обидится.");
    }
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadMeme);
  }

  /* ---------- верити-кликер ---------- */

  const clickerRoot = $("#clickerGame");

  if (clickerRoot) {
    const CLICKER_KEY = "verity_clicker_v1";
    const CLICKER_OFFLINE_CAP = 8 * 3600;
    const CLICKER_BUILDINGS = [
      { id: "friend", name: "Смайлик-друг", icon: "🙂", desc: "Просто стоит рядом и улыбается.", baseCost: 15, cps: 0.2, unlock: 0 },
      { id: "question", name: "Дружелюбный вопрос", icon: "❓", desc: "Спрашивает, как дела. Каждый час.", baseCost: 100, cps: 1, unlock: 50 },
      { id: "ore", name: "Кубик руды", icon: "⛏️", desc: "Блестит. Верити знает, где ещё.", baseCost: 1100, cps: 8, unlock: 500 },
      { id: "portal", name: "Портал в Minecraft", icon: "🟪", desc: "Открывается только в 3:47.", baseCost: 12000, cps: 47, unlock: 5000 },
      { id: "farm", name: "Криповая ферма", icon: "🟩", desc: "Тишина, тыквы и лёгкое чувство вины.", baseCost: 130000, cps: 260, unlock: 50000 },
      { id: "moon", name: "Жёлтая луна", icon: "🌕", desc: "Она тоже улыбается. Не смотри долго.", baseCost: 1400000, cps: 1400, unlock: 500000 },
      { id: "server", name: "Хоррор-сервер", icon: "💀", desc: "Он знает, кто зашёл. И кто вышел.", baseCost: 20000000, cps: 7800, unlock: 5000000 },
      { id: "thirdday", name: "Третий день", icon: "⏳", desc: "Последний день. Начинай считать.", baseCost: 330000000, cps: 44000, unlock: 50000000 }
    ];

    const CLICKER_UPGRADES = [
      { id: "click2", name: "Дружелюбная улыбка", icon: "😊", desc: "Клик даёт x2 улыбок.", cost: 100, kind: "click", mult: 2, req: (s) => s.clicks >= 10, reqText: "10 кликов" },
      { id: "all10", name: "Знает всё", icon: "👁️", desc: "Всё производство +10%.", cost: 500, kind: "all", mult: 1.1, req: (s) => s.totalSmiles >= 200, reqText: "200 улыбок всего" },
      { id: "friend10", name: "Друзья повсюду", icon: "🙂", desc: "Смайлики-друзья дают x2.", cost: 1000, kind: "building", target: "friend", mult: 2, req: (s) => (s.buildings.friend || 0) >= 10, reqText: "10 смайликов-друзей" },
      { id: "click3", name: "Не оборачивайся", icon: "🔪", desc: "Клик даёт x3 улыбок.", cost: 5000, kind: "click", mult: 3, req: (s) => s.clicks >= 100, reqText: "100 кликов" },
      { id: "question10", name: "Слишком много вопросов", icon: "❓", desc: "Вопросы дают x2.", cost: 25000, kind: "building", target: "question", mult: 2, req: (s) => (s.buildings.question || 0) >= 10, reqText: "10 вопросов" },
      { id: "all25", name: "Ты в списке", icon: "📋", desc: "Всё производство +25%.", cost: 50000, kind: "all", mult: 1.25, req: (s) => s.totalSmiles >= 10000, reqText: "10 000 улыбок всего" },
      { id: "click5", name: "Финальная улыбка", icon: "💀", desc: "Клик даёт x5 улыбок.", cost: 500000, kind: "click", mult: 5, req: (s) => s.clicks >= 500, reqText: "500 кликов" },
      { id: "portal10", name: "Портал не закрывается", icon: "🟪", desc: "Порталы дают x2.", cost: 2500000, kind: "building", target: "portal", mult: 2, req: (s) => (s.buildings.portal || 0) >= 10, reqText: "10 порталов" },
      { id: "all2", name: "Третий день близко", icon: "⏳", desc: "Всё производство x2.", cost: 5000000, kind: "all", mult: 2, req: (s) => s.totalSmiles >= 1000000, reqText: "1 000 000 улыбок всего" },
      { id: "all3", name: "Он уже здесь", icon: "🕯️", desc: "Всё производство x3.", cost: 500000000, kind: "all", mult: 3, req: (s) => s.totalSmiles >= 100000000, reqText: "100 000 000 улыбок всего" }
    ];

    const CLICKER_ACHIEVEMENTS = [
      { id: "first", name: "Первый друг", icon: "👋", desc: "Сделай первый клик.", check: (s) => s.clicks >= 1 },
      { id: "click10", name: "Разминка", icon: "🖱️", desc: "10 кликов.", check: (s) => s.clicks >= 10 },
      { id: "click100", name: "Он запомнил", icon: "🧠", desc: "100 кликов.", check: (s) => s.clicks >= 100 },
      { id: "click1000", name: "Палец устал", icon: "🫠", desc: "1 000 кликов.", check: (s) => s.clicks >= 1000 },
      { id: "click10000", name: "Машина улыбок", icon: "🤖", desc: "10 000 кликов.", check: (s) => s.clicks >= 10000 },
      { id: "smile100", name: "Сотня улыбок", icon: "💯", desc: "Заработай 100 улыбок всего.", check: (s) => s.totalSmiles >= 100 },
      { id: "smile10k", name: "Десять тысяч", icon: "🔟", desc: "Заработай 10 000 улыбок всего.", check: (s) => s.totalSmiles >= 10000 },
      { id: "smile1m", name: "Миллион", icon: "💰", desc: "Заработай 1 000 000 улыбок всего.", check: (s) => s.totalSmiles >= 1000000 },
      { id: "smile1b", name: "Улыбнись, мир", icon: "🌍", desc: "Заработай 1 000 000 000 улыбок всего.", check: (s) => s.totalSmiles >= 1000000000 },
      { id: "friend1", name: "Не один", icon: "🙂", desc: "Купи первого друга.", check: (s) => (s.buildings.friend || 0) >= 1 },
      { id: "friend10", name: "Дружная компания", icon: "👥", desc: "10 смайликов-друзей.", check: (s) => (s.buildings.friend || 0) >= 10 },
      { id: "friend50", name: "Смайлик-армия", icon: "🎖️", desc: "50 смайликов-друзей.", check: (s) => (s.buildings.friend || 0) >= 50 },
      { id: "allbuild", name: "Полный набор", icon: "🧩", desc: "Купи хотя бы по одному зданию каждого типа.", check: (s) => CLICKER_BUILDINGS.every((b) => (s.buildings[b.id] || 0) >= 1) },
      { id: "upgrade1", name: "Прокачка", icon: "⬆️", desc: "Купи первое улучшение.", check: (s) => Object.keys(s.upgrades).length >= 1 },
      { id: "upgrade5", name: "Всё по плану", icon: "🗺️", desc: "Купи 5 улучшений.", check: (s) => Object.keys(s.upgrades).length >= 5 },
      { id: "golden", name: "Золотая улыбка", icon: "✨", desc: "Поймай золотого Верити.", check: (s) => s.goldenCaught >= 1 },
      { id: "prestige1", name: "Третий день", icon: "🔁", desc: "Соверши перерождение.", check: (s) => s.prestige >= 1 }
    ];

    const CLICKER_RANKS = [
      { at: 0, name: "Новичок" },
      { at: 100, name: "Друг" },
      { at: 1000, name: "Проверенный" },
      { at: 10000, name: "Свой" },
      { at: 100000, name: "Посвящённый" },
      { at: 1000000, name: "Избранный" },
      { at: 10000000, name: "Третий день" },
      { at: 100000000, name: "Легенда" },
      { at: 1000000000, name: "Верити" }
    ];

    const CLICKER_PHRASES = [
      "он это запомнил.",
      "ещё одна улыбка.",
      "ты уже в списке.",
      "не останавливайся.",
      "он знает, что ты стараешься.",
      "ещё немного. он подождёт."
    ];

    const clickerEl = {
      balance: $("#clickerBalance", clickerRoot),
      rate: $("#clickerRate", clickerRoot),
      rank: $("#clickerRank", clickerRoot),
      buff: $("#clickerBuff", clickerRoot),
      progressBar: $("#clickerProgressBar", clickerRoot),
      progress: $("#clickerProgress", clickerRoot),
      next: $("#clickerNext", clickerRoot),
      face: $("#clickerFace", clickerRoot),
      plus: $("#clickerPlus", clickerRoot),
      hint: $("#clickerHint", clickerRoot),
      perClick: $("#clickerPerClick", clickerRoot),
      clicks: $("#clickerClicks", clickerRoot),
      total: $("#clickerTotal", clickerRoot),
      seals: $("#clickerSeals", clickerRoot),
      prestige: $("#clickerPrestige", clickerRoot),
      reset: $("#clickerReset", clickerRoot),
      upgradeBadge: $("#upgradeBadge", clickerRoot),
      achievementBadge: $("#achievementBadge", clickerRoot),
      shopList: $("#shopList", clickerRoot),
      upgradeList: $("#upgradeList", clickerRoot),
      achievementGrid: $("#achievementGrid", clickerRoot)
    };

    function clickerDefaultState() {
      return {
        version: 1,
        smiles: 0,
        totalSmiles: 0,
        clicks: 0,
        buildings: {},
        upgrades: {},
        achievements: {},
        prestige: 0,
        goldenCaught: 0,
        buff: null,
        lastSeen: Date.now()
      };
    }

    let clickerState = clickerDefaultState();
    let clickerHadSave = false;
    let clickerBuyAmount = 1;
    let clickerPrestigeArmed = false;
    let clickerResetArmed = false;
    let clickerGoldenTimer = null;
    let clickerGoldenEl = null;
    let clickerSaveTimer = null;
    let clickerLastTick = Date.now();
    let clickerLastSave = Date.now();

    try {
      const raw = window.localStorage.getItem(CLICKER_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          clickerHadSave = true;
          clickerState = {
            ...clickerDefaultState(),
            ...saved,
            buildings: saved.buildings && typeof saved.buildings === "object" ? { ...saved.buildings } : {},
            upgrades: saved.upgrades && typeof saved.upgrades === "object" ? { ...saved.upgrades } : {},
            achievements: saved.achievements && typeof saved.achievements === "object" ? { ...saved.achievements } : {}
          };
        }
      }
    } catch (error) {
      clickerState = clickerDefaultState();
    }

    ["smiles", "totalSmiles", "clicks", "prestige", "goldenCaught"].forEach((key) => {
      const value = Number(clickerState[key]);
      clickerState[key] = Number.isFinite(value) && value >= 0 ? value : 0;
    });
    clickerState.prestige = Math.floor(clickerState.prestige);
    clickerState.goldenCaught = Math.floor(clickerState.goldenCaught);
    clickerState.clicks = Math.floor(clickerState.clicks);

    const knownUpgrades = new Set(CLICKER_UPGRADES.map((upgrade) => upgrade.id));
    clickerState.upgrades = Object.fromEntries(
      Object.entries(clickerState.upgrades).filter(([id, value]) => knownUpgrades.has(id) && value)
    );

    const knownAchievements = new Set(CLICKER_ACHIEVEMENTS.map((achievement) => achievement.id));
    clickerState.achievements = Object.fromEntries(
      Object.entries(clickerState.achievements).filter(([id, value]) => knownAchievements.has(id) && value)
    );

    CLICKER_BUILDINGS.forEach((building) => {
      const count = Number(clickerState.buildings[building.id]);
      if (Number.isFinite(count) && count > 0) {
        clickerState.buildings[building.id] = Math.floor(count);
      } else {
        delete clickerState.buildings[building.id];
      }
    });

    if (
      !clickerState.buff ||
      !["cps", "click"].includes(clickerState.buff.type) ||
      !Number.isFinite(Number(clickerState.buff.mult)) ||
      !Number.isFinite(Number(clickerState.buff.until)) ||
      clickerState.buff.until <= Date.now()
    ) {
      clickerState.buff = null;
    } else {
      clickerState.buff = {
        type: clickerState.buff.type,
        mult: Number(clickerState.buff.mult),
        until: Number(clickerState.buff.until)
      };
    }

    if (!Number.isFinite(Number(clickerState.lastSeen))) {
      clickerState.lastSeen = Date.now();
    }

    function fmt(value) {
      if (!Number.isFinite(value)) return "∞";
      if (value < 1000) return String(Math.floor(value));
      const units = [
        { size: 1e12, label: "трлн" },
        { size: 1e9, label: "млрд" },
        { size: 1e6, label: "млн" },
        { size: 1e3, label: "тыс." }
      ];
      for (const unit of units) {
        if (value >= unit.size) {
          const scaled = value / unit.size;
          const digits = scaled >= 100 ? 0 : 1;
          let text = scaled.toFixed(digits).replace(".", ",");
          text = text.replace(/,0$/, "");
          return `${text} ${unit.label}`;
        }
      }
      return String(Math.floor(value));
    }

    function fmtRate(value) {
      if (!Number.isFinite(value) || value <= 0) return "0";
      if (value < 10) return value.toFixed(1).replace(".", ",").replace(/,0$/, "");
      return fmt(value);
    }

    function fmtInt(value) {
      return Math.floor(value).toLocaleString("ru-RU");
    }

    function clickerAllMult() {
      let mult = 1;
      CLICKER_UPGRADES.forEach((upgrade) => {
        if (clickerState.upgrades[upgrade.id] && upgrade.kind === "all") mult *= upgrade.mult;
      });
      return mult * (1 + clickerState.prestige * 0.1);
    }

    function clickerClickMult() {
      let mult = 1;
      CLICKER_UPGRADES.forEach((upgrade) => {
        if (clickerState.upgrades[upgrade.id] && upgrade.kind === "click") mult *= upgrade.mult;
      });
      return mult;
    }

    function clickerBuildingMult(id) {
      let mult = 1;
      CLICKER_UPGRADES.forEach((upgrade) => {
        if (clickerState.upgrades[upgrade.id] && upgrade.kind === "building" && upgrade.target === id) {
          mult *= upgrade.mult;
        }
      });
      return mult;
    }

    function clickerCps() {
      let cps = 0;
      CLICKER_BUILDINGS.forEach((building) => {
        const count = clickerState.buildings[building.id] || 0;
        if (count > 0) cps += count * building.cps * clickerBuildingMult(building.id);
      });
      cps *= clickerAllMult();
      if (clickerState.buff && clickerState.buff.type === "cps" && clickerState.buff.until > Date.now()) {
        cps *= clickerState.buff.mult;
      }
      return cps;
    }

    function clickerClickPower() {
      let power = clickerClickMult() * clickerAllMult();
      if (clickerState.buff && clickerState.buff.type === "click" && clickerState.buff.until > Date.now()) {
        power *= clickerState.buff.mult;
      }
      return Math.max(1, Math.floor(power));
    }

    function clickerBuildingCost(id, amount = 1) {
      const building = CLICKER_BUILDINGS.find((item) => item.id === id);
      if (!building) return Infinity;
      const count = clickerState.buildings[id] || 0;
      let total = 0;
      for (let index = 0; index < amount; index += 1) {
        total += Math.floor(building.baseCost * Math.pow(1.15, count + index));
      }
      return total;
    }

    function clickerBuildingUnlocked(building) {
      return clickerState.totalSmiles >= building.unlock;
    }

    function clickerPrestigeGain() {
      const seals = Math.floor(Math.sqrt(clickerState.totalSmiles / 1e6));
      return Math.max(0, seals - clickerState.prestige);
    }

    function clickerRankInfo() {
      let index = 0;
      CLICKER_RANKS.forEach((rank, rankIndex) => {
        if (clickerState.totalSmiles >= rank.at) index = rankIndex;
      });
      const current = CLICKER_RANKS[index];
      const next = CLICKER_RANKS[index + 1] || null;
      const progress = next ? (clickerState.totalSmiles - current.at) / (next.at - current.at) : 1;
      return { current, next, progress: Math.max(0, Math.min(1, progress)) };
    }

    function clickerSave() {
      clickerState.lastSeen = Date.now();
      try {
        window.localStorage.setItem(CLICKER_KEY, JSON.stringify(clickerState));
      } catch (error) {
        /* localStorage может быть недоступен */
      }
    }

    function clickerScheduleSave() {
      window.clearTimeout(clickerSaveTimer);
      clickerSaveTimer = window.setTimeout(clickerSave, 600);
    }

    function clickerApplyOffline() {
      if (!clickerHadSave) return;
      const now = Date.now();
      const lastSeen = Number(clickerState.lastSeen);
      if (!Number.isFinite(lastSeen) || lastSeen >= now) return;
      const elapsed = Math.min((now - lastSeen) / 1000, CLICKER_OFFLINE_CAP);
      if (elapsed < 30) return;
      const cps = clickerCps();
      if (cps <= 0) return;
      const gain = cps * elapsed * 0.5;
      clickerState.smiles += gain;
      clickerState.totalSmiles += gain;
      clickerState.lastSeen = now;
      clickerSave();
      window.setTimeout(() => toast(`пока тебя не было: +${fmt(gain)} улыбок`), 900);
    }

    function clickerUpdateStats() {
      const cps = clickerCps();
      const rank = clickerRankInfo();
      const buffActive = clickerState.buff && clickerState.buff.until > Date.now();
      const buffSeconds = buffActive ? Math.max(0, Math.ceil((clickerState.buff.until - Date.now()) / 1000)) : 0;

      if (clickerEl.balance) clickerEl.balance.textContent = fmt(clickerState.smiles);
      if (clickerEl.rate) clickerEl.rate.textContent = `+${fmtRate(cps)} / сек`;
      if (clickerEl.perClick) clickerEl.perClick.textContent = fmt(clickerClickPower());
      if (clickerEl.clicks) clickerEl.clicks.textContent = fmtInt(clickerState.clicks);
      if (clickerEl.total) clickerEl.total.textContent = fmt(clickerState.totalSmiles);
      if (clickerEl.seals) clickerEl.seals.textContent = String(clickerState.prestige);
      if (clickerEl.rank) clickerEl.rank.textContent = rank.current.name;
      if (clickerEl.progress) clickerEl.progress.style.width = `${(rank.progress * 100).toFixed(2)}%`;
      if (clickerEl.progressBar) clickerEl.progressBar.setAttribute("aria-valuenow", String(Math.round(rank.progress * 100)));
      if (clickerEl.next) {
        clickerEl.next.textContent = rank.next
          ? `до «${rank.next.name}»: ${fmt(Math.max(0, rank.next.at - clickerState.totalSmiles))}`
          : "максимальный ранг";
      }

      if (clickerEl.buff) {
        if (buffActive) {
          clickerEl.buff.hidden = false;
          clickerEl.buff.textContent = `x${clickerState.buff.mult} ${clickerState.buff.type === "cps" ? "производство" : "клик"} · ${buffSeconds}с`;
        } else {
          clickerEl.buff.hidden = true;
        }
      }

      if (clickerEl.prestige) {
        const gain = clickerPrestigeGain();
        clickerEl.prestige.hidden = gain <= 0 && !clickerPrestigeArmed;
        if (!clickerPrestigeArmed) {
          clickerEl.prestige.textContent = gain > 0 ? `Переродиться +${gain}` : "Переродиться";
        }
      }

      if (clickerEl.upgradeBadge) {
        const available = CLICKER_UPGRADES.filter(
          (upgrade) => !clickerState.upgrades[upgrade.id] && upgrade.req(clickerState) && clickerState.smiles >= upgrade.cost
        ).length;
        clickerEl.upgradeBadge.textContent = String(available);
        clickerEl.upgradeBadge.hidden = available === 0;
      }

      if (clickerEl.achievementBadge) {
        const unlocked = CLICKER_ACHIEVEMENTS.filter((achievement) => clickerState.achievements[achievement.id]).length;
        clickerEl.achievementBadge.textContent = `${unlocked}/${CLICKER_ACHIEVEMENTS.length}`;
      }

      if (clickerEl.reset && !clickerResetArmed) clickerEl.reset.textContent = "Сброс";
    }

    function clickerRefreshAffordability() {
      if (clickerEl.shopList) {
        $$(".shop-item", clickerEl.shopList).forEach((item) => {
          const building = CLICKER_BUILDINGS.find((entry) => entry.id === item.dataset.building);
          if (!building) return;
          const unlocked = clickerBuildingUnlocked(building);
          const cost = clickerBuildingCost(building.id, clickerBuyAmount);
          item.classList.toggle("is-locked", !unlocked);
          item.classList.toggle("is-poor", unlocked && clickerState.smiles < cost);
        });
      }

      if (clickerEl.upgradeList) {
        $$(".upgrade-item", clickerEl.upgradeList).forEach((item) => {
          const upgrade = CLICKER_UPGRADES.find((entry) => entry.id === item.dataset.upgrade);
          if (!upgrade) return;
          const bought = Boolean(clickerState.upgrades[upgrade.id]);
          const available = upgrade.req(clickerState);
          item.classList.toggle("is-locked", !bought && !available);
          item.classList.toggle("is-poor", !bought && available && clickerState.smiles < upgrade.cost);
        });
      }
    }

    function clickerRenderShop() {
      if (!clickerEl.shopList) return;
      const scrollTop = clickerEl.shopList.scrollTop;
      clickerEl.shopList.innerHTML = CLICKER_BUILDINGS.map((building) => {
        const count = clickerState.buildings[building.id] || 0;
        const unlocked = clickerBuildingUnlocked(building);
        const cost = clickerBuildingCost(building.id, clickerBuyAmount);
        const cpsEach = building.cps * clickerBuildingMult(building.id) * clickerAllMult();
        return `
          <button class="shop-item" type="button" data-building="${building.id}" aria-label="${building.name}, купить за ${fmt(cost)} улыбок">
            <span class="shop-icon" aria-hidden="true">${building.icon}</span>
            <span class="shop-body">
              <span class="shop-name"><span>${building.name}</span><b class="shop-count">x${count}</b></span>
              <span class="shop-desc">${unlocked ? building.desc : `откроется на ${fmt(building.unlock)} улыбках всего`}</span>
              <span class="shop-stats"><span class="shop-cost">${fmt(cost)} улыбок</span><span class="shop-cps">+${fmtRate(cpsEach)}/сек</span></span>
            </span>
          </button>`;
      }).join("");
      clickerEl.shopList.scrollTop = scrollTop;
      clickerRefreshAffordability();
    }

    function clickerRenderUpgrades() {
      if (!clickerEl.upgradeList) return;
      const scrollTop = clickerEl.upgradeList.scrollTop;
      const upgrades = [...CLICKER_UPGRADES].sort((a, b) => a.cost - b.cost);
      clickerEl.upgradeList.innerHTML = upgrades.map((upgrade) => {
        const bought = Boolean(clickerState.upgrades[upgrade.id]);
        const available = upgrade.req(clickerState);
        const desc = bought ? "куплено" : available ? upgrade.desc : `нужно: ${upgrade.reqText}`;
        return `
          <button class="upgrade-item${bought ? " is-bought" : ""}" type="button" data-upgrade="${upgrade.id}" ${bought ? "disabled" : ""}>
            <span class="upgrade-icon" aria-hidden="true">${bought ? "✓" : upgrade.icon}</span>
            <span class="upgrade-body">
              <span class="upgrade-name">${upgrade.name}</span>
              <span class="upgrade-desc">${desc}</span>
              ${bought ? "" : `<span class="upgrade-cost">${fmt(upgrade.cost)} улыбок</span>`}
            </span>
          </button>`;
      }).join("");
      clickerEl.upgradeList.scrollTop = scrollTop;
      clickerRefreshAffordability();
    }

    function clickerRenderAchievements() {
      if (!clickerEl.achievementGrid) return;
      clickerEl.achievementGrid.innerHTML = CLICKER_ACHIEVEMENTS.map((achievement) => {
        const unlocked = Boolean(clickerState.achievements[achievement.id]);
        return `
          <div class="achievement${unlocked ? " is-unlocked" : ""}">
            <span class="achievement-icon" aria-hidden="true">${unlocked ? achievement.icon : "?"}</span>
            <b>${achievement.name}</b>
            <span>${achievement.desc}</span>
          </div>`;
      }).join("");
    }

    function clickerCheckAchievements() {
      const newlyUnlocked = [];
      CLICKER_ACHIEVEMENTS.forEach((achievement) => {
        if (!clickerState.achievements[achievement.id] && achievement.check(clickerState)) {
          clickerState.achievements[achievement.id] = true;
          newlyUnlocked.push(achievement);
        }
      });
      if (newlyUnlocked.length === 0) return;
      clickerRenderAchievements();
      clickerSave();
      newlyUnlocked.forEach((achievement, index) => {
        window.setTimeout(() => toast(`достижение: ${achievement.name}`), 350 * index);
      });
    }

    function clickerBuyBuilding(id) {
      const building = CLICKER_BUILDINGS.find((item) => item.id === id);
      if (!building) return;
      if (!clickerBuildingUnlocked(building)) {
        toast(`«${building.name}» откроется на ${fmt(building.unlock)} улыбках всего.`);
        return;
      }
      const cost = clickerBuildingCost(id, clickerBuyAmount);
      if (clickerState.smiles < cost) {
        toast(`не хватает ${fmt(cost - clickerState.smiles)} улыбок.`);
        return;
      }
      clickerState.smiles -= cost;
      clickerState.buildings[id] = (clickerState.buildings[id] || 0) + clickerBuyAmount;
      clickerState.lastSeen = Date.now();
      clickerSave();
      clickerRenderShop();
      clickerRenderUpgrades();
      clickerUpdateStats();
      clickerCheckAchievements();
      toast(clickerBuyAmount > 1 ? `куплено: ${building.name} x${clickerBuyAmount}` : `куплено: ${building.name}`);
    }

    function clickerBuyUpgrade(id) {
      const upgrade = CLICKER_UPGRADES.find((item) => item.id === id);
      if (!upgrade || clickerState.upgrades[id]) return;
      if (!upgrade.req(clickerState)) {
        toast(`улучшение откроется: ${upgrade.reqText}.`);
        return;
      }
      if (clickerState.smiles < upgrade.cost) {
        toast(`не хватает ${fmt(upgrade.cost - clickerState.smiles)} улыбок.`);
        return;
      }
      clickerState.smiles -= upgrade.cost;
      clickerState.upgrades[id] = true;
      clickerState.lastSeen = Date.now();
      clickerSave();
      clickerRenderShop();
      clickerRenderUpgrades();
      clickerUpdateStats();
      clickerCheckAchievements();
      toast(`улучшение: ${upgrade.name}`);
    }

    function clickerPrestige() {
      const gain = clickerPrestigeGain();
      if (gain <= 0) return;
      if (!clickerPrestigeArmed) {
        clickerPrestigeArmed = true;
        if (clickerEl.prestige) clickerEl.prestige.textContent = `Точно? +${gain} печатей`;
        toast("перерождение сбросит улыбки, здания и улучшения. нажми ещё раз.");
        window.setTimeout(() => {
          clickerPrestigeArmed = false;
          clickerUpdateStats();
        }, 4000);
        return;
      }

      clickerPrestigeArmed = false;
      clickerState.prestige += gain;
      clickerState.smiles = 0;
      clickerState.buildings = {};
      clickerState.upgrades = {};
      clickerState.buff = null;
      clickerState.lastSeen = Date.now();
      clickerSave();
      clickerRenderShop();
      clickerRenderUpgrades();
      clickerUpdateStats();
      clickerCheckAchievements();
      toast(`перерождение: +${gain} печатей. он снова тебя нашёл.`);
      flashScreen(600);
    }

    function clickerReset() {
      if (!clickerResetArmed) {
        clickerResetArmed = true;
        if (clickerEl.reset) clickerEl.reset.textContent = "Точно сбросить?";
        toast("сброс удалит весь прогресс кликера. нажми ещё раз.");
        window.setTimeout(() => {
          clickerResetArmed = false;
          clickerUpdateStats();
        }, 4000);
        return;
      }

      clickerResetArmed = false;
      clickerPrestigeArmed = false;
      clickerState = clickerDefaultState();
      if (clickerGoldenEl) {
        clickerGoldenEl.remove();
        clickerGoldenEl = null;
      }
      try {
        window.localStorage.removeItem(CLICKER_KEY);
      } catch (error) {
        /* игнорируем */
      }
      clickerSave();
      clickerRenderShop();
      clickerRenderUpgrades();
      clickerRenderAchievements();
      clickerUpdateStats();
      toast("прогресс кликера сброшен. он сделал вид, что не заметил.");
    }

    function clickerScheduleGolden(delay) {
      window.clearTimeout(clickerGoldenTimer);
      const wait = typeof delay === "number" ? delay : 45000 + Math.random() * 90000;
      clickerGoldenTimer = window.setTimeout(clickerSpawnGolden, wait);
    }

    function clickerSpawnGolden() {
      if (document.visibilityState === "hidden" || (clickerState.buff && clickerState.buff.until > Date.now())) {
        clickerScheduleGolden(20000);
        return;
      }
      if (clickerGoldenEl) clickerGoldenEl.remove();

      const stage = $(".clicker-main", clickerRoot);
      if (!stage) {
        clickerScheduleGolden(30000);
        return;
      }

      const button = document.createElement("button");
      button.className = "golden-verity";
      button.type = "button";
      button.setAttribute("aria-label", "Поймать золотого Верити");
      button.innerHTML = `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#ffd60a" />
          <ellipse cx="23" cy="27" rx="4" ry="6" fill="#0a0a0b" />
          <ellipse cx="41" cy="27" rx="4" ry="6" fill="#0a0a0b" />
          <path d="M18 38c4 8 24 8 28 0-4 4-24 4-28 0Z" fill="#0a0a0b" />
        </svg>`;
      button.style.left = `${6 + Math.random() * 74}%`;
      button.style.top = `${10 + Math.random() * 70}%`;
      stage.appendChild(button);
      clickerGoldenEl = button;

      const removeTimer = window.setTimeout(() => {
        if (clickerGoldenEl === button) {
          button.remove();
          clickerGoldenEl = null;
          clickerScheduleGolden();
        }
      }, 9000);

      button.addEventListener("click", () => {
        window.clearTimeout(removeTimer);
        button.remove();
        clickerGoldenEl = null;
        clickerCatchGolden();
        clickerScheduleGolden();
      }, { once: true });
    }

    function clickerCatchGolden() {
      clickerState.goldenCaught += 1;
      const roll = Math.random();
      if (roll < 0.5) {
        clickerState.buff = { type: "cps", mult: 7, until: Date.now() + 25000 };
        toast("золотой Верити: производство x7 на 25 секунд!");
      } else if (roll < 0.8) {
        clickerState.buff = { type: "click", mult: 10, until: Date.now() + 20000 };
        toast("золотой Верити: клик x10 на 20 секунд!");
      } else {
        const bonus = Math.max(25, clickerCps() * 600, clickerState.smiles * 0.15);
        clickerState.smiles += bonus;
        clickerState.totalSmiles += bonus;
        toast(`золотой Верити: +${fmt(bonus)} улыбок!`);
      }
      clickerState.lastSeen = Date.now();
      clickerSave();
      clickerUpdateStats();
      clickerCheckAchievements();
      flashScreen(320);
    }

    function clickerTick() {
      const now = Date.now();
      const delta = Math.min((now - clickerLastTick) / 1000, CLICKER_OFFLINE_CAP);
      clickerLastTick = now;

      if (clickerState.buff && clickerState.buff.until <= now) {
        clickerState.buff = null;
        clickerScheduleSave();
        toast("золотая улыбка закончилась.");
      }

      const cps = clickerCps();
      if (cps > 0) {
        const gain = cps * delta;
        clickerState.smiles += gain;
        clickerState.totalSmiles += gain;
      }

      clickerState.lastSeen = now;
      if (now - clickerLastSave > 5000) {
        clickerSave();
        clickerLastSave = now;
      }

      clickerUpdateStats();
      clickerCheckAchievements();
      clickerRefreshAffordability();
    }

    if (clickerEl.face) {
      clickerEl.face.addEventListener("click", () => {
        const gain = clickerClickPower();
        clickerState.smiles += gain;
        clickerState.totalSmiles += gain;
        clickerState.clicks += 1;
        clickerState.lastSeen = Date.now();
        clickerScheduleSave();
        clickerUpdateStats();
        clickerRefreshAffordability();
        clickerCheckAchievements();

        if (clickerEl.plus) {
          clickerEl.plus.textContent = `+${fmt(gain)}`;
          clickerEl.plus.classList.remove("is-on");
          void clickerEl.plus.offsetWidth;
          clickerEl.plus.classList.add("is-on");
        }

        clickerEl.face.classList.remove("is-poked");
        void clickerEl.face.offsetWidth;
        clickerEl.face.classList.add("is-poked");

        if (clickerState.clicks % 10 === 0 && clickerEl.hint) {
          clickerEl.hint.textContent = CLICKER_PHRASES[Math.floor(Math.random() * CLICKER_PHRASES.length)];
        }

        if (clickerState.clicks % 100 === 0) {
          flashScreen(280);
          toast("он запомнил этот клик.");
        }
      });
    }

    if (clickerEl.shopList) {
      clickerEl.shopList.addEventListener("click", (event) => {
        const item = event.target.closest(".shop-item");
        if (!item) return;
        clickerBuyBuilding(item.dataset.building);
      });
    }

    if (clickerEl.upgradeList) {
      clickerEl.upgradeList.addEventListener("click", (event) => {
        const item = event.target.closest(".upgrade-item");
        if (!item) return;
        clickerBuyUpgrade(item.dataset.upgrade);
      });
    }

    const clickerTabs = $$(".clicker-tab", clickerRoot);
    const clickerPanels = {
      shop: $("#shopPanel", clickerRoot),
      upgrades: $("#upgradesPanel", clickerRoot),
      achievements: $("#achievementsPanel", clickerRoot)
    };

    clickerTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.tab;
        clickerTabs.forEach((item) => {
          const active = item === tab;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", String(active));
        });
        Object.entries(clickerPanels).forEach(([key, panel]) => {
          if (panel) panel.hidden = key !== name;
        });
      });
    });

    $$(".buy-amount", clickerRoot).forEach((button) => {
      button.addEventListener("click", () => {
        clickerBuyAmount = Number(button.dataset.amount) || 1;
        $$(".buy-amount", clickerRoot).forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        clickerRenderShop();
        clickerUpdateStats();
      });
    });

    if (clickerEl.prestige) clickerEl.prestige.addEventListener("click", clickerPrestige);
    if (clickerEl.reset) clickerEl.reset.addEventListener("click", clickerReset);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clickerSave();
    });
    window.addEventListener("pagehide", clickerSave);

    clickerApplyOffline();
    clickerRenderShop();
    clickerRenderUpgrades();
    clickerRenderAchievements();
    clickerUpdateStats();
    clickerCheckAchievements();
    clickerLastTick = Date.now();
    clickerLastSave = Date.now();
    window.setInterval(clickerTick, 100);
    clickerScheduleGolden();
  }

  applyMeme(false);
})();
