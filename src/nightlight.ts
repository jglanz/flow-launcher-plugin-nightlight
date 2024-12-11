import WinReg from "winreg"

export enum NightLightKeyPath {
  State = "\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.bluelightreduction.bluelightreductionstate\\windows.data.bluelightreduction.bluelightreductionstate",
  Settings = "\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.bluelightreduction.settings\\windows.data.bluelightreduction.settings"
}

function markDataChanged(newData: number[]): void {
  for (let i = 10; i < 15; i++) {
    if (newData[i] !== 0xff) {
      newData[i]++
      break
    }
  }
}

/**
 * A class for inspecting Windows 10/11's Night Light feature.
 */
export class NightLight {
  private readonly registryStateKey_ = new WinReg({
    hive: WinReg.HKCU,
    key: NightLightKeyPath.State
  })

  private readonly registrySettingsKey_ = new WinReg({
    hive: WinReg.HKCU,
    key: NightLightKeyPath.Settings
  })

  constructor() {}

  supported(): boolean {
    return this.registryStateKey_ != null
  }

  getData(key: NightLightKeyPath = NightLightKeyPath.State): Promise<WinReg.RegistryItem> {
    const regKey =
      key === NightLightKeyPath.State ? this.registryStateKey_ : this.registrySettingsKey_
    return new Promise<WinReg.RegistryItem>((resolve, reject) =>
      regKey.get("Data", (err, result) => (err ? reject(err) : resolve(result)))
    )
  }

  async enabled(): Promise<boolean> {
    if (!this.supported()) return false
    const data = await this.getData()
    if (!data) return false
    const bytes = hexToBytes(data.value)
    return bytes[18] === 0x15 // 21 in decimal
  }

  async enable(): Promise<void> {
    if (this.supported() && !(await this.enabled())) await this.toggle()
  }

  async disable(): Promise<void> {
    if (this.supported() && (await this.enabled())) await this.toggle()
  }

  async toggle(): Promise<void> {
    let newData: number[]
    const enabled = await this.enabled()
    const rawData = await this.getData()
    const data = hexToBytes(rawData.value)

    if (enabled) {
      newData = new Array(41).fill(0)
      newData.splice(0, 22, ...data.slice(0, 22))
      newData.splice(23, 43 - 25, ...data.slice(25, 43))
      newData[18] = 0x13
    } else {
      newData = new Array(43).fill(0)
      newData.splice(0, 22, ...data.slice(0, 22))
      newData.splice(25, 41 - 23, ...data.slice(23, 41))
      newData[18] = 0x15
      newData[23] = 0x10
      newData[24] = 0x00
    }

    markDataChanged(newData)

    const newDataHex = bytesToHex(newData)
    return new Promise<void>((resolve, reject) =>
      this.registryStateKey_.set("Data", WinReg.REG_BINARY, newDataHex, (err) => {
        err ? reject(err) : resolve()
      })
    )
  }

  async getTemperature(): Promise<number> {
    const rawData = await this.getData(NightLightKeyPath.Settings)
    const data = hexToBytes(rawData.value)
    const size = data.length
    const tempOffset = size - 20
    const tempPart1 = data[tempOffset],
      tempPart2 = data[tempOffset + 1]

    const adjustedTemp = tempPart1 / 2 - 0x80
    const temp = (tempPart2 << 6) + adjustedTemp
    
    return temp
  }

  async setTemperature(value: number): Promise<number> {
    if (value < 1200 || value > 6500) return -1

    const rawData = await this.getData(NightLightKeyPath.Settings)
    const data = hexToBytes(rawData.value)
    const size = data.length
    const tempOffset = size - 20
    data[tempOffset] = (value & 0x3f) * 2 + 0x80
    data[tempOffset + 1] = value >> 6

    markDataChanged(data)

    const newDataHex = bytesToHex(data)
    await new Promise<void>((resolve, reject) =>
      this.registrySettingsKey_.set("Data", WinReg.REG_BINARY, newDataHex, (err) => {
        err ? reject(err) : resolve()
      })
    )
    return await this.getTemperature()
  }
}

// Convert a hex string to a byte array
export function hexToBytes(hex: string): number[] {
  let bytes = []
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16))
  }
  return bytes
}

// Convert a byte array to a hex string
export function bytesToHex(bytes: number[]): string {
  let hex = []
  for (let i = 0; i < bytes.length; i++) {
    let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i]
    hex.push((current >>> 4).toString(16))
    hex.push((current & 0xf).toString(16))
  }
  return hex.join("")
}

// Example usage:
// const nightLight = new NightLight()
// console.log('Supported:', nightLight.supported())
// console.log('Enabled:', await nightLight.enabled())
// console.log('Toggling')
// await nightLight.toggle()
// console.log('Enabled:', await nightLight.enabled())
