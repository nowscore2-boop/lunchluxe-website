const planCatalog = {
  regular: {
    title: "Regular Plan",
    type: "Regular",
    highlight: "Plan",
    tagline: "Simple. Wholesome. Everyday.",
    description: "A balanced and affordable meal plan with homestyle vegetarian meals, perfect for everyday nourishment.",
    price: 6300,
    stamp: "",
    accent: "regular",
    benefits: ["Homestyle Vegetarian Meals", "Simple & Balanced Nutrition", "Freshly Prepared Everyday", "Made with Care"],
    meals: [
      {
        name: "Breakfast",
        price: 50,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=440&q=85",
        alt: "Fresh idli served as part of a homestyle vegetarian breakfast",
        bullets: ["Nutritious and light meals", "Traditional Indian breakfast", "Freshly prepared every day"],
      },
      {
        name: "Lunch",
        price: 90,
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=440&q=85",
        alt: "Wholesome bowl of vegetables and grains for lunch",
        bullets: ["Wholesome and filling", "Seasonal vegetables", "Balanced nutrition"],
      },
      {
        name: "Dinner",
        price: 70,
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=440&q=85",
        alt: "Comforting curry served fresh for dinner",
        bullets: ["Comforting and delicious", "Homestyle dinner options", "Freshly cooked every day"],
      },
    ],
  },
  premium: {
    title: "Premium Plan",
    type: "Premium",
    highlight: "Plan",
    tagline: "More Variety. More Goodness.",
    description: "A wholesome vegetarian meal plan with premium dishes, perfect for those who love variety and homely flavours.",
    price: 8970,
    stamp: "Premium dishes everyday with Paneer & Mushroom specials.",
    accent: "premium",
    benefits: ["100% Vegetarian", "Freshly Cooked", "Greater Variety", "Made with Care"],
    meals: [
      {
        name: "Breakfast",
        price: 50,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=440&q=85",
        alt: "Fresh idli served as part of a homestyle vegetarian breakfast",
        bullets: ["Nutritious and tasty meals", "Traditional Indian breakfast", "Freshly prepared every day"],
      },
      {
        name: "Lunch",
        price: 150,
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=440&q=85",
        alt: "Wholesome bowl of vegetables and grains for lunch",
        bullets: ["Wholesome and satisfying", "Paneer and mushroom specials", "Seasonal vegetables", "Balanced nutrition"],
      },
      {
        name: "Dinner",
        price: 99,
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=440&q=85",
        alt: "Comforting curry served fresh for dinner",
        bullets: ["Comforting and delicious", "Homestyle dinner options", "Freshly cooked every day"],
      },
    ],
  },
  elite: {
    title: "Elite Plan",
    type: "Elite",
    highlight: "Plan",
    tagline: "For Your Health. For Your Goals.",
    description: "A premium vegetarian tiffin plan with a wider variety, more nutritious choices and special care for how you eat.",
    price: 12570,
    stamp: "Our most complete & nutritious plan.",
    accent: "elite",
    benefits: ["100% Vegetarian", "Freshly Cooked", "Premium Dishes", "Health Focused"],
    meals: [
      {
        name: "Breakfast",
        price: 99,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=440&q=85",
        alt: "Fresh idli served as part of a homestyle vegetarian breakfast",
        bullets: ["Nutritious and tasty meals", "Traditional Indian breakfast", "Freshly prepared every day"],
      },
      {
        name: "Lunch",
        price: 200,
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=440&q=85",
        alt: "Wholesome bowl of vegetables and grains for lunch",
        bullets: ["Wholesome and satisfying", "Paneer and mushroom specials", "Seasonal vegetables", "Balanced nutrition"],
      },
      {
        name: "Dinner",
        price: 120,
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=440&q=85",
        alt: "Comforting curry served fresh for dinner",
        bullets: ["Comforting and delicious", "Higher-protein options", "Low-oil preparation", "Freshly cooked every day"],
      },
    ],
  },
};

const searchParams = new URLSearchParams(window.location.search);
const planKey = searchParams.get("plan");
const plan = planKey ? planCatalog[planKey] : undefined;
const menuLib = window.LunchLuxeMenu;
const whatsappHref = menuLib
  ? menuLib.whatsappHref
  : (message) => `https://wa.me/91911414115?text=${encodeURIComponent(message)}`;

function setButton(button, label, href) {
  if (!button) return;
  button.href = href;
  if (/^https?:/.test(href)) {
    button.target = "_blank";
    button.rel = "noopener";
  } else {
    button.removeAttribute("target");
    button.removeAttribute("rel");
  }
  button.textContent = label;
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = " →";
  button.append(arrow);
}

if (!plan) {
  document.querySelector(".package-main")?.remove();
  const heading = document.querySelector("#package-heading");
  heading.textContent = "Choose your meal plan";
  document.querySelector(".package-tagline").textContent = "Homestyle vegetarian meals, freshly prepared every day.";
  document.querySelector(".package-description").textContent = "Explore our monthly tiffin plans and find the one that fits your everyday.";
  document.querySelector(".package-price").hidden = true;
  document.querySelector(".package-benefits").hidden = true;
  document.querySelector(".package-actions").hidden = true;
  document.querySelector(".package-stamp").hidden = true;
  document.querySelector(".package-breadcrumb .current-plan-name").textContent = "Choose a plan";
  document.title = "Choose Your LunchLuxe Meal Plan";
  const inclusions = document.querySelector("#inclusions");
  inclusions.replaceChildren();
  const link = document.createElement("a");
  link.href = "index.html#plans";
  link.className = "button button-green";
  link.textContent = "View Meal Plans";
  inclusions.append(link);
  document.querySelector("#weekly-menu").hidden = true;
  document.querySelector("#addons").hidden = true;
} else {
  document.body.classList.add(`package-${plan.accent}`);
  document.title = `${plan.title} — LunchLuxe`;
  document.querySelector('meta[name="description"]').content = `${plan.title}: ${plan.description} Fresh daily tiffin delivery in Bhubaneswar.`;
  document.querySelector(".package-breadcrumb .current-plan-name").textContent = plan.title;
  document.querySelector(".package-name").textContent = plan.type;
  document.querySelector(".package-highlight").textContent = plan.highlight;
  document.querySelector(".package-tagline").textContent = plan.tagline;
  document.querySelector(".package-description").textContent = plan.description;
  document.querySelector(".package-price strong").textContent = `₹${plan.price.toLocaleString("en-IN")}`;
  document.querySelector(".package-stamp").textContent = plan.stamp;
  const basePlanLines = [
    `Hi LunchLuxe, I’m interested in the ${plan.title} (₹${plan.price.toLocaleString("en-IN")}/month).`,
    `Meal details shown: ${plan.meals.map((meal) => `${meal.name} ₹${meal.price}/day`).join(", ")}.`,
  ];
  const confirmLine = "Please confirm current pricing, inclusions, the weekly menu, dietary details and delivery availability for my area.";
  const updatePlanButtons = (selectedAddons = []) => {
    const addonLines = menuLib ? menuLib.addonMessageLines(selectedAddons) : [];
    const href = whatsappHref([...basePlanLines, ...addonLines, confirmLine].join("\n"));
    const checkoutHref = `login.html?plan=${encodeURIComponent(planKey)}`;
    const count = selectedAddons.reduce((sum, item) => sum + item.qty, 0);
    const suffix = count ? ` + ${count} add-on${count > 1 ? "s" : ""}` : "";
    setButton(document.querySelector(".subscribe-button"), `Continue with ${plan.type}`, checkoutHref);
    setButton(document.querySelector(".subscribe-strip .contact-button"), `Choose ${plan.type} plan`, checkoutHref);
    setButton(document.querySelector(".addon-enquiry"), `Send ${plan.type}${suffix} on WhatsApp`, href);
  };
  updatePlanButtons();

  if (menuLib) {
    document.querySelector("#weekly-menu-heading").textContent = `This week’s ${plan.type} menu`;
    menuLib.mountWeeklyMenu(document.querySelector("[data-weekly-menu]"), { tier: planKey });
    menuLib.mountAddons(document.querySelector("[data-addons]"), {
      summary: document.querySelector("[data-addon-summary]"),
      onChange: updatePlanButtons,
    });
  } else {
    document.querySelector("#weekly-menu").hidden = true;
    document.querySelector("#addons").hidden = true;
  }
  document.querySelector(".monthly-total strong").textContent = `₹${plan.price.toLocaleString("en-IN")}`;

  const benefits = document.querySelector(".package-benefits");
  benefits.replaceChildren(
    ...plan.benefits.map((benefit) => {
      const item = document.createElement("span");
      item.className = "package-benefit";
      item.textContent = benefit;
      return item;
    }),
  );

  const mealCards = document.querySelector(".package-meals");
  mealCards.replaceChildren(
    ...plan.meals.map((meal) => {
      const card = document.createElement("article");
      card.className = "package-meal-card";
      const image = document.createElement("img");
      image.src = meal.image;
      image.alt = meal.alt;
      image.loading = "lazy";
      const details = document.createElement("div");
      details.className = "package-meal-details";
      const summary = document.createElement("div");
      summary.className = "meal-summary";
      const mealName = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = meal.name;
      const daily = document.createElement("p");
      daily.className = "meal-daily-price";
      daily.textContent = `₹${meal.price} / day`;
      const monthly = document.createElement("p");
      monthly.className = "meal-monthly-price";
      monthly.textContent = `₹${(meal.price * 30).toLocaleString("en-IN")} / month · (30 × 30 days)`;
      mealName.append(name, daily, monthly);
      const icon = document.createElement("span");
      icon.className = `meal-period-icon ${meal.name.toLowerCase()}`;
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = meal.name === "Dinner" ? "☾" : "☀";
      summary.append(mealName, icon);
      const bulletList = document.createElement("ul");
      meal.bullets.forEach((bullet) => {
        const item = document.createElement("li");
        item.textContent = bullet;
        bulletList.append(item);
      });
      details.append(summary, bulletList);
      card.append(image, details);
      return card;
    }),
  );

  const perks = document.querySelector(".package-perks");
  perks.replaceChildren(
    ...["Vegetarian Meals", "Freshly Prepared", "Balanced Choices", "Clear Plan Details", "Bhubaneswar Delivery"].map((label, index) => {
      const item = document.createElement("div");
      item.className = "package-perk";
      const icon = document.createElement("span");
      icon.className = `perk-icon perk-icon-${index + 1}`;
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = ["♧", "♙", "⬡", "♡", "▰"][index];
      const text = document.createElement("span");
      text.textContent = label;
      item.append(icon, text);
      return item;
    }),
  );

  const otherPlans = document.querySelector(".other-plan-links");
  otherPlans.replaceChildren(
    ...Object.entries(planCatalog)
      .filter(([key]) => key !== planKey)
      .map(([key, otherPlan]) => {
        const link = document.createElement("a");
        link.className = "other-plan-link";
        link.href = `plan.html?plan=${key}`;
        const name = document.createElement("strong");
        name.textContent = otherPlan.title;
        const price = document.createElement("span");
        price.textContent = `₹${otherPlan.price.toLocaleString("en-IN")} / month`;
        const arrow = document.createElement("span");
        arrow.className = "other-plan-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "→";
        link.append(name, price, arrow);
        return link;
      }),
  );
}

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  mainNav.classList.toggle("is-open", !isOpen);
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
