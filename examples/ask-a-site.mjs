// Answer a question from one website's own pages. Run: node examples/ask-a-site.mjs notion.com "is there a free plan"
import { Actuent } from "../dist/index.js"

const [domain = "notion.com", question = "is there a free plan"] = process.argv.slice(2)
const actuent = new Actuent()
const answer = await actuent.askSite(domain, question)
const pages = answer.pages || []
for (const p of pages.slice(0, 2)) console.log(`${p.title}: ${(p.matches || [])[0] || ""}\n  ${p.url}`)
if (!pages.length) process.exitCode = 1
