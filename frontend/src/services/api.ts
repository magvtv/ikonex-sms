const BASE_URL = 'http://localhost:3000/api'

export const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `API Error: ${response.statusText}`)
    }
    return response.json()
  },
  
  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `API Error: ${response.statusText}`)
    }
    return response.json()
  },
  
  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `API Error: ${response.statusText}`)
    }
    return response.json()
  },
  
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `API Error: ${response.statusText}`)
    }
    return response.json()
  }
}
