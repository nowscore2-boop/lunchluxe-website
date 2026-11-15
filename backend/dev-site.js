import express from "express";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const app = express();
app.disable("x-powered-by");
app.get(["/admin", "/admin/"], (_req, res) => res.sendFile(join(root, "admin/index.html")));
app.use("/assets", express.static(join(root, "assets"), { dotfiles: "deny", index: false }));
app.get("/", (_req, res) => res.sendFile(join(root, "index.html")));
app.get("/:file", (req, res, next) => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:html|css|js|txt|xml)$/.test(req.params.file)) return next();
  res.sendFile(join(root, req.params.file));
});
app.listen(8000, "127.0.0.1", () => console.log("LunchLuxe website listening on http://localhost:8000"));
