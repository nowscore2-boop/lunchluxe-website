(async () => {
  const currentCatalog = await window.LuxeCatalogReady;
  const plans = {
    regular: { name: "Regular", price: 6300, daily: 210 },
    premium: { name: "Premium", price: 8970, daily: 299 },
    elite: { name: "Elite", price: 12570, daily: 419 },
  };
  if (currentCatalog) {
    Object.entries(currentCatalog.plans).forEach(([key, plan]) => {
      plans[key] = { name: plan.type, price: plan.price, daily: plan.price / 30 };
    });
  }
  const params = new URLSearchParams(location.search);
  const validPlan = (value) => (value && plans[value] ? value : "premium");
  const selectedPlan = validPlan(params.get("plan"));
  const inr = (value) => `₹${value.toLocaleString("en-IN")}`;
  const whatsappHref = (plan) => window.LunchLuxeMenu.whatsappHref(plan
    ? `Hi LunchLuxe, I’m interested in the ${plan.name} plan (${inr(plan.price)}/month). Please confirm current pricing, delivery availability and how to get started.`
    : "Hi LunchLuxe, please share your current meal plans, pricing and delivery availability.");

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const planEnquiry = document.querySelector("[data-plan-enquiry]");
  if (planEnquiry) {
    planEnquiry.href = whatsappHref(plans[params.get("plan")]);
  }

  const planGrid = document.querySelector("[data-plan-grid]");
  if (planGrid) {
    if (currentCatalog) document.querySelector(".checkout-heading > p:last-child").textContent = "Choose a plan to request delivery. Our team confirms coverage and availability before any payment.";
    planGrid.querySelectorAll("[data-plan]").forEach((card) => {
      const key = card.getAttribute("data-plan");
      card.classList.toggle("is-selected", key === selectedPlan);
      card.querySelector("h2").textContent = plans[key].name;
      card.querySelector(".checkout-plan-price").firstChild.textContent = `${inr(plans[key].price)} `;
      if (currentCatalog) {
        const plan = currentCatalog.plans[key];
        card.querySelector(".checkout-plan-copy").textContent = plan.description;
        const list = card.querySelector("ul");
        list.replaceChildren(...plan.benefits.map((benefit) => {
          const item = document.createElement("li"); item.textContent = benefit; return item;
        }));
      }
      card.querySelector("button").addEventListener("click", () => {
        location.href = currentCatalog ? `order.html?plan=${encodeURIComponent(key)}` : whatsappHref(plans[key]);
      });
      if (currentCatalog) card.querySelector("button").textContent = `Request ${plans[key].name} →`;
    });
  }

  const waitingPage = document.querySelector("[data-waiting-page]");
  if (waitingPage) {
    const plan = plans[selectedPlan];
    document.querySelectorAll("[data-plan-name]").forEach((node) => { node.textContent = `${plan.name} Plan`; });
    document.querySelectorAll("[data-plan-price]").forEach((node) => { node.textContent = inr(plan.price); });
    document.querySelectorAll("[data-contact-plan]").forEach((link) => {
      link.href = whatsappHref(plan);
    });
  }
})();
