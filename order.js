(async () => {
  const status = document.querySelector("#order-status");
  const form = document.querySelector("#order-form");
  const catalog = await window.LuxeCatalogReady;
  const base = (window.LUNCHLUXE_API_URL || "").replace(/\/$/, "");
  if (!base || !catalog) {
    status.textContent = "Online requests are currently unavailable. Please contact the LunchLuxe team on WhatsApp instead.";
    return;
  }
  const select = form.elements.namedItem("plan");
  Object.entries(catalog.plans).forEach(([key, plan]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = plan.title;
    select.append(option);
  });
  const requested = new URLSearchParams(location.search).get("plan");
  if (requested && Object.hasOwn(catalog.plans, requested)) select.value = requested;
  const showPrice = () => {
    document.querySelector("#order-price").textContent = `30-day plan: ₹${catalog.plans[select.value].price.toLocaleString("en-IN")}. Delivery must be confirmed.`;
  };
  select.addEventListener("change", showPrice);
  showPrice();
  form.hidden = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Sending request…";
    try {
      const data = Object.fromEntries(new FormData(form));
      data.catalogVersion = window.LuxeCatalogVersion;
      const response = await fetch(`${base}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your request could not be sent.");
      form.hidden = true;
      status.textContent = `Request #${result.id} received. Our team will contact you to confirm delivery and your start date. No payment has been taken.`;
    } catch (error) {
      status.textContent = `${error.message} Please try again or contact our team.`;
      button.disabled = false;
    }
  });
})();
