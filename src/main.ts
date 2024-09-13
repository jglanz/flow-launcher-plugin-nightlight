import { Flow } from "./lib/flow"
import { NightLight } from "./nightlight"

// The events are the custom events that you define in the flow.on() method.
const events = ["toggle"] as const
type Events = (typeof events)[number]

const flow = new Flow<Events>("assets/bulb.png")
const nightlight = new NightLight()

flow.on("query", (params) => {
  flow.showResult({
    title: `Nightlight Toggle`,
    subtitle: "Toggle nightlight on/off",
    method: "toggle",
    parameters: [] // dontHideAfterAction: true,
  })
})

flow.on("toggle", async (params) => {
  await nightlight.toggle()
})

flow.run()
