import { Flow } from "./lib/flow"
import { NightLight } from "./nightlight"

const events = ["toggle"] as const
type Events = (typeof events)[number]

const flow = new Flow<Events>("assets/bulb.png")
const nightlight = new NightLight()

flow.on("query", (params) => {
  flow.showResult({
    title: `Nightlight Toggle`,
    subtitle: "Toggle nightlight on/off",
    method: "toggle",
    parameters: []
  })
})

flow.on("toggle", async (params) => {
  await nightlight.toggle()
})

flow.run()
