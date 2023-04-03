type SerialFilesType = () => {
    serialFiles: String[]
    selectedFiles: File[]
    navigate: (folder : String) => void
    selectFile: (path: String) => void
}

export default SerialFilesType
