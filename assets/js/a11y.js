/* Accessibility options: a panel opened from the header (♿ button), saved per visitor in this browser.
   Each option is a class on <html>, so the CSS does the work:
     a11y-size-1/2   larger text (WCAG 1.4.4)
     a11y-font       highly legible typeface (Atkinson Hyperlegible), helps many dyslexic readers
     a11y-spacing    text spacing per WCAG 1.4.12 (line 1.5×, paragraph 2×, letter .12em, word .16em)
     a11y-calm       no animation, no autoplay, quieter page, narrower lines (ADHD-friendly)
     a11y-ruler      reading mask that follows the pointer, one band of text at a time
     a11y-cb         colour-blind-safe palette (Okabe–Ito: orange and blue instead of red and green/teal)
     a11y-contrast   high contrast text and borders
     a11y-links      underline every link
   Presets combine them. Loaded before main.js, so "calm" also
   makes later scripts see prefers-reduced-motion and skip their animations. */
(function () {
  const root = document.documentElement, KEY = "a11y";
  const OPTS = ["size", "font", "spacing", "calm", "ruler", "cb", "contrast", "links"];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  let st = load();

  // the page scripts ask matchMedia whether to animate: answer "reduce" while calm is on
  const mm = window.matchMedia.bind(window);
  window.matchMedia = (q) => (st.calm && /prefers-reduced-motion:\s*reduce/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q));

  let fontLoaded = false;
  const loadFont = () => { if (fontLoaded) return; fontLoaded = true; const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap"; document.head.appendChild(l); };

  let ruler = null;
  const rulerOn = (on) => {
    if (on && !ruler) { ruler = document.createElement("div"); ruler.className = "a11y-mask"; ruler.setAttribute("aria-hidden", "true");
      ruler.innerHTML = '<div class="a11y-shade a11y-shade-t"></div><div class="a11y-band"></div><div class="a11y-shade a11y-shade-b"></div>'; document.body.appendChild(ruler);
      const [t, band, bt] = ruler.children;
      const move = (y) => { const top = Math.max(0, y - 26); t.style.height = top + "px"; band.style.top = top + "px"; bt.style.top = top + 52 + "px"; };
      window.addEventListener("pointermove", (e) => move(e.clientY), { passive: true }); move(innerHeight / 3); }
    if (ruler) ruler.hidden = !on;
  };

  const apply = () => {
    root.classList.toggle("a11y-size-1", st.size === 1); root.classList.toggle("a11y-size-2", st.size === 2);
    ["font", "spacing", "calm", "ruler", "cb", "contrast", "links"].forEach((k) => root.classList.toggle("a11y-" + k, !!st[k]));
    if (st.font) loadFont();
    if (document.body) rulerOn(!!st.ruler);
    if (st.calm) document.querySelectorAll("video").forEach((v) => { try { v.pause(); } catch (e) {} });
    document.dispatchEvent(new CustomEvent("themechange")); // canvases and maps re-read the colours
  };
  apply();

  const PRESETS = {
    focus: { label: "ADHD-friendly focus", desc: "Calm page, reading mask, roomier text", set: { calm: true, ruler: true, spacing: true } },
    dyslexia: { label: "Dyslexia-friendly", desc: "Legible typeface and spacing", set: { font: true, spacing: true } },
    colour: { label: "Colour-blind safe", desc: "Orange and blue instead of red and green", set: { cb: true } },
    vision: { label: "Low vision", desc: "Larger text, high contrast, underlined links", set: { size: 2, contrast: true, links: true } }
  };
  const ROWS = [
    ["font", "Legible typeface", "Atkinson Hyperlegible, designed for low-vision readers"],
    ["spacing", "Text spacing", "More room between lines, words and letters"],
    ["calm", "Reduce motion and distractions", "No animation or autoplay; quieter, narrower page"],
    ["ruler", "Reading mask", "Dims the page except the line you are reading"],
    ["cb", "Colour-blind-safe colours", "Every colour cue also differs in brightness"],
    ["contrast", "High contrast", "Darker text and borders"],
    ["links", "Underline links", "Links stand out without relying on colour"]
  ];

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5c2.3.8 4.6 1.2 7 1.2s4.7-.4 7-1.2M12 9.7V14m0 0-3 6.5M12 14l3 6.5"/></svg>';
  let panel = null, lastFocus = null;
  const render = () => {
    const on = (k) => !!st[k];
    panel.querySelector(".a11y-body").innerHTML = `
      <p class="a11y-k">Quick presets</p>
      <div class="a11y-presets">${Object.entries(PRESETS).map(([id, p]) => { const active = Object.entries(p.set).every(([k, v]) => st[k] === v);
        return `<button type="button" class="a11y-preset" data-p="${id}" aria-pressed="${active}"><b>${p.label}</b><span>${p.desc}</span></button>`; }).join("")}</div>
      <p class="a11y-k">Text size</p>
      <div class="a11y-seg" role="radiogroup" aria-label="Text size">${["Default", "Larger", "Largest"].map((l, i) => `<button type="button" role="radio" data-size="${i}" aria-checked="${(st.size || 0) === i}" style="font-size:${1 + i * 0.12}rem">${l}</button>`).join("")}</div>
      <p class="a11y-k">Options</p>
      ${ROWS.map(([k, t, d]) => `<label class="a11y-row"><span><b>${t}</b><small>${d}</small></span><input type="checkbox" role="switch" data-k="${k}" ${on(k) ? "checked" : ""}></label>`).join("")}
      <div class="a11y-foot"><button type="button" class="a11y-reset">Reset all</button><span>Saved in this browser only.</span></div>`;
    panel.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => { const p = PRESETS[b.dataset.p], active = b.getAttribute("aria-pressed") === "true";
      Object.entries(p.set).forEach(([k, v]) => { st[k] = active ? (k === "size" ? 0 : false) : v; }); commit(); }));
    panel.querySelectorAll("[data-size]").forEach((b) => b.addEventListener("click", () => { st.size = +b.dataset.size; commit(); }));
    panel.querySelectorAll("[data-k]").forEach((c) => c.addEventListener("change", () => { st[c.dataset.k] = c.checked; commit(c.dataset.k); }));
    panel.querySelector(".a11y-reset").addEventListener("click", () => { st = {}; commit(); });
  };
  const commit = (focusKey) => { save(st); apply(); const f = document.activeElement && document.activeElement.dataset; render();
    const again = focusKey ? panel.querySelector(`[data-k="${focusKey}"]`) : f && (f.p ? panel.querySelector(`[data-p="${f.p}"]`) : f.size != null ? panel.querySelector(`[data-size="${f.size}"]`) : null);
    (again || panel.querySelector(".a11y-close")).focus(); };
  const open = () => {
    lastFocus = document.activeElement;
    if (!panel) {
      panel = document.createElement("div"); panel.className = "a11y-panel"; panel.hidden = true;
      panel.innerHTML = `<div class="a11y-scrim" data-close></div><div class="a11y-box" role="dialog" aria-modal="true" aria-labelledby="a11y-title">
        <div class="a11y-head"><h2 id="a11y-title">${ICON} Accessibility</h2><button type="button" class="a11y-close" data-close aria-label="Close">✕</button></div>
        <div class="a11y-body"></div></div>`;
      document.body.appendChild(panel);
      panel.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
      panel.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); close(); }
        if (e.key === "Tab") { const f = [...panel.querySelectorAll("button, input")].filter((x) => x.offsetParent); const a = f[0], z = f[f.length - 1];
          if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
      });
    }
    render(); panel.hidden = false; document.body.classList.add("a11y-open"); panel.querySelector(".a11y-close").focus();
  };
  const close = () => { panel.hidden = true; document.body.classList.remove("a11y-open"); lastFocus && lastFocus.focus && lastFocus.focus(); };

  const mount = () => {
    // skip link for keyboard and screen-reader users
    const main = document.getElementById("main") || document.querySelector("main");
    if (main && !main.id) main.id = "main";
    if (main && !document.querySelector(".skip-link")) { if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1"); document.body.insertAdjacentHTML("afterbegin", `<a class="skip-link" href="#main">Skip to content</a>`); }
    const bar = document.querySelector("header.top .top-in");
    if (bar && !document.getElementById("a11y-btn")) {
      const b = document.createElement("button"); b.className = "a11y-btn"; b.id = "a11y-btn"; b.type = "button"; b.setAttribute("aria-label", "Accessibility options"); b.title = "Accessibility options"; b.innerHTML = ICON;
      bar.appendChild(b); b.addEventListener("click", open);
    }
    // footer link too, so the options are reachable from the end of the page
    const foot = document.querySelector(".foot");
    if (foot && !foot.querySelector(".a11y-foot-link")) { const a = document.createElement("button"); a.type = "button"; a.className = "a11y-foot-link"; a.textContent = "Accessibility options"; a.addEventListener("click", open); (foot.querySelector(".wrap") || foot).appendChild(a); }
    rulerOn(!!st.ruler);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  window.addEventListener("load", mount);
  window.A11Y = { open, get: () => ({ ...st }) };
})();
