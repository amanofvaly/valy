import { initialize } from "@medusajs/medusa"

async function test() {
    const res = await fetch("http://localhost:9000/admin/gst", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa("admin@test.com:supersecret") // Or pass it if auth is disabled
        },
        body: JSON.stringify({ origin_state_code: "07", company_gstin: "07AAAAA", defaultRate: 18, categoryRates: [] })
    })
    const text = await res.text()
    console.log(res.status, text)
}
test()
