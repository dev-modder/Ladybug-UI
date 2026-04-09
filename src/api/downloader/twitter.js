import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function getTwitterMedia(tweetUrl) {
    const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1]
    if (!tweetId) throw new Error("Invalid Twitter/X URL — could not extract tweet ID")

    const apiUrl = `https://api.vxtwitter.com/Twitter/status/${tweetId}`
    const response = await axios.get(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000,
    })

    const data = response.data
    const mediaItems = data.media_extended || []

    return {
      id: tweetId,
      text: data.text || "",
      author: data.user_name || "",
      author_handle: data.user_screen_name || "",
      created_at: data.date || "",
      likes: data.likes || 0,
      retweets: data.retweets || 0,
      media: mediaItems.map((m) => ({
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnail_url || null,
        duration: m.duration_millis ? m.duration_millis / 1000 : null,
      })),
    }
  }

  app.get("/downloader/twitter", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query
      if (!url) {
        return res.status(400).json({ status: false, error: "url parameter is required" })
      }

      const result = await getTwitterMedia(url)
      res.status(200).json({ status: true, ...result })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
