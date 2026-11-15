import "dotenv/config";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const menuSource = await readFile(new URL("../menu.js", import.meta.url), "utf8");
const planSource = await readFile(new URL("../plan-page.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(menuSource, context);
const catalogSource = planSource.slice(planSource.indexOf("const planCatalog"), planSource.indexOf("const currentCatalog"));
if (!catalogSource) throw new Error("Could not locate the existing plan catalog.");
const plans = vm.runInNewContext(`${catalogSource}\nplanCatalog`, {});
const { weeklyMenu, addons, tiers } = context.window.LunchLuxeMenu;
const catalog = { plans, weeklyMenu, addons, tiers };

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
  await client.query("INSERT INTO luxe_catalog (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING", [JSON.stringify(catalog)]);
  await client.query("COMMIT");
  console.log("LunchLuxe tables and initial catalog are ready.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
