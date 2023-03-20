import React from 'react'
import SerialFilesType from './serialFiles.type.ts'
import Button from '../shared/button.tsx'

const SerialFiles: React.FC = ({ serialFilesLogic }) => {    
    const { serialFiles = [], navigate }: SerialFilesType = serialFilesLogic()
    const onClick = (folder) => () => {
        navigate(folder)
    }
    const files = serialFiles.map((folder, i) => {
        return <li key={i}><Button onClick={onClick(folder)}>{folder}</Button></li>
    })
    return <ul>{files}</ul>
}

export default SerialFiles