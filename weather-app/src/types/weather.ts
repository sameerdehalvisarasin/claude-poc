export interface ForecastDay {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  windSpeed: number;
  humidity: number;
  precipitation: number;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  pressure: number;
  visibility: number;
  uvIndex: number | null;
  precipitation: number;
  sunrise: number;
  sunset: number;
}

export interface WeatherData {
  city: string;
  country: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  lastUpdated: string;
}
