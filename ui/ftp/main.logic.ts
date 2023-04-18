import { useState } from 'react';

import { Device, File, AvailableDevices } from './main.type'

export const useMainLogic = function() {
  const { BridgeSerial, BridgeDisk } = window
  // List and connect to serial devices
  const [ availableDevices, setAvailableDevices ] = useState<AvailableDevices[]>()
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
    const newSelection = selectedFiles.filter(f => f.device !== DeviceType.disk)
    setSelectedFiles(newSelection)
  }

  const navigateSerial = async (newPath) => {
    const files = await BridgeSerial.listFiles(newPath)
    setSerialPath(newPath)
    setSerialFiles(files)
    const newSelection = selectedFiles.filter(f => f.device !== DeviceType.serial)
    setSelectedFiles(newSelection)
  }

  const refresh = async () => {
    setWaiting(true)
    // list available devices
    const devices = await BridgeSerial.loadPorts()
    setAvailableDevices(devices)
    // list serial files
    if (connectedDevice) {
      const files = await BridgeSerial.listFiles(serialPath)
      setSerialFiles(files)
    } else {
      setSerialFiles([])
    }
    // list disk files
    if (diskPath) {
      const files = await BridgeDisk.listFiles(diskPath)
      setDiskFiles(files)
    } else {
      setDiskFiles([])
    }
    setWaiting(false)
  }

  const serialLogic = () => ({
    availableDevices: availableDevices,
    connectedDevice: connectedDevice,
    serialPath: serialPath,
    serialFiles: serialFiles,
    selectedFiles: selectedFiles,
    connect: async (devicePath: String) => {
      setWaiting(true)
      await BridgeSerial.connect(devicePath)
      setConnectedDevice(devicePath)
      setSerialPath('/')
      const files = await BridgeSerial.listFiles('/')
      setSerialFiles(files)
      setWaiting(false)
    },
    disconnect: async () => {
      setWaiting(true)
      await BridgeSerial.disconnect()
      setConnectedDevice(null)
      setSerialPath(null)
      setSerialFiles([])
      setWaiting(false)
    },
    selectFile: (path) => {
      const serialFilesOnly = selectedFiles.filter(f => f.device === DeviceType.serial)
      const selected = serialFilesOnly.find(f => f.path === path)
      if (selected) {
        let newSelection = serialFilesOnly.filter(f => f.path !== path)
        setSelectedFiles(newSelection)
      } else {
        let file = {
          path: path,
          device: DeviceType.serial
        }
        serialFilesOnly.push(file)
        setSelectedFiles(serialFilesOnly.slice())
      }
    },
    refresh: refresh,
    navigate: navigateSerial,
  })
  const diskLogic = () => ({
    diskPath: diskPath,
    diskFiles: diskFiles,
    selectedFiles: selectedFiles,
    openFolder: async () => {
      const { folder, files } = await BridgeDisk.openFolder()
      setDiskPath(folder)
      setDiskFiles(files)
    },
    selectFile: (path) => {
      const diskFilesOnly = selectedFiles.filter(f => f.device === DeviceType.disk)
      const selected = diskFilesOnly.find(f => f.path === path)
      if (selected) {
        let newSelection = diskFilesOnly.filter(f => f.path !== path)
        setSelectedFiles(newSelection)
      } else {
        let file = {
          path: path,
          device: DeviceType.disk
        }
        diskFilesOnly.push(file)
        setSelectedFiles(diskFilesOnly.slice())
      }
    },
    navigate: navigateDisk
  })
  const fileManagementLogic = () => ({
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
          if (f.device === DeviceType.disk) {
            await BridgeDisk.removeFile(diskPath, filename)
          }
          if (f.device === DeviceType.serial) {
            await BridgeSerial.removeFile(f.path)
          }
        }
        refresh()
      } catch (e) {
        console.log('error', e)
      }
      setWaiting(false)
    },
    refresh: refresh
  })
  const loadingLogic = async () => ({
    waiting
  })

  return {
    waiting,
    serialLogic,
    diskLogic,
    fileManagementLogic,
    loadingLogic
  }
}
