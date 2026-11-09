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

  applyMeme(false);
})();
