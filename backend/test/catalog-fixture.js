import { readFile } from "node:fs/promises";
import vm from "node:vm";

export async function initialCatalog() {
  const menuSource = await readFile(new URL("../../menu.js", import.meta.url), "utf8");
  const planSource = await readFile(new URL("../../plan-page.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(menuSource, context);
  const source = planSource.slice(planSource.indexOf("const planCatalog"), planSource.indexOf("const currentCatalog"));
  const plans = vm.runInNewContext(`${source}\nplanCatalog`, {});
  const { tiers, weeklyMenu, addons } = context.window.LunchLuxeMenu;
  return JSON.parse(JSON.stringify({ plans, tiers, weeklyMenu, addons }));
}
