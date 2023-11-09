async function store(state, emitter) {
  const log = console.log
  const serial = window.BridgeSerial
  const disk = window.BridgeDisk

  state.view = 'editor'
  state.diskNavigationPath = '/'
  state.diskNavigationRoot = null
  state.diskFiles = []
  state.serialNavigationPath = '/'
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

  state.isLoadingFiles = false
  state.dialogs = []

  state.isTerminalBound = false

  // START AND BASIC ROUTING
  emitter.on('select-disk-navigation-root', async () => {
    let folder = getDiskNavigationRootFromStorage()
    if (!folder) {
      folder = await selectDiskFolder()
      if (folder) {
        saveDiskNavigationRootToStorage(folder)
      }
    }
    state.diskNavigationRoot = folder
    emitter.emit('render')
  })
  emitter.on('change-view', (view) => {
    state.view = view
    emitter.emit('render')
  })

  // CONNECTION DIALOG
  emitter.on('open-connection-dialog', () => {
    state.availablePorts = await getAvailablePorts()
    state.isConnectionDialogOpen = true
    emitter.emit('render')
  })
  emitter.on('close-connection-dialog', () => {
    state.isConnectionDialogOpen = false
    emitter.emit('render')
  })
  emitter.on('update-ports', () => {
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
    emitter.emit('render')
  })
  emitter.on('disconnect', async () => {
    state.isConnected = false
    state.isPanelOpen = false
  })
  emitter.on('connection-timeout', () => {
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
    const file = state.diskFiles.find(f => f.id == state.editingFile)
    const code = file.editor.editor.state.doc.toString()
    await serial.get_prompt()
    try {
      await serial.run(code)
    } catch(e) {
      log('error', e)
    }
    emitter.emit('render')
  })
  emitter.on('stop', async () => {
    log('stop')
    state.isPanelOpen = true
    await serial.get_prompt()
    emitter.emit('render')
  })
  emitter.on('reset', async () => {
    log('reset')
    state.isPanelOpen = true
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
  emitter.on('save', () => {})
  emitter.on('saved', () => {})

  // TABS
  emitter.on('select-tab', () => {})
  emitter.on('close-tab', () => {})

  // FILE OPERATIONS
  emitter.on('refresh-files', () => {})
  emitter.on('remove-file', () => {})
  emitter.on('create-file', () => {})
  emitter.on('rename-file', () => {})
  emitter.on('finish-renaming', () => {})
  emitter.on('finish-creating', () => {})
  emitter.on('open-file-options', () => {})
  emitter.on('close-file-options', () => {})

  // DOWNLOAD AND UPLOAD FILES
  emitter.on('upload-files', () => {})
  emitter.on('download-files', () => {})

  // NAVIGATION
  emitter.on('navigate-board-folder', () => {})
  emitter.on('navigate-disk-folder', () => {})

  //
  // // DIALOGS
  // state.dialogs = {}
  // emitter.on('open-connection-dialog', async () => {
  //   log('open-connection-dialog')
  //   if (state.isConnected) {
  //     emitter.emit('disconnect')
  //   }
  //   state.dialogs['connection'] = true
  //   state.availablePorts = await serial.loadPorts()
  //   emitter.emit('render')
  // })
  // emitter.on('close-dialog', () => {
  //   log('close-dialog')
  //   Object.keys(state.dialogs).forEach(k => {
  //     state.dialogs[k] = false
  //   })
  //   emitter.emit('render')
  // })
  //
  // // CONNECTION
  // state.availablePorts = []
  // emitter.on('load-ports', async () => {
  //   log('load-ports')
  //   state.availablePorts = await serial.loadPorts()
  //   emitter.emit('render')
  // })
  // emitter.on('disconnect', async () => {
  //   log('disconnect')
  //   state.serialPort = null
  //   state.isConnected = false
  //
  //   await serial.disconnect()
  //
  //   emitter.emit('render')
  // })
  // emitter.on('connect', async (port) => {
  //   const path = port.path
  //   log('connect', path)
  //
  //   await serial.connect(path)
  //
  //   // Stop whatever is going on
  //   // Recover from getting stuck in raw repl
  //   await serial.get_prompt()
  //
  //   state.isConnected = true
  //   state.isPanelOpen = true
  //   emitter.emit('close-dialog')
  //
  //   // Make sure there is a lib folder
  //   log('creating lib folder')
  //   await serial.createFolder('lib')
  //   state.serialPort = path
  //
  //   // Bind terminal
  //   let term = state.cache(XTerm, 'terminal').term
  //   if (!state.isTerminalBound) {
  //     state.isTerminalBound = true
  //     term.onData((data) => {
  //       serial.eval(data)
  //       term.scrollToBottom()
  //     })
  //     serial.eval('\x02')
  //   }
  //   serial.onData((data) => {
  //     term.write(data)
  //     term.scrollToBottom()
  //   })
  //   serial.onDisconnect(() => emitter.emit('disconnect'))
  // })
  //
  // // CODE EXECUTION
  // emitter.on('run', async () => {
  //   log('run')
  //   state.isPanelOpen = true
  //   const file = state.diskFiles.find(f => f.id == state.editingFile)
  //   const code = file.editor.editor.state.doc.toString()
  //   await serial.get_prompt()
  //   try {
  //     await serial.run(code)
  //   } catch(e) {
  //     console.log('error', e)
  //   }
  //   emitter.emit('render')
  // })
  // emitter.on('stop', async () => {
  //   log('stop')
  //   await serial.get_prompt()
  //   emitter.emit('render')
  // })
  // emitter.on('reset', async () => {
  //   log('reset')
  //   await serial.reset()
  //   emitter.emit('update-files')
  //   emitter.emit('render')
  // })
  //
  // // TERMINAL PANEL
  // state.isTerminalBound = false
  // state.isPanelOpen = false
  // emitter.on('toggle-panel', () => {
  //   log('toggle-panel')
  //   if (state.isPanelOpen) {
  //     state.isPanelOpen = false
  //   } else {
  //     state.isPanelOpen = true
  //   }
  //   emitter.emit('render')
  // })
  // emitter.on('clean-terminal', () => {
  //   log('clean-terminal')
  //   state.cache(XTerm, 'terminal').term.clear()
  // })
  //
  // // FILES
  // state.diskFiles = null
  // state.diskNavigationRoot = localStorage.getItem('diskNavigationRoot')
  // if (!state.diskNavigationRoot || state.diskNavigationRoot == 'null') {
  //   state.diskNavigationRoot = null
  // }
  //
  // emitter.on('load-disk-files', async () => {
  //   log('load-disk-files')
  //   if (!state.diskNavigationRoot) return false
  //
  //   const files = await disk.ilistFiles(state.diskNavigationRoot)
  //   state.diskFiles = files.map(MyFile)
  //   // Load file contents
  //   for (let i in state.diskFiles) {
  //     if (state.diskFiles[i].type == 'file') {
  //       state.diskFiles[i].content = await disk.loadFile(
  //         state.diskNavigationRoot + '/' + state.diskFiles[i].path
  //       )
  //       state.diskFiles[i].editor = state.cache(CodeMirrorEditor, `editor_${state.diskFiles[i].id}`)
  //       state.diskFiles[i].editor.render(state.diskFiles[i].content)
  //       // Temporary: Open all the files
  //       state.openedFiles.push(state.diskFiles[i].id)
  //     }
  //   }
  //   if (state.openedFiles && state.openedFiles.length > 0) {
  //     // Temporary: Select first file
  //     emitter.emit('select-tab', state.openedFiles[0])
  //   }
  //   emitter.emit('render')
  // })
  // emitter.on('select-disk-navigation-root', async () => {
  //   log('select-disk-navigation-root')
  //   state.diskNavigationRoot = null
  //   let { folder, files } = await disk.openFolder()
  //   if (folder !== 'null' && folder !== null) {
  //     localStorage.setItem('diskNavigationRoot', folder)
  //     state.diskNavigationRoot = folder
  //   }
  //   state.diskFiles = await disk.ilistFiles(state.diskNavigationRoot)
  //   emitter.emit('load-disk-files')
  //   emitter.emit('render')
  // })
  //
  // // TABS
  // state.openedFiles = []
  // state.editingFile = null
  // emitter.on('select-tab', (id) => {
  //   log('select-tab', id)
  //   if (state.editingFile !== id) {
  //     state.editingFile = id
  //     emitter.emit('render')
  //   }
  // })
  // emitter.on('close-tab', (id) => {
  //   log('close-tab', id)
  //   state.openedFiles = state.openedFiles.filter(f => f !== id)
  //   if (state.editingFile === id) {
  //     // Temporary: Select first file
  //     state.editingFile = null
  //   }
  //   if (state.editingFile == null && state.openedFiles.length > 0) {
  //     state.editingFile = state.openedFiles[0]
  //   }
  //   emitter.emit('render')
  // })
  //
  // // VIEW AND ROUTING
  // state.view = 'editor'
  // emitter.on('set-view', (view) => {
  //   log('set-view', view)
  //   state.view = view
  //   emitter.emit('render')
  // })
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

function createFile({ source, parentFolder, fileName }) {
  const id = generateHash()
  const editor = state.cache(CodeMirrorEditor, `editor_${id}`)
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

async function getAvailablePorts() {
  return await serial.loadPorts()
}

function getBoardFiles(path) {
  const files = await serial.ilistFiles(path)
  return files.map(f => ({
    fileName: f[0],
    type: f[1] === 0x4000 ? 'folder' : 'file'
  }))
}

function checkDiskFile({ parentFolder, fileName }) {
  const files = getDiskFiles(parentFolder)
  const file = files.find((f) => f.fileName === fileName)
  return file ? true : false
}

function checkBoardFile({ parentFolder, fileName }) {
  const files = getBoardFiles(parentFolder)
  const file = files.find((f) => f.fileName === fileName)
  return file ? true : false
}

function checkOverwrite({ fileNames = [], parentFolder, source }) {
  let files = []
  let overwrite = []
  if (source === 'board') {
    files = getBoardFiles(parentFolder)
  } else {
    files = getDiskFiles(parentFolder)
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
  const file = state.openedFiles[state.editingFile]
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
  return isConnected && selectedDiskFiles.length === 0
}

function canUpload({ isConnected, selectedFiles }) {
  const selectedBoardFiles = selectedFiles.filter((f) => f.source === 'board')
  return isConnected && selectedBoardFiles.length === 0
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
    result = selectedFiles.push({ fileName, source })
  }
}
