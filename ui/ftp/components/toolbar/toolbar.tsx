import React, { useState } from 'react'
import styles from './toolbar.module.scss'
import Button from '../shared/button.tsx'


const Toolbar: React.FC = ({ toolbarLogic }) => {
  const {
    openFolder,
    refresh,
    connect,
    disconnect,
    connectedDevice,
    availableDevices = []
  } = toolbarLogic()
  const [ selectedDevice, setSelectedDevice ] = useState<String | null>()
  const onChange = (e) => setSelectedDevice(e.target.value)
  const onConnect = () => {
    if (connectedDevice) {
      disconnect()
    } else {
      connect(selectedDevice)
    }
  }

  const deviceSelector = (
    <select onChange={onChange} value={selectedDevice}>
      <option value="none">Select a device...</option>
      {availableDevices.map((d, i) => <option key={i} value={d.path}>{d.path}</option>)}
    </select>
  )
  const deviceDisplay = <span>{connectedDevice}</span>

  return (
    <div className={styles.body}>
    <Button onClick={refresh}>Refresh</Button>
    {connectedDevice ? deviceDisplay : deviceSelector}
    {connectedDevice ? <span>✅</span> : <span>⛔</span>}
    <Button onClick={onConnect}>
    {connectedDevice ? 'Disconnect' : 'Connect'}
    </Button>
    <Button onClick={openFolder}>Select Folder</Button>
    </div>
  )
}

export default Toolbar
