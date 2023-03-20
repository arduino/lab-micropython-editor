import { useState } from 'react';

import ToolbarType from './components/toolbar/toolbar.type'
import DiskNavigationType from './components/navigation/diskNavigation.type'
import DiskFilesType from './components/files/diskFiles.type'
import SerialNavigationType from './components/navigation/serialNavigation.type'
import SerialFilesType from './components/files/serialFiles.type'
import FileManagementType from './components/files/management.type'

import { Device, File } from './main.type'

export type UseMainLogic = () => {
    toolbarLogic: ToolbarType
    diskNavigationLogic: DiskNavigationType
    diskFilesLogic: DiskFilesType
    serialNavigationLogic: SerialNavigationType
    serialFilesLogic: SerialFilesType
    fileManagementLogic: FileManagementType
}

export const useMainLogic : UseMainLogic = function() : ReturnType<UseMainLogic> {
    const { BridgeSerial, BridgeDisk } = window
    // List and connect to serial devices
    const [ availableDevices, setAvailableDevices ] = useState<String[]>()
    const [ connectedDevice, setConnectedDevice ] = useState<String | null>()
    // Navigation paths
    const [ serialPath, setSerialPath ] = useState<String | null>()
    const [ diskPath, setDiskPath ] = useState<String | null>()
    // Available files (listed)
    const [ diskFiles, setDiskFiles ] = useState<String[]>()
    const [ serialFiles, setSerialFiles ] = useState<String[]>()
    // Selected file
    const [ selectedFile, setSelectedFile ] = useState<File | null>()
    // Progress
    const [ waiting, setWaiting ] = useState<Boolean>()

    // HELPERS
    const navigateDisk = async (folder) => {
        const pathArray = diskPath.split('/')
        const folderIndex = pathArray.indexOf(folder)
        let newPathArray = []
        if (folderIndex === -1) {
            newPathArray = pathArray.concat(folder)
        } else {
            newPathArray = pathArray.slice(0, folderIndex+1)
        }
        const newPath = newPathArray.join('/')
        const files = await BridgeDisk.listFiles(newPath)
        setDiskPath(newPath)
        setDiskFiles(files)
    }

    const navigateSerial = async (folder) => {
        const pathArray = serialPath.split('/')
        const folderIndex = pathArray.indexOf(folder)
        let newPathArray = []
        if (folderIndex === -1) {
            newPathArray = pathArray.concat(folder)
        } else {
            newPathArray = pathArray.slice(0, folderIndex+1)
        }
        const newPath = newPathArray.join('/')
        const files = await BridgeSerial.listFiles(newPath)
        setSerialPath(newPath)
        setSerialFiles(files)
    }

    // LOGIC
    const toolbarLogic = () : ReturnType<ToolbarType> => {
        return {
            availableDevices: availableDevices,
            connectedDevice: connectedDevice,
            connect: async (devicePath: String) => {
                await BridgeSerial.connect(devicePath)
                setConnectedDevice(devicePath)
                setSerialPath('/')
            },
            disconnect: () => {
                setConnectedDevice(null)
                setSerialPath(null)
            },
            openFolder: async () => {
                const { folder, files } = await BridgeDisk.openFolder()
                setDiskPath(folder)
                setDiskFiles(files)
            },
            refresh: async () => {
                // list available devices
                const devices = await BridgeSerial.loadPorts()
                setAvailableDevices(devices)
                // list serial files
                if (connectedDevice) {
                    const files = await BridgeSerial.listFiles(serialPath)
                    setSerialFiles(files)
                }
                // list disk files
                if (diskPath) {
                    const files = await BridgeDisk.listFiles(diskPath)
                    setDiskFiles(files)
                }
            }
        }
    }

    const diskNavigationLogic = () : ReturnType<DiskNavigationType> => {
        return {
            diskPath: diskPath,
            navigate: navigateDisk
        }
    }

    const diskFilesLogic = () : ReturnType<DiskFilesType> => {
        return {
            diskFiles: diskFiles,
            // selectedFile: selectedFile,
            navigate: navigateDisk,
            selectFile: (path) => {
                setSelectedFile({
                    path: path, 
                    device: Device.disk
                })
            }
        }
    }

    const serialNavigationLogic = () : ReturnType<SerialNavigationType> => {
        return {
            serialPath: serialPath,
            navigate: navigateSerial
        }
    }

    const serialFilesLogic = () : ReturnType<SerialFilesType> => {
        return {
            serialFiles: serialFiles,
            selectedFile: selectedFile,
            navigate: navigateSerial,
            selectFile: (path) => {
                setSelectedFile({
                    path: path,
                    device: Device.serial
                })
            }
        }
    }

    const fileManagementLogic = () : ReturnType<FileManagementType> => {
        return {
            upload: (diskPath, serialPath) => {},
            download: (serialPath, diskPath) => {},
            remove: () => {}
        }
    }

    return {
        toolbarLogic,
        diskNavigationLogic,
        diskFilesLogic,
        serialNavigationLogic,
        serialFilesLogic,
        fileManagementLogic
    }
}

