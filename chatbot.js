(() => {
  const WHATSAPP = "91911414115";
  const EMAIL = "Orders@lunchluxe.com";
  const STORE_KEY = "lunchluxe-tickets";
  const menuLib = window.LunchLuxeMenu;
  const PLANS = [
    { key: "regular", name: "Regular", price: 6300, perDay: 210, icon: "🌿", line: "Homestyle vegetarian meals, seasonal vegetables, balanced nutrition." },
    { key: "premium", name: "Premium", price: 8970, perDay: 299, icon: "👑", line: "Everything in Regular plus daily paneer / mushroom specials and more variety." },
    { key: "elite", name: "Elite", price: 12570, perDay: 419, icon: "✦", line: "Health-focused, higher-protein, low-oil meals with raita and a sweet." },
  ];
  const CATEGORIES = ["Late / missed delivery", "Food quality or taste", "Wrong or missing item", "Billing / payment", "Pause, change or cancel plan", "Allergy or health concern", "Feedback / suggestion", "Other"];
  const PRIORITIES = [
    { value: "Low", hint: "Whenever convenient" },
    { value: "Medium", hint: "Within a day" },
    { value: "High", hint: "Affects today’s meal" },
    { value: "Urgent", hint: "Health or safety issue" },
  ];
  const MAIN_CHIPS = ["📋 Meal plans & prices", "🍛 Today’s menu", "🛵 Delivery areas", "🧾 Raise a ticket", "🔎 Track my ticket", "💬 Talk to a person"];

  const inr = (n) => `₹${n.toLocaleString("en-IN")}`;
  const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const mail = (subject, body) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    [].concat(children).filter(Boolean).forEach((child) => node.append(child));
    return node;
  }

  // Renders **bold** segments safely without innerHTML
  function rich(text) {
    const frag = document.createDocumentFragment();
    text.split("\n").forEach((line, lineIndex) => {
      if (lineIndex) frag.append(el("br"));
      line.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
        if (!part) return;
        frag.append(part.startsWith("**") ? el("strong", { text: part.slice(2, -2) }) : document.createTextNode(part));
      });
    });
    return frag;
  }

  const loadTickets = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
  };
  const saveTickets = (tickets) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(tickets.slice(-20))); } catch { /* storage unavailable */ }
  };
  function newTicketId() {
    const d = new Date();
    const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return `LL-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  // Cute chef avatar chopping a carrot (static, trusted SVG markup)
  const CHEF_SVG = `<svg class="lx-chef" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <ellipse class="lx-chef-shadow" cx="32" cy="58" rx="22" ry="2.4"/>
    <path class="lx-chef-coat" d="M18 53 Q18 37 32 36 Q46 37 46 53 Z"/>
    <path class="lx-chef-apron" d="M25 41 H39 V53 H25 Z"/>
    <circle class="lx-chef-button" cx="32" cy="45" r="1"/>
    <path class="lx-chef-scarf" d="M27 36 L32 40 L37 36 Z"/>
    <g class="lx-chef-head">
      <circle class="lx-chef-skin" cx="32" cy="26" r="10"/>
      <g class="lx-chef-hat">
        <rect x="23.5" y="14" width="17" height="6" rx="2"/>
        <circle cx="25" cy="12" r="5.5"/><circle cx="32" cy="9" r="6.5"/><circle cx="39" cy="12" r="5.5"/>
      </g>
      <line class="lx-chef-hatband" x1="24" y1="18.5" x2="40" y2="18.5"/>
      <g class="lx-chef-eyes"><ellipse cx="28.3" cy="25.5" rx="1.4" ry="1.6"/><ellipse cx="35.7" cy="25.5" rx="1.4" ry="1.6"/></g>
      <circle class="lx-chef-cheek" cx="25.6" cy="29" r="1.9"/><circle class="lx-chef-cheek" cx="38.4" cy="29" r="1.9"/>
      <path class="lx-chef-smile" d="M29.5 29.6 Q32 32.4 34.5 29.6"/>
    </g>
    <rect class="lx-chef-board" x="8" y="49" width="48" height="6.5" rx="3"/>
    <g class="lx-chef-carrot">
      <path class="lx-carrot-leaf" d="M12 46.5 l-3.5 -3 M12 47 l-4 0.2 M12 47.5 l-3.2 2.4"/>
      <path class="lx-carrot" d="M12 45 Q26 45.2 37 47.2 Q26 49 12 49 Q10.6 47 12 45 Z"/>
      <path class="lx-carrot-line" d="M17 45.6 v1.4 M22 45.5 v1.6 M27 45.9 v1.2"/>
    </g>
    <g class="lx-chef-slices"><ellipse cx="34" cy="47.5" rx="1.5" ry="1.2"/><ellipse cx="35" cy="47.5" rx="1.4" ry="1.1"/><ellipse cx="34.5" cy="47.5" rx="1.3" ry="1"/></g>
    <circle class="lx-chef-skin lx-chef-lefthand" cx="20" cy="46.6" r="2.4"/>
    <g class="lx-chef-arm">
      <path class="lx-chef-sleeve" d="M43 42 Q45 44 41 46"/>
      <path class="lx-chef-blade" d="M38.5 44.5 L31 45.2 Q30.2 47.8 31.8 48.8 L38.5 47.2 Z"/>
      <rect class="lx-chef-handle" x="38.2" y="44.2" width="6.5" height="3" rx="1.4"/>
      <circle class="lx-chef-skin" cx="41.5" cy="45.7" r="2.4"/>
    </g>
  </svg>`;
  function chefNode(extraClass = "") {
    const wrap = document.createElement("span");
    wrap.className = `lx-chef-wrap ${extraClass}`.trim();
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = CHEF_SVG;
    return wrap;
  }
  window.LunchLuxeChef = chefNode;

  const guestName = () => {
    try { return (localStorage.getItem("lunchluxe-guest") || "").trim(); } catch { return ""; }
  };

  // ---------- UI shell ----------
  const launcher = el("button", { className: "lx-launcher", type: "button", "aria-label": "Open LunchLuxe support chat", "aria-expanded": "false", "aria-controls": "lx-chat" }, [
    chefNode("lx-launcher-icon"),
    el("span", { className: "lx-launcher-close", "aria-hidden": "true", text: "✕" }),
    el("span", { className: "lx-badge", "aria-hidden": "true", text: "1" }),
  ]);
  const teaser = el("button", { className: "lx-teaser", type: "button" }, [rich("👋 Need help? **Chat with us** or raise a ticket.")]);
  const log = el("div", { className: "lx-log", role: "log", "aria-live": "polite", "aria-label": "Chat messages" });
  const chips = el("div", { className: "lx-chips", "aria-label": "Suggested questions" });
  const input = el("input", { className: "lx-input", type: "text", placeholder: "Type your question…", "aria-label": "Message", autocomplete: "off", maxlength: "300" });
  const form = el("form", { className: "lx-compose" }, [input, el("button", { className: "lx-send", type: "submit", "aria-label": "Send" }, [el("span", { "aria-hidden": "true", text: "➤" })])]);
  const panel = el("section", { className: "lx-panel", id: "lx-chat", role: "dialog", "aria-label": "LunchLuxe support chat", hidden: true }, [
    el("header", { className: "lx-head" }, [
      el("span", { className: "lx-avatar", "aria-hidden": "true" }, [chefNode()]),
      el("div", {}, [el("strong", { text: "Chef Luxe · Assistant" }), el("small", {}, [el("i", { className: "lx-online", "aria-hidden": "true" }), "Online · Support & orders"])]),
      el("button", { className: "lx-head-btn", type: "button", "aria-label": "Raise a support ticket", title: "Raise a ticket", onClick: () => openTicketForm() }, ["🧾"]),
      el("button", { className: "lx-head-btn", type: "button", "aria-label": "Close chat", onClick: () => toggle(false) }, ["✕"]),
    ]),
    log,
    chips,
    form,
  ]);
  document.body.append(teaser, panel, launcher);

  let opened = false;
  let greeted = false;
  function toggle(force) {
    opened = typeof force === "boolean" ? force : !opened;
    panel.hidden = !opened;
    launcher.classList.toggle("is-open", opened);
    launcher.setAttribute("aria-expanded", String(opened));
    launcher.setAttribute("aria-label", opened ? "Close support chat" : "Open LunchLuxe support chat");
    teaser.classList.remove("is-shown");
    launcher.querySelector(".lx-badge").hidden = true;
    if (opened) {
      if (!greeted) greet();
      setTimeout(() => input.focus(), 50);
    } else {
      launcher.focus();
    }
  }
  launcher.addEventListener("click", () => toggle());
  teaser.addEventListener("click", () => toggle(true));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && opened) toggle(false); });
  setTimeout(() => { if (!opened) teaser.classList.add("is-shown"); }, 4000);
  setTimeout(() => teaser.classList.remove("is-shown"), 14000);

  // Any element with data-open-chat or data-open-ticket can open the assistant
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-chat], [data-open-ticket]");
    if (!trigger) return;
    event.preventDefault();
    if (trigger.hasAttribute("data-open-ticket")) openTicketForm();
    else toggle(true);
  });

  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addMessage(who, content) {
    const bubble = el("div", { className: `lx-msg lx-${who}` });
    if (typeof content === "string") bubble.append(rich(content));
    else bubble.append(content);
    log.append(bubble);
    scrollDown();
    return bubble;
  }

  function setChips(list = MAIN_CHIPS) {
    chips.replaceChildren(...list.map((label) => el("button", { type: "button", className: "lx-chip", text: label, onClick: () => handle(label) })));
  }

  function botSay(parts, nextChips, after) {
    const typing = el("div", { className: "lx-typing-row", role: "status", "aria-label": "Assistant is typing" }, [
      chefNode("lx-typing-chef"),
      el("div", { className: "lx-msg lx-bot lx-typing" }, [el("span"), el("span"), el("span")]),
      el("small", { className: "lx-typing-note", text: "Chef is chopping up an answer…" }),
    ]);
    log.append(typing);
    scrollDown();
    const delay = Math.min(350 + [].concat(parts).join(" ").length * 6, 1100);
    setTimeout(() => {
      typing.remove();
      [].concat(parts).forEach((part) => addMessage("bot", part));
      setChips(nextChips);
      if (after) after();
    }, delay);
  }

  function linkRow(links) {
    return el("div", { className: "lx-links" }, links.map(({ label, href, primary }) =>
      el("a", { className: `lx-link${primary ? " is-primary" : ""}`, href, target: href.startsWith("http") ? "_blank" : null, rel: href.startsWith("http") ? "noopener" : null, text: label })));
  }

  function greet() {
    greeted = true;
    log.append(el("div", { className: "lx-intro" }, [
      chefNode("lx-intro-chef"),
      el("strong", { text: "Chef Luxe at your service!" }),
      el("small", { text: "Freshly chopped answers, served hot. 🥕" }),
    ]));
    const hour = new Date().getHours();
    const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const guest = guestName();
    botSay([`${hello}${guest ? `, **${guest}**` : ""}! 👋 I’m the **Luxe Assistant**.`, "I can answer questions about **plans, menu and delivery**, or help you **raise a support ticket** for any issue. What do you need?"]);
  }

  // ---------- Answers ----------
  function plansCard() {
    const wrap = el("div", { className: "lx-plans" });
    PLANS.forEach((plan) => wrap.append(el("a", { className: "lx-plan", href: `plan.html?plan=${plan.key}` }, [
      el("span", { className: "lx-plan-icon", "aria-hidden": "true", text: plan.icon }),
      el("span", {}, [el("strong", { text: `${plan.name} · ${inr(plan.price)}/mo` }), el("small", { text: `≈ ${inr(plan.perDay)}/day · ${plan.line}` })]),
    ])));
    return wrap;
  }

  function todayMenu() {
    if (!menuLib || !menuLib.weeklyMenu) return "Our menu changes daily. See the **Day-wise menu** section on the home page.";
    const dayIndex = (new Date().getDay() + 6) % 7;
    const day = menuLib.weeklyMenu[dayIndex];
    if (!day) return "Please check the **Day-wise menu** section on the home page.";
    return `Here’s **${day.day}’s** menu (Regular plan):\n☀ **Breakfast:** ${day.breakfast.join(", ")}\n🍛 **Lunch:** ${day.lunch.join(", ")}\n☾ **Dinner:** ${day.dinner.join(", ")}\n👑 Premium adds **${day.premium}**.`;
  }

  const intents = [
    { test: /^\s*(hi|hello|hey|namaste|good (morning|evening|afternoon))\b[\s!.]*$/i, reply: () => botSay("Hello! 😊 How can I help you today?") },
    { test: /\btrack|\bstatus\b|my tickets?|\bLL-\w+/i, reply: (text) => showTickets(text) },
    { test: /ticket|incident|complain|issue|problem|report|raise|\b(wrong|missing|late|cold|stale|refund|bad|spill(ed)?|hair|sick)\b|not (delivered|received|come|arrived)/i, reply: (text) => {
      botSay("I’m sorry something went wrong. Let’s log it as a **support ticket** so our team can fix it quickly. 🧾", [], () => openTicketForm(guessCategory(text)));
    } },
    { test: /\b(person|human|agent|call|phone|whats ?app|contact|talk)\b/i, reply: () => botSay(["You can reach our team directly:", linkRow([
      { label: "💬 WhatsApp us", href: wa("Hi LunchLuxe, I’d like to talk to someone from your team."), primary: true },
      { label: "✉️ Email", href: mail("LunchLuxe enquiry", "Hi LunchLuxe,\n\n") },
    ])]) },
    { test: /\b(pause|cancel|skip|holiday|stop|change|upgrade|downgrade|switch)\b/i, reply: () => botSay(["To **pause, skip, upgrade or cancel** your plan, raise a request and our team will confirm the change.", linkRow([{ label: "🧾 Raise a request", href: "#ticket-plan", primary: true }])]) },
    { test: /elite/i, reply: () => botSay([`✦ **Elite · ${inr(12570)}/month** (≈ ${inr(419)}/day)\nHealth-focused meals, **higher protein**, **low-oil** preparation, plus raita and a sweet.`, linkRow([{ label: "View Elite plan", href: "plan.html?plan=elite", primary: true }])]) },
    { test: /premium/i, reply: () => botSay([`👑 **Premium · ${inr(8970)}/month** (≈ ${inr(299)}/day) — our **most popular** plan.\nDaily **paneer or mushroom specials** and greater variety.`, linkRow([{ label: "View Premium plan", href: "plan.html?plan=premium", primary: true }])]) },
    { test: /regular|basic|cheap/i, reply: () => botSay([`🌿 **Regular · ${inr(6300)}/month** (≈ ${inr(210)}/day)\nSimple, wholesome **homestyle vegetarian** meals with seasonal vegetables.`, linkRow([{ label: "View Regular plan", href: "plan.html?plan=regular", primary: true }])]) },
    { test: /veg|jain|onion|garlic|allerg|diet|protein|diabet|oil|gluten|health/i, reply: () => botSay(["All our meals are **100% vegetarian**. 🌱", "For **Jain, no onion-garlic, allergies or diet needs**, tell our team on WhatsApp and we’ll confirm what’s possible.", linkRow([{ label: "Ask about my diet", href: wa("Hi LunchLuxe, I have a dietary requirement: "), primary: true }])]) },
    { test: /plan|price|pricing|\bcost|subscri|month|\brates?\b|₹|\brs\b/i, reply: () => botSay(["All plans include **breakfast, lunch & dinner for 30 days**. Tap one to see details:", plansCard(), "Prices are illustrative — our team confirms the current price before you order."]) },
    { test: /\b(today|menu|food|dish(es)?|eat|breakfast|lunch|dinner)/i, reply: () => botSay([todayMenu(), linkRow([{ label: "See full week", href: "index.html#menu" }])]) },
    { test: /deliver|area|pin\b|location|where|bhubaneswar|time|slot/i, reply: () => botSay(["🛵 We deliver across **Bhubaneswar**. Coverage and time slots depend on your area.", "Send us your **PIN code** on WhatsApp and we’ll confirm availability.", linkRow([{ label: "Check my area", href: wa("Hi LunchLuxe, please confirm delivery availability for my PIN code: "), primary: true }])]) },
    { test: /add.?on|extra|drink|snack|lassi|chaas|curd|water|juice|chocolate|cookie|makhana|namkeen|papad|pickle/i, reply: () => {
      const list = menuLib && menuLib.addons ? menuLib.addons.slice(0, 6).map((a) => `${a.icon} ${a.name} — **${inr(a.price)}**`).join("\n") : "Drinks, dairy, snacks and treats.";
      botSay([`You can add everyday essentials to each delivery:\n${list}`, linkRow([{ label: "Browse all add-ons", href: "index.html#addons" }])]);
    } },
    { test: /pay|upi|card|cash|invoice|bill/i, reply: () => botSay("💳 Our team shares **payment options and invoices** when confirming your plan. For a billing problem, choose **Raise a ticket**.") },
    { test: /\b(thank|thanks|great|awesome|ok|okay|cool)\b/i, reply: () => botSay("You’re welcome! 🍃 Anything else I can help with?") },
  ];

  function handle(raw) {
    const text = raw.trim();
    if (!text) return;
    addMessage("user", text);
    if (/^🧾|raise a ticket/i.test(text)) { openTicketForm(); return; }
    if (/^🔎/.test(text)) { showTickets(""); return; }
    if (/^💬/.test(text)) { intents.find((i) => i.test.source.includes("person")).reply(text); return; }
    const intent = intents.find((item) => item.test.test(text));
    if (intent) intent.reply(text);
    else botSay(["I’m not sure about that one yet. 🤔 You can pick a topic below, **raise a ticket**, or chat with our team.", linkRow([{ label: "💬 Ask on WhatsApp", href: wa(`Hi LunchLuxe, ${text}`), primary: true }])]);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handle(input.value);
    input.value = "";
  });
  log.addEventListener("click", (event) => {
    const link = event.target.closest(".lx-link");
    const href = link && link.getAttribute("href");
    if (href === "#" || href === "#ticket-plan") { event.preventDefault(); openTicketForm(href === "#ticket-plan" ? CATEGORIES[4] : ""); }
  });

  // ---------- Ticket / incident form ----------
  function field(label, control, hint) {
    return el("label", { className: "lx-field" }, [el("span", { text: label }), control, hint ? el("small", { className: "lx-hint", text: hint }) : null]);
  }

  function guessCategory(text = "") {
    if (/late|not (delivered|received|come|arrived)|delay/i.test(text)) return CATEGORIES[0];
    if (/wrong|missing/i.test(text)) return CATEGORIES[2];
    if (/refund|bill|pay|charge/i.test(text)) return CATEGORIES[3];
    if (/pause|cancel|skip|change|upgrade|downgrade|switch/i.test(text)) return CATEGORIES[4];
    if (/allerg|sick|hair|unwell/i.test(text)) return CATEGORIES[5];
    if (/cold|stale|bad|taste|quality|spill/i.test(text)) return CATEGORIES[1];
    return "";
  }

  function openTicketForm(preset = "") {
    if (typeof preset !== "string") preset = "";
    if (!opened) {
      greeted = true;
      toggle(true);
      log.append(el("div", { className: "lx-intro" }, [chefNode("lx-intro-chef"), el("strong", { text: "Chef Luxe is here to help" })]));
      addMessage("bot", "Let’s log your issue as a **support ticket**. 🧾 It only takes a minute.");
    }
    if (log.querySelector(".lx-ticket-form:not(.is-done)")) { log.querySelector(".lx-ticket-form:not(.is-done) input").focus(); return; }
    const saved = loadTickets().at(-1) || {};
    const uid = Date.now();
    const name = el("input", { name: "name", required: true, autocomplete: "name", value: saved.name || "", maxlength: "60" });
    const phone = el("input", { name: "phone", type: "tel", required: true, autocomplete: "tel", inputmode: "tel", pattern: "[0-9+\\s-]{10,15}", value: saved.phone || "", placeholder: "10-digit mobile" });
    const email = el("input", { name: "email", type: "email", autocomplete: "email", value: saved.email || "", placeholder: "Optional" });
    const category = el("select", { name: "category", required: true }, [el("option", { value: "", text: "Choose a category" }), ...CATEGORIES.map((c) => el("option", { value: c, text: c }))]);
    const date = el("input", { name: "date", type: "date", value: new Date().toISOString().slice(0, 10) });
    const priority = el("div", { className: "lx-priority", role: "radiogroup", "aria-label": "Priority" }, PRIORITIES.map((p, i) =>
      el("label", { className: `lx-pri lx-pri-${p.value.toLowerCase()}` }, [
        el("input", { type: "radio", name: `priority-${uid}`, value: p.value, checked: i === 1 }),
        el("span", { text: p.value }),
      ])));
    const details = el("textarea", { name: "details", required: true, rows: "3", minlength: "10", maxlength: "600", placeholder: "What happened? Include meal, time and anything we should know." });
    const error = el("p", { className: "lx-error", role: "alert" });
    const submit = el("button", { className: "lx-submit", type: "submit", text: "Submit ticket" });

    const ticketForm = el("form", { className: "lx-ticket-form", novalidate: true }, [
      el("h4", {}, ["🧾 Support ticket"]),
      el("p", { className: "lx-form-sub", text: "Fields marked * are required." }),
      field("Your name *", name),
      el("div", { className: "lx-row" }, [field("Phone *", phone), field("Email", email)]),
      el("div", { className: "lx-row" }, [field("Issue type *", category), field("Date of issue", date)]),
      el("fieldset", { className: "lx-field" }, [el("legend", { text: "Priority" }), priority]),
      field("Describe the issue *", details),
      error,
      el("div", { className: "lx-form-actions" }, [
        el("button", { type: "button", className: "lx-cancel", text: "Cancel", onClick: () => { ticketForm.remove(); botSay("No problem — ticket cancelled. Anything else?"); } }),
        submit,
      ]),
    ]);

    ticketForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const problems = [];
      if (name.value.trim().length < 2) problems.push(name);
      if (!/^[0-9+\s-]{10,15}$/.test(phone.value.trim())) problems.push(phone);
      if (email.value && !email.checkValidity()) problems.push(email);
      if (!category.value) problems.push(category);
      if (details.value.trim().length < 10) problems.push(details);
      ticketForm.querySelectorAll(".is-invalid").forEach((node) => node.classList.remove("is-invalid"));
      if (problems.length) {
        problems.forEach((node) => node.classList.add("is-invalid"));
        error.textContent = "Please fill in the highlighted fields (description needs at least 10 characters).";
        problems[0].focus();
        return;
      }
      const ticket = {
        id: newTicketId(),
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        category: category.value,
        priority: ticketForm.querySelector(`input[name="priority-${uid}"]:checked`).value,
        date: date.value,
        details: details.value.trim(),
        page: location.pathname.split("/").pop() || "index.html",
        created: new Date().toISOString(),
        status: "Open",
      };
      saveTickets([...loadTickets(), ticket]);
      ticketForm.classList.add("is-done");
      ticketForm.querySelectorAll("input, select, textarea, button").forEach((node) => { node.disabled = true; });
      addMessage("user", `Submitted ticket: ${ticket.category} (${ticket.priority})`);
      confirmTicket(ticket);
    });

    if (preset) category.value = preset;
    addMessage("bot", ticketForm).classList.add("lx-wide");
    chips.replaceChildren();
    setTimeout(() => (name.value ? (category.value ? details : category) : name).focus(), 60);
  }

  function ticketText(t) {
    return [
      `🧾 LunchLuxe support ticket ${t.id}`,
      `Issue: ${t.category}`,
      `Priority: ${t.priority}`,
      t.date ? `Date of issue: ${t.date}` : "",
      `Name: ${t.name}`,
      `Phone: ${t.phone}`,
      t.email ? `Email: ${t.email}` : "",
      "",
      t.details,
    ].filter((line, i, arr) => line || arr[i - 1]).join("\n");
  }

  function confirmTicket(t) {
    const card = el("div", { className: "lx-ticket-card" }, [
      el("div", { className: "lx-ticket-top" }, [el("span", { className: "lx-check", "aria-hidden": "true", text: "✓" }), el("div", {}, [el("strong", { text: "Ticket created" }), el("code", { text: t.id })])]),
      el("dl", {}, [
        el("dt", { text: "Issue" }), el("dd", { text: t.category }),
        el("dt", { text: "Priority" }), el("dd", {}, [el("span", { className: `lx-tag lx-pri-${t.priority.toLowerCase()}`, text: t.priority })]),
        el("dt", { text: "Status" }), el("dd", {}, [el("span", { className: "lx-tag lx-status", text: t.status })]),
      ]),
    ]);
    botSay([
      card,
      "**Last step:** send it to our support team so they can start working on it. 👇",
      linkRow([
        { label: "💬 Send on WhatsApp", href: wa(ticketText(t)), primary: true },
        { label: "✉️ Send by email", href: mail(`Support ticket ${t.id} – ${t.category}`, ticketText(t)) },
      ]),
      `Save your ticket ID **${t.id}** — type it here any time to see its details.`,
    ]);
  }

  function showTickets(text) {
    const tickets = loadTickets();
    const match = (text.match(/LL-[\w-]+/i) || [])[0];
    const list = match ? tickets.filter((t) => t.id.toLowerCase() === match.toLowerCase()) : tickets.slice(-3).reverse();
    if (!list.length) {
      botSay([match ? `I couldn’t find **${match}** on this device.` : "You haven’t raised any tickets on this device yet.", linkRow([{ label: "🧾 Raise a ticket", href: "#", primary: true }])]);
      return;
    }
    botSay([
      match ? "Here’s your ticket:" : `Your recent ticket${list.length > 1 ? "s" : ""}:`,
      ...list.map((t) => el("div", { className: "lx-ticket-mini" }, [
        el("code", { text: t.id }),
        el("span", { text: `${t.category} · ${t.priority}` }),
        el("small", { text: `Raised ${new Date(t.created).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` }),
        el("a", { className: "lx-link", href: wa(`Hi LunchLuxe, could you update me on ticket ${t.id}?`), target: "_blank", rel: "noopener", text: "Ask for an update →" }),
      ])),
    ]);
  }

  setChips();
})();
