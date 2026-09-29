// Actuent tools for LangChain.js (npm i @langchain/core).
//
//   import { actuentLangChainTools } from "@actuent/sdk/langchain"
//   const agent = createReactAgent({ llm, tools: actuentLangChainTools() })
//
// actuentLangChainTools({ apiKey: "ak_..." }) uses your Pro key.
import { ClientOptions } from "./index"
import { actuentToolSpecs } from "./tools"

export function actuentLangChainTools(options: ClientOptions = {}): any[] {
  let lc: any
  try { lc = require("@langchain/core/tools") } catch { throw new Error("@actuent/sdk/langchain needs LangChain: npm i @langchain/core") }
  return actuentToolSpecs(options).map(t => lc.tool(async (args: any) => JSON.stringify(await t.run(args)), { name: t.name, description: t.description, schema: t.parameters }))
}
