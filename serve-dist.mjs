import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const port = 4173;
const root = join(process.cwd(), "dist");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const sendFile = (res, filePath) => {
  const type = contentTypes[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
};

createServer((req, res) => {
  const pathname = req.url?.split("?")[0] ?? "/";
  const relativePath =
    pathname === "/"
      ? "/index.html"
      : pathname === "/card-lab" || pathname === "/card-lab/"
        ? "/card-lab.html"
        : pathname;
  const filePath = normalize(join(root, relativePath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  sendFile(res, join(root, "index.html"));
}).listen(port, "127.0.0.1", () => {
  console.log(`Static server ready at http://127.0.0.1:${port}`);
});
