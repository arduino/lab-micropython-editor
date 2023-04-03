import { useState } from 'react';

import ToolbarType from './components/toolbar/toolbar.type'
import DiskNavigationType from './components/navigation/diskNavigation.type'
import DiskFilesType from './components/files/diskFiles.type'
import SerialNavigationType from './components/navigation/serialNavigation.type'
import SerialFilesType from './components/files/serialFiles.type'
import FileManagementType from './components/files/fileManagement.type'

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
  // Selected files
  const [ selectedFiles = [], setSelectedFiles ] = useState<File[]>()
  // Progress
  const [ waiting, setWaiting ] = useState<Boolean>()

  // HELPERS
  const navigateDisk = async (newPath) => {
    const files = await BridgeDisk.listFiles(newPath)
    setDiskPath(newPath)
    setDiskFiles(files)
    const newSelection = selectedFiles.filter(f => f.device !== Device.disk)
    setSelectedFiles(newSelection)
  }

  const navigateSerial = async (newPath) => {
    const files = await BridgeSerial.listFiles(newPath)
    setSerialPath(newPath)
    setSerialFiles(files)
    const newSelection = selectedFiles.filter(f => f.device !== Device.serial)
    setSelectedFiles(newSelection)
  }

  // LOGIC
  const refresh = async () => {
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
  const toolbarLogic = () : ReturnType<ToolbarType> => {
    return {
      availableDevices: availableDevices,
      connectedDevice: connectedDevice,
      connect: async (devicePath: String) => {
        await BridgeSerial.connect(devicePath)
        setConnectedDevice(devicePath)
        setSerialPath('/')
        const files = await BridgeSerial.listFiles('/')
        setSerialFiles(files)
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
      refresh: refresh
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
      diskPath: diskPath,
      diskFiles: diskFiles,
      selectedFiles: selectedFiles,
      navigate: navigateDisk,
      selectFile: (path) => {
        const diskFilesOnly = selectedFiles.filter(f => f.device === Device.disk)
        const selected = diskFilesOnly.find(f => f.path === path)
        if (selected) {
          let newSelection = diskFilesOnly.filter(f => f.path !== path)
          setSelectedFiles(newSelection)
        } else {
          let file = {
            path: path,
            device: Device.disk
          }
          diskFilesOnly.push(file)
          setSelectedFiles(diskFilesOnly.slice())
        }
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
      serialPath: serialPath,
      serialFiles: serialFiles,
      selectedFiles: selectedFiles,
      navigate: navigateSerial,
      selectFile: (path) => {
        const serialFilesOnly = selectedFiles.filter(f => f.device === Device.serial)
        const selected = serialFilesOnly.find(f => f.path === path)
        if (selected) {
          let newSelection = serialFilesOnly.filter(f => f.path !== path)
          setSelectedFiles(newSelection)
        } else {
          let file = {
            path: path,
            device: Device.serial
          }
          serialFilesOnly.push(file)
          setSelectedFiles(serialFilesOnly.slice())
        }
      }
    }
  }

  const fileManagementLogic = () : ReturnType<FileManagementType> => {
    return {
      upload: async () => {
        setWaiting(true)
        try {
          for (let i = 0; i < selectedFiles.length; i++) {
            const filename = selectedFiles[i].path.split('/').pop()
            await BridgeSerial.uploadFile(diskPath, serialPath, filename)
          }
          refresh()
        } catch (e) {
          console.log('error', e)
        }
        setWaiting(false)
      },
      download: async () => {
        setWaiting(true)
        try {
          for (let i = 0; i < selectedFiles.length; i++) {
            const filename = selectedFiles[i].path.split('/').pop()
            await BridgeSerial.downloadFile(serialPath, diskPath, filename)
          }
          refresh()
        } catch (e) {
          console.log('error', e)
        }
        setWaiting(false)
      },
      remove: async () => {
        setWaiting(true)
        try {
          for (let i = 0; i < selectedFiles.length; i++) {
            const f = selectedFiles[i]
            const filename = f.path.split('/').pop()
            if (f.device === Device.disk) {
              await BridgeDisk.removeFile(diskPath, filename)
            }
            if (f.device === Device.serial) {
              await BridgeSerial.removeFile(f.path)
            }
          }
          refresh()
        } catch (e) {
          console.log('error', e)
        }
        setWaiting(false)
      }
    }
  }

  return {
    toolbarLogic,
    diskNavigationLogic,
    diskFilesLogic,
    serialNavigationLogic,
    serialFilesLogic,
    fileManagementLogic,
    waiting
  }
}
