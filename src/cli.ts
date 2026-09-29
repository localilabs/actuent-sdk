#!/usr/bin/env node
// npx actuent: Actuent from the terminal.
//   npx actuent search <query>             websites and products, as AI agents see them
//   npx actuent ask <domain> <question>    answer a question from one site's own pages
//   npx actuent similar <domain>           sites like this one
//   npx actuent <anything else>            the same as search
// Add --json for the raw response, or set ACTUENT_API_KEY for Pro.
import { Actuent } from "./index"
import { lawpyAnimate, lawpySay, canDraw } from "./lawpy"

const args = process.argv.slice(2)
const json = args.includes("--json")
const words = args.filter(a => a !== "--json")
const client = new Actuent({ apiKey: process.env.ACTUENT_API_KEY })
const color = canDraw(process.stdout)
const c = (code: number, s: string) => color ? `\x1b[${code}m${s}\x1b[0m` : s
const bold = (s: string) => c(1, s), dim = (s: string) => c(2, s), orange = (s: string) => color ? `\x1b[38;5;208m${s}\x1b[0m` : s

async function main(): Promise<number> {
  const [cmd, ...rest] = words
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    // Lawpy says hello on the quickstart screen.
    await lawpyAnimate("wave", ["Hi, I'm Lawpy from Actuent!", "Search the web as AI agents see it."], 2)
    console.log(`
${bold("Quickstart")}
  npx actuent search "vegan café copenhagen"      websites and products
  npx actuent ask basecamp.com "free plan?"       answer from a site's own pages
  npx actuent similar notion.so                   sites like this one

${bold("In your code")}
  npm i @actuent/sdk
  import { Actuent } from "@actuent/sdk"
  const results = await new Actuent().search("running shoes under €100")

  Agents: import { actuentTools } from "@actuent/sdk/ai" (Vercel AI SDK)
          import { actuentLangChainTools } from "@actuent/sdk/langchain"

${dim("Add --json for raw output · ACTUENT_API_KEY for Pro · Docs: https://docs.actuent.ai")}`)
    return 0
  }

  if (cmd === "ask") {
    const [domain, ...q] = rest
    if (!domain || !q.length) { console.error('Usage: npx actuent ask <domain> "<question>"'); return 1 }
    const d = await client.ask(domain, q.join(" "))
    if (json) { console.log(JSON.stringify(d, null, 2)); return 0 }
    if (!d.sentences.length) { lawpySay("think", [d.message || "No answer on its pages."]); return 0 }
    lawpySay("idle", [`${bold(d.name)} ${dim(`(${d.domain})`)}`, `“${q.join(" ")}”`])
    for (const s of d.sentences) console.log(`\n  “${s.text}”\n  ${dim(s.url)}`)
    for (const a of d.actions || []) if (a.url) console.log(`\n  ${orange("→")} ${a.name}: ${a.url}`)
    console.log(`\n${dim(d.note || "")}`)
    return 0
  }

  if (cmd === "similar") {
    const [domain] = rest
    if (!domain) { console.error("Usage: npx actuent similar <domain>"); return 1 }
    const d = await client.similar(domain)
    if (json) { console.log(JSON.stringify(d, null, 2)); return 0 }
    if (!d.sites.length) { lawpySay("think", [d.message || `Nothing like ${domain} yet.`]); return 0 }
    console.log(bold(`Sites like ${domain}\n`))
    for (const s of d.sites) console.log(`  ${orange(s.domain.padEnd(28))} ${s.name !== s.domain ? s.name : ""}\n  ${" ".repeat(28)} ${dim(s.why)}`)
    return 0
  }

  const query = (cmd === "search" ? rest : words).join(" ").trim()
  if (!query) { console.error('Usage: npx actuent search "<query>"'); return 1 }
  const d: any = await client.search(query)
  if (json) { console.log(JSON.stringify(d, null, 2)); return 0 }
  const results = d.results || []
  if (!results.length && !(d.products || []).length) { lawpySay("think", [d.message || `Nothing found for “${query}” yet.`]); return 0 }
  if (d.searched_for) console.log(dim(`Showing results for “${d.searched_for}”\n`))
  else if (d.did_you_mean) console.log(dim(`Did you mean “${d.did_you_mean}”?\n`))
  if (d.answer?.sentences?.length) {
    console.log(bold(`From ${d.answer.domain}:`))
    for (const s of d.answer.sentences) console.log(`  “${s.text}”`)
    console.log("")
  }
  for (const [i, r] of results.slice(0, 8).entries()) {
    const bits = [r.category?.replace(/_/g, " "), r.open_now === true ? "open now" : null, r.executable ? "executable actions" : null].filter(Boolean).join(" · ")
    console.log(`${dim(String(i + 1).padStart(2))} ${orange(r.domain)} ${r.name && r.name !== r.domain ? bold(r.name) : ""}${bits ? dim(`  ${bits}`) : ""}`)
    if (r.snippet) console.log(`   ${r.snippet}`)
  }
  for (const p of (d.products || []).slice(0, 5)) console.log(`   ${orange("£€$")} ${p.name}: ${p.price} ${p.currency} ${dim(p.domain)}${p.lowest_90_days ? c(32, "  lowest in 90 days") : ""}`)
  if (d.related?.length) console.log(dim(`\nRelated: ${d.related.join(" · ")}`))
  return 0
}

main().then(code => process.exit(code), e => { console.error(e?.message || e); process.exit(1) })
