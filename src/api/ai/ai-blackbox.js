import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/ai/blackbox", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text } = req.query
      if (!text) {
        return res.status(400).json({ status: false, error: "text parameter is required" })
      }

      const response = await axios.post(
        "https://www.blackbox.ai/api/chat",
        {
          messages: [{ role: "user", content: text }],
          id: "chatcmpl-" + Math.random().toString(36).substring(2),
          previewToken: null,
          userId: null,
          codeModelMode: true,
          agentMode: {},
          trendingAgentMode: {},
          isMicMode: false,
          isChromeExt: false,
          githubToken: null,
          clickedAnswer2: false,
          clickedAnswer3: false,
          clickedForceWebSearch: false,
          visitFromDelta: false,
          mobileClient: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: "https://www.blackbox.ai/",
            Origin: "https://www.blackbox.ai",
          },
          timeout: 30000,
        }
      )

      const rawText = response.data
      const cleaned = typeof rawText === "string"
        ? rawText.replace(/\$@\$.*?\$@\$/gs, "").trim()
        : String(rawText)

      res.status(200).json({ status: true, result: cleaned })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
