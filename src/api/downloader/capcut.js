import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/downloader/capcut", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query
      if (!url) {
        return res.status(400).json({ status: false, error: "url parameter is required" })
      }

      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 15000,
      })

      const $ = cheerio.load(response.data)

      const ogVideo = $('meta[property="og:video"]').attr("content")
        || $('meta[property="og:video:url"]').attr("content")
      const ogImage = $('meta[property="og:image"]').attr("content")
      const ogTitle = $('meta[property="og:title"]').attr("content") || ""
      const ogDesc = $('meta[property="og:description"]').attr("content") || ""

      let videoUrl = ogVideo

      if (!videoUrl) {
        const scriptData = $("script").toArray()
        for (const s of scriptData) {
          const content = $(s).html() || ""
          const match = content.match(/"video_url"\s*:\s*"([^"]+)"/)
            || content.match(/"playAddr"\s*:\s*"([^"]+)"/)
          if (match) {
            videoUrl = match[1].replace(/\\u002F/g, "/").replace(/\\/g, "")
            break
          }
        }
      }

      if (!videoUrl && !ogImage) {
        return res.status(404).json({ status: false, error: "Could not extract media from this CapCut URL" })
      }

      res.status(200).json({
        status: true,
        type: videoUrl ? "video" : "image",
        title: ogTitle,
        description: ogDesc,
        url: videoUrl || ogImage,
        thumbnail: ogImage || null,
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
