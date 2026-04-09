import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  app.get("/tools/weather", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { city } = req.query
      if (!city) {
        return res.status(400).json({ status: false, error: "city parameter is required" })
      }

      const geoRes = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
        { timeout: 10000 }
      )

      if (!geoRes.data.results || geoRes.data.results.length === 0) {
        return res.status(404).json({ status: false, error: `City "${city}" not found` })
      }

      const { latitude, longitude, name, country, country_code, timezone } = geoRes.data.results[0]

      const weatherRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover&wind_speed_unit=kmh&timezone=${encodeURIComponent(timezone || "auto")}`,
        { timeout: 10000 }
      )

      const current = weatherRes.data.current
      const units = weatherRes.data.current_units

      const weatherCodes = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Moderate drizzle",
        55: "Heavy drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 80: "Slight rain showers",
        81: "Moderate rain showers", 82: "Violent rain showers", 95: "Thunderstorm",
        96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
      }

      res.status(200).json({
        status: true,
        location: { city: name, country, country_code, latitude, longitude, timezone },
        current: {
          temperature: `${current.temperature_2m}${units.temperature_2m}`,
          feels_like: `${current.apparent_temperature}${units.apparent_temperature}`,
          humidity: `${current.relative_humidity_2m}${units.relative_humidity_2m}`,
          precipitation: `${current.precipitation}${units.precipitation}`,
          wind_speed: `${current.wind_speed_10m}${units.wind_speed_10m}`,
          wind_direction: `${current.wind_direction_10m}${units.wind_direction_10m}`,
          cloud_cover: `${current.cloud_cover}${units.cloud_cover}`,
          condition: weatherCodes[current.weather_code] || "Unknown",
          time: current.time,
        },
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message || "Internal server error" })
    }
  })
}
