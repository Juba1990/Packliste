export interface Item {
  id: string
  name: string
  quantity: number
  weight?: number
  person: string
  checked: boolean
  comment?: string
}

export interface Category {
  id: string
  name: string
  items: { [key: string]: Item }
}

export interface Trip {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  weightTracking: boolean
  persons: string[]
  categories: { [key: string]: Category }
  shareId?: string
  sharePassword?: string
  createdAt: number
}

export interface SavedList {
  id: string
  name: string
  categories: { [key: string]: Category }
  createdAt: number
}

export interface WeatherDay {
  date: string
  maxTemp: number
  minTemp: number
  precipitation: number
}
