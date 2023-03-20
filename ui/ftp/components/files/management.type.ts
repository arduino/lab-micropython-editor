type FileManagementType = () => {
    upload: (diskPath: String, serialPath: String) => void
    download: (serialPath: String, diskPath: String) => void
    remove: () => void
}

export default FileManagementType