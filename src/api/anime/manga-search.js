import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/anime/manga-search", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query, limit } = req.query
      if (!query) return res.status(400).json({ status: false, error: "query parameter is required" })

      const maxResults = Math.min(parseInt(limit) || 10, 25)
      const response = await axios.get(
        `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=${maxResults}&sfw=true`,
        { timeout: 15000 }
      )

      const results = response.data.data.map((manga) => ({
        mal_id: manga.mal_id,
        title: manga.title,
        title_english: manga.title_english,
        title_japanese: manga.title_japanese,
        type: manga.type,
        chapters: manga.chapters,
        volumes: manga.volumes,
        status: manga.status,
        score: manga.score,
        synopsis: manga.synopsis,
        genres: manga.genres?.map((g) => g.name) || [],
        image: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url,
        url: manga.url,
      }))

      res.status(200).json({
        status: true,
        query,
        total: results.length,
        results,
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
