// Actuent tools for the Vercel AI SDK (npm i ai).
//
//   import { actuentTools } from "@actuent/sdk/ai"
//   const result = await generateText({ model, tools: actuentTools(), prompt: "Find a vegan café in Copenhagen open late" })
//
// actuentTools({ apiKey: "ak_..." }) uses your Pro key.
import { ClientOptions } from "./index"
import { actuentToolSpecs } from "./tools"

export function actuentTools(options: ClientOptions = {}): Record<string, any> {
  let ai: any
  try { ai = require("ai") } catch { throw new Error('@actuent/sdk/ai needs the Vercel AI SDK: npm i ai') }
  const out: Record<string, any> = {}
  for (const t of actuentToolSpecs(options)) {
    const schema = ai.jsonSchema(t.parameters)
    // inputSchema (AI SDK 5+) and parameters (AI SDK 4) both point to the same schema.
    out[t.name] = ai.tool({ description: t.description, inputSchema: schema, parameters: schema, execute: (args: any) => t.run(args) })
  }
  return out
}
