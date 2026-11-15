(() => {
  const base = (window.LUNCHLUXE_API_URL || "").replace(/\/$/, "");
  window.LuxeCatalogReady = (async () => {
    if (!base) return null;
    try {
      const response = await fetch(`${base}/api/catalog`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
      const result = await response.json();
      const data = result.data;
      if (!Number.isSafeInteger(result.version) || !data || !data.plans || !data.tiers || !Array.isArray(data.weeklyMenu) || !Array.isArray(data.addons)) throw new Error("The catalog response is invalid.");
      window.LuxeCatalogVersion = result.version;
      const menu = window.LunchLuxeMenu;
      if (menu) {
        Object.assign(menu.tiers, data.tiers);
        menu.weeklyMenu.splice(0, menu.weeklyMenu.length, ...data.weeklyMenu);
        menu.addons.splice(0, menu.addons.length, ...data.addons);
      }
      return data;
    } catch (error) {
      console.error("Could not load the current LunchLuxe catalog:", error);
      const warning = document.createElement("p");
      warning.setAttribute("role", "alert");
      warning.style.cssText = "margin:0;padding:12px;background:#fff0d4;color:#5a3100;text-align:center";
      warning.textContent = "Current menu and prices are temporarily unavailable. The information shown may be outdated; please confirm with our team.";
      document.body.prepend(warning);
      return null;
    }
  })();
})();
