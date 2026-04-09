import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/downloader/pinterest", createApiKeyMiddleware(), async (req, res) => {
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

      const scriptTags = $("script[data-relay-response]").toArray()
      let pinData = null
      for (const script of scriptTags) {
        try {
          const json = JSON.parse($(script).html())
          if (json?.response?.data?.v3GetPinQuery?.data) {
            pinData = json.response.data.v3GetPinQuery.data
            break
          }
        } catch {}
      }

      let mediaUrl = null
      let mediaType = "image"
      let title = $('meta[property="og:title"]').attr("content") || ""
      let description = $('meta[property="og:description"]').attr("content") || ""

      if (pinData) {
        if (pinData.videos?.video_list) {
          const vList = pinData.videos.video_list
          const best = vList.V_720P || vList.V_480P || vList.V_360P || vList.V_HLSV4 || Object.values(vList)[0]
          if (best?.url) {
            mediaUrl = best.url
            mediaType = "video"
          }
        }
        if (!mediaUrl && pinData.images) {
          const orig = pinData.images.orig || pinData.images["736x"] || Object.values(pinData.images)[0]
          mediaUrl = orig?.url
        }
        title = pinData.title || title
        description = pinData.description || description
      }

      if (!mediaUrl) {
        mediaUrl = $('meta[property="og:video"]').attr("content") || $('meta[property="og:image"]').attr("content")
        if ($('meta[property="og:video"]').attr("content")) mediaType = "video"
      }

      if (!mediaUrl) {
        return res.status(404).json({ status: false, error: "Could not extract media from this Pinterest URL" })
      }

      res.status(200).json({
        status: true,
        type: mediaType,
        title,
        description,
        url: mediaUrl,
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
