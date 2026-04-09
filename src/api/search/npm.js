import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/search/npm", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query, limit } = req.query
      if (!query) return res.status(400).json({ status: false, error: "query parameter is required" })

      const maxResults = Math.min(parseInt(limit) || 10, 20)

      const response = await axios.get(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${maxResults}`,
        { timeout: 10000 }
      )

      const results = response.data.objects.map((obj) => {
        const pkg = obj.package
        return {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description || "",
          keywords: pkg.keywords || [],
          author: pkg.author?.name || pkg.publisher?.username || null,
          date: pkg.date,
          links: {
            npm: pkg.links?.npm,
            homepage: pkg.links?.homepage || null,
            repository: pkg.links?.repository || null,
          },
          score: {
            final: obj.score?.final,
            quality: obj.score?.detail?.quality,
            popularity: obj.score?.detail?.popularity,
            maintenance: obj.score?.detail?.maintenance,
          },
          weekly_downloads: obj.downloads?.weekly || null,
        }
      })

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
