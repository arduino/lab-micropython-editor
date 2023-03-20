type SerialFilesType = () => {
    serialFiles: String[]
    selectedFile: File
    navigate: (folder : String) => void
    selectFile: (path: String) => void
}

export default SerialFilesType