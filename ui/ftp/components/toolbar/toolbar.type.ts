type ToolbarType = () => {
    availableDevices: String[]
    connectedDevice: String | null
    connect: (devicePath: String) => void
    disconnect: () => void
    openFolder: () => void
    refresh: () => void
}

export default ToolbarType