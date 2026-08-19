import { MedusaError } from "@medusajs/framework/utils"

/**
 * Shiprocket API v2 client.
 *
 * Handles token caching (9-day TTL), and exposes all endpoints
 * needed by the Shipping Orchestrator:
 *   - checkServiceability
 *   - createOrder
 *   - generateAWB
 *   - cancelOrder
 *   - trackShipment
 *   - createReturnOrder
 */
export class ShiprocketAPI {
  private token: string | null = null
  private tokenExpiry: number | null = null
  private tokenCredentialFingerprint: string | null = null
  private API_URL = "https://apiv2.shiprocket.in/v1/external"

  constructor() {}

  // ------------------------------------------------------------------
  // Auth
  // ------------------------------------------------------------------

  async getToken(settings: any): Promise<string> {
    const email = settings?.api_settings?.shiprocket_email
    const password = settings?.api_settings?.shiprocket_password

    if (!email || !password) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shiprocket credentials not provided in Shipping Orchestrator Settings."
      )
    }

    const fingerprint = `${email}:${password}`
    const cacheValid =
      this.token &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry &&
      this.tokenCredentialFingerprint === fingerprint

    if (cacheValid) {
      return this.token!
    }

    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Shiprocket Auth Failed: ${await response.text()}`)
    }

    const data = await response.json()
    this.token = data.token
    this.tokenCredentialFingerprint = fingerprint
    // Token valid for 10 days, cache for 9 days
    this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000

    return this.token!
  }

  private async authHeaders(settings: any): Promise<Record<string, string>> {
    const token = await this.getToken(settings)
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    }
  }

  // ------------------------------------------------------------------
  // Serviceability
  // ------------------------------------------------------------------

  async checkServiceability(payload: {
    pickup_postcode: string
    delivery_postcode: string
    weight: number
    cod: number
    length?: number
    breadth?: number
    height?: number
  }, settings: any): Promise<any> {
    const headers = await this.authHeaders(settings)
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, String(v)])
      )
    ).toString()

    const response = await fetch(
      `${this.API_URL}/courier/serviceability/?${query}`,
      { method: "GET", headers }
    )

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shiprocket Serviceability Failed: ${await response.text()}`
      )
    }

    return await response.json()
  }

  // ------------------------------------------------------------------
  // Order Management
  // ------------------------------------------------------------------

  async createOrder(payload: any, settings: any): Promise<any> {
    const headers = await this.authHeaders(settings)

    const response = await fetch(`${this.API_URL}/orders/create/adhoc`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shiprocket Create Order Failed: ${await response.text()}`
      )
    }

    return await response.json()
  }

  async cancelOrder(orderIds: number[], settings: any): Promise<any> {
    const headers = await this.authHeaders(settings)

    const response = await fetch(`${this.API_URL}/orders/cancel`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ids: orderIds }),
    })

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shiprocket Cancel Order Failed: ${await response.text()}`
      )
    }

    return await response.json()
  }

  // ------------------------------------------------------------------
  // AWB & Shipment
  // ------------------------------------------------------------------

  async generateAWB(
    shipmentId: number,
    courierId: number,
    settings: any
  ): Promise<any> {
    const headers = await this.authHeaders(settings)

    const response = await fetch(`${this.API_URL}/courier/assign/awb`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        shipment_id: shipmentId,
        courier_id: courierId,
      }),
    })

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shiprocket Generate AWB Failed: ${await response.text()}`
      )
    }

    return await response.json()
  }

  async trackShipment(shipmentId: number, settings: any): Promise<any> {
    const headers = await this.authHeaders(settings)

    const response = await fetch(
      `${this.API_URL}/courier/track/shipment/${shipmentId}`,
      { method: "GET", headers }
    )

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shiprocket Track Shipment Failed: ${await response.text()}`
      )
    }

    return await response.json()
  }

  // ------------------------------------------------------------------
  // Returns (Pillar 5)
  // ------------------------------------------------------------------

  async createReturnOrder(payload: {
    order_id: string
    order_date: string
    pickup_customer_name: string
    pickup_address: string
    pickup_city: string
    pickup_state: string
    pickup_pincode: string
    pickup_phone: string
    order_items: any[]
    [key: string]: any
  }, settings: any): Promise<any> {
    const headers = await this.authHeaders(settings)

    const response = await fetch(
      `${this.API_URL}/orders/create/return`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Shiprocket Create Return Order Failed: ${await response.text()}`
      )
    }

    return await response.json()
  }
}
