import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { InputError, choice, date, integer, text, validateCatalog } from "./validation.js";

const scrypt = promisify(scryptCallback);
const digest = (token) => createHash("sha256").update(token).digest("hex");
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export async function verifyPassword(password, hash) {
  const [algorithm, salt, encoded, extra] = hash.split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt || "") || !/^[a-f0-9]{128}$/.test(encoded || "") || extra !== undefined) return false;
  const derived = await scrypt(password, salt, 64);
  return timingSafeEqual(derived, Buffer.from(encoded, "hex"));
}

export function createApp(pool, config) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: config.publicOrigin }));
  app.use(express.json({ limit: "256kb" }));
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false });
  const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: "draft-7", legacyHeaders: false });

  app.get("/api/health", asyncRoute(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  }));
  app.get("/api/catalog", asyncRoute(async (_req, res) => {
    const { rows } = await pool.query("SELECT version, data FROM luxe_catalog WHERE id = 1");
    if (!rows[0]) throw new Error("Catalog is not initialized. Run the migration.");
    res.set("Cache-Control", "no-store").json(rows[0]);
  }));

  app.post("/api/orders", orderLimiter, asyncRoute(async (req, res) => {
    const body = req.body || {};
    const customer = text(body.customerName, "Name", 120);
    const phone = text(body.phone, "Phone", 20);
    const email = text(body.email, "Email", 254);
    const address = text(body.address, "Address", 500);
    const pin = text(body.pin, "PIN code", 6);
    if (!/^[0-9+() -]{10,20}$/.test(phone)) throw new InputError("Enter a valid phone number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("Enter a valid email address.");
    if (!/^\d{6}$/.test(pin)) throw new InputError("PIN code must contain six digits.");
    const start = date(body.startDate, "Requested start date");
    const key = choice(body.plan, "plan", ["regular", "premium", "elite"]);
    const version = integer(body.catalogVersion, "Catalog version", 1, 2147483647);
    const result = await pool.query(
      `INSERT INTO luxe_orders (customer_name, phone, email, address, pin, start_date, plan_key, plan_name, amount_paise)
       SELECT $1,$2,$3,$4,$5,$6,$7, data->'plans'->$7->>'title',
         ((data->'plans'->$7->>'price')::integer * 100)
       FROM luxe_catalog WHERE id = 1 AND version = $8 RETURNING id, status`,
      [customer, phone, email, address, pin, start, key, version],
    );
    if (!result.rowCount) return res.status(409).json({ error: "Plan details have changed. Reload this page and review the current price before requesting." });
    res.status(201).json({ id: String(result.rows[0].id), status: result.rows[0].status });
  }));

  app.post("/api/admin/login", loginLimiter, asyncRoute(async (req, res) => {
    const username = typeof req.body?.username === "string" ? req.body.username : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (username.length > 200 || password.length > 1024 || username !== config.adminUsername || !(await verifyPassword(password, config.adminPasswordHash))) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const token = randomBytes(32).toString("base64url");
    await pool.query("INSERT INTO luxe_admin_sessions (token_hash, expires_at) VALUES ($1, now() + interval '8 hours')", [digest(token)]);
    res.set("Cache-Control", "no-store").json({ token });
  }));

  app.use("/api/admin", asyncRoute(async (req, res, next) => {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get("authorization") || "");
    if (!match) return res.status(401).json({ error: "Please sign in." });
    const result = await pool.query("SELECT 1 FROM luxe_admin_sessions WHERE token_hash = $1 AND expires_at > now()", [digest(match[1])]);
    if (!result.rowCount) return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    req.sessionToken = match[1];
    res.set("Cache-Control", "no-store");
    next();
  }));

  app.post("/api/admin/logout", asyncRoute(async (req, res) => {
    await pool.query("DELETE FROM luxe_admin_sessions WHERE token_hash = $1", [digest(req.sessionToken)]);
    res.status(204).end();
  }));
  app.get("/api/admin/session", (_req, res) => res.json({ ok: true }));
  app.put("/api/admin/catalog", asyncRoute(async (req, res) => {
    const version = integer(req.body?.version, "Catalog version", 1, 2147483647);
    const data = validateCatalog(req.body?.data);
    const result = await pool.query(
      "UPDATE luxe_catalog SET data = $1, version = version + 1, updated_at = now() WHERE id = 1 AND version = $2 RETURNING version",
      [JSON.stringify(data), version],
    );
    if (!result.rowCount) return res.status(409).json({ error: "Catalog changed elsewhere. Reload before saving." });
    res.json(result.rows[0]);
  }));
  app.get("/api/admin/orders", asyncRoute(async (_req, res) => {
    const offset = integer(Number(_req.query.offset ?? 0), "Offset", 0, 10000000);
    const result = await pool.query("SELECT o.*, o.start_date::text AS start_date FROM luxe_orders o ORDER BY o.id DESC LIMIT 51 OFFSET $1", [offset]);
    res.json({ items: result.rows.slice(0, 50), hasMore: result.rows.length > 50 });
  }));
  app.patch("/api/admin/orders/:id", asyncRoute(async (req, res) => {
    const id = integer(Number(req.params.id), "Order ID", 1, Number.MAX_SAFE_INTEGER);
    const status = choice(req.body?.status, "order status", ["pending", "approved", "rejected", "completed", "cancelled"]);
    const result = await pool.query("UPDATE luxe_orders SET status = $1 WHERE id = $2 RETURNING id, status", [status, id]);
    if (!result.rowCount) return res.status(404).json({ error: "Order not found." });
    res.json(result.rows[0]);
  }));
  app.get("/api/admin/finance", asyncRoute(async (req, res) => {
    const offset = integer(Number(req.query.offset ?? 0), "Offset", 0, 10000000);
    const [entries, totals] = await Promise.all([
      pool.query("SELECT f.*, f.entry_date::text AS entry_date FROM luxe_finance f ORDER BY f.entry_date DESC, f.id DESC LIMIT 51 OFFSET $1", [offset]),
      pool.query("SELECT kind, COALESCE(SUM(amount_paise), 0)::text AS total_paise FROM luxe_finance GROUP BY kind"),
    ]);
    res.json({ entries: entries.rows.slice(0, 50), hasMore: entries.rows.length > 50, totals: totals.rows });
  }));
  app.post("/api/admin/finance", asyncRoute(async (req, res) => {
    const b = req.body || {};
    const result = await pool.query(
      `INSERT INTO luxe_finance (entry_date, kind, category, amount_paise, description, order_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [date(b.entryDate, "Date"), choice(b.kind, "entry type", ["income", "expense"]), text(b.category, "Category", 100), integer(b.amountPaise, "Amount", 1), text(b.description || "", "Description", 500, false), b.orderId ? integer(Number(b.orderId), "Order ID", 1, Number.MAX_SAFE_INTEGER) : null],
    );
    res.status(201).json(result.rows[0]);
  }));
  app.get("/api/admin/employees", asyncRoute(async (_req, res) => {
    const result = await pool.query("SELECT * FROM luxe_employees ORDER BY id DESC");
    res.json(result.rows);
  }));
  app.post("/api/admin/employees", asyncRoute(async (req, res) => {
    const b = req.body || {};
    const result = await pool.query(
      "INSERT INTO luxe_employees (name, role, phone, monthly_salary_paise, status) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [text(b.name, "Name", 120), text(b.role, "Role", 120), text(b.phone || "", "Phone", 20, false), integer(b.monthlySalaryPaise, "Monthly salary", 0), choice(b.status, "employee status", ["active", "inactive"])],
    );
    res.status(201).json(result.rows[0]);
  }));
  app.patch("/api/admin/employees/:id", asyncRoute(async (req, res) => {
    const id = integer(Number(req.params.id), "Employee ID", 1, Number.MAX_SAFE_INTEGER);
    const b = req.body || {};
    const result = await pool.query(
      "UPDATE luxe_employees SET name=$1, role=$2, phone=$3, monthly_salary_paise=$4, status=$5 WHERE id=$6 RETURNING id",
      [text(b.name, "Name", 120), text(b.role, "Role", 120), text(b.phone || "", "Phone", 20, false), integer(b.monthlySalaryPaise, "Monthly salary", 0), choice(b.status, "employee status", ["active", "inactive"]), id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Employee not found." });
    res.json(result.rows[0]);
  }));
  app.get("/api/admin/employee-records", asyncRoute(async (req, res) => {
    const offset = integer(Number(req.query.offset ?? 0), "Offset", 0, 10000000);
    const result = await pool.query("SELECT r.*, r.record_date::text AS record_date, e.name AS employee_name FROM luxe_employee_records r JOIN luxe_employees e ON e.id = r.employee_id ORDER BY r.record_date DESC, r.id DESC LIMIT 51 OFFSET $1", [offset]);
    res.json({ items: result.rows.slice(0, 50), hasMore: result.rows.length > 50 });
  }));
  app.post("/api/admin/employee-records", asyncRoute(async (req, res) => {
    const b = req.body || {};
    const kind = choice(b.kind, "record type", ["attendance", "leave", "shift", "salary_payment"]);
    const amount = kind === "salary_payment" ? integer(b.amountPaise, "Salary payment", 1) : null;
    const result = await pool.query(
      "INSERT INTO luxe_employee_records (employee_id, record_date, kind, details, amount_paise) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [integer(Number(b.employeeId), "Employee", 1, Number.MAX_SAFE_INTEGER), date(b.recordDate, "Date"), kind, text(b.details, "Details", 500), amount],
    );
    res.status(201).json(result.rows[0]);
  }));
  app.use((error, _req, res, _next) => {
    if (error instanceof InputError) return res.status(400).json({ error: error.message });
    if (error.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
    if (error.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
    if (error.code === "23503") return res.status(400).json({ error: "The referenced record does not exist." });
    console.error("LunchLuxe API error:", error);
    res.status(500).json({ error: "The request failed. Please try again or contact the administrator." });
  });
  return app;
}
