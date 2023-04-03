import React from 'react'
import DiskFilesType from './diskFiles.type.ts'
import Button from '../shared/button.tsx'
import { Device } from '../../main.type'

const DiskFiles: React.FC = ({ diskFilesLogic }) => {
    const {
      diskPath,
      selectedFiles = [],
      diskFiles = [],
      navigate,
      selectFile
    } : DiskFilesType = diskFilesLogic()
    const onNavigate = (folder) => () => navigate([diskPath,folder].join('/'))
    const onSelect = (folder) => () => selectFile([diskPath,folder].join('/'))
    const files = diskFiles.map((folder, i) => {
        const checked = selectedFiles
                        .filter(f => f.device === Device.disk)
                        .find(f => f.path === [diskPath,folder].join('/'))
        return (
          <li key={i}>
            <Button onClick={onSelect(folder)}>[{checked?`x`:' '}]</Button>
            <Button onClick={onNavigate(folder)}>{folder}</Button>
          </li>
        )
    })
    return <ul>{files}</ul>
}

export default DiskFiles
