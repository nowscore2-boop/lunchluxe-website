import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";

if (!process.stdin.isTTY) throw new Error("Run this command in an interactive terminal.");
const mutedOutput = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
const terminal = createInterface({ input: process.stdin, output: mutedOutput, terminal: true });
process.stderr.write("Admin password (input hidden): ");
terminal.question("", (password) => {
  terminal.close();
  process.stderr.write("\n");
  if (password.length < 14) {
    console.error("Use a password of at least 14 characters.");
    process.exitCode = 1;
    return;
  }
  const salt = randomBytes(16).toString("hex");
  console.log(`scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`);
});
