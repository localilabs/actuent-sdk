// A field of a structured action input (LAWP 0.3) — https://github.com/localilabs/lawp/blob/main/LAWP.md#structured-inputs-v03
export type InputField = {
  name: string
  type?: "string" | "number" | "integer" | "boolean" | "date" | "time" | "datetime" | "email" | "phone" | "url" | "enum"
  required?: boolean
  description?: string
  options?: string[]
  example?: unknown
}

export type Action = {
  id: string
  name: string
  description: string
  intent: string[]
  input: {
    type: "text" | "number" | "none" | "object"
    required: boolean
    // LAWP 0.3: the named fields of an "object" input, e.g. date, time, email
    fields?: InputField[]
  }
  // Makes the action executable by AI agents. Only used when served from your own
  // https://<domain>/.well-known/lawp.json — see https://docs.actuent.ai/#actions
  // Where a person can do this themselves, e.g. a booking page (LAWP 0.3)
  url?: string
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
