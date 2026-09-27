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
  // LAWP 0.4
  output?: { fields: InputField[] }
  modes?: ("execute" | "quote")[]
  safety?: { requires_confirmation?: boolean, costs_money?: boolean | { amount: number, currency: string }, reversible?: boolean, destructive?: boolean }
  account?: "none" | "optional" | "required"
  scopes?: string[]
  endpoint?: {
    url: string
    method?: "POST" | "GET"
  }
}

export type Page = {
  title: string
  content: string
}

export type OpeningHours = { days: ("Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su")[], opens: string, closes: string }

// LAWP 0.4: businesses describe themselves.
export type Business = {
  type?: string, name?: string, telephone?: string, email?: string, price_range?: string,
  address?: { street?: string, postcode?: string, city?: string, region?: string, country?: string },
  geo?: { lat: number, lon: number },
  opening_hours?: OpeningHours[],
  closed_on_public_holidays?: boolean,
  offers?: { name: string, price?: number, currency?: string, category?: string, description?: string, action?: string }[]
}

export type LawpConfig = {
  domain: string
  name: string
  pages: Record<string, Page>
  actions: Action[]
  // LAWP 0.4
  lawp_version?: string
  language?: string
  updated_at?: string
  ttl?: number
  business?: Business
  accounts?: { type: "oauth2", authorization_url: string, token_url: string, registration_url?: string, scopes?: Record<string, string> }
  translations?: Record<string, { name?: string, pages?: Record<string, Page>, actions?: Record<string, { name?: string, description?: string, intent?: string[] }> }>
  more_pages?: string[]
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

// ----- Client: search Actuent and use the same tools as ChatGPT and Claude -----

export type ClientOptions = { apiKey?: string, baseUrl?: string, agentsUrl?: string }

export class ActuentError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) { super(message) }
}

export class Actuent {
  private apiKey?: string
  private baseUrl: string
  private agentsUrl: string

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey
    this.baseUrl = (options.baseUrl || "https://api.actuent.ai").replace(/\/$/, "")
    this.agentsUrl = (options.agentsUrl || "https://agents.actuent.ai").replace(/\/$/, "")
  }

  private async request(url: string, body?: unknown): Promise<any> {
    const res = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Accept": "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new ActuentError(data?.error || data?.message || `HTTP ${res.status}`, res.status, data)
    return data
  }

  /** Search by topic, domain or page, in any language: { results, products }. */
  search(query: string) { return this.request(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`) }

  /** A site's agent-readiness score (0–100), label, category and checks. */
  score(domain: string) { return this.request(`${this.baseUrl}/badge.json?domain=${encodeURIComponent(domain)}`) }

  /** Call any Actuent MCP tool, e.g. tool("actuent_plan", { location: "Copenhagen" }). */
  async tool(name: string, args: Record<string, unknown> = {}): Promise<any> {
    const reply = await this.request(`${this.agentsUrl}/api/mcp`, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } })
    if (!reply?.result) throw new ActuentError(reply?.error?.message || "Unexpected response", undefined, reply)
    const text = (reply.result.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
    let data: any = text
    try { data = JSON.parse(text) } catch {}
    if (reply.result.isError) throw new ActuentError(data?.error || text || `${name} failed`, undefined, data)
    return data
  }

  getActions(domain: string) { return this.tool("actuent_get_actions", { domain }) }
  askSite(domain: string, question: string) { return this.tool("actuent_ask_site", { domain, question }) }
  nearby(query: string, location: string, options: { radius_metres?: number, open_now?: boolean, filters?: string[] } = {}) { return this.tool("actuent_nearby", { query, location, ...options }) }
  findService(query: string, options: { location?: string, max_price?: number, currency?: string } = {}) { return this.tool("actuent_find_service", { query, ...options }) }
  plan(location: string, options: { stops?: string[], date?: string, start_time?: string, cuisine?: string, filters?: string[] } = {}) { return this.tool("actuent_plan", { location, ...options }) }
  trip(location: string, options: { days?: number, start_date?: string, filters?: string[] } = {}) { return this.tool("actuent_trip", { location, ...options }) }
  events(options: { location?: string, query?: string, from?: string, to?: string } = {}) { return this.tool("actuent_events", options) }
  compareSites(domains: string[]) { return this.tool("actuent_compare", { domains }) }
  compareProducts(urls: string[]) { return this.tool("actuent_compare", { products: urls }) }
  /** Pro: email (and optional webhook) when the price drops or it's back in stock. */
  watchPrice(url: string, options: { target_price_eur?: number, notify?: "price" | "stock" | "both", webhook_url?: string } = {}) { return this.tool("actuent_watch_price", { url, ...options }) }
  /**
   * Pro: perform a site's action. Actions that cost money or ask for confirmation first return
   * needs_confirmation: show the user, then call again with { confirmed: true }. Use { mode: "quote" }
   * for price and availability without committing.
   */
  executeAction(domain: string, actionId: string, input?: unknown, options: { mode?: "execute" | "quote", confirmed?: boolean } = {}) { return this.tool("actuent_execute_action", { domain, action_id: actionId, input, ...options }) }
  /** Pro: check a long-running action that returned pending. */
  actionStatus(domain: string, statusUrl: string) { return this.tool("actuent_action_status", { domain, status_url: statusUrl }) }
}
