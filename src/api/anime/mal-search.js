import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/anime/mal-search", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query, limit } = req.query
      if (!query) return res.status(400).json({ status: false, error: "query parameter is required" })

      const maxResults = Math.min(parseInt(limit) || 10, 25)
      const response = await axios.get(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=${maxResults}&sfw=true`,
        { timeout: 15000 }
      )

      const results = response.data.data.map((anime) => ({
        mal_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        title_japanese: anime.title_japanese,
        type: anime.type,
        episodes: anime.episodes,
        status: anime.status,
        score: anime.score,
        synopsis: anime.synopsis,
        year: anime.year,
        season: anime.season,
        genres: anime.genres?.map((g) => g.name) || [],
        image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        url: anime.url,
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
