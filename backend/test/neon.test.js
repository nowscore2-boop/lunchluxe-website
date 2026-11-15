import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { createApp } from "../app.js";
import { initialCatalog } from "./catalog-fixture.js";

test("API isolates private records and saves catalog, orders, finance and employee records", { skip: !process.env.LUXE_TEST_DATABASE_URL }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.LUXE_TEST_DATABASE_URL });
  const client = await pool.connect();
  const schema = `luxe_test_${randomBytes(8).toString("hex")}`;
  let server;
  try {
    await client.query("BEGIN");
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET LOCAL search_path TO ${schema}`);
    await client.query(await readFile(new URL("../schema.sql", import.meta.url), "utf8"));
    await client.query("INSERT INTO luxe_catalog (id, data) VALUES (1, $1)", [JSON.stringify(await initialCatalog())]);
    const salt = randomBytes(16).toString("hex");
    const password = "test password only";
    const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
    const app = createApp(client, { adminUsername: "test-admin", adminPasswordHash: hash, publicOrigin: "http://localhost" });
    server = await new Promise((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    let token = "";
    async function request(path, method = "GET", data, authenticated = true) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { ...(data ? { "Content-Type": "application/json" } : {}), ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}) },
        body: data ? JSON.stringify(data) : undefined,
      });
      return { status: response.status, data: response.status === 204 ? null : await response.json() };
    }

    assert.equal((await request("/api/admin/orders")).status, 401);
    assert.equal((await request("/api/admin/login", "POST", { username: "test-admin", password: "wrong" })).status, 401);
    const login = await request("/api/admin/login", "POST", { username: "test-admin", password });
    assert.equal(login.status, 200);
    token = login.data.token;
    const catalog = await request("/api/catalog");
    assert.equal(catalog.status, 200);
    const updated = structuredClone(catalog.data.data);
    updated.plans.regular.meals[0].price = 60;
    updated.plans.regular.price = 6600;
    updated.weeklyMenu[0].breakfast[0] = "Test dish";
    updated.addons[0].price = 30;
    assert.equal((await request("/api/admin/catalog", "PUT", { version: catalog.data.version, data: updated })).status, 200);
    assert.equal((await request("/api/admin/catalog", "PUT", { version: catalog.data.version, data: updated })).status, 409);
    const refreshedCatalog = await request("/api/catalog");
    assert.equal(refreshedCatalog.data.data.weeklyMenu[0].breakfast[0], "Test dish");
    assert.equal(refreshedCatalog.data.data.addons[0].price, 30);

    const order = { customerName: "Test customer", phone: "9999999999", email: "test@example.com", address: "Test address", pin: "751001", startDate: "2030-01-01", plan: "regular", catalogVersion: 1 };
    assert.equal((await request("/api/orders", "POST", order, false)).status, 409);
    order.catalogVersion = 2;
    const created = await request("/api/orders", "POST", order, false);
    assert.equal(created.status, 201);
    const orders = await request("/api/admin/orders");
    assert.equal(orders.data.items[0].amount_paise, 660000);
    assert.equal(orders.data.items[0].status, "pending");
    assert.equal(orders.data.items[0].start_date, "2030-01-01");
    await client.query(
      `INSERT INTO luxe_orders (customer_name, phone, email, address, pin, start_date, plan_key, plan_name, amount_paise)
       SELECT 'Page test', '9999999999', 'test@example.com', 'Test address', '751001', '2030-01-01', 'regular', 'Regular Plan', 630000 FROM generate_series(1, 50)`,
    );
    const firstPage = await request("/api/admin/orders?offset=0");
    const secondPage = await request("/api/admin/orders?offset=50");
    assert.equal(firstPage.data.items.length, 50);
    assert.equal(firstPage.data.hasMore, true);
    assert.equal(secondPage.data.items.length, 1);
    assert.equal(secondPage.data.hasMore, false);
    assert.equal((await request(`/api/admin/orders/${created.data.id}`, "PATCH", { status: "approved" })).status, 200);
    assert.equal((await request("/api/admin/finance", "POST", { entryDate: "2030-01-01", kind: "income", category: "Plan", amountPaise: 660000, description: "", orderId: created.data.id })).status, 201);
    const finance = await request("/api/admin/finance");
    assert.equal(finance.data.totals[0].total_paise, "660000");
    assert.equal(finance.data.entries[0].entry_date, "2030-01-01");
    const employee = await request("/api/admin/employees", "POST", { name: "Test employee", role: "Cook", phone: "", monthlySalaryPaise: 1000000, status: "active" });
    assert.equal(employee.status, 201);
    assert.equal((await request("/api/admin/employee-records", "POST", { employeeId: employee.data.id, recordDate: "2030-01-01", kind: "salary_payment", details: "January", amountPaise: 1000000 })).status, 201);
    const records = await request("/api/admin/employee-records");
    assert.equal(records.data.items[0].employee_name, "Test employee");
    assert.equal(records.data.items[0].record_date, "2030-01-01");
    assert.equal((await request("/api/admin/logout", "POST")).status, 204);
    assert.equal((await request("/api/admin/employees")).status, 401);
  } finally {
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
