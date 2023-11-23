const log = console.log
const serial = window.BridgeSerial
const disk = window.BridgeDisk

async function store(state, emitter) {
  state.view = 'editor'
  state.diskNavigationPath = '/'
  state.diskNavigationRoot = getDiskNavigationRootFromStorage()
  state.diskFiles = []
  state.boardNavigationPath = '/'
  state.boardFiles = []
  state.openFiles = []
  state.selectedFiles = []
  state.editingFile = null
  state.creatingFile = null
  state.renamingFile = null

  state.availablePorts = []

  state.isConnectionDialogOpen = false
  state.isConnecting = false
  state.isConnected = false
  state.connectedPort = null


  state.isPanelOpen = false
  state.isSaving = false
  state.savingProgress = 0
  state.isTransferring = false
  state.transferringProgress = 0
  state.isRemoving = false

  state.isLoadingFiles = false
  state.dialogs = []

  state.isTerminalBound = false

  const newFile = createEmptyFile({
    parentFolder: null, // Null parent folder means not saved?
    source: 'disk'
  })
  state.openFiles.push(newFile)
  state.editingFile = newFile.id

  // START AND BASIC ROUTING
  emitter.on('select-disk-navigation-root', async () => {
    const folder = await selectDiskFolder()
    if (folder) {
      saveDiskNavigationRootToStorage(folder)
      state.diskNavigationRoot = folder
      emitter.emit('refresh-files')
    }
    emitter.emit('render')
  })
  emitter.on('change-view', (view) => {
    state.view = view
    if (state.view === 'file-manager') {
      emitter.emit('refresh-files')
    }
    emitter.emit('render')
  })

  // CONNECTION DIALOG
  emitter.on('open-connection-dialog', async () => {
    log('open-connection-dialog')
    emitter.emit('disconnect')
    state.availablePorts = await getAvailablePorts()
    state.isConnectionDialogOpen = true
    emitter.emit('render')
  })
  emitter.on('close-connection-dialog', () => {
    state.isConnectionDialogOpen = false
    emitter.emit('render')
  })
  emitter.on('update-ports', async () => {
    state.availablePorts = await getAvailablePorts()
    emitter.emit('render')
  })
  emitter.on('select-port', async (port) => {
    log('connect', port)
    const path = port.path

    state.isConnecting = true
    emitter.emit('render')

    let timeout_id = setTimeout(() => emitter.emit('connection-timeout'), 5000)
    await serial.connect(path)
    clearTimeout(timeout_id)

    // Stop whatever is going on
    // Recover from getting stuck in raw repl
    await serial.get_prompt()

    // Make sure there is a lib folder
    log('creating lib folder')
    await serial.createFolder('lib')

    // Connected and ready
    state.isConnecting = false
    state.isConnected = true
    if (state.view === 'editor') {
      state.isPanelOpen = true
    }
    state.connectedPort = path

    // Bind terminal
    let term = state.cache(XTerm, 'terminal').term
    if (!state.isTerminalBound) {
      state.isTerminalBound = true
      term.onData((data) => {
        serial.eval(data)
        term.scrollToBottom()
      })
      serial.eval('\x02')
    }
    serial.onData((data) => {
      term.write(data)
      term.scrollToBottom()
    })
    serial.onDisconnect(() => emitter.emit('disconnect'))

    emitter.emit('close-connection-dialog')
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('disconnect', async () => {
    state.isConnected = false
    state.isPanelOpen = false
    state.boardFiles = []
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('connection-timeout', async () => {
    state.isConnected = false
    state.isConnecting = false
    state.availablePorts = await getAvailablePorts()
    state.isConnectionDialogOpen = true
    emitter.emit('render')
  })

  // CODE EXECUTION
  emitter.on('run', async () => {
    log('run')
    state.isPanelOpen = true
    const openFile = state.openFiles.find(f => f.id == state.editingFile)
    const code = openFile.editor.editor.state.doc.toString()
    emitter.emit('render')
    try {
      await serial.get_prompt()
      await serial.run(code)
    } catch(e) {
      log('error', e)
    }
  })
  emitter.on('stop', async () => {
    log('stop')
    state.isPanelOpen = true
    emitter.emit('render')
    await serial.get_prompt()
  })
  emitter.on('reset', async () => {
    log('reset')
    state.isPanelOpen = true
    emitter.emit('render')
    await serial.reset()
    emitter.emit('update-files')
    emitter.emit('render')
  })

  // PANEL
  emitter.on('open-panel', () => {
    state.isPanelOpen = true
    emitter.emit('render')
  })
  emitter.on('close-panel', () => {
    state.isPanelOpen = false
    emitter.emit('render')
  })
  emitter.on('clear-terminal', () => {
    state.cache(XTerm, 'terminal').term.clear()
  })

  // SAVING
  emitter.on('save', async () => {
    log('save')
    if (!canSave(state)) {
      log("can't save")
      return
    }
    state.isSaving = true
    emitter.emit('render')

    const save = async () => {
      state.isSaving = true
      emitter.emit('render')
      try {
        if (openFile.source == 'board') {
          await serial.get_prompt()
          await serial.saveFileContent(
            serial.getFullPath(
              '/',
              openFile.parentFolder,
              openFile.fileName
            ),
            contents,
            (e) => {
              state.savingProgress = e
              emitter.emit('render')
            }
          )
        } else {
          await disk.saveFileContent(
            disk.getFullPath(
              state.diskNavigationRoot,
              openFile.parentFolder,
              openFile.fileName
            ),
            contents
          )
        }
      } catch(e) {
        log('error', e)
      }
      state.isSaving = false
      state.savingProgress = 0
      emitter.emit('refresh-files')
      emitter.emit('render')
    }

    // Get open file
    let openFile = state.openFiles.find(f => f.id === state.editingFile)
    const contents = openFile.editor.editor.state.doc.toString()
    const newFile = openFile.parentFolder == null

    // does full path exist?
    let fullPathExists = false
    if (openFile.source == 'board') {
      fullPathExists = await checkBoardFile({
        parentFolder: openFile.parentFolder,
        fileName: openFile.fileName
      })
    } else {
      fullPathExists = await checkDiskFile({
        root: state.diskNavigationRoot,
        parentFolder: openFile.parentFolder,
        fileName: openFile.fileName
      })
    }

    if (!newFile && fullPathExists) {
      save()
    } else {
      // Make current navigation the parentFolder
      if (openFile.source == 'board') {
        openFile.parentFolder = state.boardNavigationPath
      } else {
        openFile.parentFolder = state.diskNavigationPath
      }

      // is there a file file on the parent path with the same name?
      // let willOverwrite = false
      // if (openFile.source == 'board') {
      //   willOverwrite = await checkBoardFile({
      //     parentFolder: openFile.parentFolder,
      //     fileName: openFiles.fileName
      //   })
      // } else {
      //   willOverwrite = await checkDiskFile({
      //     root: state.diskNavigationRoot,
      //     parentFolder: openFile.parentFolder,
      //     fileName: openFile.fileName
      //   })
      // }
      //
      // if (willOverwrite) {
      //   log('will overwrite')
      //   state.dialogs.push({
      //     description: html`Would you like to overwrite the file <strong>${openFile.fileName}</strong> on ${openFile.source}?`,
      //     options: [
      //       { text: `Yes`, onClick: () => save() },
      //       { text: `No`, onClick: () => {
      //           state.dialogs.shift()
      //           emitter.emit('render')
      //         }
      //       },
      //     ]
      //   })
      save()

      state.isSaving = false
      emitter.emit('render')
    }
  })

  // TABS
  emitter.on('select-tab', (id) => {
    state.editingFile = id
    emitter.emit('render')
  })
  emitter.on('close-tab', (id) => {
    state.openFiles = state.openFiles.filter(f => f.id !== id)
    state.editingFile = null

    if(state.openFiles.length > 0) {
      state.editingFile = state.openFiles[0].id
    } else {
      const newFile = createEmptyFile({
        source: 'disk',
        parentFolder: state.diskNavigationPath
      })
      state.openFiles.push(newFile)
      state.editingFile = newFile.id
    }

    emitter.emit('render')
  })

  // FILE OPERATIONS
  emitter.on('refresh-files', async () => {
    log('refresh-files')
    if (state.isConnected) {
      state.boardFiles = await getBoardFiles(
        serial.getFullPath(
          '/',
          state.boardNavigationPath,
          ''
        )
      )
    }
    state.diskFiles = await getDiskFiles(
      disk.getFullPath(
        state.diskNavigationRoot,
        state.diskNavigationPath,
        ''
      )
    )
    emitter.emit('refresh-selected-files')
    emitter.emit('render')
  })
  emitter.on('refresh-selected-files', () => {
    state.selectedFiles = state.selectedFiles.filter(f => {
      if (f.source === 'board') {
        if (!state.isConnected) return false
        return state.boardFiles.find(g => f.fileName === g.fileName)
      } else {
        return state.diskFiles.find(g => f.fileName === g.fileName)
      }
    })
    emitter.emit('render')
  })
  emitter.on('remove-files', async () => {
    state.isRemoving = true
    emitter.emit('render')

    for (let i in state.selectedFiles) {
      const file = state.selectedFiles[i]
      if (file.source === 'board') {
        await serial.removeFile(
          serial.getFullPath(
            '/',
            state.boardNavigationPath,
            file.fileName
          )
        )
      } else {
        await disk.removeFile(
          disk.getFullPath(
            state.diskNavigationRoot,
            state.diskNavigationPath,
            file.fileName
          )
        )
      }
    }

    emitter.emit('refresh-files')

    state.isRemoving = false
    emitter.emit('render')
  })
  emitter.on('create-file', () => {})
  emitter.on('rename-file', () => {})
  emitter.on('finish-renaming', () => {})
  emitter.on('finish-creating', () => {})
  emitter.on('open-file-options', () => {})
  emitter.on('close-file-options', () => {})

  emitter.on('toggle-file-selection', (file, source) => {
    const isSelected = state.selectedFiles.find((f) => {
      return f.fileName === file.fileName && f.source === source
    })
    if (isSelected) {
      state.selectedFiles = state.selectedFiles.filter((f) => {
        return !(f.fileName === file.fileName && f.source === source)
      })
    } else {
      state.selectedFiles.push({
        fileName: file.fileName,
        source: source
      })
    }
    emitter.emit('render')
  })
  emitter.on('open-selected-files', async () => {
    log('open-selected-files')
    let files = []
    for (let i in state.selectedFiles) {
      let selectedFile = state.selectedFiles[i]
      let fileContent = '# empty file)'

      if (selectedFile.source === 'board') {
        fileContent = await serial.loadFile(
          serial.getFullPath(
            '/',
            state.boardNavigationPath,
            selectedFile.fileName
          )
        )
        files.push(
          createFile({
            parentFolder: state.boardNavigationPath,
            fileName: selectedFile.fileName,
            source: selectedFile.source,
            content: fileContent
          })
        )
      } else {
        fileContent = await disk.loadFile(
          disk.getFullPath(
            state.diskNavigationRoot,
            state.diskNavigationPath,
            selectedFile.fileName
          )
        )
        files.push(
          createFile({
            parentFolder: state.diskNavigationPath,
            fileName: selectedFile.fileName,
            source: selectedFile.source,
            content: fileContent
          })
        )
      }
    }

    files = files.filter((f) => { // file to open
      let isAlready = false
      state.openFiles.forEach((g) => { // file already open
        if (g.fileName == f.fileName && g.source == f.source) {
          isAlready = true
        }
      })
      return !isAlready
    })
    if (files.length > 0) {
      // console.log(state.openFiles, files)
      state.openFiles = state.openFiles.concat(files)
      state.editingFile = files[0].id
    }
    state.view = 'editor'
    state.selectedFiles = []
    emitter.emit('render')
  })

  // DOWNLOAD AND UPLOAD FILES
  emitter.on('upload-files', async () => {
    state.isTransferring = true
    emitter.emit('render')

    for (let i in state.selectedFiles) {
      const file = state.selectedFiles[i]
      await serial.uploadFile(
        disk.getFullPath(
          state.diskNavigationRoot,
          state.diskNavigationPath,
          file.fileName
        ),
        serial.getFullPath(
          '/',
          state.boardNavigationPath,
          file.fileName
        ),
        (e) => {
          state.transferringProgress = e
          emitter.emit('render')
        }
      )
    }

    state.isTransferring = false
    state.selectedFiles = []
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('download-files', async () => {
    state.isTransferring = true
    emitter.emit('render')

    for (let i in state.selectedFiles) {
      const file = state.selectedFiles[i]
      await serial.downloadFile(
        serial.getFullPath(
          '/',
          state.boardNavigationPath,
          file.fileName
        ),
        disk.getFullPath(
          state.diskNavigationRoot,
          state.diskNavigationPath,
          file.fileName
        ),
        (e) => {
          state.transferringProgress = e
          emitter.emit('render')
        }
      )
    }

    state.isTransferring = false
    state.selectedFiles = []
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  // NAVIGATION
  emitter.on('navigate-board-folder', (folder) => {
    log('navigate-board-folder')
    state.boardNavigationPath = serial.getFullPath(
      state.boardNavigationPath,
      folder,
      ''
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('navigate-board-parent', () => {
    log('navigate-board-parent')
    state.boardNavigationPath = serial.getFullPath(
      state.boardNavigationPath,
      '..',
      ''
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  emitter.on('navigate-disk-folder', (folder) => {
    log('navigate-disk-folder')
    state.diskNavigationPath = disk.getFullPath(
      state.diskNavigationPath,
      folder,
      ''
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('navigate-disk-parent', () => {
    log('navigate-disk-parent')
    state.diskNavigationPath = disk.getFullPath(
      state.diskNavigationPath,
      '..',
      ''
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  function createFile({ source, parentFolder, fileName, content = '# empty file' }) {
    const id = generateHash()
    const editor = state.cache(CodeMirrorEditor, `editor_${id}`)
    editor.content = content
    const hasChanges = false
    return {
      id,
      source,
      parentFolder,
      fileName,
      editor,
      hasChanges
    }
  }

  function createEmptyFile({ source, parentFolder }) {
    return createFile({
      fileName: generateFileName(),
      parentFolder,
      source,
    })
  }
}


function getDiskNavigationRootFromStorage() {
  let diskNavigationRoot = localStorage.getItem('diskNavigationRoot')
  if (!diskNavigationRoot || diskNavigationRoot == 'null') {
    diskNavigationRoot = null
  }
  return diskNavigationRoot
}

function saveDiskNavigationRootToStorage(path) {
  try {
    localStorage.setItem('diskNavigationRoot', path)
    return true
  } catch(e) {
    log('saveDiskNavigationRootToStorage', e)
    return false
  }
}

async function selectDiskFolder() {
  let { folder, files } = await disk.openFolder()
  if (folder !== null && folder != 'null') {
    return folder
  }
  return null
}

async function getDiskFiles(path) {
  const files = await disk.ilistFiles(path)
  return files.map(f => ({
    fileName: f.path,
    type: f.type
  }))
}

function generateHash() {
  return `${Date.now()}_${parseInt(Math.random()*1024)}`
}

async function getAvailablePorts() {
  return await serial.loadPorts()
}

async function getBoardFiles(path) {
  await serial.get_prompt()
  const files = await serial.ilistFiles(path)
  return files.map(f => ({
    fileName: f[0],
    type: f[1] === 0x4000 ? 'folder' : 'file'
  }))
}

async function checkDiskFile({ root, parentFolder, fileName }) {
  if (root == null || parentFolder == null || fileName == null) return false
  const files = await getDiskFiles(
    disk.getFullPath(root, parentFolder, '')
  )
  const file = files.find((f) => f.fileName === fileName)
  return file ? true : false
}

async function checkBoardFile({ parentFolder, fileName }) {
  if (parentFolder == null || fileName == null) return false
  const files = await getBoardFiles(parentFolder)
  const file = files.find((f) => f.fileName === fileName)
  return file ? true : false
}

async function checkOverwrite({ fileNames = [], parentFolder, source }) {
  let files = []
  let overwrite = []
  if (source === 'board') {
    files = getBoardFiles(parentFolder)
  } else {
    files = await getDiskFiles(parentFolder)
  }
  return files.filter((f) => filenames.indexOf(f.fileName) !== -1)
}

function generateFileName(filename) {
  if (filename) {
    let name = filename.split('.py')
    return `${name[0]}_${Date.now()}.py`
  } else {
    return `${pickRandom(adjectives)}_${pickRandom(nouns)}.py`
  }
}

function pickRandom(array) {
  return array[parseInt(Math.random()*array.length)]
}

function canSave(state) {
  const isEditor = state.view === 'editor'
  const isConnected = state.isConnected
  const file = state.openFiles.find(f => f.id === state.editingFile)
  // Can only save on editor
  if (!isEditor) return false
  // Can always save disk files
  if (file.source === 'disk') return true
  // Can save board files if connected
  return state.isConnected
}

function canExecute(state) {
  const isEditor = state.view === 'editor'
  const isConnected = state.isConnected
  return isEditor && isConnected
}

function canDownload({ isConnected, selectedFiles }) {
  const selectedDiskFiles = selectedFiles.filter((f) => f.source === 'disk')
  return isConnected
      && selectedFiles.length > 0
      && selectedDiskFiles.length === 0
}

function canUpload({ isConnected, selectedFiles }) {
  const selectedBoardFiles = selectedFiles.filter((f) => f.source === 'board')
  return isConnected
      && selectedFiles.length > 0
      && selectedBoardFiles.length === 0
}

function toggleFileSelection({ fileName, source, selectedFiles }) {
  let result = []
  let file = selectedFiles.find((f) => {
    return f.fileName === fileName && f.source === source
  })
  if (file) {
    // filter file out
    result = selectedFiles.filter((f) => {
      return f.fileName !== fileName && f.source !== source
    })
  } else {
    // push file
    selectedFiles.push({ fileName, source })
  }
  return result
}
