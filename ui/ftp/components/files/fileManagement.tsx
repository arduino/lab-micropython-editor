import React from 'react'
import FileManagementType from './fileManagement.type'
import Button from '../shared/button.tsx'

const FileManagement: React.FC = ({ fileManagementLogic }) => {
    const { upload, download, remove }: FileManagementType = fileManagementLogic()
    return (
      <ul>
          <li><Button onClick={upload}>{`<-`}</Button></li>
          <li><Button onClick={download}>{`->`}</Button></li>
          <li><Button onClick={remove}>{`x`}</Button></li>
      </ul>
    )
}

export default FileManagement
