const log = console.log
const serial = window.BridgeSerial
const disk = window.BridgeDisk
const win = window.BridgeWindow

const shortcuts = window.BridgeWindow.getShortcuts()

const newFileContent = `# This program was created in Arduino Lab for MicroPython

print('Hello, MicroPython!')
`

async function confirm(msg, cancelMsg, confirmMsg) {
  cancelMsg = cancelMsg || 'Cancel'
  confirmMsg = confirmMsg || 'Yes'
  let response = await win.openDialog({
    type: 'question',
    buttons: [cancelMsg, confirmMsg],
    cancelId: 0,
    message: msg
  })
  console.log('confirm', response)
  return Promise.resolve(response)
}

async function store(state, emitter) {
  win.setWindowSize(720, 640)

  state.platform = window.BridgeWindow.getOS()
  state.view = 'editor'
  state.diskNavigationPath = '/'
  state.diskNavigationRoot = getDiskNavigationRootFromStorage()
  state.diskFiles = []
  state.boardNavigationPath = '/'
  state.boardNavigationRoot = '/'
  state.boardFiles = []
  state.openFiles = []
  state.selectedFiles = []
  state.editingFile = null
  state.creatingFile = null
  state.renamingFile = null
  state.creatingFolder = null
  state.renamingTab = null

  state.availablePorts = []

  state.isConnectionDialogOpen = false
  state.isConnecting = false
  state.isConnected = false
  state.connectedPort = null

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
  newFile.editor.onChange = function() {
    newFile.hasChanges = true
    emitter.emit('render')
  }
  state.openFiles.push(newFile)
  state.editingFile = newFile.id

  state.savedPanelHeight = PANEL_DEFAULT
  state.panelHeight = PANEL_CLOSED
  state.resizePanel = function(e) {
    state.panelHeight = (PANEL_CLOSED/2) + document.body.clientHeight - e.clientY
    if (state.panelHeight <= PANEL_CLOSED) {
      state.savedPanelHeight = PANEL_DEFAULT
    } else {
      state.savedPanelHeight = state.panelHeight
    }
    emitter.emit('render')
  }

  // Menu management
  const updateMenu = () => {
    window.BridgeWindow.updateMenuState({
      isConnected: state.isConnected,
      view: state.view
    })
  }

  // START AND BASIC ROUTING
  emitter.on('select-disk-navigation-root', async () => {
    const folder = await selectDiskFolder()
    if (folder) {
      saveDiskNavigationRootToStorage(folder)
      state.diskNavigationRoot = folder
      state.diskNavigationPath = '/'
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
    updateMenu()
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

    // The following Timeout operation will be cleared after a succesful getPrompt()
    // If a board has crashed and/or cannot return a REPL prompt, the connection will fail
    // and the user will be prompted to reset the device and try again.
    let timeout_id = setTimeout(() => {
      let response = win.openDialog({
        type: 'question',
        buttons: ['OK'],
        cancelId: 0,
        message: "Could not connect to the board. Reset it and try again."
      })
      console.log('Reset request acknowledged', response)
      emitter.emit('connection-timeout')
    }, 3500)
    try {
      await serial.connect(path)
    } catch(e) {
      console.error(e)
    }
    // Stop whatever is going on
    // Recover from getting stuck in raw repl
    
    await serial.getPrompt()
    clearTimeout(timeout_id)
    // Connected and ready
    state.isConnecting = false
    state.isConnected = true
    updateMenu()
    if (state.view === 'editor' && state.panelHeight <= PANEL_CLOSED) {
      state.panelHeight = state.savedPanelHeight
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
    await serial.disconnect()
    state.isConnected = false
    state.panelHeight = PANEL_CLOSED
    state.boardFiles = []
    state.boardNavigationPath = '/'
    emitter.emit('refresh-files')
    emitter.emit('render')
    updateMenu()
  })
  emitter.on('connection-timeout', async () => {
    state.isConnected = false
    state.isConnecting = false
    state.availablePorts = await getAvailablePorts()
    state.isConnectionDialogOpen = true
    emitter.emit('render')
  })

  // CODE EXECUTION
  emitter.on('run', async (onlySelected = false) => {
    log('run')
    const openFile = state.openFiles.find(f => f.id == state.editingFile)
    let code = openFile.editor.editor.state.doc.toString()

    // If there is a selection, run only the selected code
    const startIndex = openFile.editor.editor.state.selection.ranges[0].from
    const endIndex = openFile.editor.editor.state.selection.ranges[0].to
    if (endIndex - startIndex > 0 && onlySelected) {
      selectedCode = openFile.editor.editor.state.doc.toString().substring(startIndex, endIndex)
      // Checking to see if the user accidentally double-clicked some whitespace
      // While a random selection would yield an error when executed, 
      // selecting only whitespace would not and the user would have no feedback.
      // This check only replaces the full content of the currently selected tab
      // with a text selection if the selection is not empty and contains only whitespace.
      if (selectedCode.trim().length > 0) {
        code = selectedCode
      }
    }
    
    emitter.emit('open-panel')
    emitter.emit('render')
    try {
      await serial.getPrompt()
      await serial.run(code)
    } catch(e) {
      log('error', e)
    }
  })
  emitter.on('stop', async () => {
    log('stop')
    if (state.panelHeight <= PANEL_CLOSED) {
      state.panelHeight = state.savedPanelHeight
    }
    emitter.emit('open-panel')
    emitter.emit('render')
    await serial.getPrompt()
  })
  emitter.on('reset', async () => {
    log('reset')
    if (state.panelHeight <= PANEL_CLOSED) {
      state.panelHeight = state.savedPanelHeight
    }
    emitter.emit('open-panel')
    emitter.emit('render')
    await serial.reset()
    emitter.emit('update-files')
    emitter.emit('render')
  })

  // PANEL
  emitter.on('open-panel', () => {
    emitter.emit('stop-resizing-panel')
    state.panelHeight = state.savedPanelHeight
    emitter.emit('render')
    setTimeout(() => {
      state.cache(XTerm, 'terminal').resizeTerm()
    }, 200)
  })
  emitter.on('close-panel', () => {
    emitter.emit('stop-resizing-panel')
    state.savedPanelHeight = state.panelHeight
    state.panelHeight = 0
    emitter.emit('render')
  })
  emitter.on('clear-terminal', () => {
    state.cache(XTerm, 'terminal').term.clear()
  })
  emitter.on('start-resizing-panel', () => {
    log('start-resizing-panel')
    window.addEventListener('mousemove', state.resizePanel)
    // Stop resizing when mouse leaves window or enters the tabs area
    document.body.addEventListener('mouseleave', () => {
      emitter.emit('stop-resizing-panel')
    }, { once: true })
    document.querySelector('#tabs').addEventListener('mouseenter', () => {
      emitter.emit('stop-resizing-panel')
    }, { once: true })
  })
  emitter.on('stop-resizing-panel', () => {
    log('stop-resizing-panel')
    window.removeEventListener('mousemove', state.resizePanel)
  })

  // SAVING
  emitter.on('save', async () => {
    log('save')
    let response = canSave({
      view: state.view,
      isConnected: state.isConnected,
      openFiles: state.openFiles,
      editingFile: state.editingFile
    })
    if (response == false) {
      log("can't save")
      return
    }

    state.isSaving = true
    emitter.emit('render')

    // Get open file
    let openFile = state.openFiles.find(f => f.id === state.editingFile)

    let willOverwrite = false
    const oldParentFolder = openFile.parentFolder
    const isNewFile = oldParentFolder === null

    if (isNewFile) {
      // Define parent folder
      if (openFile.source == 'board') {
        openFile.parentFolder = state.boardNavigationPath
      } else if (openFile.source == 'disk') {
        openFile.parentFolder = state.diskNavigationPath
      }

    }

    // Check if the current full path exists
    let fullPathExists = false
    if (openFile.source == 'board') {
      await serial.getPrompt()
      fullPathExists = await serial.fileExists(
        serial.getFullPath(
          state.boardNavigationRoot,
          openFile.parentFolder,
          openFile.fileName
        )
      )
    } else if (openFile.source == 'disk') {
      fullPathExists = await disk.fileExists(
        disk.getFullPath(
          state.diskNavigationRoot,
          openFile.parentFolder,
          openFile.fileName
        )
      )
    }

    if (isNewFile || !fullPathExists) {
      // Redefine parent folder
      if (openFile.source == 'board') {
        openFile.parentFolder = state.boardNavigationPath
        // Check for overwrite
        await serial.getPrompt()
        willOverwrite = await serial.fileExists(
          serial.getFullPath(
            state.boardNavigationRoot,
            openFile.parentFolder,
            openFile.fileName
          )
        )
      } else if (openFile.source == 'disk') {
        openFile.parentFolder = state.diskNavigationPath
        // Check for overwrite
        willOverwrite = await disk.fileExists(
          disk.getFullPath(
            state.diskNavigationRoot,
            openFile.parentFolder,
            openFile.fileName
          )
        )
      }
    }

    if (willOverwrite) {
      const confirmation = await confirm(`You are about to overwrite the file ${openFile.fileName} on your ${openFile.source}.\n\n Are you sure you want to proceed?`, 'Cancel', 'Yes')
      if (!confirmation) {
        state.isSaving = false
        openFile.parentFolder = oldParentFolder
        emitter.emit('render')
        return
      }
    }

    // SAVE
    const contents = openFile.editor.editor.state.doc.toString()
    try {
      if (openFile.source == 'board') {
        await serial.getPrompt()
        await serial.saveFileContent(
          serial.getFullPath(
            state.boardNavigationRoot,
            openFile.parentFolder,
            openFile.fileName
          ),
          contents,
          (e) => {
            state.savingProgress = e
            emitter.emit('render')
          }
        )
      } else if (openFile.source == 'disk') {
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

    openFile.hasChanges = false
    state.isSaving = false
    state.savingProgress = 0
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  // TABS
  emitter.on('select-tab', (id) => {
    log('select-tab', id)
    state.editingFile = id
    emitter.emit('render')
  })
  emitter.on('close-tab', async (id) => {
    log('close-tab', id)
    const currentTab = state.openFiles.find(f => f.id === id)
    if (currentTab.hasChanges) {
      let response = await confirm("Your file has unsaved changes. Are you sure you want to proceed?")
      if (!response) return false
    }
    state.openFiles = state.openFiles.filter(f => f.id !== id)
    // state.editingFile = null

    if(state.openFiles.length > 0) {
      state.editingFile = state.openFiles[0].id
    } else {
      const newFile = createEmptyFile({
        source: 'disk',
        parentFolder: null
      })
      newFile.editor.onChange = function() {
        newFile.hasChanges = true
        emitter.emit('render')
      }
      state.openFiles.push(newFile)
      state.editingFile = newFile.id
    }

    emitter.emit('render')
  })

  // FILE OPERATIONS
  emitter.on('refresh-files', async () => {
    log('refresh-files')
    if (state.isLoadingFiles) return
    state.isLoadingFiles = true
    emitter.emit('render')

    if (state.isConnected) {
      try {
        state.boardFiles = await getBoardFiles(
          serial.getFullPath(
            state.boardNavigationRoot,
            state.boardNavigationPath,
            ''
          )
        )
      } catch (e) {
        state.boardFiles = []
      }
    } else {
      state.boardFiles = []
    }

    try {
      state.diskFiles = await getDiskFiles(
        disk.getFullPath(
          state.diskNavigationRoot,
          state.diskNavigationPath,
          ''
        )
      )
    } catch (e) {
      state.diskNavigationRoot = null
      state.diskNavigationPath = '/'
      state.isLoadingFiles = false
      emitter.emit('render')
      return
    }

    emitter.emit('refresh-selected-files')
    state.isLoadingFiles = false
    emitter.emit('render')
  })
  emitter.on('refresh-selected-files', () => {
    log('refresh-selected-files')
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

  emitter.on('create-file', (device) => {
    log('create-file', device)
    if (state.creatingFile !== null) return
    state.creatingFile = device
    state.creatingFolder = null
    emitter.emit('render')
  })
  emitter.on('finish-creating-file', async (value) => {
    log('finish-creating', value)
    if (!state.creatingFile) return

    if (!value) {
      state.creatingFile = null
      emitter.emit('render')
      return
    }

    if (state.creatingFile == 'board' && state.isConnected) {
      let willOverwrite = await checkBoardFile({
        root: state.boardNavigationRoot,
        parentFolder: state.boardNavigationPath,
        fileName: value
      })
      if (willOverwrite) {
        const confirmAction = await confirm(`You are about to overwrite the file ${value} on your board.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.creatingFile = null
          emitter.emit('render')
          return
        }
        // TODO: Remove existing file
      }
      await serial.saveFileContent(
        serial.getFullPath(
          '/',
          state.boardNavigationPath,
          value
        ),
        newFileContent
      )
    } else if (state.creatingFile == 'disk') {
      let willOverwrite = await checkDiskFile({
        root: state.diskNavigationRoot,
        parentFolder: state.diskNavigationPath,
        fileName: value
      })
      if (willOverwrite) {
        const confirmAction = await confirm(`You are about to overwrite the file ${value} on your disk.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.creatingFile = null
          emitter.emit('render')
          return
        }
        // TODO: Remove existing file
      }
      await disk.saveFileContent(
        disk.getFullPath(
          state.diskNavigationRoot,
          state.diskNavigationPath,
          value
        ),
        newFileContent
      )
    }

    setTimeout(() => {
      state.creatingFile = null
      emitter.emit('refresh-files')
      emitter.emit('render')
    }, 200)
  })
  emitter.on('create-folder', (device) => {
    log('create-folder', device)
    if (state.creatingFolder !== null) return
    state.creatingFolder = device
    state.creatingFile = null
    emitter.emit('render')
  })
  emitter.on('finish-creating-folder', async (value) => {
    log('finish-creating-folder', value)
    if (!state.creatingFolder) return

    if (!value) {
      state.creatingFolder = null
      emitter.emit('render')
      return
    }

    if (state.creatingFolder == 'board' && state.isConnected) {
      let willOverwrite = await checkBoardFile({
        root: state.boardNavigationRoot,
        parentFolder: state.boardNavigationPath,
        fileName: value
      })
      if (willOverwrite) {
        const confirmAction = await confirm(`You are about to overwrite ${value} on your board.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.creatingFolder = null
          emitter.emit('render')
          return
        }
        // Remove existing folder
        await removeBoardFolder(
          serial.getFullPath(
            state.boardNavigationRoot,
            state.boardNavigationPath,
            value
          )
        )
      }
      await serial.createFolder(
        serial.getFullPath(
          state.boardNavigationRoot,
          state.boardNavigationPath,
          value
        )
      )
    } else if (state.creatingFolder == 'disk') {
      let willOverwrite = await checkDiskFile({
        root: state.diskNavigationRoot,
        parentFolder: state.diskNavigationPath,
        fileName: value
      })
      if (willOverwrite) {
        const confirmAction = await confirm(`You are about to overwrite ${value} on your disk.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.creatingFolder = null
          emitter.emit('render')
          return
        }
        // Remove existing folder
        await disk.removeFolder(
          disk.getFullPath(
            state.diskNavigationRoot,
            state.diskNavigationPath,
            value
          )
        )
      }
      await disk.createFolder(
        disk.getFullPath(
          state.diskNavigationRoot,
          state.diskNavigationPath,
          value
        )
      )
    }

    setTimeout(() => {
      state.creatingFolder = null
      emitter.emit('refresh-files')
      emitter.emit('render')
    }, 200)
  })

  emitter.on('remove-files', async () => {
    log('remove-files') // and folders
    state.isRemoving = true
    emitter.emit('render')

    let boardNames = state.selectedFiles
      .filter(file => file.source === 'board')
      .map(file => file.fileName)

    let diskNames = state.selectedFiles
      .filter(file => file.source === 'disk')
      .map(file => file.fileName)

    let message = `You are about to delete the following files:\n\n`
    if (boardNames.length) {
      message += `From your board:\n`
      boardNames.forEach(name => message += `${name}\n`)
      message += `\n`
    }
    if (diskNames.length) {
      message += `From your disk:\n`
      diskNames.forEach(name => message += `${name}\n`)
      message += `\n`
    }

    message += `Are you sure you want to proceed?`
    const confirmAction = await confirm(message, 'Cancel', 'Yes')
    if (!confirmAction) {
      state.isRemoving = false
      emitter.emit('render')
      return
    }

    for (let i in state.selectedFiles) {
      const file = state.selectedFiles[i]
      if (file.type == 'folder') {
        if (file.source === 'board') {
          await removeBoardFolder(
            serial.getFullPath(
              state.boardNavigationRoot,
              state.boardNavigationPath,
              file.fileName
            )
          )
        } else {
          await disk.removeFolder(
            disk.getFullPath(
              state.diskNavigationRoot,
              state.diskNavigationPath,
              file.fileName
            )
          )
        }
      } else {
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
    }

    emitter.emit('refresh-files')
    state.selectedFiles = []
    state.isRemoving = false
    emitter.emit('render')
  })

  emitter.on('rename-file', (source, item) => {
    log('rename-file', source, item)
    state.renamingFile = source
    emitter.emit('render')
  })
  emitter.on('finish-renaming-file', async (value) => {
    log('finish-renaming-file', value)

    // You can only rename one file, the selected one
    const file = state.selectedFiles[0]

    if (!value || file.fileName == value) {
      state.renamingFile = null
      emitter.emit('render')
      return
    }

    state.isSaving = true
    emitter.emit('render')

    // Check if new name overwrites something
    if (state.renamingFile == 'board' && state.isConnected) {
      // Check if it will overwrite something
      const willOverwrite = await checkOverwrite({
        fileNames: [ value ],
        parentPath: disk.getFullPath(
          state.boardNavigationRoot, state.boardNavigationPath, ''
        ),
        source: 'board'
      })
      if (willOverwrite.length > 0) {
        let message = `You are about to overwrite the following file/folder on your board:\n\n`
        message += `${value}\n\n`
        message += `Are you sure you want to proceed?`
        const confirmAction = await confirm(message, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.isSaving = false
          state.renamingFile = null
          emitter.emit('render')
          return
        }

        if (file.type == 'folder') {
          await removeBoardFolder(
            serial.getFullPath(
              state.boardNavigationRoot,
              state.boardNavigationPath,
              value
            )
          )
        } else if (file.type == 'file') {
          await serial.removeFile(
            serial.getFullPath(
              state.boardNavigationRoot,
              state.boardNavigationPath,
              value
            )
          )
        }
      }
    } else if (state.renamingFile == 'disk') {
      // Check if it will overwrite something
      const willOverwrite = await checkOverwrite({
        fileNames: [ value ],
        parentPath: disk.getFullPath(
          state.diskNavigationRoot, state.diskNavigationPath, ''
        ),
        source: 'disk'
      })
      if (willOverwrite.length > 0) {
        let message = `You are about to overwrite the following file/folder on your disk:\n\n`
        message += `${value}\n\n`
        message += `Are you sure you want to proceed?`
        const confirmAction = await confirm(message, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.isSaving = false
          state.renamingFile = null
          emitter.emit('render')
          return
        }

        if (file.type == 'folder') {
          await disk.removeFolder(
            disk.getFullPath(
              state.diskNavigationRoot,
              state.diskNavigationPath,
              value
            )
          )
        } else if (file.type == 'file') {
          await disk.removeFile(
            disk.getFullPath(
              state.diskNavigationRoot,
              state.diskNavigationPath,
              value
            )
          )
        }

      }
    }

    try {
      if (state.renamingFile == 'board') {
        await serial.renameFile(
          serial.getFullPath(
            state.boardNavigationRoot,
            state.boardNavigationPath,
            file.fileName
          ),
          serial.getFullPath(
            state.boardNavigationRoot,
            state.boardNavigationPath,
            value
          )
        )
      } else {
        await disk.renameFile(
          disk.getFullPath(
            state.diskNavigationRoot,
            state.diskNavigationPath,
            file.fileName
          ),
          disk.getFullPath(
            state.diskNavigationRoot,
            state.diskNavigationPath,
            value
          )
        )
      }
    } catch (e) {
      alert(`The file ${file.fileName} could not be renamed to ${value}`)
    }

    state.isSaving = false
    state.renamingFile = null
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  emitter.on('rename-tab', (id) => {
    log('rename-tab', id)
    state.renamingTab = id
    emitter.emit('render')
  })
  emitter.on('finish-renaming-tab', async (value) => {
    log('finish-renaming-tab', value)

    // You can only rename one tab, the active one
    const openFile = state.openFiles.find(f => f.id === state.renamingTab)

    if (!value || openFile.fileName == value) {
      state.renamingTab = null
      state.isSaving = false
      emitter.emit('render')
      return
    }

    let response = canSave({
      view: state.view,
      isConnected: state.isConnected,
      openFiles: state.openFiles,
      editingFile: state.editingFile
    })
    if (response == false) {
      log("can't save")
      return
    }

    state.isSaving = true
    emitter.emit('render')

    const oldParentFolder = openFile.parentFolder
    const oldName = openFile.fileName
    openFile.fileName = value

    const isNewFile = oldParentFolder === null
    let fullPathExists = false
    if (!isNewFile) {
      // Check if full path exists
      if (openFile.source == 'board') {
        fullPathExists = await serial.fileExists(
          serial.getFullPath(
            state.boardNavigationRoot,
            openFile.parentFolder,
            oldName
          )
        )
      } else if (openFile.source == 'disk') {
        fullPathExists = await disk.fileExists(
          disk.getFullPath(
            state.diskNavigationRoot,
            openFile.parentFolder,
            oldName
          )
        )
      }
    }
    if (isNewFile || !fullPathExists) {
      // Define parent folder
      if (openFile.source == 'board') {
        openFile.parentFolder = state.boardNavigationPath
      } else if (openFile.source == 'disk') {
        openFile.parentFolder = state.diskNavigationPath
      }
    }

    // Check if it will overwrite
    let willOverwrite = false
    if (openFile.source == 'board') {
      willOverwrite = await serial.fileExists(
        serial.getFullPath(
          state.boardNavigationRoot,
          openFile.parentFolder,
          openFile.fileName
        )
      )
    } else if (openFile.source == 'disk') {
      willOverwrite = await disk.fileExists(
        disk.getFullPath(
          state.diskNavigationRoot,
          openFile.parentFolder,
          openFile.fileName
        )
      )
    }

    if (willOverwrite) {
      const confirmation = await confirm(`You are about to overwrite the file ${openFile.fileName} on your ${openFile.source}.\n\n Are you sure you want to proceed?`, 'Cancel', 'Yes')
      if (!confirmation) {
        state.renamingTab = null
        state.isSaving = false
        openFile.fileName = oldName
        emitter.emit('render')
        return
      }
    }

    if (fullPathExists) {
      // SAVE FILE CONTENTS
      const contents = openFile.editor.editor.state.doc.toString()
      try {
        if (openFile.source == 'board') {
          await serial.getPrompt()
          await serial.saveFileContent(
            serial.getFullPath(
              state.boardNavigationRoot,
              openFile.parentFolder,
              oldName
            ),
            contents,
            (e) => {
              state.savingProgress = e
              emitter.emit('render')
            }
          )
        } else if (openFile.source == 'disk') {
          await disk.saveFileContent(
            disk.getFullPath(
              state.diskNavigationRoot,
              openFile.parentFolder,
              oldName
            ),
            contents
          )
        }
      } catch (e) {
        log('error', e)
      }
      // RENAME FILE
      try {
        if (openFile.source == 'board') {
          await serial.renameFile(
            serial.getFullPath(
              state.boardNavigationRoot,
              openFile.parentFolder,
              oldName
            ),
            serial.getFullPath(
              state.boardNavigationRoot,
              openFile.parentFolder,
              openFile.fileName
            )
          )
        } else if (openFile.source == 'disk') {
          await disk.renameFile(
            disk.getFullPath(
              state.diskNavigationRoot,
              openFile.parentFolder,
              oldName
            ),
            disk.getFullPath(
              state.diskNavigationRoot,
              openFile.parentFolder,
              openFile.fileName
            )
          )
        }
      } catch(e) {
        log('error', e)
      }
    } else if (!fullPathExists) {
      // SAVE FILE CONTENTS
      const contents = openFile.editor.editor.state.doc.toString()
      try {
        if (openFile.source == 'board') {
          await serial.getPrompt()
          await serial.saveFileContent(
            serial.getFullPath(
              state.boardNavigationRoot,
              openFile.parentFolder,
              openFile.fileName
            ),
            contents,
            (e) => {
              state.savingProgress = e
              emitter.emit('render')
            }
          )
        } else if (openFile.source == 'disk') {
          await disk.saveFileContent(
            disk.getFullPath(
              state.diskNavigationRoot,
              openFile.parentFolder,
              openFile.fileName
            ),
            contents
          )
        }
      } catch (e) {
        log('error', e)
      }
    }

    openFile.hasChanges = false
    state.renamingTab = null
    state.isSaving = false
    state.savingProgress = 0
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  emitter.on('toggle-file-selection', (file, source, event) => {
    log('toggle-file-selection', file, source, event)
    let parentFolder = source == 'board' ? state.boardNavigationPath : state.diskNavigationPath
    // Single file selection unless holding keyboard key
    if (event && !event.ctrlKey && !event.metaKey) {
      state.selectedFiles = [{
        fileName: file.fileName,
        type: file.type,
        source: source,
        parentFolder: parentFolder
      }]
      emitter.emit('render')
      return
    }

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
        type: file.type,
        source: source,
        parentFolder: parentFolder
      })
    }
    emitter.emit('render')
  })
  emitter.on('open-selected-files', async () => {
    log('open-selected-files')
    let filesToOpen = []
    let filesAlreadyOpen = []
    for (let i in state.selectedFiles) {
      let selectedFile = state.selectedFiles[i]
      if (selectedFile.type == 'folder') {
        // Don't open folders
        continue
      }
      // ALl good until here

      const alreadyOpen = state.openFiles.find((f) => {
        return f.fileName == selectedFile.fileName
              && f.source == selectedFile.source
              && f.parentFolder == selectedFile.parentFolder
      })
      console.log('already open', alreadyOpen)

      if (!alreadyOpen) {
        // This file is not open yet,
        // load content and append it to the list of files to open
        let file = null
        if (selectedFile.source == 'board') {
          const fileContent = await serial.loadFile(
            serial.getFullPath(
              state.boardNavigationRoot,
              state.boardNavigationPath,
              selectedFile.fileName
            )
          )
          const bytesToSource = String.fromCharCode(...fileContent);
          file = createFile({
            parentFolder: state.boardNavigationPath,
            fileName: selectedFile.fileName,
            source: selectedFile.source,
            content: bytesToSource
          })
          file.editor.onChange = function() {
            file.hasChanges = true
            emitter.emit('render')
          }
        } else if (selectedFile.source == 'disk') {
          const fileContent = await disk.loadFile(
            disk.getFullPath(
              state.diskNavigationRoot,
              state.diskNavigationPath,
              selectedFile.fileName
            )
          )
          file = createFile({
            parentFolder: state.diskNavigationPath,
            fileName: selectedFile.fileName,
            source: selectedFile.source,
            content: fileContent
          })
          file.editor.onChange = function() {
            file.hasChanges = true
            emitter.emit('render')
          }
        }
        filesToOpen.push(file)
      } else {
        // This file is already open,
        // append it to the list of files that are already open
        filesAlreadyOpen.push(alreadyOpen)
      }
    }

    // If opening an already open file, switch to its tab
    if (filesAlreadyOpen.length > 0) {
      state.editingFile = filesAlreadyOpen[0].id
    }
    // If there are new files to open, they take priority
    if (filesToOpen.length > 0) {
      state.editingFile = filesToOpen[0].id
    }

    state.openFiles = state.openFiles.concat(filesToOpen)

    state.view = 'editor'
    emitter.emit('render')
  })
  emitter.on('open-file', (source, file) => {
    log('open-file', source, file)
    state.selectedFiles = [{
      fileName: file.fileName,
      type: file.type,
      source: source,
      parentFolder: state[`${source}NavigationPath`] // XXX
    }]
    emitter.emit('open-selected-files')
  })

  // DOWNLOAD AND UPLOAD FILES
  emitter.on('upload-files', async () => {
    log('upload-files')
    state.isTransferring = true
    emitter.emit('render')

    // Check which files will be overwritten on the board
    const willOverwrite = await checkOverwrite({
      source: 'board',
      fileNames: state.selectedFiles.map(f => f.fileName),
      parentPath: serial.getFullPath(
        state.boardNavigationRoot,
        state.boardNavigationPath,
        ''
      ),
    })

    if (willOverwrite.length > 0) {
      let message = `You are about to overwrite the following files/folders on your board:\n\n`
      willOverwrite.forEach(f => message += `${f.fileName}\n`)
      message += `\n`
      message += `Are you sure you want to proceed?`
      const confirmAction = await confirm(message, 'Cancel', 'Yes')
      if (!confirmAction) {
        state.isTransferring = false
        emitter.emit('render')
        return
      }
    }

    for (let i in state.selectedFiles) {
      const file = state.selectedFiles[i]
      const srcPath = disk.getFullPath(
        state.diskNavigationRoot,
        state.diskNavigationPath,
        file.fileName
      )
      const destPath = serial.getFullPath(
        state.boardNavigationRoot,
        state.boardNavigationPath,
        file.fileName
      )
      if (file.type == 'folder') {
        await uploadFolder(
          srcPath, destPath,
          (progress, fileName) => {
            state.transferringProgress = `${fileName}: ${progress}`
            emitter.emit('render')
          }
        )
      } else {
        await serial.uploadFile(
          srcPath, destPath,
          (progress) => {
            state.transferringProgress = `${file.fileName}: ${progress}`
            emitter.emit('render')
          }
        )
      }
    }

    state.isTransferring = false
    state.selectedFiles = []
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('download-files', async () => {
    log('download-files')
    state.isTransferring = true
    emitter.emit('render')

    // Check which files will be overwritten on the disk
    const willOverwrite = await checkOverwrite({
      source: 'disk',
      fileNames: state.selectedFiles.map(f => f.fileName),
      parentPath: disk.getFullPath(
        state.diskNavigationRoot,
        state.diskNavigationPath,
        ''
      ),
    })

    if (willOverwrite.length > 0) {
      let message = `You are about to overwrite the following files/folders on your disk:\n\n`
      willOverwrite.forEach(f => message += `${f.fileName}\n`)
      message += `\n`
      message += `Are you sure you want to proceed?`
      const confirmAction = await confirm(message, 'Cancel', 'Yes')
      if (!confirmAction) {
        state.isTransferring = false
        emitter.emit('render')
        return
      }
    }

    for (let i in state.selectedFiles) {
      const file = state.selectedFiles[i]
      const srcPath = serial.getFullPath(
        state.boardNavigationRoot,
        state.boardNavigationPath,
        file.fileName
      )
      const destPath = disk.getFullPath(
        state.diskNavigationRoot,
        state.diskNavigationPath,
        file.fileName
      )
      if (file.type == 'folder') {
        await downloadFolder(
          srcPath, destPath,
          (e) => {
            state.transferringProgress = e
            emitter.emit('render')
          }
        )
      } else {
        await serial.downloadFile(
          srcPath, destPath,
          (e) => {
            state.transferringProgress = e
            emitter.emit('render')
          }
        )
      }
    }

    state.isTransferring = false
    state.selectedFiles = []
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  // NAVIGATION
  emitter.on('navigate-board-folder', (folder) => {
    log('navigate-board-folder', folder)
    state.boardNavigationPath = serial.getNavigationPath(
      state.boardNavigationPath,
      folder
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('navigate-board-parent', () => {
    log('navigate-board-parent')
    state.boardNavigationPath = serial.getNavigationPath(
      state.boardNavigationPath,
      '..'
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  emitter.on('navigate-disk-folder', (folder) => {
    log('navigate-disk-folder', folder)
    state.diskNavigationPath = disk.getNavigationPath(
      state.diskNavigationPath,
      folder
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('navigate-disk-parent', () => {
    log('navigate-disk-parent')
    state.diskNavigationPath = disk.getNavigationPath(
      state.diskNavigationPath,
      '..'
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  win.onBeforeReload(async () => {
    // Perform any cleanup needed
    if (state.isConnected) {
      await serial.disconnect()
      state.isConnected = false
      state.panelHeight = PANEL_CLOSED
      state.boardFiles = []
      state.boardNavigationPath = '/'
    }
    // Any other cleanup needed
  })

  win.beforeClose(async () => {
    const hasChanges = !!state.openFiles.find(f => f.hasChanges)
    if (hasChanges) {
      const response = await confirm('You may have unsaved changes. Are you sure you want to proceed?', 'Cancel', 'Yes')
      if (!response) return false
    }
    await win.confirmClose()
  })

  // win.shortcutCmdR(() => {
  //   // Only run if we can execute
    
  // })

  win.onKeyboardShortcut((key) => {
    if (key === shortcuts.CONNECT) {
      emitter.emit('open-connection-dialog')
    }
    if (key === shortcuts.DISCONNECT) {
      emitter.emit('disconnect')
    }
    if (key === shortcuts.RESET) {
      if (state.view != 'editor') return
      emitter.emit('reset')
    }
    if (key === shortcuts.CLEAR_TERMINAL) {
      if (state.view != 'editor') return
      emitter.emit('clear-terminal')
    }
    // Future: Toggle REPL panel
    // if (key === 'T') {
    //   if (state.view != 'editor') return
    //   emitter.emit('clear-terminal')
    // }
    if (key === shortcuts.RUN) {
      if (state.view != 'editor') return
      runCode()
    }
    if (key === shortcuts.RUN_SELECTION || key === shortcuts.RUN_SELECTION_WL) { 
      if (state.view != 'editor') return
      runCodeSelection()
    }
    if (key === shortcuts.STOP) {
      if (state.view != 'editor') return
      stopCode()
    }
    if (key === shortcuts.SAVE) {
      if (state.view != 'editor') return
      emitter.emit('save')
    }
    if (key === shortcuts.EDITOR_VIEW) {
      if (state.view != 'file-manager') return
      emitter.emit('change-view', 'editor')
    }
    if (key === shortcuts.FILES_VIEW) {
      if (state.view != 'editor') return
      emitter.emit('change-view', 'file-manager')
    }
    if (key === shortcuts.ESC) {
      if (state.isConnectionDialogOpen) {
        emitter.emit('close-connection-dialog')
      }
    }

  })

  function runCode() {
    if (canExecute({ view: state.view, isConnected: state.isConnected })) {
      emitter.emit('run')
    }
  }
  function runCodeSelection() {
    if (canExecute({ view: state.view, isConnected: state.isConnected })) {
      emitter.emit('run', true)
    }
  }
  function stopCode() {
    if (canExecute({ view: state.view, isConnected: state.isConnected })) {
      emitter.emit('stop')
    }
  }
  function createFile(args) {
    const {
      source,
      parentFolder,
      fileName,
      content = newFileContent,
      hasChanges = false
    } = args
    const id = generateHash()
    const editor = state.cache(CodeMirrorEditor, `editor_${id}`)
    editor.content = content
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
      hasChanges: true
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
  let files = await disk.ilistFiles(path)
  files = files.map(f => ({
    fileName: f.path,
    type: f.type
  }))
  files = files.sort(sortFilesAlphabetically)
  return files
}

function sortFilesAlphabetically(entryA, entryB) {
  return(entryA.fileName.localeCompare(entryB.fileName));
}

function generateHash() {
  return `${Date.now()}_${parseInt(Math.random()*1024)}`
}

async function getAvailablePorts() {
  return await serial.loadPorts()
}

async function getBoardFiles(path) {
  await serial.getPrompt()
  let files = await serial.ilistFiles(path)
  files = files.map(f => ({
    fileName: f[0],
    type: f[1] === 0x4000 ? 'folder' : 'file'
  }))
  files = files.sort(sortFilesAlphabetically)
  return files
}

function checkDiskFile({ root, parentFolder, fileName }) {
  if (root == null || parentFolder == null || fileName == null) return false
  return disk.fileExists(
    disk.getFullPath(root, parentFolder, fileName)
  )
}

async function checkBoardFile({ root, parentFolder, fileName }) {
  if (root == null || parentFolder == null || fileName == null) return false
  await serial.getPrompt()
  return serial.fileExists(
    serial.getFullPath(root, parentFolder, fileName)
  )
}

async function checkOverwrite({ fileNames = [], parentPath, source }) {
  let files = []
  if (source === 'board') {
    files = await getBoardFiles(parentPath)
  } else {
    files = await getDiskFiles(parentPath)
  }
  return files.filter((f) => fileNames.indexOf(f.fileName) !== -1)
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

function canSave({ view, isConnected, openFiles, editingFile }) {
  const isEditor = view === 'editor'
  const file = openFiles.find(f => f.id === editingFile)
  if (!file.hasChanges) return false
  // Can only save on editor
  if (!isEditor) return false
  // Can always save disk files
  if (file.source === 'disk') return true
  // Can save board files if connected
  return isConnected
}

function canExecute({ view, isConnected }) {
  const isEditor = view === 'editor'
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

function canEdit({ selectedFiles }) {
  const files = selectedFiles.filter((f) => f.type == 'file')
  return files.length != 0
}

async function removeBoardFolder(fullPath) {
  // TODO: Replace with getting the file tree from the board and deleting one by one
  let output = await serial.execFile(await getHelperFullPath())
  await serial.run(`delete_folder('${fullPath}')`)
}

async function uploadFolder(srcPath, destPath, dataConsumer) {
  dataConsumer = dataConsumer || function() {}
  await serial.createFolder(destPath)
  let allFiles = await disk.ilistAllFiles(srcPath)
  for (let i in allFiles) {
    const file = allFiles[i]
    const relativePath = file.path.substring(srcPath.length)
    if (file.type === 'folder') {
      await serial.createFolder(
        serial.getFullPath(
          destPath,
          relativePath,
          ''
        )
      )
    } else {
      await serial.uploadFile(
        disk.getFullPath(srcPath, relativePath, ''),
        serial.getFullPath(destPath, relativePath, ''),
        (progress) => {
          dataConsumer(progress, relativePath)
        }
      )
    }
  }
}

async function downloadFolder(srcPath, destPath, dataConsumer) {
  dataConsumer = dataConsumer || function() {}
  await disk.createFolder(destPath)
  let output = await serial.execFile(await getHelperFullPath())
  output = await serial.run(`ilist_all('${srcPath}')`)
  let files = []
  try {
    // Extracting the json output from serial response
    output = output.substring(
      output.indexOf('OK')+2,
      output.indexOf('\x04')
    )
    files = JSON.parse(output)
  } catch (e) {
    log('error', output)
  }
  for (let i in files) {
    const file = files[i]
    const relativePath = file.path.substring(srcPath.length)
    if (file.type == 'folder') {
      await disk.createFolder(
        disk.getFullPath( destPath, relativePath, '')
      )
    } else {
      await serial.downloadFile(
        serial.getFullPath(srcPath, relativePath, ''),
        serial.getFullPath(destPath, relativePath, '')
      )
    }
  }
}

async function getHelperFullPath() {
  const appPath = await disk.getAppPath()
  if (await win.isPackaged()) {
    return disk.getFullPath(
      appPath,
      '..',
      'ui/arduino/helpers.py'
    )
  } else {
    return disk.getFullPath(
      appPath,
      'ui/arduino/helpers.py',
      ''
    )
  }

}
