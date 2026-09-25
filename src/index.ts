export type Action = {
  id: string
  name: string
  description: string
  intent: string[]
  input: {
    type: "text" | "number" | "none"
    required: boolean
  }
  // Makes the action executable by AI agents. Only used when served from your own
  // https://<domain>/.well-known/lawp.json — see https://docs.actuent.ai/#actions
  endpoint?: {
    url: string
    method?: "POST" | "GET"
  }
}

export type Page = {
  title: string
  content: string
}

export type LawpConfig = {
  domain: string
  name: string
  pages: Record<string, Page>
  actions: Action[]
}

export type ActuentConfig = {
  apiKey: string
  site: LawpConfig
}

const ACTUENT_API = "https://api.actuent.ai"

export async function register(config: ActuentConfig): Promise<void> {
  const res = await fetch(`${ACTUENT_API}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(config.site)
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Actuent registration failed: ${error.message || res.statusText}`)
  }

  console.log(`✅ ${config.site.domain} registered on Actuent`)
}
