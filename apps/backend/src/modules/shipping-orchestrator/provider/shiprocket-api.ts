export class ShiprocketAPI {
  private static token: string | null = null
  private static tokenExpiry: number | null = null
  private static API_URL = "https://apiv2.shiprocket.in/v1/external"

  static async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token
    }

    const email = process.env.SHIPROCKET_EMAIL
    const password = process.env.SHIPROCKET_PASSWORD

    if (!email || !password) {
      throw new Error("Shiprocket credentials not found in environment variables.")
    }

    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error(`Shiprocket Auth Failed: ${await response.text()}`)
    }

    const data = await response.json()
    this.token = data.token
    // Token valid for 10 days, cache for 9 days
    this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000 
    
    return this.token!
  }

  static async checkServiceability(payload: any): Promise<any> {
    const token = await this.getToken()
    
    // Construct query params
    const query = new URLSearchParams(payload).toString()
    
    const response = await fetch(`${this.API_URL}/courier/serviceability/?${query}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    })

    if (!response.ok) {
      throw new Error(`Shiprocket Serviceability Failed: ${await response.text()}`)
    }

    return await response.json()
  }

  static async createOrder(payload: any): Promise<any> {
    const token = await this.getToken()

    const response = await fetch(`${this.API_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Shiprocket Create Order Failed: ${await response.text()}`)
    }

    return await response.json()
  }
}
