export enum Device { serial, disk }

export type File = {
    path: String
    device: Device
}