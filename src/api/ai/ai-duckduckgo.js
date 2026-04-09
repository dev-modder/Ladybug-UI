import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/ai/duckduckgo", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, model } = req.query
      if (!text) {
        return res.status(400).json({ status: false, error: "text parameter is required" })
      }

      const selectedModel = model || "gpt-4o-mini"

      const tokenRes = await axios.get("https://duckduckgo.com/duckchat/v1/status", {
        headers: {
          "x-vqd-accept": "1",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      })

      const vqdToken = tokenRes.headers["x-vqd-4"]
      if (!vqdToken) {
        return res.status(500).json({ status: false, error: "Failed to obtain DuckDuckGo session token" })
      }

      const chatRes = await axios.post(
        "https://duckduckgo.com/duckchat/v1/chat",
        {
          model: selectedModel,
          messages: [{ role: "user", content: text }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-vqd-4": vqdToken,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          responseType: "text",
          timeout: 30000,
        }
      )

      const lines = chatRes.data.split("\n").filter(Boolean)
      let result = ""
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const json = line.slice(6).trim()
          if (json === "[DONE]") break
          try {
            const parsed = JSON.parse(json)
            result += parsed.message || ""
          } catch {}
        }
      }

      res.status(200).json({ status: true, model: selectedModel, result: result.trim() })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
