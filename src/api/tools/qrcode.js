import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/tools/qrcode", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, size } = req.query
      if (!text) {
        return res.status(400).json({ status: false, error: "text parameter is required" })
      }

      const qrSize = parseInt(size) || 300
      if (qrSize < 50 || qrSize > 1000) {
        return res.status(400).json({ status: false, error: "size must be between 50 and 1000" })
      }

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${qrSize}x${qrSize}&format=png`

      const response = await axios.get(qrUrl, { responseType: "arraybuffer", timeout: 10000 })

      res.setHeader("Content-Type", "image/png")
      res.setHeader("Content-Disposition", `inline; filename="qrcode.png"`)
      res.status(200).send(Buffer.from(response.data))
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
