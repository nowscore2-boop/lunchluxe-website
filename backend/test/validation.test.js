import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { verifyPassword } from "../app.js";
import { date, InputError, validateCatalog } from "../validation.js";
import { initialCatalog } from "./catalog-fixture.js";

test("server can be loaded by CommonJS hosts without top-level await", { skip: !process.features.require_module }, () => {
  const server = fileURLToPath(new URL("../server.js", import.meta.url));
  const result = spawnSync(process.execPath, ["-e", "require(process.argv[1])", server], {
    env: { ...process.env, DATABASE_URL: "", ADMIN_USERNAME: "", ADMIN_PASSWORD_HASH: "", PUBLIC_ORIGIN: "" },
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD_HASH and PUBLIC_ORIGIN are required/);
});

test("existing catalog is valid and rejects inconsistent prices and duplicate add-ons", async () => {
  const catalog = await initialCatalog();
  assert.equal(validateCatalog(catalog), catalog);
  const invalidPrice = structuredClone(catalog);
  invalidPrice.plans.regular.price += 1;
  assert.throws(() => validateCatalog(invalidPrice), /monthly price/);
  const duplicate = structuredClone(catalog);
  duplicate.addons.push(duplicate.addons[0]);
  assert.throws(() => validateCatalog(duplicate), /unique/);
  const invalidDay = structuredClone(catalog);
  invalidDay.weeklyMenu.pop();
  assert.throws(() => validateCatalog(invalidDay), /seven days/);
});

test("date validation rejects impossible dates", () => {
  assert.equal(date("2028-02-29", "Date"), "2028-02-29");
  assert.throws(() => date("2027-02-29", "Date"), InputError);
});

test("admin passwords use salted scrypt", async () => {
  const salt = randomBytes(16).toString("hex");
  const hash = `scrypt$${salt}$${scryptSync("long secure password", salt, 64).toString("hex")}`;
  assert.equal(await verifyPassword("long secure password", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(await verifyPassword("anything", "invalid"), false);
});
