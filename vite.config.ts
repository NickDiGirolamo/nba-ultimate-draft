import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const cardLabUrlAlias = () => ({
  name: "card-lab-url-alias",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? "";
      const [pathname, query = ""] = url.split("?");

      if (pathname === "/card-lab" || pathname === "/card-lab/") {
        res.statusCode = 302;
        res.setHeader("Location", `/card-lab.html${query ? `?${query}` : ""}`);
        res.end();
        return;
      }

      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? "";
      const [pathname, query = ""] = url.split("?");

      if (pathname === "/card-lab" || pathname === "/card-lab/") {
        res.statusCode = 302;
        res.setHeader("Location", `/card-lab.html${query ? `?${query}` : ""}`);
        res.end();
        return;
      }

      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), cardLabUrlAlias()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "card-lab": resolve(__dirname, "card-lab.html"),
      },
    },
  },
});
