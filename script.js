/* eslint-disable no-console */
const $ = (sel) => document.querySelector(sel);

const STORAGE_KEY = "birthday_site_v1";

const defaultState = {
  name: "The Missing Puzzle",
  from: "From Wilson",
  to: "The Missing Puzzle",
  message: `Something beautiful is approaching… 🌙

Each second that passes isn’t just time moving.
It’s a quiet reminder that the world is getting ready to celebrate someone rare.

You.

The girl who turns simple sketches into art.
The one who dances like rhythm chose her first.
The one who disappears into novels and makes stories feel real.

The countdown isn’t just for a birthday.
It’s for the day the moon decided to show up on earth in human form.

Stay patient.
Stay curious.
Your day is almost here.

And trust me… it’s worth the wait. ✨`,

  // YYYY-MM-DD; Ivy's birthday (you can still change this in Settings)
  date: "2026-03-13",

  wishes: [],
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const raw = saved ? safeParse(saved, {}) : {};
  return {
    ...defaultState,
    ...raw,
    wishes: Array.isArray(raw.wishes) ? raw.wishes.slice(0, 50) : [],
  };
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTargetDate(state) {
  const now = new Date();
  if (!state.date) return now;

  const [y, m, d] = state.date.split("-").map((x) => Number(x));
  if (!y || !m || !d) return now;

  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function nextOccurrence(date) {
  const now = new Date();
  const target = new Date(date);
  if (target.getTime() >= now.getTime()) return target;
  const next = new Date(target);
  next.setFullYear(target.getFullYear() + 1);
  return next;
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

function buildShareUrl(state) {
  const url = new URL(window.location.href);
  url.searchParams.set("name", state.name);
  if (state.date) url.searchParams.set("date", state.date);
  if (state.from) url.searchParams.set("from", state.from);
  if (state.message) url.searchParams.set("msg", state.message);
  return url.toString();
}

function applyFromQuery(state) {
  const url = new URL(window.location.href);
  const name = url.searchParams.get("name");
  const date = url.searchParams.get("date");
  const from = url.searchParams.get("from");
  const msg = url.searchParams.get("msg");

  let changed = false;
  if (name) {
    state.name = name.slice(0, 40);
    changed = true;
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    state.date = date;
    changed = true;
  }
  if (from) {
    state.from = from.slice(0, 50);
    changed = true;
  }
  if (msg) {
    state.message = msg.slice(0, 420);
    changed = true;
  }
  if (changed) saveState(state);
}

function updateUI(state) {
  setText($("#personName"), state.name || "Friend");
  setText($("#toName"), state.name || "Friend");
  setText($("#fromName"), state.from || "From Wilson, your secret admirer");
  setText($("#messageText"), state.message || defaultState.message);

  const initial = (state.name || "F").trim().slice(0, 1).toUpperCase() || "F";
  setText($("#avatarInitial"), initial);

  const badgeText = $("#badgeText");
  if (badgeText) badgeText.textContent = state.date ? "Counting down to your day" : "Today is your day";

  const sideTitle = $("#sideTitle");
  if (sideTitle) sideTitle.textContent = state.name ? `${state.name}'s day` : "Birthday vibes";

  const sideSub = $("#sideSub");
  if (sideSub) sideSub.textContent = state.date ? "Something special is on the way" : "Small surprises, big smiles.";

  const inputName = $("#inputName");
  if (inputName) inputName.value = state.name || "";
  const inputDate = $("#inputDate");
  if (inputDate) inputDate.value = state.date || "";
  const inputFrom = $("#inputFrom");
  if (inputFrom) inputFrom.value = state.from || "";
  const inputMessage = $("#inputMessage");
  if (inputMessage) inputMessage.value = state.message || "";

  renderWishes(state);
}

function humanCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return { days, hours, mins, secs };
}

function renderCountdown(state) {
  const now = new Date();
  const target = nextOccurrence(getTargetDate(state));
  const diff = target.getTime() - now.getTime();

  const { days, hours, mins, secs } = humanCountdown(diff);
  setText($("#cdDays"), String(days));
  setText($("#cdHours"), pad2(hours));
  setText($("#cdMins"), pad2(mins));
  setText($("#cdSecs"), pad2(secs));

  const micro = $("#microLine");
  if (!micro) return;

  if (diff <= 0) micro.textContent = "It’s time — happy birthday!";
  else if (days === 0) micro.textContent = "Almost there — today or within 24 hours!";
  else micro.textContent = `Counting down: ${days} day${days === 1 ? "" : "s"} to go`;
}

function renderWishes(state) {
  const ul = $("#wishList");
  if (!ul) return;
  ul.innerHTML = "";
  for (const w of state.wishes) {
    const li = document.createElement("li");
    li.className = "wishItem";

    const txt = document.createElement("div");
    txt.className = "wishText";
    txt.textContent = w.text;

    const btn = document.createElement("button");
    btn.className = "xBtn";
    btn.type = "button";
    btn.textContent = "✕";
    btn.addEventListener("click", () => {
      state.wishes = state.wishes.filter((x) => x.id !== w.id);
      saveState(state);
      renderWishes(state);
    });

    li.appendChild(txt);
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// Confetti
function makeConfetti(canvas) {
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let w = 0;
  let h = 0;
  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const colors = ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb7185"];
  const pieces = [];
  let running = false;
  let until = 0;

  function burst(count = 120) {
    const now = performance.now();
    until = now + 2200;
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: -10 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 1.2 + Math.random() * 3.2,
        r: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.18,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 120 + Math.floor(Math.random() * 80),
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  function tick(t) {
    ctx.clearRect(0, 0, w, h);
    const gravity = 0.04;

    for (const p of pieces) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
    }

    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      if (p.life <= 0 || p.y > h + 40) pieces.splice(i, 1);
    }

    for (const p of pieces) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r * 0.55, p.r * 2.2, p.r * 1.1);
      ctx.restore();
    }

    if (pieces.length === 0 && t > until) {
      running = false;
      return;
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  return { burst, resize };
}

function setupGallery() {
  const picker = $("#photoPicker");
  const grid = $("#galleryGrid");
  if (!picker || !grid) return;

  picker.addEventListener("change", () => {
    const files = Array.from(picker.files || []).slice(0, 12);
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(f);

      const wrap = document.createElement("div");
      wrap.className = "photo";

      const img = document.createElement("img");
      img.alt = "Birthday photo";
      img.src = url;

      wrap.appendChild(img);
      grid.appendChild(wrap);
    }
    picker.value = "";
  });
}

function setupAudio() {
  const audio = $("#music");
  const btn = $("#btnPlay");
  const hint = $("#audioHint");
  if (!audio || !btn) return;

  audio.loop = true;

  let isPlaying = false;

  async function play() {
    try {
      await audio.play();
      isPlaying = true;
      setText(btn, "Pause music");
      setText(hint, "Playing Unanifaa by Iyanii… tap to pause.");
    } catch {
      setText(hint, "Tap to start Unanifaa by Iyanii.");
    }
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    setText(btn, "Play birthday music");
    setText(hint, "Music paused. Tap to resume Unanifaa by Iyanii.");
  }

  btn.addEventListener("click", () => {
    if (isPlaying) pause();
    else play();
  });
}

function main() {
  const state = loadState();
  applyFromQuery(state);
  updateUI(state);

  const confettiCanvas = $("#confetti");
  const confetti = confettiCanvas ? makeConfetti(confettiCanvas) : null;

  // Countdown loop
  renderCountdown(state);
  setInterval(() => renderCountdown(state), 250);

  // Celebrate buttons
  $("#btnCelebrate")?.addEventListener("click", () => confetti?.burst(160));
  $("#btnWish")?.addEventListener("click", () => confetti?.burst(100));

  // Settings
  $("#settingsForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.name = ($("#inputName")?.value || "").trim().slice(0, 40) || "Friend";
    state.date = ($("#inputDate")?.value || "").trim();
    state.from = ($("#inputFrom")?.value || "").trim().slice(0, 50) || "Someone who cares";
    state.message = ($("#inputMessage")?.value || "").trim().slice(0, 420) || defaultState.message;
    saveState(state);
    updateUI(state);
    confetti?.burst(140);
  });

  $("#btnReset")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = loadState();
    Object.assign(state, fresh);
    updateUI(state);
    confetti?.burst(140);
  });

  // Wish jar
  $("#wishForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#wishInput");
    if (!input) return;
    const text = (input.value || "").trim();
    if (!text) return;
    state.wishes.unshift({ id: uid(), text: text.slice(0, 120) });
    state.wishes = state.wishes.slice(0, 20);
    input.value = "";
    saveState(state);
    renderWishes(state);
    confetti?.burst(80);
  });

  // Share link
  $("#btnCopyLink")?.addEventListener("click", async () => {
    const url = buildShareUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      setText($("#microLine"), "Share link copied!");
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setText($("#microLine"), "Share link copied!");
    }
  });

  // Auto celebrate on birthday day (within local date)
  const now = new Date();
  const t = getTargetDate(state);
  const isSameDay =
    now.getFullYear() === t.getFullYear() &&
    now.getMonth() === t.getMonth() &&
    now.getDate() === t.getDate();
  if (isSameDay) {
    setText($("#badgeText"), "Happy Birthday — today!");
    confetti?.burst(200);
  }

  // Gallery
  setupGallery();

  // Audio
  setupAudio();

  const autoAudio = $("#music");
  const hint = $("#audioHint");
  if (autoAudio) {
    autoAudio.loop = true;
    autoAudio.volume = 0.7;
    autoAudio
      .play()
      .then(() => {
        setText(hint, "Playing Unanifaa by Iyanii… tap to pause.");
      })
      .catch(() => {
        setText(hint, "Tap play to start Unanifaa by Iyanii.");
      });
  }

  // Keyboard shortcut
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "c" && (e.ctrlKey || e.metaKey)) return;
    if (e.key.toLowerCase() === "b") confetti?.burst(140);
  });
}

window.addEventListener("DOMContentLoaded", main);


