import React from 'react'

type FileManagementParams = () => {
  upload: () => void
  download: () => void
  remove: () => void
  refresh: () => void
}

const FileManagementView: React.FC = ({ logic }) => {
    const { refresh } : FileManagementParams = logic()
    return (
      <div className="file-management column align-center justify-center">
        <button onClick={refresh}>↺</button>
        <button>←</button>
        <button>→</button>
        <button>×</button>
      </div>
    )
}

export default FileManagementView
