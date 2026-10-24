(() => {
  const root = document.documentElement;
  const NAME_KEY = "lunchluxe-guest";
  const SEEN_KEY = "lunchluxe-intro-seen";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get: (area, key) => { try { return window[area].getItem(key) || ""; } catch { return ""; } },
    set: (area, key, value) => { try { window[area].setItem(key, value); } catch { /* storage unavailable */ } },
  };
  const cleanName = (value) => value.replace(/[^\p{L}\p{M}\s.'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 24);

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
    [].concat(children).filter(Boolean).forEach((child) => node.append(child));
    return node;
  }

  function showHeroWelcome(name) {
    const copy = document.querySelector(".hero-copy");
    if (!copy || !name) return;
    const existing = copy.querySelector(".hero-welcome");
    const note = existing || el("p", { className: "hero-welcome" });
    note.replaceChildren("👋 Welcome, ", el("strong", { text: name }), " — your table is ready.");
    if (!existing) copy.prepend(note);
  }

  const savedName = cleanName(store.get("localStorage", NAME_KEY));
  if (!root.classList.contains("intro-active")) {
    showHeroWelcome(savedName);
    return;
  }

  // ---------- Build the stage ----------
  const chef = window.LunchLuxeChef ? window.LunchLuxeChef("ll-chef") : el("span", { className: "ll-chef ll-chef-emoji", text: "👨‍🍳" });
  const question = el("p", { className: "ll-bubble-text", id: "ll-intro-title" }, ["Hi there! 👋", el("br"), "What’s your name?"]);
  const bubble = el("div", { className: "ll-bubble", "aria-live": "polite" }, [question]);
  const input = el("input", { className: "ll-input", type: "text", name: "guest", autocomplete: "given-name", maxlength: "24", placeholder: "Type your name…", "aria-label": "Your name", required: true, value: savedName });
  const nameForm = el("form", { className: "ll-name-form" }, [
    input,
    el("button", { className: "ll-go", type: "submit" }, ["Nice to meet you ", el("span", { "aria-hidden": "true", text: "→" })]),
  ]);
  const hint = el("p", { className: "ll-hint", role: "alert" });

  const cutButton = el("button", { className: "ll-cut", type: "button" }, [
    el("span", { className: "ll-cut-icon", "aria-hidden": "true", text: "✂" }),
    el("span", { text: "Cut to get into great food" }),
  ]);
  const ribbon = el("div", { className: "ll-ribbon", hidden: true }, [
    el("span", { className: "ll-ribbon-half ll-left", "aria-hidden": "true" }),
    el("span", { className: "ll-ribbon-half ll-right", "aria-hidden": "true" }),
    el("span", { className: "ll-bow", "aria-hidden": "true" }, [el("i"), el("i"), el("b")]),
    el("span", { className: "ll-scissors", "aria-hidden": "true", text: "✂" }),
    cutButton,
  ]);

  const curtainLeft = el("div", { className: "ll-curtain ll-curtain-left", "aria-hidden": "true" });
  const curtainRight = el("div", { className: "ll-curtain ll-curtain-right", "aria-hidden": "true" });
  const valance = el("div", { className: "ll-valance", "aria-hidden": "true" }, [el("span", { text: "LunchLuxe" })]);
  const skip = el("button", { className: "ll-skip", type: "button", text: "Skip intro" });
  const burst = el("div", { className: "ll-burst", "aria-hidden": "true" });

  const stage = el("div", { className: "ll-stage" }, [
    el("div", { className: "ll-spot", "aria-hidden": "true" }),
    bubble,
    el("div", { className: "ll-chef-stand" }, [chef]),
    nameForm,
    hint,
  ]);

  const intro = el("div", { className: "ll-intro", role: "dialog", "aria-modal": "true", "aria-labelledby": "ll-intro-title" }, [
    curtainLeft, curtainRight, valance, stage, ribbon, burst, skip,
  ]);
  document.body.prepend(intro);
  root.classList.add("intro-ready");
  requestAnimationFrame(() => intro.classList.add("is-in"));
  setTimeout(() => input.focus({ preventScroll: true }), reduceMotion ? 50 : 900);

  let guest = savedName;

  // ---------- Step 1: name ----------
  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = cleanName(input.value);
    if (!name) {
      hint.textContent = "Just your first name is perfect 😊";
      input.classList.remove("is-shake");
      void input.offsetWidth;
      input.classList.add("is-shake");
      input.focus();
      return;
    }
    guest = name;
    store.set("localStorage", NAME_KEY, name);
    hint.textContent = "";
    question.replaceChildren("Lovely to meet you, ", el("strong", { text: name }), "! 🥕", el("br"), "Your table is ready…");
    bubble.classList.remove("is-pop");
    void bubble.offsetWidth;
    bubble.classList.add("is-pop");
    intro.classList.add("is-named");
    ribbon.hidden = false;
    intro.setAttribute("aria-labelledby", "ll-intro-title");
    setTimeout(() => cutButton.focus({ preventScroll: true }), reduceMotion ? 50 : 700);
  });

  // ---------- Step 2: cut the ribbon ----------
  function veggieBurst() {
    if (reduceMotion) return;
    const items = ["🥕", "🥒", "🍅", "🌶️", "🥦", "🌽", "🍋", "🧅", "🫑", "🌿", "✨", "🥔"];
    for (let i = 0; i < 26; i += 1) {
      const piece = el("span", { text: items[i % items.length] });
      const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
      const distance = 160 + Math.random() * 260;
      piece.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--y", `${Math.sin(angle) * distance - 80}px`);
      piece.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
      piece.style.animationDelay = `${Math.random() * 0.12}s`;
      piece.style.fontSize = `${18 + Math.random() * 18}px`;
      burst.append(piece);
    }
  }

  function finish(name) {
    store.set("sessionStorage", SEEN_KEY, "1");
    intro.classList.add("is-open");
    showHeroWelcome(name);
    const done = () => {
      intro.remove();
      root.classList.remove("intro-active", "intro-ready");
      const target = location.hash && document.querySelector(location.hash);
      if (target) target.scrollIntoView();
      const focusTarget = document.querySelector(".hero-ctas .button") || document.querySelector("main");
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    };
    setTimeout(done, reduceMotion ? 250 : 1900);
  }

  cutButton.addEventListener("click", () => {
    if (intro.classList.contains("is-cut")) return;
    intro.classList.add("is-cut");
    cutButton.disabled = true;
    setTimeout(veggieBurst, reduceMotion ? 0 : 520);
    setTimeout(() => finish(guest), reduceMotion ? 50 : 1250);
  });

  skip.addEventListener("click", () => finish(cleanName(input.value) || guest));
  intro.addEventListener("keydown", (event) => {
    if (event.key === "Escape") finish(cleanName(input.value) || guest);
    if (event.key !== "Tab") return;
    const focusable = [...intro.querySelectorAll("input, button")].filter((node) => !node.disabled && node.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();
