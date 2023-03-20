import React from 'react'
import ReactDOM from 'react-dom/client'

import Toolbar from './components/toolbar/toolbar'
import DiskNavigation from './components/navigation/diskNavigation'
import DiskFiles from './components/files/diskFiles'
import SerialNavigation from './components/navigation/serialNavigation'
import SerialFiles from './components/files/serialFiles'

import { useMainLogic } from './main.logic.ts'

const App: React.FC = () => {
  const { 
    toolbarLogic,
    diskNavigationLogic,
    diskFilesLogic,
    serialNavigationLogic,
    serialFilesLogic
  } = useMainLogic()
  return (
    <>
      <Toolbar toolbarLogic={toolbarLogic}></Toolbar>
      <div>
        <div>
          <DiskNavigation navigationLogic={diskNavigationLogic}></DiskNavigation>
          <DiskFiles diskFilesLogic={diskFilesLogic}></DiskFiles>
        </div>
        <div>
          <SerialNavigation navigationLogic={serialNavigationLogic}></SerialNavigation>
          <SerialFiles serialFilesLogic={serialFilesLogic}></SerialFiles>
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
