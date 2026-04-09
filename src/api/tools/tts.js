import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/tools/tts", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, lang } = req.query
      if (!text) return res.status(400).json({ status: false, error: "text parameter is required" })

      const language = lang || "en"

      if (text.length > 200) {
        return res.status(400).json({ status: false, error: "text must be 200 characters or less for TTS" })
      }

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${language}&client=tw-ob`

      const response = await axios.get(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://translate.google.com/",
        },
        responseType: "arraybuffer",
        timeout: 15000,
      })

      res.setHeader("Content-Type", "audio/mpeg")
      res.setHeader("Content-Disposition", `inline; filename="tts.mp3"`)
      res.status(200).send(Buffer.from(response.data))
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
