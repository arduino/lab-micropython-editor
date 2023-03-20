type DiskFilesType = () => {
    diskFiles: String[]
    // selectedFile: File
    navigate: (folder : String) => void
    selectFile: (path: String) => void
}

export default DiskFilesType