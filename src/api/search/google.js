import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/search/google", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query, limit } = req.query
      if (!query) return res.status(400).json({ status: false, error: "query parameter is required" })

      const maxResults = Math.min(parseInt(limit) || 10, 20)

      const response = await axios.get(
        `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}&hl=en`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: 15000,
        }
      )

      const $ = cheerio.load(response.data)
      const results = []

      $("div.g, div[data-hveid]").each((i, el) => {
        if (results.length >= maxResults) return false
        const titleEl = $(el).find("h3").first()
        const linkEl = $(el).find("a[href]").first()
        const descEl = $(el).find("div[data-sncf], div.VwiC3b, span.st").first()

        const title = titleEl.text().trim()
        const href = linkEl.attr("href")
        const desc = descEl.text().trim()

        if (title && href && href.startsWith("http") && !href.includes("google.com/search")) {
          results.push({ title, url: href, description: desc || null })
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
