(() => {
  const base = (window.LUNCHLUXE_API_URL || "").replace(/\/$/, "");
  const notice = document.querySelector("#notice");
  const dashboard = document.querySelector("#dashboard");
  const loginPanel = document.querySelector("#login-panel");
  const logout = document.querySelector("#logout");
  const forms = Object.fromEntries([...document.querySelectorAll("form")].map((form) => [form.getAttribute("id"), form]));
  let token = sessionStorage.getItem("luxe-admin-token") || "";
  let catalog;
  let version;
  let employees = [];
  const offsets = { orders: 0, finance: 0, staff: 0 };

  function message(value, error = false) {
    notice.textContent = value;
    notice.classList.toggle("error", error);
  }
  function field(form, name) { return form.elements.namedItem(name); }
  function money(paise) { return `₹${(Number(paise) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
  function paise(value) {
    if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Enter an amount with at most two decimal places.");
    const [whole, fraction = ""] = value.split(".");
    const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (!Number.isSafeInteger(result)) throw new Error("Amount is too large.");
    return result;
  }
  function showSignedIn(signedIn) {
    loginPanel.hidden = signedIn;
    dashboard.hidden = !signedIn;
    logout.hidden = !signedIn;
  }
  async function api(path, options = {}) {
    if (!base) throw new Error("The API is not configured. Set LUNCHLUXE_API_URL in api-config.js.");
    const headers = { ...options.headers };
    if (options.body) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${base}${path}`, { ...options, headers, cache: "no-store" });
    const body = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      if (response.status === 401 && path !== "/api/admin/login") {
        token = "";
        sessionStorage.removeItem("luxe-admin-token");
        showSignedIn(false);
      }
      throw new Error(body?.error || `Request failed (${response.status}).`);
    }
    return body;
  }
  async function perform(form, action) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message("");
    try { await action(); } catch (error) { message(error.message, true); } finally { button.disabled = false; }
  }
  function paragraph(value) {
    const node = document.createElement("p");
    node.textContent = value;
    return node;
  }
  function record(lines) {
    const node = document.createElement("article");
    node.className = "record";
    lines.forEach((line) => node.append(paragraph(line)));
    return node;
  }
  function recordButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = label;
    button.addEventListener("click", async () => {
      button.disabled = true;
      try { await action(); } catch (error) { message(error.message, true); } finally { button.disabled = false; }
    });
    return button;
  }
  function renderEmpty(root, nodes) {
    root.replaceChildren(...(nodes.length ? nodes : [paragraph("No records yet.")]));
  }
  function renderPager(root, key, hasMore, refresh) {
    const controls = document.createElement("div");
    controls.className = "actions";
    const previous = recordButton("Previous", async () => {
      offsets[key] -= 50;
      try { await refresh(); } catch (error) { offsets[key] += 50; throw error; }
    });
    const next = recordButton("Next", async () => {
      offsets[key] += 50;
      try { await refresh(); } catch (error) { offsets[key] -= 50; throw error; }
    });
    previous.disabled = offsets[key] === 0;
    next.disabled = !hasMore;
    controls.append(previous, next);
    root.append(controls);
  }
  function showTab(id) {
    document.querySelectorAll(".page").forEach((page) => { page.hidden = page.id !== id; });
    document.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-current", button.dataset.tab === id ? "page" : "false"));
  }
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => showTab(button.dataset.tab)));
  showTab("catalog");

  forms["login-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const form = event.currentTarget;
      const result = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ username: field(form, "username").value, password: field(form, "password").value }) });
      token = result.token;
      sessionStorage.setItem("luxe-admin-token", token);
      field(form, "password").value = "";
      showSignedIn(true);
      await refreshAll();
      message("Signed in.");
    });
  });
  logout.addEventListener("click", async () => {
    try {
      await api("/api/admin/logout", { method: "POST" });
      token = "";
      sessionStorage.removeItem("luxe-admin-token");
      catalog = undefined;
      showSignedIn(false);
      message("Signed out.");
    } catch (error) { message(error.message, true); }
  });

  async function refreshCatalog() {
    const result = await api("/api/catalog");
    catalog = result.data;
    version = result.version;
    renderPlan();
    renderDay();
    renderAddons();
  }
  async function saveCatalog(next) {
    const result = await api("/api/admin/catalog", { method: "PUT", body: JSON.stringify({ version, data: next }) });
    catalog = next;
    version = result.version;
    renderPlan();
    renderDay();
    renderAddons();
    message("Saved. Visitors see the changes after reloading.");
  }
  function renderPlan() {
    const form = forms["plan-form"];
    const key = field(form, "key").value;
    const plan = catalog.plans[key];
    field(form, "name").value = plan.type;
    field(form, "tagline").value = plan.tagline;
    field(form, "description").value = plan.description;
    field(form, "note").value = catalog.tiers[key].note;
    field(form, "benefits").value = plan.benefits.join(", ");
    field(form, "stamp").value = plan.stamp;
    ["breakfast", "lunch", "dinner"].forEach((name, index) => { field(form, name).value = plan.meals[index].price; });
  }
  document.querySelector("#plan-select").addEventListener("change", renderPlan);
  forms["plan-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const form = event.currentTarget;
      const next = structuredClone(catalog);
      const key = field(form, "key").value;
      const plan = next.plans[key];
      plan.type = field(form, "name").value.trim();
      plan.title = `${plan.type} Plan`;
      plan.tagline = field(form, "tagline").value.trim();
      plan.description = field(form, "description").value.trim();
      plan.benefits = field(form, "benefits").value.split(",").map((item) => item.trim()).filter(Boolean);
      plan.stamp = field(form, "stamp").value.trim();
      next.tiers[key].label = plan.type;
      next.tiers[key].note = field(form, "note").value.trim();
      ["breakfast", "lunch", "dinner"].forEach((name, index) => { plan.meals[index].price = Number(field(form, name).value); });
      plan.price = plan.meals.reduce((sum, meal) => sum + meal.price, 0) * 30;
      await saveCatalog(next);
    });
  });
  function renderDay() {
    const form = forms["menu-form"];
    const entry = catalog.weeklyMenu.find((item) => item.day === field(form, "day").value);
    ["breakfast", "lunch", "dinner"].forEach((name) => { field(form, name).value = entry[name].join(", "); });
    field(form, "premium").value = entry.premium;
    field(form, "eliteBreakfast").value = entry.elite.breakfast;
    field(form, "eliteLunch").value = entry.elite.lunch.join(", ");
    field(form, "eliteDinner").value = entry.elite.dinner;
  }
  document.querySelector("#day-select").addEventListener("change", renderDay);
  forms["menu-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const form = event.currentTarget;
      const next = structuredClone(catalog);
      const entry = next.weeklyMenu.find((item) => item.day === field(form, "day").value);
      const list = (name) => field(form, name).value.split(",").map((item) => item.trim()).filter(Boolean);
      ["breakfast", "lunch", "dinner"].forEach((name) => { entry[name] = list(name); });
      entry.premium = field(form, "premium").value.trim();
      entry.elite = { breakfast: field(form, "eliteBreakfast").value.trim(), lunch: list("eliteLunch"), dinner: field(form, "eliteDinner").value.trim() };
      await saveCatalog(next);
    });
  });
  function clearAddon() { forms["addon-form"].reset(); field(forms["addon-form"], "originalId").value = ""; }
  document.querySelector("#addon-clear").addEventListener("click", clearAddon);
  function renderAddons() {
    renderEmpty(document.querySelector("#addons-list"), catalog.addons.map((addon) => {
      const node = record([`${addon.icon} ${addon.name} · ${addon.size} · ${money(addon.price * 100)} · ${addon.category}`]);
      node.append(recordButton("Edit", () => {
        const form = forms["addon-form"];
        ["id", "name", "size", "category", "icon", "price"].forEach((name) => { field(form, name).value = addon[name]; });
        field(form, "originalId").value = addon.id;
        form.scrollIntoView({ behavior: "smooth" });
      }), recordButton("Remove", async () => {
        if (!confirm(`Remove ${addon.name}?`)) return;
        const next = structuredClone(catalog);
        next.addons = next.addons.filter((item) => item.id !== addon.id);
        await saveCatalog(next);
      }));
      return node;
    }));
  }
  forms["addon-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const form = event.currentTarget;
      const next = structuredClone(catalog);
      const item = Object.fromEntries(["id", "name", "size", "category", "icon"].map((name) => [name, field(form, name).value.trim()]));
      item.price = Number(field(form, "price").value);
      const original = field(form, "originalId").value;
      if (original) next.addons = next.addons.filter((addon) => addon.id !== original);
      next.addons.push(item);
      await saveCatalog(next);
      clearAddon();
    });
  });

  async function refreshOrders() {
    const orders = await api(`/api/admin/orders?offset=${offsets.orders}`);
    const root = document.querySelector("#orders-list");
    renderEmpty(root, orders.items.map((order) => {
      const node = record([
        `#${order.id} · ${order.plan_name} · ${money(order.amount_paise)} · ${order.status}`,
        `${order.customer_name} · ${order.phone} · ${order.email}`,
        `${order.address} · PIN ${order.pin} · Requested start: ${String(order.start_date).slice(0, 10)}`,
      ]);
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Status for order ${order.id}`);
      ["pending", "approved", "rejected", "completed", "cancelled"].forEach((status) => {
        const option = document.createElement("option");
        option.value = status; option.textContent = status; option.selected = status === order.status;
        select.append(option);
      });
      node.append(select, recordButton("Update status", async () => {
        await api(`/api/admin/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status: select.value }) });
        await refreshOrders();
        message("Order status updated.");
      }));
      renderPager(root, "orders", orders.hasMore, refreshOrders);
      return node;
    }));
  }
  async function refreshFinance() {
    const result = await api(`/api/admin/finance?offset=${offsets.finance}`);
    const sum = (kind) => Number(result.totals.find((item) => item.kind === kind)?.total_paise || 0);
    document.querySelector("#finance-totals").textContent = `Recorded income: ${money(sum("income"))} · Expenses: ${money(sum("expense"))} · Net: ${money(sum("income") - sum("expense"))}`;
    const root = document.querySelector("#finance-list");
    renderEmpty(root, result.entries.map((entry) => record([
      `${String(entry.entry_date).slice(0, 10)} · ${entry.kind} · ${entry.category} · ${money(entry.amount_paise)}`,
      `${entry.description}${entry.order_id ? ` · Order #${entry.order_id}` : ""}`,
    ])));
    renderPager(root, "finance", result.hasMore, refreshFinance);
  }
  forms["finance-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const f = event.currentTarget;
      await api("/api/admin/finance", { method: "POST", body: JSON.stringify({ entryDate: field(f, "entryDate").value, kind: field(f, "kind").value, category: field(f, "category").value, amountPaise: paise(field(f, "amount").value), description: field(f, "description").value, orderId: field(f, "orderId").value }) });
      f.reset(); offsets.finance = 0; await refreshFinance(); message("Finance entry saved.");
    });
  });
  function clearEmployee() { forms["employee-form"].reset(); field(forms["employee-form"], "id").value = ""; }
  document.querySelector("#employee-clear").addEventListener("click", clearEmployee);
  async function refreshEmployees() {
    employees = await api("/api/admin/employees");
    const select = document.querySelector("#record-employee");
    const selected = select.value;
    select.replaceChildren(...employees.map((employee) => {
      const option = document.createElement("option");
      option.value = employee.id; option.textContent = `${employee.name} (${employee.status})`;
      return option;
    }));
    if (employees.some((employee) => String(employee.id) === selected)) select.value = selected;
    renderEmpty(document.querySelector("#employee-list"), employees.map((employee) => {
      const node = record([`${employee.name} · ${employee.role} · ${employee.status}`, `${employee.phone || "No phone"} · Monthly salary ${money(employee.monthly_salary_paise)}`]);
      node.append(recordButton("Edit", () => {
        const f = forms["employee-form"];
        ["id", "name", "role", "phone", "status"].forEach((name) => { field(f, name).value = employee[name]; });
        field(f, "salary").value = (employee.monthly_salary_paise / 100).toFixed(2);
        f.scrollIntoView({ behavior: "smooth" });
      }));
      return node;
    }));
  }
  forms["employee-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const f = event.currentTarget;
      const id = field(f, "id").value;
      const data = { name: field(f, "name").value, role: field(f, "role").value, phone: field(f, "phone").value, monthlySalaryPaise: paise(field(f, "salary").value), status: field(f, "status").value };
      await api(`/api/admin/employees${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: JSON.stringify(data) });
      clearEmployee(); await refreshEmployees(); message("Employee saved.");
    });
  });
  document.querySelector("#record-kind").addEventListener("change", (event) => {
    const salary = event.target.value === "salary_payment";
    document.querySelector("#record-amount-label").hidden = !salary;
    field(forms["staff-record-form"], "amount").required = salary;
  });
  async function refreshEmployeeRecords() {
    const records = await api(`/api/admin/employee-records?offset=${offsets.staff}`);
    const root = document.querySelector("#staff-record-list");
    renderEmpty(root, records.items.map((entry) => record([
      `${String(entry.record_date).slice(0, 10)} · ${entry.employee_name} · ${entry.kind.replace("_", " ")}`,
      `${entry.details}${entry.amount_paise !== null ? ` · ${money(entry.amount_paise)}` : ""}`,
    ])));
    renderPager(root, "staff", records.hasMore, refreshEmployeeRecords);
  }
  forms["staff-record-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const f = event.currentTarget;
      const kind = field(f, "kind").value;
      await api("/api/admin/employee-records", { method: "POST", body: JSON.stringify({ employeeId: field(f, "employeeId").value, recordDate: field(f, "recordDate").value, kind, details: field(f, "details").value, amountPaise: kind === "salary_payment" ? paise(field(f, "amount").value) : null }) });
      f.reset(); document.querySelector("#record-amount-label").hidden = true; field(f, "amount").required = false;
      offsets.staff = 0; await refreshEmployeeRecords(); message("Employee record saved.");
    });
  });
  async function refreshAll() {
    await Promise.all([refreshCatalog(), refreshOrders(), refreshFinance(), refreshEmployees(), refreshEmployeeRecords()]);
  }
  if (token) {
    api("/api/admin/session").then(() => { showSignedIn(true); return refreshAll(); }).catch((error) => message(error.message, true));
  } else if (!base) {
    message("The API is not configured. Set LUNCHLUXE_API_URL in api-config.js.", true);
  }
})();
