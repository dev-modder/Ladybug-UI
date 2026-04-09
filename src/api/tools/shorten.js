import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/tools/shorten", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query
      if (!url) {
        return res.status(400).json({ status: false, error: "url parameter is required" })
      }

      try { new URL(url) } catch {
        return res.status(400).json({ status: false, error: "Invalid URL provided" })
      }

      const response = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        { timeout: 10000 }
      )

      res.status(200).json({
        status: true,
        original: url,
        shortened: response.data,
        provider: "TinyURL",
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
