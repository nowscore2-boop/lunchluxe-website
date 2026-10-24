(() => {
  const plans = {
    regular: { name: "Regular", price: 6300, daily: 210 },
    premium: { name: "Premium", price: 8970, daily: 299 },
    elite: { name: "Elite", price: 12570, daily: 419 },
  };
  const params = new URLSearchParams(location.search);
  const validPlan = (value) => (value && plans[value] ? value : "premium");
  const selectedPlan = validPlan(params.get("plan") || sessionStorage.getItem("lunchluxe-plan"));
  const inr = (value) => `₹${value.toLocaleString("en-IN")}`;

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const loginForm = document.querySelector("[data-login-form]");
  if (loginForm) {
    const error = loginForm.querySelector(".form-error");
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(loginForm);
      const email = String(data.get("email") || "").trim().toLowerCase();
      const password = String(data.get("password") || "");
      if (!loginForm.checkValidity()) {
        loginForm.reportValidity();
        return;
      }
      if (!email || password.length < 6) {
        error.textContent = "Enter a valid email and a password of at least 6 characters.";
        return;
      }
      const rawName = email.split("@")[0].replace(/[._-]+/g, " ").trim();
      const name = rawName ? rawName.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Guest";
      sessionStorage.setItem("lunchluxe-user", JSON.stringify({ name, email }));
      const requestedPlan = validPlan(params.get("plan"));
      location.href = `checkout-plans.html?plan=${requestedPlan}`;
    });
  }

  const planGrid = document.querySelector("[data-plan-grid]");
  if (planGrid) {
    const user = JSON.parse(sessionStorage.getItem("lunchluxe-user") || "null");
    const greeting = document.querySelector("[data-user-greeting]");
    if (greeting) greeting.textContent = user ? `Welcome back, ${user.name}.` : "Choose a plan to continue.";

    const choose = (key) => {
      sessionStorage.setItem("lunchluxe-plan", key);
      location.href = `payment.html?plan=${key}`;
    };
    planGrid.querySelectorAll("[data-plan]").forEach((card) => {
      const key = card.getAttribute("data-plan");
      card.classList.toggle("is-selected", key === selectedPlan);
      card.querySelector("button").addEventListener("click", () => choose(key));
    });
  }

  const waitingPage = document.querySelector("[data-waiting-page]");
  if (waitingPage) {
    const plan = plans[selectedPlan];
    sessionStorage.setItem("lunchluxe-plan", selectedPlan);
    document.querySelectorAll("[data-plan-name]").forEach((node) => { node.textContent = `${plan.name} Plan`; });
    document.querySelectorAll("[data-plan-price]").forEach((node) => { node.textContent = inr(plan.price); });
    document.querySelectorAll("[data-change-plan]").forEach((link) => {
      link.href = `checkout-plans.html?plan=${selectedPlan}`;
    });
    let waitingNumber = Number(localStorage.getItem("lunchluxe-waiting-number"));
    if (!Number.isInteger(waitingNumber) || waitingNumber < 100 || waitingNumber > 999) {
      waitingNumber = Math.floor(140 + Math.random() * 360);
      localStorage.setItem("lunchluxe-waiting-number", String(waitingNumber));
    }
    document.querySelector("[data-waiting-number]").textContent = String(waitingNumber);
  }
})();
