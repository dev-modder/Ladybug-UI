import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function searchITunes(query) {
    const res = await axios.get(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5&entity=song`,
      { timeout: 10000 }
    )
    return res.data.results || []
  }

  async function searchMusicBrainz(query) {
    const res = await axios.get(
      `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=5`,
      {
        headers: { "User-Agent": "LadybugAPIs/1.0.0 (https://github.com/dev-modder/Ladybug-UI)" },
        timeout: 10000,
      }
    )
    return res.data.recordings || []
  }

  async function searchLyrics(artist, title) {
    try {
      const res = await axios.get(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 8000 }
      )
      return res.data.lyrics ? res.data.lyrics.slice(0, 500) + (res.data.lyrics.length > 500 ? "..." : "") : null
    } catch {
      return null
    }
  }

  async function recognizeByUrl(audioUrl) {
    const formData = new FormData()
    formData.append("url", audioUrl)
    formData.append("return", "apple_music,spotify,deezer,lyrics")
    const res = await axios.post("https://api.audd.io/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 20000,
    })
    return res.data
  }

  async function getYouTubeMeta(ytUrl) {
    const res = await axios.get(ytUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 12000,
    })
    const $ = cheerio.load(res.data)
    const title = $('meta[property="og:title"]').attr("content")
      || $("title").text().replace(" - YouTube", "").trim()
    const description = $('meta[name="description"]').attr("content") || ""
    return { title, description }
  }

  function formatITunesResult(track) {
    return {
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      genre: track.primaryGenreName,
      release_date: track.releaseDate?.split("T")[0] || null,
      duration_ms: track.trackTimeMillis || null,
      duration: track.trackTimeMillis ? `${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, "0")}` : null,
      preview_url: track.previewUrl || null,
      artwork: track.artworkUrl100?.replace("100x100bb", "600x600bb") || null,
      itunes_url: track.trackViewUrl || null,
    }
  }

  function formatMBResult(rec) {
    const artist = rec["artist-credit"]?.[0]?.artist?.name || rec["artist-credit"]?.[0]?.name || null
    const release = rec.releases?.[0]
    return {
      title: rec.title,
      artist,
      album: release?.title || null,
      release_date: release?.date || null,
      country: release?.country || null,
      musicbrainz_id: rec.id,
      score: rec.score,
    }
  }

  app.get("/tools/musicfinder", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query, url, mode } = req.query

      if (!query && !url) {
        return res.status(400).json({
          status: false,
          error: "Provide either 'query' (song title/artist) or 'url' (audio/YouTube URL)",
          usage: {
            search: "/tools/musicfinder?query=Bohemian+Rhapsody",
            youtube: "/tools/musicfinder?url=https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
            audio: "/tools/musicfinder?url=https://example.com/audio.mp3&mode=recognize",
          },
        })
      }

      if (url) {
        const isYouTube = /youtube\.com|youtu\.be/i.test(url)
        const isAudio = /\.(mp3|wav|m4a|ogg|aac|flac|webm)(\?|$)/i.test(url) || mode === "recognize"

        if (isAudio) {
          const auddResult = await recognizeByUrl(url)

          if (auddResult.status === "success" && auddResult.result) {
            const track = auddResult.result
            const lyricsPreview = await searchLyrics(track.artist, track.title)

            return res.status(200).json({
              status: true,
              mode: "audio_recognition",
              recognized: true,
              title: track.title,
              artist: track.artist,
              album: track.album,
              release_date: track.release_date,
              label: track.label,
              lyrics_preview: lyricsPreview,
              links: {
                spotify: track.spotify?.external_urls?.spotify || null,
                apple_music: track.apple_music?.url || null,
                deezer: track.deezer?.link || null,
              },
            })
          }

          return res.status(200).json({
            status: true,
            mode: "audio_recognition",
            recognized: false,
            message: "Could not identify this audio. Try /tools/musicfinder?query=song+name instead.",
          })
        }

        if (isYouTube) {
          const { title: ytTitle } = await getYouTubeMeta(url)
          if (!ytTitle) {
            return res.status(400).json({ status: false, error: "Could not extract title from YouTube URL" })
          }

          const cleanQuery = ytTitle
            .replace(/\(Official.*?\)/gi, "")
            .replace(/\[Official.*?\]/gi, "")
            .replace(/\(Lyrics.*?\)/gi, "")
            .replace(/\[Lyrics.*?\]/gi, "")
            .replace(/\(Audio.*?\)/gi, "")
            .replace(/\[Audio.*?\]/gi, "")
            .replace(/\(Music Video\)/gi, "")
            .replace(/\|.*$/, "")
            .replace(/-\s*YouTube$/, "")
            .trim()

          const [itunesResults, mbResults] = await Promise.allSettled([
            searchITunes(cleanQuery),
            searchMusicBrainz(cleanQuery),
          ])

          const itunes = itunesResults.status === "fulfilled" ? itunesResults.value : []
          const mb = mbResults.status === "fulfilled" ? mbResults.value : []

          const lyricsPreview = itunes[0]
            ? await searchLyrics(itunes[0].artistName, itunes[0].trackName)
            : null

          return res.status(200).json({
            status: true,
            mode: "youtube",
            youtube_title: ytTitle,
            detected_query: cleanQuery,
            top_result: itunes[0] ? formatITunesResult(itunes[0]) : (mb[0] ? formatMBResult(mb[0]) : null),
            lyrics_preview: lyricsPreview,
            itunes_results: itunes.slice(0, 3).map(formatITunesResult),
            musicbrainz_results: mb.slice(0, 3).map(formatMBResult),
          })
        }

        return res.status(400).json({
          status: false,
          error: "Unrecognized URL type. Use a YouTube URL, direct audio file URL (with ?mode=recognize), or use the 'query' parameter for search.",
        })
      }

      const [itunesResults, mbResults] = await Promise.allSettled([
        searchITunes(query),
        searchMusicBrainz(query),
      ])

      const itunes = itunesResults.status === "fulfilled" ? itunesResults.value : []
      const mb = mbResults.status === "fulfilled" ? mbResults.value : []

      const topMatch = itunes[0] || null
      const lyricsPreview = topMatch
        ? await searchLyrics(topMatch.artistName, topMatch.trackName)
        : null

      res.status(200).json({
        status: true,
        mode: "search",
        query,
        top_result: topMatch ? formatITunesResult(topMatch) : (mb[0] ? formatMBResult(mb[0]) : null),
        lyrics_preview: lyricsPreview,
        itunes_results: itunes.slice(0, 5).map(formatITunesResult),
        musicbrainz_results: mb.slice(0, 5).map(formatMBResult),
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
