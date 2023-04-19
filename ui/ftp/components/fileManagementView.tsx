import React from 'react'

import { File, DeviceType } from '../main.type.ts'

type FileManagementParams = () => {
  upload: () => void
  download: () => void
  remove: () => void
  refresh: () => void
  canDownload: Boolean,
  canUpload: Boolean,
  selectedFiles: File[]
}

const FileManagementView: React.FC = ({ logic }) => {
    const {
      refresh,
      download,
      upload,
      remove,
      canUpload,
      canDownload,
      selectedFiles = []
    } : FileManagementParams = logic()
    return (
      <div className="file-management column align-center justify-center">
        <button onClick={refresh}>↺</button>
        <button disabled={!canUpload} onClick={upload}>←</button>
        <button disabled={!canDownload} onClick={download}>→</button>
        <button onClick={remove}>×</button>
      </div>
    )
}

export default FileManagementView
