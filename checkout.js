(() => {
  const plans = {
    regular: { name: "Regular", price: 6300, daily: 210 },
    premium: { name: "Premium", price: 8970, daily: 299 },
    elite: { name: "Elite", price: 12570, daily: 419 },
  };
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
    planGrid.querySelectorAll("[data-plan]").forEach((card) => {
      const key = card.getAttribute("data-plan");
      card.classList.toggle("is-selected", key === selectedPlan);
      card.querySelector("button").addEventListener("click", () => {
        location.href = whatsappHref(plans[key]);
      });
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
