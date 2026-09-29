// The Actuent tools every framework gets: name, description, JSON Schema input and what they do.
import { Actuent, ClientOptions } from "./index"

export type ActuentToolSpec = { name: string, description: string, parameters: Record<string, any>, run: (args: any) => Promise<unknown> }

export function actuentToolSpecs(options: ClientOptions = {}): ActuentToolSpec[] {
  const client = new Actuent(options)
  const obj = (properties: Record<string, any>, required: string[]) => ({ type: "object", properties, required, additionalProperties: false })
  return [
    {
      name: "actuent_search",
      description: "Search websites and products for the user. Returns each site's pages summarised in plain English, the actions a visitor can take (book, contact, buy), and for shopping searches, products with prices and price history. Also answers 'A vs B' comparisons and questions about one site. Works in any language; results are in English.",
      parameters: obj({ query: { type: "string", description: "What to find: a topic ('barber amsterdam'), a name ('notion'), a domain ('nike.com'), a comparison ('notion vs obsidian') or a product search ('running shoes under €100')" } }, ["query"]),
      run: ({ query }) => client.search(query)
    },
    {
      name: "actuent_ask_site",
      description: "Answer a question from one website's own pages ('does basecamp have a free plan?', 'is there parking?'). Returns matching sentences with the page each came from.",
      parameters: obj({ domain: { type: "string", description: "The site, e.g. basecamp.com" }, question: { type: "string", description: "The question, in plain words" } }, ["domain", "question"]),
      run: ({ domain, question }) => client.ask(domain, question)
    },
    {
      name: "actuent_similar",
      description: "Find websites like a given one ('alternatives to mailchimp.com'), with why each is similar.",
      parameters: obj({ domain: { type: "string", description: "The site to find alternatives to, e.g. notion.so" } }, ["domain"]),
      run: ({ domain }) => client.similar(domain)
    }
  ]
}
