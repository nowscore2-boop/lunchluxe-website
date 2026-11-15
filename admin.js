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
  const offsets = { orders: 0, customers: 0, finance: 0, staff: 0 };
  let suppliers = [];
  let inventory = [];

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
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
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
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
    showTab(button.dataset.tab);
    const refresh = { overview: refreshOverview, orders: refreshOrders, customers: refreshCustomers }[button.dataset.tab];
    if (refresh) refresh().catch((error) => message(error.message, true));
  }));
  showTab("overview");

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
    const form = forms["order-search-form"];
    const params = new URLSearchParams({ offset: String(offsets.orders), q: field(form, "query").value, status: field(form, "status").value });
    const orders = await api(`/api/admin/orders?${params}`);
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
        await Promise.all([refreshOrders(), refreshOverview()]);
        message("Order status updated.");
      }));
      return node;
    }));
    renderPager(root, "orders", orders.hasMore, refreshOrders);
  }
  forms["order-search-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => { offsets.orders = 0; await refreshOrders(); });
  });
  async function refreshOverview() {
    const data = await api("/api/admin/overview");
    const metrics = [
      ["Pending requests", data.pending_orders],
      ["All requests", data.total_orders],
      ["Active employees", data.active_employees],
      ["Low-stock items", data.low_stock],
      ["Recorded income", money(data.income_paise)],
      ["Recorded expenses", money(data.expense_paise)],
    ];
    document.querySelector("#overview-cards").replaceChildren(...metrics.map(([label, value]) => {
      const card = document.createElement("article");
      card.className = "overview-card";
      const name = document.createElement("span");
      name.textContent = label;
      const number = document.createElement("strong");
      number.textContent = String(value);
      card.append(name, number);
      return card;
    }));
  }
  async function refreshCustomers() {
    const result = await api(`/api/admin/customers?offset=${offsets.customers}`);
    const root = document.querySelector("#customers-list");
    renderEmpty(root, result.items.map((customer) => record([
      `${customer.customer_name} · ${customer.order_count} request${customer.order_count === 1 ? "" : "s"}`,
      `${customer.phone} · ${customer.email}`,
      `${customer.address} · PIN ${customer.pin}`,
    ])));
    renderPager(root, "customers", result.hasMore, refreshCustomers);
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
      f.reset(); offsets.finance = 0; await Promise.all([refreshFinance(), refreshOverview()]); message("Finance entry saved.");
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
      clearEmployee(); await Promise.all([refreshEmployees(), refreshOverview()]); message("Employee saved.");
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
  function clearSupplier() { forms["supplier-form"].reset(); field(forms["supplier-form"], "id").value = ""; }
  document.querySelector("#supplier-clear").addEventListener("click", clearSupplier);
  async function refreshSuppliers() {
    suppliers = await api("/api/admin/suppliers");
    const select = document.querySelector("#inventory-supplier");
    const selected = select.value;
    const empty = document.createElement("option");
    empty.value = ""; empty.textContent = "No supplier";
    select.replaceChildren(empty, ...suppliers.map((supplier) => {
      const option = document.createElement("option");
      option.value = supplier.id; option.textContent = `${supplier.name} (#${supplier.id})`;
      return option;
    }));
    if (suppliers.some((supplier) => String(supplier.id) === selected)) select.value = selected;
    renderEmpty(document.querySelector("#suppliers-list"), suppliers.map((supplier) => {
      const node = record([`${supplier.name} · ID #${supplier.id}`, [supplier.phone, supplier.email, supplier.notes].filter(Boolean).join(" · ") || "No contact details"]);
      node.append(recordButton("Edit", () => {
        const form = forms["supplier-form"];
        ["id", "name", "phone", "email", "notes"].forEach((name) => { field(form, name).value = supplier[name]; });
        form.scrollIntoView({ behavior: "smooth" });
      }));
      return node;
    }));
  }
  forms["supplier-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const form = event.currentTarget;
      const id = field(form, "id").value;
      const data = Object.fromEntries(["name", "phone", "email", "notes"].map((name) => [name, field(form, name).value]));
      await api(`/api/admin/suppliers${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: JSON.stringify(data) });
      clearSupplier(); await Promise.all([refreshSuppliers(), refreshInventory()]); message("Supplier saved.");
    });
  });
  function clearInventory() { forms["inventory-form"].reset(); field(forms["inventory-form"], "code").readOnly = false; }
  document.querySelector("#inventory-clear").addEventListener("click", clearInventory);
  async function refreshInventory() {
    inventory = await api("/api/admin/inventory");
    renderEmpty(document.querySelector("#inventory-list"), inventory.map((item) => {
      const low = Number(item.quantity) <= Number(item.reorder_level);
      const node = record([
        `${item.name} · ${item.code}${low ? " · LOW STOCK" : ""}`,
        `${item.quantity} ${item.unit} · Low-stock threshold ${item.reorder_level} ${item.unit}`,
        item.supplier_name ? `Supplier: ${item.supplier_name} (#${item.supplier_id})` : "No supplier assigned",
      ]);
      if (low) node.classList.add("low-stock");
      node.append(recordButton("Edit", () => {
        const form = forms["inventory-form"];
        ["code", "name", "unit", "quantity"].forEach((name) => { field(form, name).value = item[name]; });
        field(form, "reorderLevel").value = item.reorder_level;
        field(form, "supplierId").value = item.supplier_id || "";
        field(form, "code").readOnly = true;
        form.scrollIntoView({ behavior: "smooth" });
      }));
      return node;
    }));
  }
  forms["inventory-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const form = event.currentTarget;
      const code = field(form, "code").value.trim().toUpperCase();
      if (!field(form, "code").readOnly && inventory.some((item) => item.code === code) && !confirm(`Update existing item ${code}?`)) return;
      const data = Object.fromEntries(["name", "unit", "quantity", "reorderLevel", "supplierId"].map((name) => [name, field(form, name).value]));
      await api(`/api/admin/inventory/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) });
      clearInventory(); await Promise.all([refreshInventory(), refreshOverview()]); message("Stock item saved.");
    });
  });
  document.querySelector("#inventory-export").addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
      const response = await fetch(`${base}/api/admin/inventory.xlsx`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Export failed (${response.status}).`);
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = "lunchluxe-inventory.xlsx"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message("Inventory workbook downloaded.");
    } catch (error) { message(error.message, true); } finally { event.currentTarget.disabled = false; }
  });
  forms["inventory-import-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.currentTarget, async () => {
      const form = event.currentTarget;
      const file = field(form, "workbook").files[0];
      if (!file || !file.name.toLowerCase().endsWith(".xlsx") || file.size > 2 * 1024 * 1024) throw new Error("Choose an .xlsx file smaller than 2 MB.");
      if (!confirm("Import this workbook? Matching item codes will be overwritten.")) return;
      const result = await api("/api/admin/inventory/import", { method: "POST", headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, body: file });
      form.reset(); await Promise.all([refreshInventory(), refreshOverview()]); message(`Imported ${result.imported} inventory item(s).`);
    });
  });
  async function refreshAll() {
    await Promise.all([refreshCatalog(), refreshOrders(), refreshFinance(), refreshEmployees(), refreshEmployeeRecords(), refreshOverview(), refreshCustomers(), refreshSuppliers(), refreshInventory()]);
  }
  if (token) {
    api("/api/admin/session").then(() => { showSignedIn(true); return refreshAll(); }).catch((error) => message(error.message, true));
  } else if (!base) {
    message("The API is not configured. Set LUNCHLUXE_API_URL in api-config.js.", true);
  }
})();
