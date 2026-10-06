// Search the live web the way an AI assistant does. Run: node examples/search.mjs "cafes in brooklyn open now"
import { Actuent } from "../dist/index.js"

const actuent = new Actuent()
const answer = await actuent.search(process.argv[2] || "does notion have a free plan")
for (const r of answer.results.slice(0, 3)) console.log(`- ${r.name} (${r.domain})${r.open_now ? " · open now" : ""}`)
if (answer.answer) console.log(`Answer: ${answer.answer.sentences[0].text}`)
if (!answer.results.length) process.exitCode = 1
