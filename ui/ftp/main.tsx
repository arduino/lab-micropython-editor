import React from 'react'
import { useEffect } from 'react'
import ReactDOM from 'react-dom/client'

import SerialView from './components/serialView.tsx'
import FileManagementView from './components/fileManagementView.tsx'
import DiskView from './components/diskView.tsx'
import LoadingView from './components/loadingView.tsx'

import { useMainLogic } from './main.logic.ts'

const App: React.FC = () => {
  const {
    waiting,
    serialLogic,
    diskLogic,
    fileManagementLogic,
    loadingLogic,
    refresh
  } = useMainLogic()

  useEffect(() => {
    refresh()
  }, [])

  const overlay = (
    <div className="window-overlay">
      <div>Waiting</div>
    </div>
  )
  return (
    <>
    <div className="window-wrapper row">
      <SerialView logic={serialLogic} />
      <FileManagementView logic={fileManagementLogic} />
      <DiskView logic={diskLogic} />
    </div>
    {waiting ? overlay : null}
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
