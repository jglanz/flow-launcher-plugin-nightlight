import { Flow, JSONRPCResponse } from "./lib/flow"
import { NightLight } from "./nightlight"
import logger from "./lib/logger"

const events = ["toggle", "set"] as const
type Events = (typeof events)[number]

const flow = new Flow<Events>("assets/bulb.png")
const nightlight = new NightLight()

flow.on("query", (params) => {
  let temp: string = null
  if (typeof params === "string" && (params as any).length) {
    temp = params
  }
  
  const results = [
    !temp && {
      title: `Nightlight Toggle`,
      subtitle: "Toggle on/off",
      method: "toggle",
      parameters: []
    }, temp && {
      title: `Nightlight Set Temperature`,
      subtitle: temp ? `Set temperature to ${temp}k` : "Acceptable range 1500-6500k",
      method: "set",
      parameters: [temp].filter(Boolean)
    }
  ].filter(Boolean) as JSONRPCResponse<any>[]
  flow.showResult(...results)
})

flow.on("set", async function(params:any){
  const arg =  typeof params === "string" ? params : params[0] as string
  const argLength = arg?.length ?? 0
  //logger.info(`SET params=${JSON.stringify(params)},argLength=${argLength},data=${JSON.stringify(this.data)}`)
  
  if (argLength < 1) {
    flow.showResult({
      title: `value required (1500-6500k)`
    })
    return
  }
  
  const value = parseInt(arg,10)
  await nightlight.setTemperature(value)
})


flow.on("toggle", async (params) => {
  await nightlight.toggle()
})

flow.run()
