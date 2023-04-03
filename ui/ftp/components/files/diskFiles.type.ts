type DiskFilesType = () => {
  diskPath: string,
  diskFiles: string[]
  selectedFiles: File[]
  navigate: (folder : string) => void
  selectFile: (path: string) => void
}

export default DiskFilesType
