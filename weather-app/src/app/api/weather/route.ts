import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const ONE_CALL_URL = "https://api.openweathermap.org/data/3.0/onecall";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";

interface GeoResult {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");

  if (!city) {
    return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "OpenWeatherMap API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Geocode city name to coordinates
    const geoRes = await fetch(
      `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
    );
    const geoData: GeoResult[] = await geoRes.json();

    if (!geoData.length) {
      return NextResponse.json({ error: `City "${city}" not found` }, { status: 404 });
    }

    const { lat, lon, name, country } = geoData[0];

    // Fetch current weather
    const weatherRes = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const weatherData = await weatherRes.json();

    // Fetch 5-day forecast
    const forecastRes = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const forecastData = await forecastRes.json();

    // Try One Call API for UV index (may require separate subscription)
    let uvIndex: number | null = null;
    try {
      const uvRes = await fetch(
        `${ONE_CALL_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${API_KEY}`
      );
      if (uvRes.ok) {
        const uvData = await uvRes.json();
        uvIndex = uvData.current?.uvi ?? null;
      }
    } catch {
      // UV data not available, continue without it
    }

    // Process daily forecast (group by day, take noon reading)
    const dailyMap = new Map<string, typeof forecastData.list[0]>();
    for (const entry of forecastData.list) {
      const date = entry.dt_txt.split(" ")[0];
      const hour = parseInt(entry.dt_txt.split(" ")[1].split(":")[0]);
      // Prefer noon reading, otherwise take first available
      if (!dailyMap.has(date) || hour === 12) {
        dailyMap.set(date, entry);
      }
    }

    const forecast = Array.from(dailyMap.values())
      .slice(0, 5)
      .map((entry) => ({
        date: entry.dt_txt.split(" ")[0],
        temp: Math.round(entry.main.temp),
        tempMin: Math.round(entry.main.temp_min),
        tempMax: Math.round(entry.main.temp_max),
        description: entry.weather[0].description,
        icon: entry.weather[0].icon,
        windSpeed: entry.wind.speed,
        humidity: entry.main.humidity,
        precipitation: Math.round((entry.pop || 0) * 100),
      }));

    return NextResponse.json({
      city: name,
      country,
      current: {
        temp: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        tempMin: Math.round(weatherData.main.temp_min),
        tempMax: Math.round(weatherData.main.temp_max),
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        windSpeed: weatherData.wind.speed,
        windDirection: weatherData.wind.deg,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility,
        uvIndex,
        precipitation: weatherData.rain?.["1h"] || weatherData.snow?.["1h"] || 0,
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
      },
      forecast,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
