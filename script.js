// ===== הגדרות העסק – עדכנו כאן =====
const CONFIG = {
  whatsapp: "972500000000", // מספר בפורמט בינלאומי, בלי + ובלי 0 בהתחלה
  // שעות פתיחה לפי יום (0 = ראשון ... 6 = שבת). close אחרי חצות = 24:00 ומעלה
  hours: {
    0: { open: "12:00", close: "24:00" },
    1: { open: "12:00", close: "24:00" },
    2: { open: "12:00", close: "24:00" },
    3: { open: "12:00", close: "24:00" },
    4: { open: "12:00", close: "24:00" },
    5: { open: "12:00", close: "16:00" },
    6: { open: "19:00", close: "25:00" },
  },
  maxGuests: 12,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ===== Header: scroll state + mobile menu =====
const header = $(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = $(".nav-toggle");
const setNav = (open) => {
  document.body.classList.toggle("nav-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
};
toggle.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
$$(".main-nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
document.addEventListener("keydown", (e) => e.key === "Escape" && setNav(false));

// ===== Hero embers =====
const embers = $(".embers");
if (embers && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (let i = 0; i < 28; i++) {
    const e = document.createElement("i");
    e.style.left = `${Math.random() * 100}%`;
    e.style.animationDuration = `${6 + Math.random() * 8}s`;
    e.style.animationDelay = `${Math.random() * 10}s`;
    e.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
    const size = 2 + Math.random() * 4;
    e.style.width = e.style.height = `${size}px`;
    embers.appendChild(e);
  }
}

// ===== Menu tabs =====
const tabs = $$(".tab");
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", String(active));
    });
    $$(".tab-panel").forEach((p) => {
      const active = p.dataset.panel === tab.dataset.tab;
      p.classList.toggle("active", active);
      p.hidden = !active;
    });
  })
);

// ===== Opening hours: highlight today + open/closed =====
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function openStatus(now = new Date()) {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = CONFIG.hours[day];
  const yesterday = CONFIG.hours[(day + 6) % 7];
  // משמרת של אתמול שנמשכת אחרי חצות
  if (yesterday && toMin(yesterday.close) > 1440 && mins < toMin(yesterday.close) - 1440) {
    return { open: true, until: yesterday.close };
  }
  if (today && mins >= toMin(today.open) && mins < toMin(today.close)) {
    return { open: true, until: today.close };
  }
  return { open: false, next: today && mins < toMin(today.open) ? today.open : null };
}

const fmt = (hhmm) => {
  const m = toMin(hhmm) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

(function renderHours() {
  const day = new Date().getDay();
  const row = day <= 4 ? 0 : day;
  $$("#hours li").forEach((li) => li.classList.toggle("today", Number(li.dataset.day) === row));
  const el = $("#open-now");
  const s = openStatus();
  el.classList.add(s.open ? "is-open" : "is-closed");
  el.textContent = s.open
    ? `פתוח עכשיו · עד ${fmt(s.until)}`
    : s.next ? `סגור כרגע · נפתח היום ב־${s.next}` : "סגור כרגע";
})();

// ===== Reservation form → WhatsApp =====
const form = $("#reserve-form");
const dateInput = $("#r-date");
const timeSelect = $("#r-time");
const guestsSelect = $("#r-guests");

const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
dateInput.min = isoDate(new Date());
dateInput.value = isoDate(new Date());

for (let g = 1; g <= CONFIG.maxGuests; g++) {
  guestsSelect.add(new Option(g === 1 ? "סועד אחד" : `${g} סועדים`, g, false, g === 2));
}

function fillTimes() {
  const [y, m, d] = dateInput.value.split("-").map(Number);
  const chosen = new Date(y, m - 1, d);
  const h = CONFIG.hours[chosen.getDay()];
  timeSelect.innerHTML = "";
  if (!h) return;
  const isToday = isoDate(chosen) === isoDate(new Date());
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  // הזמנות עד שעה לפני סגירה, כל 30 דקות
  for (let t = toMin(h.open); t <= toMin(h.close) - 60; t += 30) {
    if (isToday && t < nowMin + 30) continue;
    const label = fmt(`${Math.floor(t / 60)}:${t % 60}`);
    timeSelect.add(new Option(label, label));
  }
  if (!timeSelect.options.length) timeSelect.add(new Option("אין שעות פנויות בתאריך זה", ""));
}
dateInput.addEventListener("change", fillTimes);
if (dateInput.value) fillTimes();

// כפתור "לתיאום אירוע" ממלא מראש את סיבת הביקור
$$("[data-occasion]").forEach((btn) =>
  btn.addEventListener("click", () => ($("#r-occasion").value = btn.dataset.occasion))
);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = $(".form-msg", form);
  let valid = true;
  $$("[required]", form).forEach((el) => {
    const bad = !el.value.trim() || (el.type === "tel" && !/^[\d\s+\-()]{9,}$/.test(el.value));
    el.closest(".field").classList.toggle("invalid", bad);
    if (bad) valid = false;
  });
  if (!valid) {
    msg.className = "form-msg error";
    msg.textContent = "נא למלא את כל השדות המסומנים";
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  const [y, m, d] = data.date.split("-");
  const lines = [
    "היי, אשמח להזמין מקום 🍕",
    `שם: ${data.name}`,
    `טלפון: ${data.phone}`,
    `תאריך: ${d}/${m}/${y}`,
    `שעה: ${data.time}`,
    `סועדים: ${data.guests}`,
    data.occasion && `סיבת הביקור: ${data.occasion}`,
    data.notes && `הערות: ${data.notes}`,
  ].filter(Boolean);

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  msg.className = "form-msg ok";
  msg.textContent = "מעולה! פתחנו לכם את וואטסאפ – רק לשלוח ואנחנו מאשרים 🔥";
});

// ===== Club signup (דמו – לחברו לשירות דיוור / CRM) =====
$("#club-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#club-phone");
  const msg = $(".club-msg");
  if (!/^[\d\s+\-()]{9,}$/.test(input.value)) {
    msg.textContent = "נא להזין מספר טלפון תקין";
    return;
  }
  msg.textContent = "נרשמתם! נתראה ביום ההולדת 🎉";
  input.value = "";
});

// ===== Reveal on scroll =====
const revealEls = $$(".section-head, .highlight, .dish, .card, .review, .split > *, .info-card, details, .g-item");
revealEls.forEach((el) => el.classList.add("reveal"));
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    }),
  { threshold: 0.12 }
);
revealEls.forEach((el) => io.observe(el));

$("#year").textContent = new Date().getFullYear();
