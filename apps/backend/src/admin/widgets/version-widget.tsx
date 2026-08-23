import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Badge, Tooltip } from "@medusajs/ui"

const VersionWidget = () => {
  const [version, setVersion] = useState<any>(null)

  useEffect(() => {
    fetch("/version")
      .then((res) => res.json())
      .then(setVersion)
      .catch(console.error)
  }, [])

  if (!version) return null

  const isLocal = version.version === "dev"
  
  const content = isLocal 
    ? "Running Locally" 
    : `Deployed: ${version.deployTime}\nMessage: ${version.commitMessage}`

  return (
    <div className="flex items-center mx-2">
      <Tooltip content={<div className="whitespace-pre-wrap">{content}</div>}>
        <Badge size="small" color={isLocal ? "grey" : "green"}>
          {isLocal ? "dev" : (version.version?.slice(0, 7) || version.version)}
        </Badge>
      </Tooltip>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "topbar",
})

export default VersionWidget
