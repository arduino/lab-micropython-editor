import React from 'react'
import SerialFilesType from './serialFiles.type.ts'
import Button from '../shared/button.tsx'
import { Device } from '../../main.type'

const SerialFiles: React.FC = ({ serialFilesLogic }) => {
  const {
    serialPath,
    selectedFiles = [],
    serialFiles = [],
    navigate,
    selectFile
  } : SerialFilesType = serialFilesLogic()
  const onNavigate = (folder) => () => navigate([serialPath,folder].join('/'))
  const onSelect = (folder) => () => selectFile([serialPath,folder].join('/'))
  const files = serialFiles.map((folder, i) => {
      const checked = selectedFiles
                      .filter(f => f.device === DeviceType.serial)
                      .find(f => f.path === [serialPath,folder].join('/'))
      return (
        <li key={i}>
          <Button onClick={onSelect(folder)}>[{checked?`x`:' '}]</Button>
          <Button onClick={onNavigate(folder)}>{folder}</Button>
        </li>
      )
  })
  return <ul>{files}</ul>
}

export default SerialFiles
