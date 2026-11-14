// ===== מדדי ביקור אנונימיים =====
// נשמרים במסד הנתונים של מערכת ה-CRM (טבלת pb_lp_events, ראו supabase-landing.sql במאגר PIZZA-BAR_CRM)
// ומוצגים שם במסך "דף נחיתה". לא נשמרים שמות, טלפונים או תוכן הטופס.
// ?notrack בכתובת – הדפדפן הזה לא נספר (לבעלי העסק). ?track – מבטל.
(() => {
  const TRACK = {
    url: "https://cbjxqpwvhdxnulilkzzx.supabase.co",
    key: "sb_publishable_FYCiIVwcBldpU13cjYqqGQ_6m6ILIFA", // מפתח ציבורי; הטבלה מאפשרת רק הוספה
    hosts: ["yakirdavid.github.io"],
  };

  window.pbTrack = () => {};
  const get = (store, k) => { try { return store.getItem(k); } catch { return null; } };
  const set = (store, k, v) => { try { store.setItem(k, v); } catch {} };
  const qs = new URLSearchParams(location.search);
  if (qs.has("notrack")) set(localStorage, "pb_notrack", "1");
  if (qs.has("track")) { try { localStorage.removeItem("pb_notrack"); } catch {} }

  const debug = get(localStorage, "pb_track_debug") === "1";
  const enabled = debug || (TRACK.hosts.includes(location.hostname) && !navigator.webdriver && get(localStorage, "pb_notrack") !== "1");
  if (!enabled) return;

  // לבדיקות בלבד: אפשר להפנות את המדדים לשרת אחר
  const endpoint = (debug && get(localStorage, "pb_track_url")) || TRACK.url;

  const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
  const idIn = (store, k) => {
    let v = get(store, k);
    if (!v) { v = rid(); set(store, k, v); }
    return v;
  };
  const visitor = idIn(localStorage, "pb_vid");
  const session = idIn(sessionStorage, "pb_sid");

  const send = (type, name = null, value = null, data = null) =>
    fetch(`${endpoint}/rest/v1/pb_lp_events`, {
      method: "POST",
      keepalive: true,
      headers: { apikey: TRACK.key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ visitor, session, type, name, value, data }),
    }).catch(() => {});
  window.pbTrack = send;

  // ---- כניסה: מקור ומכשיר ----
  const refHost = (() => { try { return new URL(document.referrer).hostname; } catch { return ""; } })();
  const fromRef = [["instagram", "instagram"], ["facebook", "facebook"], ["fb.", "facebook"], ["google", "google"], ["whatsapp", "whatsapp"], ["wa.me", "whatsapp"], ["tiktok", "tiktok"]]
    .find(([part]) => refHost.includes(part))?.[1];
  const src = (qs.get("src") || qs.get("utm_source") || fromRef || (refHost && refHost !== location.hostname ? refHost : "")).toLowerCase().slice(0, 40);
  send("view", null, null, {
    src,
    dev: matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop",
    w: innerWidth,
  });

  // ---- אילו חלקים בדף נצפו ----
  const seen = new Set();
  let last = "";
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const k = en.target.dataset.track;
        last = k;
        if (seen.has(k)) return;
        seen.add(k);
        send("section", k);
      }),
    { rootMargin: "0px 0px -40% 0px" }
  );
  document.querySelectorAll("[data-track]").forEach((el) => io.observe(el));

  // ---- גלילה וזמן פעיל ----
  let maxScroll = 0;
  const onScroll = () => {
    const h = document.documentElement.scrollHeight;
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round(((scrollY + innerHeight) / h) * 100)));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let active = 0;
  let since = document.visibilityState === "visible" ? performance.now() : null;
  let sent = "";
  const leave = () => {
    if (since != null) { active += performance.now() - since; since = null; }
    const value = Math.min(86400000, Math.round(active));
    const sig = `${value}|${maxScroll}|${last}`;
    if (sig === sent) return;
    sent = sig;
    send("leave", null, value, { scroll: maxScroll, last });
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leave();
    else since = performance.now();
  });
  addEventListener("pagehide", leave);

  // ---- לחיצות על כפתורים חשובים ----
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest("a, button");
      if (!el) return;
      const href = el.getAttribute("href") || "";
      let name = "";
      if (/wa\.me|whatsapp/.test(href)) name = "whatsapp";
      else if (href.startsWith("tel:")) name = "phone";
      // אינסטגרם: לפי הכפתור (instagram:about / instagram:quote / instagram:footer)
      else if (href.includes("instagram.com")) name = `instagram:${el.closest("[data-track]")?.dataset.track || "other"}`;
      else if (el.matches(".tab")) name = `tab:${el.dataset.tab}`;
      else if (el.dataset.package) name = `package:${el.dataset.package}`;
      else if (el.closest(".main-nav") && href.startsWith("#sec-")) name = `nav:${href.slice(5)}`;
      else if (el.closest(".hero-ctas, .mobile-cta") || el.matches(".mobile-cta")) name = href === "#sec-menu" ? "cta:menu" : "cta:quote";
      if (name) send("click", name.slice(0, 60));
    },
    true
  );
})();
