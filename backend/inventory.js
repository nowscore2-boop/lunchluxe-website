import ExcelJS from "exceljs";
import unzipper from "unzipper";
import { Readable } from "node:stream";
import { InputError, text } from "./validation.js";

export const columns = ["Item code", "Item name", "Unit", "Quantity", "Reorder level", "Supplier ID"];
const MAX_ROWS = 1000;

function quantity(value, label) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d{1,9}(\.\d{1,3})?$/.test(raw)) throw new InputError(`${label} must be a non-negative number with at most 3 decimal places.`);
  return raw;
}

export function inventoryItem(value) {
  const code = text(value.code, "Item code", 50).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(code)) throw new InputError("Item code may contain letters, numbers, underscores and hyphens.");
  const supplier = value.supplierId === null || value.supplierId === "" || value.supplierId === undefined ? null : String(value.supplierId);
  if (supplier !== null && !/^[1-9]\d{0,14}$/.test(supplier)) throw new InputError("Supplier ID must be a positive whole number.");
  return { code, name: text(value.name, "Item name", 120), unit: text(value.unit, "Unit", 30), quantity: quantity(value.quantity, "Quantity"), reorderLevel: quantity(value.reorderLevel, "Reorder level"), supplierId: supplier };
}

async function checkZip(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer.length > 2 * 1024 * 1024) throw new InputError("Choose an Excel .xlsx file smaller than 2 MB.");
  let bytes = 0;
  let count = 0;
  const names = new Set();
  try {
    const stream = Readable.from([buffer]).pipe(unzipper.Parse({ forceStream: true }));
    for await (const entry of stream) {
      count += 1;
      if (count > 200 || names.has(entry.path) || entry.path.includes("..") || entry.path.startsWith("/")) throw new InputError("Invalid Excel workbook contents.");
      names.add(entry.path);
      for await (const chunk of entry) {
        bytes += chunk.length;
        if (bytes > 20 * 1024 * 1024) throw new InputError("The Excel workbook is too large when expanded.");
      }
    }
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError("Could not read the Excel workbook. Use an .xlsx file.");
  }
  if (!names.has("[Content_Types].xml") || !names.has("xl/workbook.xml")) throw new InputError("Choose a valid .xlsx workbook.");
}

export async function readWorkbook(buffer) {
  await checkZip(buffer);
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer); } catch { throw new InputError("Could not read the Excel workbook. Use an .xlsx file."); }
  const sheet = workbook.getWorksheet("Inventory");
  if (!sheet) throw new InputError('The workbook must contain an "Inventory" sheet. Download the template first.');
  if (sheet.rowCount > MAX_ROWS + 1 || sheet.columnCount > columns.length) throw new InputError(`The workbook may contain at most ${MAX_ROWS} items and ${columns.length} columns.`);
  if (columns.some((name, index) => sheet.getRow(1).getCell(index + 1).value !== name)) throw new InputError("The workbook columns do not match the template.");
  const items = [];
  const codes = new Set();
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (!row.hasValues) continue;
    const values = columns.map((_, index) => row.getCell(index + 1).value);
    if (values.every((value) => value === null)) continue;
    try {
      const item = inventoryItem({ code: values[0], name: values[1], unit: values[2], quantity: values[3], reorderLevel: values[4], supplierId: values[5] });
      if (codes.has(item.code)) throw new InputError(`Duplicate item code ${item.code}.`);
      codes.add(item.code);
      items.push(item);
    } catch (error) {
      if (error instanceof InputError) throw new InputError(`Row ${rowNumber}: ${error.message}`);
      throw error;
    }
  }
  if (!items.length) throw new InputError("The workbook has no inventory items.");
  return items;
}

export async function writeWorkbook(items) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventory");
  sheet.addRow(columns);
  sheet.getRow(1).font = { bold: true };
  for (const item of items) {
    sheet.addRow([item.code, item.name, item.unit, Number(item.quantity), Number(item.reorder_level), item.supplier_id ? String(item.supplier_id) : ""]);
  }
  sheet.columns.forEach((column) => { column.width = 22; });
  return workbook.xlsx.writeBuffer();
}
