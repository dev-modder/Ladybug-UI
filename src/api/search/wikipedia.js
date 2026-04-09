import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/search/wikipedia", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query, lang } = req.query
      if (!query) return res.status(400).json({ status: false, error: "query parameter is required" })

      const language = lang || "en"

      const searchRes = await axios.get(
        `https://${language}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5`,
        { timeout: 10000 }
      )

      const searches = searchRes.data.query?.search || []
      if (searches.length === 0) {
        return res.status(404).json({ status: false, error: `No Wikipedia results found for "${query}"` })
      }

      const top = searches[0]
      const summaryRes = await axios.get(
        `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(top.title)}`,
        { timeout: 10000 }
      )

      const summary = summaryRes.data

      res.status(200).json({
        status: true,
        query,
        title: summary.title,
        description: summary.description || "",
        extract: summary.extract || "",
        url: summary.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(top.title)}`,
        image: summary.thumbnail?.source || null,
        other_results: searches.slice(1).map((s) => ({
          title: s.title,
          snippet: s.snippet?.replace(/<[^>]+>/g, "").trim(),
        })),
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
