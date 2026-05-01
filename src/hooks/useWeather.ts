import { useState, useEffect } from 'react'
import { WeatherDay } from '../types'

export function useWeather(location: string, startDate: string, endDate: string) {
  const [weather, setWeather] = useState<WeatherDay[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!location || !startDate || !endDate) return

    const fetchWeather = async () => {
      setLoading(true)
      try {
        // Geocoding: Get coordinates for location
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`
        )
        const geoData = await geoRes.json()
        if (!geoData.results?.length) return

        const { latitude, longitude } = geoData.results[0]

        // Weather forecast
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe/Zurich&start_date=${startDate}&end_date=${endDate}`
        )
        const weatherData = await weatherRes.json()

        if (weatherData.daily) {
          const days: WeatherDay[] = weatherData.daily.time.map((date: string, i: number) => ({
            date,
            maxTemp: Math.round(weatherData.daily.temperature_2m_max[i]),
            minTemp: Math.round(weatherData.daily.temperature_2m_min[i]),
            precipitation: Math.round(weatherData.daily.precipitation_sum[i] * 10) / 10
          }))
          setWeather(days)
        }
      } catch (err) {
        console.error('Weather fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [location, startDate, endDate])

  return { weather, loading }
}
