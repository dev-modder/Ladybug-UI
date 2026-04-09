import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/tools/translate", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, to, from } = req.query
      if (!text) return res.status(400).json({ status: false, error: "text parameter is required" })
      if (!to) return res.status(400).json({ status: false, error: "to parameter is required (target language code)" })

      const sourceLang = from || "auto"

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000,
      })

      const data = response.data
      let translated = ""
      if (Array.isArray(data[0])) {
        for (const part of data[0]) {
          if (part && part[0]) translated += part[0]
        }
      }

      const detectedLang = data[2] || sourceLang

      res.status(200).json({
        status: true,
        original: text,
        translated,
        from: detectedLang,
        to,
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
