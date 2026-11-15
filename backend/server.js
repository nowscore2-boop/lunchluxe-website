import "dotenv/config";
import pg from "pg";
import { createApp } from "./app.js";

const { DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD_HASH, PUBLIC_ORIGIN, PORT = "3000" } = process.env;
if (!DATABASE_URL || !ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !PUBLIC_ORIGIN) {
  throw new Error("DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD_HASH and PUBLIC_ORIGIN are required.");
}
if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(ADMIN_PASSWORD_HASH)) throw new Error("ADMIN_PASSWORD_HASH is invalid.");
const pool = new pg.Pool({ connectionString: DATABASE_URL });
const catalog = await pool.query("SELECT 1 FROM luxe_catalog WHERE id = 1");
if (!catalog.rowCount) throw new Error("Catalog is not initialized. Run the migration.");
createApp(pool, { adminUsername: ADMIN_USERNAME, adminPasswordHash: ADMIN_PASSWORD_HASH, publicOrigin: PUBLIC_ORIGIN })
  .listen(Number(PORT), () => console.log(`LunchLuxe API listening on port ${PORT}`));
