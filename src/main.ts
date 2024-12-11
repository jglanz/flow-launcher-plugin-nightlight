import { Flow, JSONRPCResponse } from "./lib/flow"
import { NightLight } from "./nightlight"

const events = ["toggle", "set"] as const
type Events = (typeof events)[number]

const flow = new Flow<Events>("assets/bulb.png")
const nightlight = new NightLight()

flow.on("query", (params) => {
  
  const results = [
    params.length < 2 && {
      title: `Nightlight Toggle`,
      subtitle: "Toggle on/off",
      method: "toggle",
      parameters: []
    }, {
      title: `Nightlight Set Temperature`,
      subtitle: "Acceptable range 1500-6500k",
      method: "set",
      parameters: []
    }
  ].filter(Boolean) as JSONRPCResponse<any>[]
  flow.showResult(...results)
})

flow.on("set", async (params) => {
  if (params.length === 0) {
    return flow.showResult({
      title: `value required (1500-6500k)`
    })
  }
  
  await nightlight.setTemperature(params[0] as number)
})


flow.on("toggle", async (params) => {
  await nightlight.toggle()
})

flow.run()
