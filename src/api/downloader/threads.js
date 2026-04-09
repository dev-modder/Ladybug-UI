import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/downloader/threads", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query
      if (!url) {
        return res.status(400).json({ status: false, error: "url parameter is required" })
      }

      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 15000,
      })

      const $ = cheerio.load(response.data)

      const ogVideo = $('meta[property="og:video"]').attr("content")
        || $('meta[property="og:video:url"]').attr("content")
      const ogImage = $('meta[property="og:image"]').attr("content")
      const ogTitle = $('meta[property="og:title"]').attr("content") || ""
      const ogDesc = $('meta[property="og:description"]').attr("content") || ""

      if (!ogVideo && !ogImage) {
        return res.status(404).json({ status: false, error: "No media found in this Threads post" })
      }

      res.status(200).json({
        status: true,
        type: ogVideo ? "video" : "image",
        title: ogTitle,
        description: ogDesc,
        url: ogVideo || ogImage,
        thumbnail: ogImage || null,
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
