// ===== הגדרות העסק – עדכנו כאן =====
const CONFIG = {
  whatsapp: "972506858090", // מספר בפורמט בינלאומי, בלי + ובלי 0 בהתחלה
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

// ===== Quote form → WhatsApp =====
const form = $("#quote-form");
const dateInput = $("#q-date");
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
dateInput.min = isoDate(new Date());

// כפתורי "למסלול הזה" ממלאים מראש את המסלול בטופס
$$("[data-package]").forEach((btn) =>
  btn.addEventListener("click", () => ($("#q-package").value = btn.dataset.package))
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
    "היי, אשמח לבדוק זמינות לאירוע 🍕🔥",
    `שם: ${data.name}`,
    `טלפון: ${data.phone}`,
    `סוג האירוע: ${data.type}`,
    `תאריך: ${d}/${m}/${y}`,
    `מיקום: ${data.city}`,
    `מספר אורחים: ${data.guests}`,
    data.package && `מסלול: ${data.package}`,
    data.notes && `הערות: ${data.notes}`,
  ].filter(Boolean);

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  msg.className = "form-msg ok";
  msg.textContent = "מעולה! פתחנו לכם את וואטסאפ. רק לשלוח ונחזור אליכם 🔥";
});

// ===== Reveal on scroll =====
const revealEls = $$(".section-head, .highlight, .step, .package, .dish, .card, .review, .split > *, details");
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
