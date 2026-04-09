import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/ai/gpt4free", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, model, system } = req.query
      if (!text) {
        return res.status(400).json({ status: false, error: "text parameter is required" })
      }

      const selectedModel = model || "gpt-4o-mini"
      const systemPrompt = system || "You are a helpful assistant."

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ]

      const response = await axios.post(
        "https://app.giz.ai/api/data/users/inferenceApi",
        {
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: "https://app.giz.ai/",
            Origin: "https://app.giz.ai",
          },
          timeout: 30000,
        }
      )

      const result = response.data?.choices?.[0]?.message?.content
        || response.data?.output
        || response.data?.result
        || JSON.stringify(response.data)

      res.status(200).json({ status: true, model: selectedModel, result })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
