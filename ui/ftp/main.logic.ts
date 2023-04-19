import { useState } from 'react';

import { DeviceType, File, FileType, AvailableDevices } from './main.type'

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
    setWaiting(true)
    setDiskPath(newPath)
    await refreshDiskFiles(newPath)
    const newSelection = selectedFiles.filter(f => f.device !== DeviceType.disk)
    setSelectedFiles(newSelection)
    setWaiting(false)
  }

  const navigateSerial = async (newPath) => {
    setWaiting(true)
    setSerialPath(newPath)
    await refreshSerialFiles(newPath)
    const newSelection = selectedFiles.filter(f => f.device !== DeviceType.serial)
    setSelectedFiles(newSelection)
    setWaiting(false)
  }

  const refreshSerialFiles = async (path: String) => {
    const detailedFiles = await BridgeSerial.ilistFiles(path)
    const folders = detailedFiles.filter(f => f[1] === FileType.folder) || []
    const files = detailedFiles.filter(f => f[1] === FileType.file) || []
    const sortedFiles = folders
      .concat(files)
      .map(f => ({
        path: f[0],
        type: (f[1] === FileType.folder) ? 'folder' : 'file',
        size: f[3],
        device: DeviceType.serial
      })) || []
    setSerialFiles(sortedFiles)
  }

  const refreshDiskFiles = async (path: String) => {
    const detailedFiles = await BridgeDisk.ilistFiles(path)
    const folders = detailedFiles.filter(f => f.type === 'folder') || []
    const files = detailedFiles.filter(f => f.type === 'file') || []
    const sortedFiles = folders
      .concat(files)
      .map(f => ({
        path: f.path,
        type: f.type,
        device: DeviceType.disk
      }))
    setDiskFiles(sortedFiles)
  }

  const refresh = async () => {
    setWaiting(true)
    // list available devices
    const devices = await BridgeSerial.loadPorts()
    setAvailableDevices(devices)
    // list serial files
    if (connectedDevice) await refreshSerialFiles(serialPath)
    else setSerialFiles([])
    // list disk files
    if (diskPath) await refreshDiskFiles(diskPath)
    else setDiskFiles([])

    setWaiting(false)
  }

  const serialLogic = () => ({
    availableDevices: availableDevices,
    connectedDevice: connectedDevice,
    serialPath: serialPath,
    serialFiles: serialFiles,
    selectedFiles: selectedFiles,
    connect: async (port: String) => {
      setWaiting(true)
      await BridgeSerial.connect(port)
      setConnectedDevice(port)
      setSerialPath('/')
      refreshSerialFiles(serialPath)
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
    selectFile: (file: File) => {
      const serialFilesOnly = selectedFiles.filter(f => f.device === DeviceType.serial)
      const selected = serialFilesOnly.find(f => f.path === file.path)
      if (selected) {
        let newSelection = serialFilesOnly.filter(f => f.path !== file.path)
        setSelectedFiles(newSelection)
      } else {
        serialFilesOnly.push(file)
        setSelectedFiles(serialFilesOnly.slice())
      }
    },
    navigate: navigateSerial,
  })
  const diskLogic = () => ({
    diskPath: diskPath,
    diskFiles: diskFiles,
    selectedFiles: selectedFiles,
    openFolder: async () => {
      const { folder, files } = await BridgeDisk.openFolder()
      setDiskPath(folder)
      await refreshDiskFiles(folder)
    },
    selectFile: (file: File) => {
      const diskFilesOnly = selectedFiles.filter(f => f.device === DeviceType.disk)
      const selected = diskFilesOnly.find(f => f.path === file.path)
      if (selected) {
        let newSelection = diskFilesOnly.filter(f => f.path !== file.path)
        setSelectedFiles(newSelection)
      } else {
        let f = {
          path: file.path,
          type: file.type,
          device: DeviceType.disk
        }
        diskFilesOnly.push(f)
        setSelectedFiles(diskFilesOnly.slice())
      }
    },
    navigate: navigateDisk
  })
  const fileManagementLogic = () => ({
    canUpload: selectedFiles.find(f => f.device === DeviceType.disk) && serialPath,
    canDownload: selectedFiles.find(f => f.device === DeviceType.serial) && diskPath,
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
            await BridgeSerial.removeFile(serialPath + '/' + f.path)
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
