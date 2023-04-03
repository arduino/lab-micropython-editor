import React from 'react'
import ReactDOM from 'react-dom/client'

import Toolbar from './components/toolbar/toolbar'
import DiskNavigation from './components/navigation/diskNavigation'
import DiskFiles from './components/files/diskFiles'
import SerialNavigation from './components/navigation/serialNavigation'
import SerialFiles from './components/files/serialFiles'
import FileManagement from './components/files/fileManagement'

import { useMainLogic } from './main.logic.ts'

const App: React.FC = () => {
  const {
    waiting,
    toolbarLogic,
    diskNavigationLogic,
    diskFilesLogic,
    serialNavigationLogic,
    serialFilesLogic,
    fileManagementLogic
  } = useMainLogic()
  if (waiting) {
    return (
      <>
        <Toolbar toolbarLogic={toolbarLogic}></Toolbar>
        WAIT!
      </>
    )
  }
  return (
    <>
      <Toolbar toolbarLogic={toolbarLogic}></Toolbar>
      <div className="row">
        <div className="column">
          <SerialNavigation navigationLogic={serialNavigationLogic}></SerialNavigation>
          <div className="file-panel">
            <SerialFiles serialFilesLogic={serialFilesLogic}></SerialFiles>
          </div>
        </div>
        <div className="column file-management">
          <FileManagement fileManagementLogic={fileManagementLogic} />
        </div>
        <div className="column">
          <DiskNavigation navigationLogic={diskNavigationLogic}></DiskNavigation>
          <div className="file-panel">
            <DiskFiles diskFilesLogic={diskFilesLogic}></DiskFiles>
          </div>
        </div>
      </div>
    </>
  )
}

window.addEventListener('load', () => {
  window.BridgeWindow.setWindowSize(900, 600)
  const container : HTMLElement | null = document.querySelector('main')
  const root = ReactDOM.createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
