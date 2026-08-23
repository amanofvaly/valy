import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  let versionData = {
    commitSha: process.env.COMMIT_SHA || "dev",
    commitTime: null,
    commitMessage: null,
    deployTime: null,
  }

  try {
    const versionPath = path.join(process.cwd(), "version.json")
    if (fs.existsSync(versionPath)) {
      const fileData = JSON.parse(fs.readFileSync(versionPath, "utf-8"))
      versionData = { ...versionData, ...fileData }
    } else {
      // Check one level up (in case we are running outside .medusa/server during dev)
      const rootVersionPath = path.join(process.cwd(), "..", "..", "version.json")
      if (fs.existsSync(rootVersionPath)) {
        const fileData = JSON.parse(fs.readFileSync(rootVersionPath, "utf-8"))
        versionData = { ...versionData, ...fileData }
      }
    }
  } catch (e) {
    // Ignore errors reading the file
  }

  // Format dates in IST (+05:30)
  const formatIST = (dateString: string | null) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "long",
      })
    } catch {
      return dateString
    }
  }

  res.json({
    version: versionData.commitSha,
    commitTime: formatIST(versionData.commitTime),
    deployTime: formatIST(versionData.deployTime),
    commitMessage: versionData.commitMessage,
  })
}
