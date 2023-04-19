export enum DeviceType { serial, disk }
export enum FileType { file = 0x8000, folder = 0x4000 }

export type File = {
    path: String
    type: FileType
    device: Device
    size?: Number
}

export type AvailableDevice = {
  locationId: undefined | string
  manufacturer: string
  path: string
  pnpId: string
  productId: string
  serialNumber: string
  vendorId: string
}
