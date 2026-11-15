const planKeys = ["regular", "premium", "elite"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export class InputError extends Error {}

export function text(value, label, max = 200, required = true) {
  if (typeof value !== "string") throw new InputError(`${label} must be text.`);
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new InputError(`${label} must be ${required ? "1" : "0"}-${max} characters.`);
  return result;
}

export function integer(value, label, min = 0, max = 100000000) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new InputError(`${label} must be an integer between ${min} and ${max}.`);
  return value;
}

export function date(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InputError(`${label} must be a date.`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) throw new InputError(`${label} must be a valid date.`);
  return value;
}

export function choice(value, label, choices) {
  if (!choices.includes(value)) throw new InputError(`Invalid ${label}.`);
  return value;
}

function stringList(value, label, maxItems = 12) {
  if (!Array.isArray(value) || !value.length || value.length > maxItems) throw new InputError(`${label} must have 1-${maxItems} items.`);
  value.forEach((item) => text(item, label, 120));
}

export function validateCatalog(data) {
  if (!data || typeof data !== "object" || !data.plans || !data.tiers || !Array.isArray(data.weeklyMenu) || !Array.isArray(data.addons)) {
    throw new InputError("Invalid catalog.");
  }
  for (const key of planKeys) {
    const plan = data.plans[key];
    const tier = data.tiers[key];
    if (!plan || !tier || !Array.isArray(plan.meals) || plan.meals.length !== 3) throw new InputError(`Invalid ${key} plan.`);
    for (const field of ["title", "type", "highlight", "tagline", "description"]) text(plan[field], `${key} ${field}`, 300);
    text(plan.stamp, `${key} stamp`, 300, false);
    if (plan.accent !== key) throw new InputError(`Invalid ${key} accent.`);
    integer(plan.price, `${key} monthly price`, 1, 1000000);
    stringList(plan.benefits, `${key} benefits`);
    ["Breakfast", "Lunch", "Dinner"].forEach((mealName, index) => {
      const meal = plan.meals[index];
      if (!meal || meal.name !== mealName) throw new InputError(`Invalid ${key} meal.`);
      integer(meal.price, `${key} ${mealName} price`, 0, 100000);
      text(meal.image, "Meal image URL", 500);
      if (!/^https:\/\//.test(meal.image)) throw new InputError("Meal image URL must use HTTPS.");
      text(meal.alt, "Meal image description", 300);
      stringList(meal.bullets, "Meal details");
    });
    if (plan.price !== 30 * plan.meals.reduce((sum, meal) => sum + meal.price, 0)) throw new InputError(`${key} monthly price must equal 30 times its daily meal prices.`);
    text(tier.label, "Tier label", 80);
    text(tier.note, "Tier description", 300);
  }
  if (data.weeklyMenu.length !== 7) throw new InputError("The weekly menu must contain seven days.");
  data.weeklyMenu.forEach((entry, index) => {
    if (!entry || entry.day !== days[index] || !entry.elite) throw new InputError("The weekly menu days must be Monday to Sunday.");
    ["breakfast", "lunch", "dinner"].forEach((meal) => stringList(entry[meal], `${entry.day} ${meal}`));
    text(entry.premium, `${entry.day} premium`, 120);
    text(entry.elite.breakfast, `${entry.day} elite breakfast`, 120);
    stringList(entry.elite.lunch, `${entry.day} elite lunch`);
    text(entry.elite.dinner, `${entry.day} elite dinner`, 120);
  });
  if (data.addons.length > 100) throw new InputError("At most 100 add-ons are allowed.");
  const ids = new Set();
  data.addons.forEach((addon) => {
    const id = text(addon.id, "Add-on ID", 50);
    if (!/^[a-z0-9-]+$/.test(id) || ids.has(id)) throw new InputError("Add-on IDs must be unique lowercase letters, numbers or hyphens.");
    ids.add(id);
    ["name", "size", "category", "icon"].forEach((key) => text(addon[key], `Add-on ${key}`, 100));
    integer(addon.price, "Add-on price", 0, 100000);
  });
  return data;
}
