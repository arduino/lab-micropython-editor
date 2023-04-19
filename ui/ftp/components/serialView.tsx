import { React } from 'react'

import {
  File,
  DeviceType,
  AvailableDevice
} from '../main.type.ts'

type SerialParams = () => {
  availableDevices: AvailableDevices[]
  connectedDevice: string
  serialPath: string
  serialFiles: String[]
  selectedFiles: File[]
  connect: (path: string) => void
  disconnect: () => void
  selectFile: (path: string) => void
  refresh: () => void
  navigate: (path: string) => void
}

const SerialView: React.FC = ({ logic }) => {
  const {
    availableDevices = [],
    serialFiles = [],
    selectedFiles = [],
    serialPath = '',
    connect,
    disconnect,
    navigate,
    selectFile
  } : SerialParams = logic()

  const onSelectDevice = (e) => {
    const value = e.target.value
    if (value === "null") {
      disconnect()
    } else {
      connect(value)
    }
  }

  const ListItem = (file: File, i: number) => {
    const onClick = () => {
      if (file.type === 'file') {
        selectFile(file)
      } else {
        navigate(serialPath + '/' + file.path)
      }
    }
    const checked = selectedFiles
      .filter(f => f.device === DeviceType.serial)
      .find(f => f.path === file.path)
    const icon = file.type === 'file'
      ? <div className="checkbox">📄</div>
      : <div className="checkbox">📁</div>
    return (
      <div className={`list-item ${checked?'checked':''}`} key={i} onClick={onClick}>
        {icon}<span>{file.path}</span>
      </div>
    )
  }

  const NavigationItem = (name: string, i:number) => {
    const crumbs = serialPath.split('/').filter(c => c !== '')
    const path = '/' + crumbs.slice(0, i).join('/')
    return (
      <button key={i} onClick={() => navigate(path)}>{name}</button>
    )
  }
  let serialPathArray = []
  if (serialPath) {
    serialPathArray = ['/'].concat(
      serialPath.split('/').filter(s => s !== '')
    )
  }

  return (
    <div className="column file-panel">
      <div className="toolbar row">
        <select onChange={onSelectDevice}>
          <option value="null">Select a device...</option>
          {availableDevices.map((d, i) => <option key={i}>{d.path}</option>)}
        </select>
      </div>
      <div className="row full-width navigation">
        {serialPathArray.map(NavigationItem)}
      </div>
      <div className="column full-width list full-height">
        {serialFiles.map(ListItem)}
      </div>
    </div>
  )
}

export default SerialView
