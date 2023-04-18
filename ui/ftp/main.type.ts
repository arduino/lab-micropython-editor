export enum DeviceType { serial, disk }

export type File = {
    path: String
    device: Device
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
