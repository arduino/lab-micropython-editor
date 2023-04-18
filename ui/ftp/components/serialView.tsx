import { React } from 'react'

import {
  File,
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
    serialPath = '',
    connect,
    disconnect
  } : SerialParams = logic()

  const onSelectDevice = (e) => {
    const value = e.target.value
    if (value === "null") {
      disconnect()
    } else {
      connect(value)
    }
  }

  const ListItem = (file: File, i: number) => (
    <div className="list-item" key={i}>
      <input className="checkbox" type="checkbox" />
      <span>{file}</span>
    </div>
  )

  const NavigationItem = (name: string, i:number) => (
    <button key={i}>{name}</button>
  )
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
