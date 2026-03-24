"use client";

import { useState, useEffect, useCallback } from "react";
import { WeatherData } from "@/types/weather";

const DEFAULT_CITIES = ["Edinburgh", "Dayton", "London", "Belgaum", "Paris"];
const REFRESH_INTERVAL = 10000;

function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    "01d": "\u2600\uFE0F", "01n": "\uD83C\uDF19",
    "02d": "\u26C5", "02n": "\u26C5",
    "03d": "\u2601\uFE0F", "03n": "\u2601\uFE0F",
    "04d": "\u2601\uFE0F", "04n": "\u2601\uFE0F",
    "09d": "\uD83C\uDF27\uFE0F", "09n": "\uD83C\uDF27\uFE0F",
    "10d": "\uD83C\uDF26\uFE0F", "10n": "\uD83C\uDF26\uFE0F",
    "11d": "\u26C8\uFE0F", "11n": "\u26C8\uFE0F",
    "13d": "\u2744\uFE0F", "13n": "\u2744\uFE0F",
    "50d": "\uD83C\uDF2B\uFE0F", "50n": "\uD83C\uDF2B\uFE0F",
  };
  return map[icon] || "\u2601\uFE0F";
}

function getWindDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function getUVLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Low", color: "bg-green-500" };
  if (uv <= 5) return { label: "Moderate", color: "bg-yellow-500" };
  if (uv <= 7) return { label: "High", color: "bg-orange-500" };
  if (uv <= 10) return { label: "Very High", color: "bg-red-500" };
  return { label: "Extreme", color: "bg-purple-600" };
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function WeatherCard({ data, onRemove }: { data: WeatherData; onRemove?: () => void }) {
  const { city, country, current, forecast, lastUpdated } = data;
  const sunriseTime = new Date(current.sunrise * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const sunsetTime = new Date(current.sunset * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{city}, {country}</h2>
            <p className="text-sm text-blue-200 mt-1">
              Updated {new Date(lastUpdated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          {onRemove && (
            <button onClick={onRemove} className="text-blue-300 hover:text-white text-xl leading-none" title="Remove city">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Current conditions */}
      <div className="px-6 py-5 bg-gradient-to-b from-[#f0f4ff] to-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-6xl font-light text-gray-900">{current.temp}&deg;C</div>
            <p className="text-lg capitalize text-gray-600 mt-1">{current.description}</p>
            <p className="text-sm text-gray-500">Feels like {current.feelsLike}&deg;C</p>
          </div>
          <div className="text-7xl">{getWeatherEmoji(current.icon)}</div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <DetailBox label="Wind" value={`${current.windSpeed} m/s`} sub={getWindDirection(current.windDirection)} />
          <DetailBox label="Humidity" value={`${current.humidity}%`} sub={current.humidity > 70 ? "High" : current.humidity > 40 ? "Moderate" : "Low"} />
          {current.uvIndex !== null ? (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">UV Index</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{current.uvIndex}</p>
              <span className={`inline-block mt-1 text-xs text-white px-2 py-0.5 rounded-full ${getUVLabel(current.uvIndex).color}`}>
                {getUVLabel(current.uvIndex).label}
              </span>
            </div>
          ) : (
            <DetailBox label="UV Index" value="N/A" sub="Unavailable" />
          )}
          <DetailBox label="Precipitation" value={`${current.precipitation} mm`} sub="Last hour" />
          <DetailBox label="Sunrise" value={sunriseTime} sub={`Sunset ${sunsetTime}`} />
          <DetailBox label="Pressure" value={`${current.pressure}`} sub="hPa" />
        </div>
      </div>

      {/* Forecast */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">5-Day Forecast</h3>
        <div className="space-y-2">
          {forecast.map((day) => (
            <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm font-medium text-gray-700 w-24">{formatDay(day.date)}</span>
              <span className="text-xl">{getWeatherEmoji(day.icon)}</span>
              <span className="text-xs text-gray-500 capitalize w-28 text-center">{day.description}</span>
              <div className="flex items-center gap-2 w-20 justify-end">
                <span className="font-semibold text-gray-900">{day.tempMax}&deg;</span>
                <span className="text-gray-400">{day.tempMin}&deg;</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 w-36 justify-end">
                <span title="Wind">{day.windSpeed} m/s</span>
                <span title="Humidity">{day.humidity}%</span>
                <span title="Precipitation chance">{day.precipitation}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function LoadingCard({ city }: { city: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-6 py-4">
        <h2 className="text-2xl font-bold">{city}</h2>
        <p className="text-sm text-blue-200 mt-1">Loading...</p>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ city, error, onRetry, onRemove }: { city: string; error: string; onRetry: () => void; onRemove?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-red-200">
      <div className="bg-gradient-to-r from-red-800 to-red-900 text-white px-6 py-4 flex justify-between items-start">
        <h2 className="text-2xl font-bold">{city}</h2>
        {onRemove && (
          <button onClick={onRemove} className="text-red-300 hover:text-white text-xl leading-none">&times;</button>
        )}
      </div>
      <div className="px-6 py-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={onRetry} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [cities, setCities] = useState<string[]>(DEFAULT_CITIES);
  const [weatherMap, setWeatherMap] = useState<Record<string, { data?: WeatherData; error?: string; loading: boolean }>>({});
  const [searchInput, setSearchInput] = useState("");
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const fetchWeather = useCallback(async (city: string) => {
    setWeatherMap((prev) => ({ ...prev, [city]: { ...prev[city], loading: true } }));
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (!res.ok) {
        setWeatherMap((prev) => ({ ...prev, [city]: { error: json.error || "Failed to fetch", loading: false } }));
      } else {
        setWeatherMap((prev) => ({ ...prev, [city]: { data: json, loading: false } }));
      }
    } catch {
      setWeatherMap((prev) => ({ ...prev, [city]: { error: "Network error", loading: false } }));
    }
  }, []);

  const fetchAll = useCallback(() => {
    cities.forEach((city) => fetchWeather(city));
  }, [cities, fetchWeather]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchAll();
      setCountdown(REFRESH_INTERVAL / 1000);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL / 1000 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    if (!cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCities((prev) => [...prev, trimmed]);
      fetchWeather(trimmed);
    }
    setSearchInput("");
  };

  const handleRemoveCity = (city: string) => {
    setCities((prev) => prev.filter((c) => c !== city));
    setWeatherMap((prev) => {
      const next = { ...prev };
      delete next[city];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Weather Dashboard</h1>
              <p className="text-blue-300 text-sm mt-1">
                Live conditions &middot; Refreshing in {countdown}s
              </p>
            </div>
            <form onSubmit={handleAddCity} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Add a city..."
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Weather Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {cities.map((city) => {
            const state = weatherMap[city];
            if (!state || (state.loading && !state.data)) {
              return <LoadingCard key={city} city={city} />;
            }
            if (state.error && !state.data) {
              return (
                <ErrorCard
                  key={city}
                  city={city}
                  error={state.error}
                  onRetry={() => fetchWeather(city)}
                  onRemove={!DEFAULT_CITIES.includes(city) ? () => handleRemoveCity(city) : undefined}
                />
              );
            }
            if (state.data) {
              return (
                <WeatherCard
                  key={city}
                  data={state.data}
                  onRemove={!DEFAULT_CITIES.includes(city) ? () => handleRemoveCity(city) : undefined}
                />
              );
            }
            return null;
          })}
        </div>
      </main>
    </div>
  );
}
