import React from 'react'

import {
  File,
  DeviceType
} from '../main.type.ts'

type DiskViewParams = {
  waiting: Boolean,
  diskPath: String
  diskFiles: File[]
  selectedFiles: File[]
  openFolder: () => void
  selectFile: (file: File) => void
  navigate: (path: String) => void
}

const DiskView: React.FC = ({ logic }) => {
    const {
      waiting = true,
      diskPath,
      diskFiles = [],
      selectedFiles = [],
      openFolder,
      selectFile,
      navigate
    } : DiskViewParams = logic()

    const ListItem = (file: File, i: number) => {
      const onClick = () => {
        if (file.type === 'file') {
          selectFile(file)
        } else {
          navigate(diskPath + '/' + file.path)
        }
      }
      const checked = selectedFiles
        .filter(f => f.device === DeviceType.disk)
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
      const crumbs = diskPath.split('/').filter(c => c !== '')
      const path = '/' + crumbs.slice(0, i).join('/')
      return (
        <button key={i} onClick={() => navigate(path)}>{name}</button>
      )
    }
    let diskPathArray = []
    if (diskPath) {
      diskPathArray = ['/'].concat(
        diskPath.split('/').filter(s => s !== '')
      )
    }
    return (
      <div className="column file-panel">
        <div className="toolbar row full-width">
            <button onClick={openFolder}>Select folder</button>
        </div>
        <div className="row full-width navigation">
          {diskPathArray.map(NavigationItem)}
        </div>
        <div className="column full-width full-height list">
          {diskFiles.map(ListItem)}
        </div>
      </div>
    )
}

export default DiskView
