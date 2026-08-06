import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/verify-link", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // Simulate browser request to avoid basic blocking
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        },
        timeout: 8000,
        validateStatus: (status) => true, // Don't throw on 4xx/5xx
      });

      if (response.status === 404) {
        return res.json({ status: "dead", reason: "Status 404" });
      }

      const html = response.data.toString();
      const errorStrings = [
        "Oops! Something went wrong",
        "Error Code: 404",
        "error - megaplay"
      ];

      for (const errStr of errorStrings) {
        if (html.includes(errStr)) {
          return res.json({ status: "dead", reason: `Found string: ${errStr}` });
        }
      }

      return res.json({ status: "alive" });
    } catch (error: any) {
      return res.json({ status: "dead", reason: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Use *all for Express v5 or * for Express v4. Wait, express 4 is installed.
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
