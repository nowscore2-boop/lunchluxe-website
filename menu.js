(() => {
  const WHATSAPP_NUMBER = "91911414115";

  const tiers = {
    regular: { label: "Regular", note: "Everyday thali — rice, dal, two seasonal sabzis and phulka." },
    premium: { label: "Premium", note: "Everyday thali plus a daily paneer or mushroom special." },
    elite: { label: "Elite", note: "Premium plate plus raita, a sweet and protein-rich, low-oil sides." },
  };

  const weeklyMenu = [
    {
      day: "Monday",
      breakfast: ["Vegetable poha", "Masala chai"],
      lunch: ["Jeera rice", "Dal tadka", "Aloo gobi", "Bhindi do pyaza", "Phulka"],
      dinner: ["Phulka", "Mixed veg curry", "Moong dal"],
      premium: "Paneer butter masala",
      elite: { breakfast: "Sprouts chaat", lunch: ["Boondi raita", "Gajar halwa"], dinner: "Grilled paneer tikka" },
    },
    {
      day: "Tuesday",
      breakfast: ["Idli & sambar", "Coconut chutney"],
      lunch: ["Steamed rice", "Sambar", "Beans poriyal", "Cabbage thoran", "Phulka"],
      dinner: ["Phulka", "Lauki chana dal", "Jeera aloo"],
      premium: "Mushroom masala",
      elite: { breakfast: "Fresh fruit bowl", lunch: ["Cucumber raita", "Rava kesari"], dinner: "Soya chunk stir-fry" },
    },
    {
      day: "Wednesday",
      breakfast: ["Aloo paratha", "Fresh curd"],
      lunch: ["Veg pulao", "Rajma masala", "Lauki sabzi", "Gajar matar", "Phulka"],
      dinner: ["Phulka", "Palak dal", "Tinda masala"],
      premium: "Kadai paneer",
      elite: { breakfast: "Moong dal chilla", lunch: ["Mint raita", "Rice kheer"], dinner: "Kala chana salad" },
    },
    {
      day: "Thursday",
      breakfast: ["Rava upma", "Masala chai"],
      lunch: ["Steamed rice", "Odia dalma", "Santula", "Potala bhaja", "Phulka"],
      dinner: ["Phulka", "Kala chana curry", "Aloo baingan"],
      premium: "Mushroom matar",
      elite: { breakfast: "Sprouts chaat", lunch: ["Pineapple raita", "Chhena poda"], dinner: "Tofu bhurji" },
    },
    {
      day: "Friday",
      breakfast: ["Masala dosa", "Sambar & chutney"],
      lunch: ["Jeera rice", "Kadhi", "Aloo shimla mirch", "Beetroot poriyal", "Phulka"],
      dinner: ["Phulka", "Chole masala", "Mixed veg"],
      premium: "Paneer do pyaza",
      elite: { breakfast: "Fruit & nut yogurt", lunch: ["Boondi raita", "Rasgulla"], dinner: "Paneer bhurji (low-oil)" },
    },
    {
      day: "Saturday",
      breakfast: ["Besan chilla", "Green chutney"],
      lunch: ["Veg biryani", "Dal fry", "Aloo matar", "Kachumber salad", "Phulka"],
      dinner: ["Phulka", "Toor dal", "Bhindi masala"],
      premium: "Mushroom do pyaza",
      elite: { breakfast: "Sprouts salad", lunch: ["Burani raita", "Gulab jamun"], dinner: "Rajma salad bowl" },
    },
    {
      day: "Sunday",
      breakfast: ["Puri", "Aloo sabzi"],
      lunch: ["Steamed rice", "Dal makhani", "Mixed veg", "Jeera aloo", "Phulka"],
      dinner: ["Vegetable khichdi", "Kadhi", "Roasted papad"],
      premium: "Shahi paneer",
      elite: { breakfast: "Fresh fruit bowl", lunch: ["Cucumber raita", "Semiya kheer"], dinner: "Grilled tofu & veggies" },
    },
  ];

  const addons = [
    { id: "chaas", name: "Masala chaas", size: "200 ml", price: 20, category: "Drinks", icon: "🥛" },
    { id: "lassi", name: "Sweet lassi", size: "200 ml", price: 30, category: "Drinks", icon: "🥤" },
    { id: "juice", name: "Fruit juice", size: "200 ml", price: 25, category: "Drinks", icon: "🧃" },
    { id: "water", name: "Packaged drinking water", size: "1 L", price: 20, category: "Drinks", icon: "💧" },
    { id: "curd", name: "Curd cup", size: "200 g", price: 25, category: "Dairy", icon: "🥣" },
    { id: "makhana", name: "Roasted makhana", size: "30 g", price: 40, category: "Snacks", icon: "🌰" },
    { id: "namkeen", name: "Namkeen / bhujia", size: "40 g", price: 20, category: "Snacks", icon: "🥨" },
    { id: "cookies", name: "Multigrain cookies", size: "75 g", price: 30, category: "Snacks", icon: "🍪" },
    { id: "protein-bar", name: "Protein bar", size: "1 bar", price: 60, category: "Health", icon: "💪" },
    { id: "chocolate", name: "Dark chocolate", size: "25 g", price: 45, category: "Treats", icon: "🍫" },
    { id: "papad", name: "Roasted papad", size: "2 pcs", price: 10, category: "Sides", icon: "🫓" },
    { id: "pickle", name: "Pickle sachet", size: "1 pc", price: 5, category: "Sides", icon: "🫙" },
  ];

  const mealMeta = [
    { key: "breakfast", label: "Breakfast", icon: "☀", className: "breakfast" },
    { key: "lunch", label: "Lunch", icon: "🍛", className: "lunch" },
    { key: "dinner", label: "Dinner", icon: "☾", className: "dinner" },
  ];

  const formatINR = (value) => `₹${value.toLocaleString("en-IN")}`;

  function whatsappHref(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
    [].concat(children).forEach((child) => child && node.append(child));
    return node;
  }

  function getDayMenu(dayIndex, tier) {
    const entry = weeklyMenu[dayIndex];
    const plain = (name) => ({ name, tag: null });
    const meals = {
      breakfast: entry.breakfast.map(plain),
      lunch: entry.lunch.map(plain),
      dinner: entry.dinner.map(plain),
    };
    if (tier === "premium" || tier === "elite") meals.lunch.push({ name: entry.premium, tag: "premium" });
    if (tier === "elite") {
      meals.breakfast.push({ name: entry.elite.breakfast, tag: "elite" });
      entry.elite.lunch.forEach((name) => meals.lunch.push({ name, tag: "elite" }));
      meals.dinner.push({ name: entry.elite.dinner, tag: "elite" });
    }
    return meals;
  }

  function mountWeeklyMenu(root, { tier = "regular", showTierTabs = false, onTierChange } = {}) {
    if (!root) return null;
    let currentTier = tier;
    const todayIndex = (new Date().getDay() + 6) % 7;
    let currentDay = todayIndex;
    const panelId = `${root.id || "weekly-menu"}-panel`;

    const board = el("div", { className: "menu-board" });
    const toolbar = el("div", { className: "menu-toolbar" });

    let tierButtons = [];
    if (showTierTabs) {
      const tierSwitch = el("div", { className: "tier-switch", role: "group", "aria-label": "Choose a plan" });
      tierButtons = Object.entries(tiers).map(([key, info]) => {
        const button = el("button", { type: "button", "data-tier": key, text: info.label });
        button.addEventListener("click", () => {
          currentTier = key;
          render();
          if (onTierChange) onTierChange(key);
        });
        tierSwitch.append(button);
        return button;
      });
      toolbar.append(tierSwitch);
    }

    const dayTabs = el("div", { className: "day-tabs", role: "tablist", "aria-label": "Day of the week" });
    const dayButtons = weeklyMenu.map((entry, index) => {
      const button = el("button", {
        type: "button",
        role: "tab",
        className: `day-tab${index === todayIndex ? " is-today" : ""}`,
        "aria-controls": panelId,
        "aria-label": index === todayIndex ? `${entry.day} (today)` : entry.day,
        text: entry.day.slice(0, 3),
      });
      button.addEventListener("click", () => {
        currentDay = index;
        render();
      });
      button.addEventListener("keydown", (event) => {
        const keys = { ArrowRight: 1, ArrowLeft: -1 };
        let next = null;
        if (event.key in keys) next = (index + keys[event.key] + weeklyMenu.length) % weeklyMenu.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = weeklyMenu.length - 1;
        if (next === null) return;
        event.preventDefault();
        currentDay = next;
        render();
        dayButtons[next].focus();
      });
      dayTabs.append(button);
      return button;
    });
    toolbar.append(dayTabs);

    const panel = el("div", { className: "day-panel", role: "tabpanel", id: panelId, "aria-live": "polite" });
    const footnote = el("p", {
      className: "menu-footnote",
      text: "Menu rotates weekly and may change with seasonal produce. Tell us about allergies or dietary preferences when you enquire.",
    });

    board.append(toolbar, panel, footnote);
    root.replaceChildren(board);

    function render() {
      tierButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.tier === currentTier)));
      dayButtons.forEach((button, index) => {
        const selected = index === currentDay;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute("aria-label", `${weeklyMenu[currentDay].day} menu, ${tiers[currentTier].label} plan`);

      const meals = getDayMenu(currentDay, currentTier);
      const head = el("div", { className: "day-panel-head" }, [
        el("h3", { text: weeklyMenu[currentDay].day }),
        el("p", { text: `${tiers[currentTier].label} plan · ${tiers[currentTier].note}` }),
      ]);
      const columns = el(
        "div",
        { className: "meal-columns" },
        mealMeta.map((meta) =>
          el("article", { className: "meal-col" }, [
            el("header", {}, [
              el("span", { className: `meal-icon ${meta.className}`, "aria-hidden": "true", text: meta.icon }),
              el("h4", { text: meta.label }),
            ]),
            el(
              "ul",
              {},
              meals[meta.key].map((item) =>
                el("li", {}, [
                  el("span", { text: item.name }),
                  item.tag ? el("span", { className: `item-tag ${item.tag}`, text: tiers[item.tag].label }) : null,
                ]),
              ),
            ),
          ]),
        ),
      );
      panel.replaceChildren(head, columns);
    }

    render();
    return {
      setTier(next) {
        currentTier = next;
        render();
      },
    };
  }

  function mountAddons(root, { summary, onChange } = {}) {
    if (!root) return null;
    const quantities = new Map(addons.map((addon) => [addon.id, 0]));
    const MAX_QTY = 5;
    const cards = new Map();

    const grid = el("div", { className: "addon-grid" });
    addons.forEach((addon) => {
      const qtyOutput = el("output", { "aria-live": "polite", text: "0" });
      const minus = el("button", { type: "button", "aria-label": `Remove one ${addon.name}`, text: "−" });
      const plus = el("button", { type: "button", "aria-label": `Add one ${addon.name}`, text: "+" });
      const card = el("article", { className: "addon-card" }, [
        el("div", { className: "addon-top" }, [
          el("span", { className: "addon-icon", "aria-hidden": "true", text: addon.icon }),
          el("div", {}, [
            el("span", { className: "addon-category", text: addon.category }),
            el("h4", { text: addon.name }),
            el("p", { text: addon.size }),
          ]),
        ]),
        el("div", { className: "addon-bottom" }, [
          el("span", { className: "addon-price", text: formatINR(addon.price) }),
          el("div", { className: "stepper", role: "group", "aria-label": `${addon.name} quantity per delivery` }, [minus, qtyOutput, plus]),
        ]),
      ]);
      const change = (delta) => {
        const next = Math.min(MAX_QTY, Math.max(0, quantities.get(addon.id) + delta));
        quantities.set(addon.id, next);
        update();
      };
      minus.addEventListener("click", () => change(-1));
      plus.addEventListener("click", () => change(1));
      cards.set(addon.id, { card, qtyOutput, minus, plus });
      grid.append(card);
    });
    root.replaceChildren(grid);

    function selection() {
      return addons.filter((addon) => quantities.get(addon.id) > 0).map((addon) => ({ addon, qty: quantities.get(addon.id) }));
    }

    function update() {
      addons.forEach((addon) => {
        const qty = quantities.get(addon.id);
        const { card, qtyOutput, minus, plus } = cards.get(addon.id);
        qtyOutput.textContent = String(qty);
        minus.disabled = qty === 0;
        plus.disabled = qty === MAX_QTY;
        card.classList.toggle("is-selected", qty > 0);
      });
      const selected = selection();
      if (summary) {
        const perDay = addonsTotal(selected);
        const count = selected.reduce((sum, item) => sum + item.qty, 0);
        summary.replaceChildren(
          el("strong", { text: count ? `${count} add-on${count > 1 ? "s" : ""} · ${formatINR(perDay)} per delivery` : "No add-ons selected" }),
          el("span", { text: count ? `About ${formatINR(perDay * 30)} over a 30-day plan (indicative)` : "Use + to add drinks, snacks or essentials to each delivery." }),
        );
      }
      if (onChange) onChange(selected);
    }

    update();
    return { selection };
  }

  function addonsTotal(selected) {
    return selected.reduce((sum, { addon, qty }) => sum + addon.price * qty, 0);
  }

  function addonMessageLines(selected) {
    if (!selected.length) return [];
    const items = selected.map(({ addon, qty }) => `${addon.name} ${addon.size} × ${qty} (${formatINR(addon.price * qty)})`).join(", ");
    return [`Add-ons per delivery: ${items} — about ${formatINR(addonsTotal(selected))}/day.`];
  }

  window.LunchLuxeMenu = {
    tiers,
    weeklyMenu,
    addons,
    formatINR,
    whatsappHref,
    mountWeeklyMenu,
    mountAddons,
    addonMessageLines,
  };
})();
