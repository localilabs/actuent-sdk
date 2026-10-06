// What's on tonight in a city, from venues' own listings. Run: node examples/whats-on.mjs Copenhagen
import { Actuent } from "../dist/index.js"

const city = process.argv[2] || "Copenhagen"
const actuent = new Actuent()
const { events = [], events_found } = await actuent.events({ location: city, when: "tonight" })
console.log(`${events_found} events in ${city} tonight`)
for (const e of events.slice(0, 5)) console.log(`- ${e.start_date.slice(11, 16)} ${e.name} @ ${e.venue}${e.genre ? ` (${e.genre})` : ""}`)
if (!events_found) process.exitCode = 1
