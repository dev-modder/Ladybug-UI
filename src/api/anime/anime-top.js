import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  const VALID_TYPES = ["tv", "movie", "ova", "special", "ona", "music"]

  app.get("/anime/top", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { type, page } = req.query

      const animeType = (type && VALID_TYPES.includes(type.toLowerCase())) ? type.toLowerCase() : null
      const pageNum = parseInt(page) || 1

      const params = new URLSearchParams({ page: pageNum, limit: 25 })
      if (animeType) params.set("type", animeType)

      const response = await axios.get(
        `https://api.jikan.moe/v4/top/anime?${params.toString()}`,
        { timeout: 15000 }
      )

      const results = response.data.data.map((anime) => ({
        rank: anime.rank,
        mal_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        type: anime.type,
        episodes: anime.episodes,
        status: anime.status,
        score: anime.score,
        scored_by: anime.scored_by,
        members: anime.members,
        year: anime.year,
        image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        url: anime.url,
      }))

      res.status(200).json({
        status: true,
        type: animeType || "all",
        page: pageNum,
        total: results.length,
        results,
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
