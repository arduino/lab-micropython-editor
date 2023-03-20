import React from 'react'
import DiskFilesType from './diskFiles.type.ts'
import Button from '../shared/button.tsx'

const DiskFiles: React.FC = ({ diskFilesLogic }) => {    
    const { diskFiles = [], navigate }: DiskFilesType = diskFilesLogic()
    const onClick = (folder) => () => {
        navigate(folder)
    }
    const files = diskFiles.map((folder, i) => {
        return <li key={i}><Button onClick={onClick(folder)}>{folder}</Button></li>
    })
    return <ul>{files}</ul>
}

export default DiskFiles