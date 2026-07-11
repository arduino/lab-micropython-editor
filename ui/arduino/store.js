const log = console.log
const serialBridge = window.BridgeSerial
const disk = window.BridgeDisk
const win = window.BridgeWindow

const shortcuts = window.BridgeWindow.getShortcuts()

const newFileContent = `# This program was created in Arduino Lab for MicroPython

print('Hello, MicroPython!')
`

// Utility functions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// In-app overlay confirm/alert system.
// Resolves with true (confirmed) or false (cancelled) when the user clicks a button.
// Only one overlay can be pending at a time — safe because Choo event handlers are linear.
let _overlayResolver = null

function showConfirmOverlay(state, emitter, msg, cancelLabel, confirmLabel) {
  if (_overlayResolver !== null) {
    console.warn('showConfirmOverlay: called while another overlay is pending')
    return Promise.resolve(false)
  }
  return new Promise((resolve) => {
    _overlayResolver = resolve
    state.overlay = confirmLabel
      ? { type: 'confirm', props: {
          message: msg,
          buttons: [
            { label: cancelLabel, result: false, style: 'secondary' },
            { label: confirmLabel, result: true,  style: 'primary'  }
          ]
        }}
      : { type: 'alert', props: {
          message: msg,
          buttons: [{ label: cancelLabel, result: true, style: 'primary' }]
        }}
    emitter.emit('render')
  })
}


function showInputOverlay(state, emitter, title, placeholder, isConnected) {
  if (_overlayResolver !== null) {
    console.warn('showInputOverlay: called while another overlay is pending')
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    _overlayResolver = resolve
    state.overlay = { type: 'new-file', props: { title, placeholder, isConnected } }
    emitter.emit('render')
  })
}

const SILENT_ERRORS = new Set([
  'INTERRUPTED_BY_RERUN',
  'INTERRUPTED_BY_STOP',
  'INTERRUPTED_BY_RESET',
])

function extractErrorMessage(e) {
  const raw = e.message || String(e)
  const marker = 'MicroPythonError: '
  const idx = raw.indexOf(marker)
  return idx !== -1 ? raw.slice(idx + marker.length) : raw
}

function alertError(state, emitter, e, context = '') {
  const raw = e?.message || String(e)
  if (SILENT_ERRORS.has(e?.code) || [...SILENT_ERRORS].some(code => raw.includes(code))) return
  console.error(context || 'error', e)
  const msg = context ? `${context}\n\n${extractErrorMessage(e)}` : extractErrorMessage(e)
  return showConfirmOverlay(state, emitter, msg, 'OK')
}

// Store: state wrapper

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

  state.newTabFileName = null
  state.editingFile = null
  state.creatingFile = null
  state.renamingFile = null
  state.creatingFolder = null
  state.renamingTab = null

  state.availablePorts = []

  state.isConnecting = false
  state.isConnected = false
  state.connectedPort = null


  state.isLoadingFiles = false
  state.boardInfo = null
  state.overlay = null
  state.dialogs = []

  state.isTerminalBound = false

  state.shortcutsDisabled = false

  await createNewTab('disk')
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
  const resizeTerminal = async() => {
    return new Promise(resolve => {
      setTimeout(() => {
        state.cache(XTerm, 'terminal').resizeTerm()
        resolve()
      }, 200)
    })
  }

  // Menu management
  const updateMenu = () => {
    window.BridgeWindow.updateMenuState({
      isConnected: state.isConnected,
      view: state.view
    })
  }

  // START AND BASIC ROUTING
  let terminalRouter = null
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

  emitter.on('change-view', async (view) => {
    if (state.view === view) {
      return
    } else {
      state.selectedFiles = []
    }
    if(view === 'file-manager') {
      if (state.isConnected) {
        if (terminalRouter) terminalRouter.setOperation('suppress')
        await serialBridge.getPrompt()
      }
      emitter.emit('refresh-files')
    }
    state.view = view
    emitter.emit('render')
    updateMenu()
  })

  emitter.on('launch-app', async (url, fallbackUrl) => {
    window.launchApp(url, fallbackUrl)
  })

  // CONNECTION DIALOG
  emitter.on('open-connection-dialog', async () => {
    // log('open-connection-dialog')
    dismissOpenDialogs()
    await serialBridge.disconnect()
    state.availablePorts = await getAvailablePorts()
    state.overlay = { type: 'connection', props: {} }
    emitter.emit('render')
  })
  emitter.on('close-connection-dialog', async () => {
    state.overlay = null
    await resizeTerminal()
    emitter.emit('render')
  })
  
  emitter.on('update-ports', async () => {
    state.availablePorts = await getAvailablePorts()
    emitter.emit('render')
  })
  emitter.on('select-port', async (port) => {
    // log('connect', port)
    const path = port.path

    state.isConnecting = true
    state.overlay = { type: 'spinner', props: { message: `Connecting to ${path}…` } }
    emitter.emit('render')

    // The following Timeout operation will be cleared after a succesful getPrompt()
    // If a board has crashed and/or cannot return a REPL prompt, the connection will fail
    // and the user will be prompted to reset the device and try again.
    let timeout_id = setTimeout(() => {
      emitter.emit('connection-timeout')
    }, 3500)
    try {
      await serialBridge.connect(path)
    } catch(e) {
      console.error(e)
    }
    // Stop whatever is going on, recover from raw repl
    // Suppress stream noise — we'll write the greeting directly after terminal is bound
    if (terminalRouter) terminalRouter.setOperation('suppress')
    let connectGreeting
    try {
      connectGreeting = await serialBridge.getPrompt()
    } catch(e) {
      // Board timed out or disconnected during getPrompt() — the UI-level timeout
      // (above) already shows the dialog; just bail out cleanly here.
      console.error('getPrompt failed:', e)
      clearTimeout(timeout_id)
      return
    }
    clearTimeout(timeout_id)
    state.overlay = { type: 'spinner', props: { message: 'Optimizing board communication speed…' } }
    emitter.emit('render')
    await serialBridge.calibrateDelay()
    state.overlay = null
    // Connected and ready
    state.isConnecting = false
    state.isConnected = true
    state.boardNavigationPath = await getBoardNavigationPath()
    state.boardInfo = await getBoardInfo()
    updateMenu()
    if (state.view === 'editor' && state.panelHeight <= PANEL_CLOSED) {
      state.panelHeight = state.savedPanelHeight
    }
    state.connectedPort = path

    // Bind terminal
    let term = state.cache(XTerm, 'terminal').term
    terminalRouter = new TerminalOutputRouter(term)
    terminalRouter.setOperation('suppress')
    terminalRouter.setHook('code-execution:before', (router) => {
      router.write('\r\n')
    })
    terminalRouter.setHook('code-execution:after', (router) => {
      router.write('>>> ')
    })
    terminalRouter.setHook('stop:after', (router) => {
      router.write('>>> ')
    })
    terminalRouter.setHook('reset:before', (router) => {
      router.write('\r\n' + ANSI.muted('--- Resetting board ---') + '\r\n')
    })
    if (!state.isTerminalBound) {
      state.isTerminalBound = true
      term.onData((data) => {
        serialBridge.eval(data)
        term.scrollToBottom()
      })
      serialBridge.eval('\x02') // Send Ctrl+B to enter normal repl mode
    }
    serialBridge.onData((data) => {
      terminalRouter.routeData(data)
    })
    if (connectGreeting) {
      const mpyIndex = connectGreeting.indexOf('MicroPython')
      const greeting = mpyIndex !== -1 ? connectGreeting.slice(mpyIndex) : connectGreeting
      const promptMatch = greeting.match(/([\s\S]*?)((?:\r?\n)?>>>\s*)$/)
      if (promptMatch) {
        terminalRouter.write(ANSI.info(promptMatch[1]))
        terminalRouter.write(promptMatch[2])
      } else {
        terminalRouter.write(ANSI.info(greeting))
        terminalRouter.write('>>> ')
      }
    }
    await sleep(150)
    terminalRouter.setOperation('repl-interactive')
    // Update the UI when the conncetion is closed
    // This may happen when unplugging the board
    serialBridge.onConnectionClosed(() => emitter.emit('disconnected'))
    // resize terminal HERE
    emitter.emit('close-connection-dialog')
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('disconnected', () => {
    if (terminalRouter) {
      terminalRouter.write('\r\n' + ANSI.muted('--- Disconnected from board ---') + '\r\n')
      terminalRouter.setOperation('repl-interactive')
    }
    state.isConnected = false
    state.isLoadingFiles = false
    const fn = _overlayResolver
    _overlayResolver = null
    if (fn) fn(false)
    state.overlay = null
    state.boardFiles = []
    state.boardNavigationPath = '/'
    state.boardInfo = null
    emitter.emit('refresh-files')
    emitter.emit('render')
    updateMenu()
  })
  emitter.on('disconnect', async () => {
    await serialBridge.disconnect()
  })
  emitter.on('connection-timeout', async () => {
    state.isConnected = false
    state.isConnecting = false
    await serialBridge.disconnect()
    state.availablePorts = await getAvailablePorts()
    state.overlay = { type: 'connection', props: { error: 'Could not connect. Reset the board and try again.' } }
    emitter.emit('render')
  })

  emitter.on('connect', async () => {
    try {
      state.availablePorts = await getAvailablePorts()
    } catch(e) {
      console.error('Could not get available ports. ', e)
    }

    if(state.availablePorts.length == 1) {
      emitter.emit('select-port', state.availablePorts[0])
    } else {
      emitter.emit('open-connection-dialog')
    }
  })

  // CODE EXECUTION
  emitter.on('run-from-button', (onlySelected = false) => {
    if (onlySelected) {
      runCodeSelection()
    } else {
      runCode()
    }
  })


  emitter.on('run', async (onlySelected = false) => {
    // log('run')
    const openFile = state.openFiles.find(f => f.id == state.editingFile)
    let code = openFile.editor.editor.state.doc.toString()

    let savedSelection = null

    if (onlySelected) {
      const editor = openFile.editor.editor
      savedSelection = editor.state.selection
      if (savedSelection.ranges[0].from === savedSelection.ranges[0].to) {
        window.editorCommands.selectFunction(editor)
      }
      const selected = editor.state.selection.ranges[0]
      const selectedCode = editor.state.doc.toString().substring(selected.from, selected.to)
      if (selectedCode.trim().length === 0) {
        editor.dispatch({ selection: savedSelection })
        return
      }
      code = selectedCode
    }

    emitter.emit('open-panel')
    emitter.emit('render')

    try {
      // suppress covers getPrompt() noise (Ctrl-C response, banner from step 1 passThrough
      // bytes that escape the stop handler's noise patterns, etc.).
      if (terminalRouter) terminalRouter.setOperation('suppress')
      await serialBridge.getPrompt()
      // code-execution before run(): micropython.js only forwards bytes from exec_raw
      // with passThrough=true (user code), so enter_raw_repl/_checkRam bytes never
      // arrive here regardless of mode. The handler receives OK+stdout+\x04+stderr+\x04>.
      if (terminalRouter) terminalRouter.setOperation('code-execution')
      await serialBridge.run(code, onlySelected ? {} : { checkRam: true })
    } catch(e) {
      await alertError(state, emitter, e)
    } finally {
      // Only reset to repl-interactive if stop/reset hasn't already taken over.
      if (terminalRouter && terminalRouter.currentOperation === 'code-execution') {
        terminalRouter.setOperation('repl-interactive')
      }
      if (savedSelection) {
        const editor = openFile.editor.editor
        editor.dispatch({ selection: savedSelection })
        editor.focus()
      }
    }
    
    el = document.querySelector('.cm-content')
    if (el) {
      el.focus()
    }
    emitter.emit('render')
  })
  emitter.on('stop', async () => {
    // log('stop')
    if (state.panelHeight <= PANEL_CLOSED) {
      state.panelHeight = state.savedPanelHeight
    }
    emitter.emit('open-panel')
    emitter.emit('render')
    if (state.isConnected) {
      if (terminalRouter) terminalRouter.setOperation('stop')
      await serialBridge.getPrompt(true)
      // getPrompt() resolves via ipcRenderer.invoke (microtask), but the serial-on-data
      // events carrying the stop output (traceback, >>>) are pushed events (macrotasks)
      // that may still be queued. Yield here so those events fire and are routed through
      // the 'stop' handler before we flip to 'repl-interactive'. 150ms is empirical —
      // enough to drain the IPC queue even on a slow board or loaded system.
      await sleep(150)
      if (terminalRouter && terminalRouter.currentOperation === 'stop') {
        terminalRouter.setOperation('repl-interactive')
      }
    }
  })
  emitter.on('reset', async () => {
    // log('reset')
    if (state.panelHeight <= PANEL_CLOSED) {
      state.panelHeight = state.savedPanelHeight
    }
    emitter.emit('open-panel')
    await resizeTerminal()
    emitter.emit('render')
    // Stay suppressed through prepareReset() AND the enter_raw_repl() ceremony inside
    // doReset() — both produce protocol noise (KeyboardInterrupt, Ctrl+B banner, raw REPL
    // entry bytes, interactive >>> echo) that must not reach the reset handler.
    // onBeforeReset fires after the code write but before \x04 triggers the actual reboot,
    // so the first genuine reboot bytes arrive while already in reset mode.
    if (terminalRouter) terminalRouter.setOperation('suppress')
    serialBridge.onBeforeReset(() => {
      if (terminalRouter) terminalRouter.setOperation('reset')
    })
    try {
      await serialBridge.prepareReset()
      await serialBridge.doReset()
    } catch (e) {
      await alertError(state, emitter, e, 'Reset failed')
    }
    // The reset handler owns the repl-interactive transition when the board sends >>>.
    // Sleep is a safety fallback if the board never completes the reboot (crash/hang).
    // Also covers suppress — meaning onBeforeReset never fired (e.g. doReset threw early).
    await sleep(4000)
    if (terminalRouter && (
      terminalRouter.currentOperation === 'reset' ||
      terminalRouter.currentOperation === 'suppress'
    )) {
      terminalRouter.setOperation('repl-interactive')
    }
    emitter.emit('update-files')
    emitter.emit('render')
  })

  // PANEL
  emitter.on('open-panel', () => {
    emitter.emit('stop-resizing-panel')
    state.panelHeight = state.savedPanelHeight
    emitter.emit('render')
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
    // log('start-resizing-panel')
    window.addEventListener('mousemove', state.resizePanel)
    // Stop resizing when mouse button is released anywhere, leaves window, or enters the tabs area
    window.addEventListener('mouseup', () => {
      emitter.emit('stop-resizing-panel')
    }, { once: true })
    document.body.addEventListener('mouseleave', () => {
      emitter.emit('stop-resizing-panel')
    }, { once: true })
    document.querySelector('#tabs').addEventListener('mouseenter', () => {
      emitter.emit('stop-resizing-panel')
    }, { once: true })
  })
  emitter.on('stop-resizing-panel', () => {
    // log('stop-resizing-panel')
    resizeTerminal()
    window.removeEventListener('mousemove', state.resizePanel)
  })

  // NEW FILE AND SAVING
  emitter.on('create-new-file', async () => {
    // log('create-new-file')
    dismissOpenDialogs()
    const result = await showInputOverlay(state, emitter, 'Create new file', generateFileName(), state.isConnected)
    if (result) emitter.emit('create-new-tab', result.device, result.fileName)
  })
  emitter.on('save', async () => {
    // log('save')
    let response = canSave({
      view: state.view,
      isConnected: state.isConnected,
      openFiles: state.openFiles,
      editingFile: state.editingFile
    })
    if (response == false) {
      // log("can't save")
      return
    }

    state.overlay = { type: 'spinner', props: { message: 'Saving…' } }
    emitter.emit('render')

    // Get open file
    let openFile = state.openFiles.find(f => f.id === state.editingFile)

    let willOverwrite = false
    const oldParentFolder = openFile.parentFolder
    const isNewFile = oldParentFolder === null
    let saved = false

    try {
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
        if (terminalRouter) terminalRouter.setOperation('suppress')
        await serialBridge.getPrompt()
        fullPathExists = await serialBridge.fileExists(
          serialBridge.getFullPath(
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
          await serialBridge.getPrompt()
          willOverwrite = await serialBridge.fileExists(
            serialBridge.getFullPath(
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
        const confirmation = await showConfirmOverlay(state, emitter, `You are about to overwrite the file ${openFile.fileName} on your ${openFile.source}.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmation) {
          openFile.parentFolder = oldParentFolder
          return  // finally handles overlay reset and router restore
        }
      }

      // SAVE
      const contents = openFile.editor.editor.state.doc.toString()
      if (openFile.source == 'board') {
        if (terminalRouter) terminalRouter.setOperation('suppress')
        await serialBridge.getPrompt()
        if (terminalRouter) terminalRouter.setOperation('file-saving')
        state.overlay = { type: 'progress', props: { message: 'Saving…', pct: 0 } }
        await serialBridge.saveFileContentAtomic(
          serialBridge.getFullPath(
            state.boardNavigationRoot,
            openFile.parentFolder,
            openFile.fileName
          ),
          contents,
          (e) => {
            state.overlay = { type: 'progress', props: { message: 'Saving…', pct: parseInt(e) || 0 } }
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

      openFile.hasChanges = false
      saved = true
    } catch (e) {
      // Disconnect during save: the 'disconnected' event already shows the notification
      // and resets UI. Only surface errors that occur while still connected.
      if (state.isConnected) await alertError(state, emitter, e, 'Save failed')
    } finally {
      state.overlay = null
      if (terminalRouter && state.isConnected) terminalRouter.setOperation('repl-interactive')
      // refresh-files must fire AFTER setOperation('repl-interactive') so it can safely
      // override the operation to 'file-listing' without being stomped by this finally
      if (saved) emitter.emit('refresh-files')
      emitter.emit('render')
    }
  })

  // TABS
  emitter.on('select-tab', (id) => {
    // log('select-tab', id)
    state.editingFile = id
    emitter.emit('render')
  })
  emitter.on('close-tab', async (id) => {
    // log('close-tab', id)
    const currentTab = state.openFiles.find(f => f.id === id)
    if (currentTab.hasChanges) {
      let response = await showConfirmOverlay(state, emitter, "Your file has unsaved changes.\nAre you sure you want to proceed?", "Cancel", "Yes")
      if (!response) return false
    }
    currentTab.editor.destroy()
    state.openFiles = state.openFiles.filter(f => f.id !== id)
    // state.editingFile = null

    if(state.openFiles.length > 0) {
      state.editingFile = state.openFiles[0].id
    } else {
      await createNewTab('disk')
    }

    emitter.emit('render')
  })

  // FILE OPERATIONS
  emitter.on('refresh-files', async () => {
    // log('refresh-files')
    if (state.isLoadingFiles) return
    state.isLoadingFiles = true
    emitter.emit('render')

    if (state.isConnected) {
      try {
        if (terminalRouter) terminalRouter.setOperation('file-listing')
        state.boardFiles = await getBoardFiles(
          serialBridge.getFullPath(
            state.boardNavigationRoot,
            state.boardNavigationPath,
            ''
          )
        )
        // ilistFiles resolves via ipcRenderer.invoke (microtask), but serial-on-data
        // events carrying the file listing protocol bytes (>OK[...]) are pushed events
        // (macrotasks) that may still be queued. Yield here so those events fire and are
        // absorbed by the 'file-listing' handler before we flip to 'repl-interactive'.
        await sleep(150)
        if (terminalRouter) terminalRouter.setOperation('repl-interactive')
      } catch (e) {
        state.boardFiles = []
        if (terminalRouter) terminalRouter.setOperation('repl-interactive')
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
    // log('refresh-selected-files')
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
  emitter.on('create-new-tab', async (device, fileName = null) => {
    const parentFolder = device == 'board' ? state.boardNavigationPath : state.diskNavigationPath
    // log('create-new-tab', device, fileName, parentFolder)
    const success = await createNewTab(device, fileName, parentFolder)
    if (success) {
      emitter.emit('render')
    }
  })
  emitter.on('create-file', (device, fileName = null) => {
    // log('create-file', device)
    if (state.creatingFile !== null) return
    
    state.creatingFile = device
    state.creatingFolder = null
    if (fileName != null) {
      emitter.emit('finish-creating-file', fileName)
    }
    emitter.emit('render')
  })
  
  emitter.on('finish-creating-file', async (fileNameParameter) => {
    // log('finish-creating', fileNameParameter)
    if (!state.creatingFile) return

    if (!fileNameParameter) {
      state.creatingFile = null
      emitter.emit('render')
      return
    }

    if (state.creatingFile == 'board' && state.isConnected) {
      try {
        if (terminalRouter) terminalRouter.setOperation('suppress')
        let willOverwrite = await checkBoardFile({
          root: state.boardNavigationRoot,
          parentFolder: state.boardNavigationPath,
          fileName: fileNameParameter
        })
        if (willOverwrite) {
          const confirmAction = await showConfirmOverlay(state, emitter, `You are about to overwrite the file ${fileNameParameter} on your board.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
          if (!confirmAction) {
            state.creatingFile = null
            emitter.emit('render')
            return
          }
          // fs_save opens with 'wb' which truncates the existing file — no explicit removal needed
        }
        const boardTabConflicts = findTabConflicts('board', state.boardNavigationPath, [fileNameParameter])
        if (!willOverwrite && boardTabConflicts.length > 0) {
          const confirmAction = await showConfirmOverlay(state, emitter, `${fileNameParameter} is open in the editor with unsaved changes. Creating this file will overwrite the open version.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
          if (!confirmAction) {
            state.creatingFile = null
            emitter.emit('render')
            return
          }
        }
        if (terminalRouter) terminalRouter.setOperation('file-saving')
        await serialBridge.saveFileContentAtomic(
          serialBridge.getFullPath(
            state.boardNavigationRoot,
            state.boardNavigationPath,
            fileNameParameter
          ),
          newFileContent
        )
        for (const tab of boardTabConflicts) {
          tab.editor.editor.dispatch({
            changes: { from: 0, to: tab.editor.editor.state.doc.length, insert: newFileContent }
          })
          tab.editor.content = newFileContent
          tab.parentFolder = state.boardNavigationPath
          tab.hasChanges = false
        }
      } catch (e) {
        if (state.isConnected) await alertError(state, emitter, e, 'Create file failed')
      } finally {
        if (terminalRouter && state.isConnected) terminalRouter.setOperation('repl-interactive')
      }
    } else if (state.creatingFile == 'disk') {
      let willOverwrite = await checkDiskFile({
        root: state.diskNavigationRoot,
        parentFolder: state.diskNavigationPath,
        fileName: fileNameParameter
      })
      if (willOverwrite) {
        const confirmAction = await showConfirmOverlay(state, emitter, `You are about to overwrite the file ${fileNameParameter} on your disk.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.creatingFile = null
          emitter.emit('render')
          return
        }
          // disk.saveFileContent uses fs.writeFile which truncates — no explicit removal needed
      }
      const diskTabConflicts = findTabConflicts('disk', state.diskNavigationPath, [fileNameParameter])
      if (!willOverwrite && diskTabConflicts.length > 0) {
        const confirmAction = await showConfirmOverlay(state, emitter, `${fileNameParameter} is open in the editor with unsaved changes. Creating this file will overwrite the open version.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmAction) {
          state.creatingFile = null
          emitter.emit('render')
          return
        }
      }
      await disk.saveFileContent(
        disk.getFullPath(
          state.diskNavigationRoot,
          state.diskNavigationPath,
          fileNameParameter
        ),
        newFileContent
      )
      for (const tab of diskTabConflicts) {
        tab.editor.editor.dispatch({
          changes: { from: 0, to: tab.editor.editor.state.doc.length, insert: newFileContent }
        })
        tab.editor.content = newFileContent
        tab.parentFolder = state.diskNavigationPath
        tab.hasChanges = false
      }
    }

    setTimeout(() => {
      state.creatingFile = null
      dismissOpenDialogs()
      emitter.emit('refresh-files')
      emitter.emit('render')
    }, 200)
  })
  emitter.on('create-folder', (device) => {
    // log('create-folder', device)
    if (state.creatingFolder !== null) return
    state.creatingFolder = device
    state.creatingFile = null
    emitter.emit('render')
  })
  emitter.on('finish-creating-folder', async (value) => {
    // log('finish-creating-folder', value)
    if (!state.creatingFolder) return

    if (!value) {
      state.creatingFolder = null
      emitter.emit('render')
      return
    }

    if (state.creatingFolder == 'board' && state.isConnected) {
      try {
        if (terminalRouter) terminalRouter.setOperation('suppress')
        let willOverwrite = await checkBoardFile({
          root: state.boardNavigationRoot,
          parentFolder: state.boardNavigationPath,
          fileName: value
        })
        if (willOverwrite) {
          const confirmAction = await showConfirmOverlay(state, emitter, `You are about to overwrite ${value} on your board.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
          if (!confirmAction) {
            state.creatingFolder = null
            emitter.emit('render')
            return
          }
          // Remove existing folder
          await removeBoardFolder(
            serialBridge.getFullPath(
              state.boardNavigationRoot,
              state.boardNavigationPath,
              value
            )
          )
        }
        await serialBridge.createFolder(
          serialBridge.getFullPath(
            state.boardNavigationRoot,
            state.boardNavigationPath,
            value
          )
        )
      } finally {
        if (terminalRouter && state.isConnected) terminalRouter.setOperation('repl-interactive')
      }
    } else if (state.creatingFolder == 'disk') {
      let willOverwrite = await checkDiskFile({
        root: state.diskNavigationRoot,
        parentFolder: state.diskNavigationPath,
        fileName: value
      })
      if (willOverwrite) {
        const confirmAction = await showConfirmOverlay(state, emitter, `You are about to overwrite ${value} on your disk.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
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

  emitter.on('remove-files', async (source) => {
    // log('remove-files') // and folders
    const filesToRemove = state.selectedFiles.filter(file => file.source === source)
    const names = filesToRemove.map(file => file.fileName)

    const deviceLabel = source === 'board' ? 'your board' : 'your disk'
    let message = `You are about to delete the following items from ${deviceLabel}:\n\n`
    names.forEach(name => message += `${name}\n`)
    message += `\nAre you sure you want to proceed?`

    const confirmAction = await showConfirmOverlay(state, emitter, message, 'Cancel', 'Yes')
    if (!confirmAction) return

    state.overlay = { type: 'spinner', props: { message: `Removing ${names.join(', ')}…` } }
    emitter.emit('render')

    try {
      if (terminalRouter) terminalRouter.setOperation('suppress')

      for (const file of filesToRemove) {
        if (file.type == 'folder') {
          if (file.source === 'board') {
            await removeBoardFolder(
              serialBridge.getFullPath(
                state.boardNavigationRoot,
                file.parentFolder,
                file.fileName
              )
            )
          } else {
            await disk.removeFolder(
              disk.getFullPath(
                state.diskNavigationRoot,
                file.parentFolder,
                file.fileName
              )
            )
          }
        } else {
          if (file.source === 'board') {
            await serialBridge.removeFile(
              serialBridge.getFullPath(
                state.boardNavigationRoot,
                file.parentFolder,
                file.fileName
              )
            )
          } else {
            await disk.removeFile(
              disk.getFullPath(
                state.diskNavigationRoot,
                file.parentFolder,
                file.fileName
              )
            )
          }
        }
      }
      state.selectedFiles = state.selectedFiles.filter(f => f.source !== source)
      emitter.emit('refresh-files')
    } catch (e) {
      await alertError(state, emitter, e, 'Remove failed')
    } finally {
      state.overlay = null
      if (terminalRouter) terminalRouter.setOperation('repl-interactive')
      emitter.emit('render')
    }
  })

  emitter.on('rename-file', (source, item) => {
    // log('rename-file', source, item)
    state.renamingFile = source
    emitter.emit('render')
  })
  emitter.on('finish-renaming-file', async (value) => {
    // log('finish-renaming-file', value)

    // You can only rename one file, the selected one
    const file = state.selectedFiles[0]

    if (!value || file.fileName == value) {
      state.renamingFile = null
      emitter.emit('render')
      return
    }

    state.overlay = { type: 'spinner', props: { message: 'Renaming…' } }
    emitter.emit('render')

    let renamed = false
    try {
      // Check if new name overwrites something
      if (state.renamingFile == 'board' && state.isConnected) {
        if (terminalRouter) terminalRouter.setOperation('suppress')
        const willOverwrite = await checkOverwrite({
          fileNames: [ value ],
          parentPath: serialBridge.getFullPath(
            state.boardNavigationRoot, state.boardNavigationPath, ''
          ),
          source: 'board'
        })
        if (willOverwrite.length > 0) {
          let message = `You are about to overwrite the following file/folder on your board:\n\n`
          message += `**${value}**\n\n`
          message += `Are you sure you want to proceed?`
          const confirmAction = await showConfirmOverlay(state, emitter, message, 'Cancel', 'Yes')
          if (!confirmAction) {
            state.renamingFile = null
            return  // finally handles overlay, router, render
          }

          if (file.type == 'folder') {
            await removeBoardFolder(
              serialBridge.getFullPath(
                state.boardNavigationRoot,
                state.boardNavigationPath,
                value
              )
            )
          } else if (file.type == 'file') {
            await serialBridge.removeFile(
              serialBridge.getFullPath(
                state.boardNavigationRoot,
                state.boardNavigationPath,
                value
              )
            )
          }
        }
      } else if (state.renamingFile == 'disk') {
        const willOverwrite = await checkOverwrite({
          fileNames: [ value ],
          parentPath: disk.getFullPath(
            state.diskNavigationRoot, state.diskNavigationPath, ''
          ),
          source: 'disk'
        })
        if (willOverwrite.length > 0) {
          let message = `You are about to overwrite the following file/folder on your disk:\n\n`
          message += `**${value}**\n\n`
          message += `Are you sure you want to proceed?`
          const confirmAction = await showConfirmOverlay(state, emitter, message, 'Cancel', 'Yes')
          if (!confirmAction) {
            state.renamingFile = null
            return  // finally handles overlay, router, render
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
          await serialBridge.renameFile(
            serialBridge.getFullPath(
              state.boardNavigationRoot,
              state.boardNavigationPath,
              file.fileName
            ),
            serialBridge.getFullPath(
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
        // Update tab if renaming successful
        const tabToRenameIndex = state.openFiles.findIndex(f => f.fileName === file.fileName && f.source === file.source && f.parentFolder === file.parentFolder)
        if (tabToRenameIndex > -1) {
          state.openFiles[tabToRenameIndex].fileName = value
          emitter.emit('render')
        }
        renamed = true
      } catch (e) {
        await alertError(state, emitter, e, `Could not rename ${file.fileName} to ${value}`)
      }
    } finally {
      state.overlay = null
      state.renamingFile = null
      if (terminalRouter && state.isConnected) terminalRouter.setOperation('repl-interactive')
      if (renamed) emitter.emit('refresh-files')
      emitter.emit('render')
    }
  })

  emitter.on('rename-tab', (id) => {
    // log('rename-tab', id)
    state.renamingTab = id
    emitter.emit('render')
  })
  emitter.on('finish-renaming-tab', async (value) => {
    // log('finish-renaming-tab', value)

    // You can only rename one tab, the active one
    const openFile = state.openFiles.find(f => f.id === state.renamingTab)

    if (!value || openFile.fileName == value) {
      state.renamingTab = null
      emitter.emit('render')
      return
    }

    // Block rename if another open tab already uses the target name at the destination.
    // For existing files the destination is the current parentFolder; for new unsaved files
    // it will be the active navigation path when saved.
    const destFolder = openFile.parentFolder !== null
      ? openFile.parentFolder
      : openFile.source === 'board' ? state.boardNavigationPath : state.diskNavigationPath
    if (findTabConflicts(openFile.source, destFolder, [value], openFile.id).length > 0) {
      await showConfirmOverlay(state, emitter, `${value} is already open in another tab. Please choose a different name.`, 'OK')
      state.renamingTab = null
      emitter.emit('render')
      return
    }

    state.overlay = { type: 'spinner', props: { message: 'Renaming…' } }
    emitter.emit('render')

    const oldParentFolder = openFile.parentFolder
    const oldName = openFile.fileName
    openFile.fileName = value

    let saved = false
    try {
      if (openFile.source == 'board') {
        if (terminalRouter) terminalRouter.setOperation('suppress')
      }

      const isNewFile = oldParentFolder === null
      let fullPathExists = false
      if (!isNewFile) {
        // Check if full path exists
        if (openFile.source == 'board') {
          fullPathExists = await serialBridge.fileExists(
            serialBridge.getFullPath(
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
        willOverwrite = await serialBridge.fileExists(
          serialBridge.getFullPath(
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
        const confirmation = await showConfirmOverlay(state, emitter, `You are about to overwrite the file ${openFile.fileName} on your ${openFile.source}.\n\nAre you sure you want to proceed?`, 'Cancel', 'Yes')
        if (!confirmation) {
          openFile.fileName = oldName
          state.renamingTab = null
          return  // finally handles overlay, router, render
        }
      }

      if (fullPathExists) {
        // SAVE FILE CONTENTS
        if (openFile.hasChanges) {
          const contents = openFile.editor.editor.state.doc.toString()
          try {
            if (openFile.source == 'board') {
              await serialBridge.getPrompt()
              if (terminalRouter) terminalRouter.setOperation('file-saving')
              state.overlay = { type: 'progress', props: { message: 'Saving…', pct: 0 } }
              await serialBridge.saveFileContentAtomic(
                serialBridge.getFullPath(
                  state.boardNavigationRoot,
                  openFile.parentFolder,
                  oldName
                ),
                contents,
                (e) => {
                  state.overlay = { type: 'progress', props: { message: 'Saving…', pct: parseInt(e) || 0 } }
                  emitter.emit('render')
                }
              )
              if (terminalRouter) terminalRouter.setOperation('suppress')
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
            await alertError(state, emitter, e, 'Save failed')
          }
        }
        // RENAME FILE
        try {
          if (openFile.source == 'board') {
            await serialBridge.renameFile(
              serialBridge.getFullPath(
                state.boardNavigationRoot,
                openFile.parentFolder,
                oldName
              ),
              serialBridge.getFullPath(
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
          await alertError(state, emitter, e, 'Rename failed')
        }
      } else if (!fullPathExists) {
        // SAVE FILE CONTENTS
        const contents = openFile.editor.editor.state.doc.toString()
        try {
          if (openFile.source == 'board') {
            await serialBridge.getPrompt()
            if (terminalRouter) terminalRouter.setOperation('file-saving')
            state.overlay = { type: 'progress', props: { message: 'Saving…', pct: 0 } }
            await serialBridge.saveFileContentAtomic(
              serialBridge.getFullPath(
                state.boardNavigationRoot,
                openFile.parentFolder,
                openFile.fileName
              ),
              contents,
              (e) => {
                state.overlay = { type: 'progress', props: { message: 'Saving…', pct: parseInt(e) || 0 } }
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
          await alertError(state, emitter, e, 'Save failed')
        }
      }

      openFile.hasChanges = false
      state.renamingTab = null
      saved = true
    } finally {
      state.overlay = null
      if (terminalRouter && state.isConnected) terminalRouter.setOperation('repl-interactive')
      if (saved) emitter.emit('refresh-files')
      emitter.emit('render')
    }
  })

  emitter.on('toggle-file-selection', (file, source, event) => {
    // log('toggle-file-selection', file, source, event)
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
  emitter.on('clear-selection-by-source', (source) => {
    state.selectedFiles = state.selectedFiles.filter(f => f.source !== source)
    emitter.emit('render')
  })
  emitter.on('open-selected-files', async () => {
    // log('open-selected-files')
    let filesToOpen = []
    let filesAlreadyOpen = []
    if (state.isLoadingFiles) return
    state.isLoadingFiles = true
    emitter.emit('render')
    try {
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

        if (!alreadyOpen) {
          // This file is not open yet,
          // load content and append it to the list of files to open
          let file = null
          if (selectedFile.source == 'board') {
            if (terminalRouter) terminalRouter.setOperation('file-loading')
            state.overlay = { type: 'progress', props: { message: `Opening ${selectedFile.fileName}…`, pct: 0 } }
            emitter.emit('render')
            // fileContent receives a raw buffer from loadFile()
            const fileContent = await serialBridge.loadFile(
              serialBridge.getFullPath(
                state.boardNavigationRoot,
                selectedFile.parentFolder,
                selectedFile.fileName
              ),
              (progress) => {
                state.overlay = { type: 'progress', props: { message: `Opening ${selectedFile.fileName}…`, pct: parseInt(progress) || 0 } }
                emitter.emit('render')
              }
            )
            // we convert the buffer to a Uint8Array
            const contentArray = new Uint8Array(fileContent);
            // we feed the Uint8Array to the TextDecoder
            const bytesToSource = new TextDecoder('utf-8').decode(contentArray);
            file = createFile({
              parentFolder: selectedFile.parentFolder,
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
                selectedFile.parentFolder,
                selectedFile.fileName
              )
            )
            file = createFile({
              parentFolder: selectedFile.parentFolder,
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
      state.selectedFiles = []
      state.view = 'editor'
      updateMenu()
    } catch (e) {
      await alertError(state, emitter, e, 'Failed to open file')
    } finally {
      state.overlay = null
      state.isLoadingFiles = false
      if (terminalRouter && state.isConnected) terminalRouter.setOperation('repl-interactive')
      emitter.emit('render')
    }
  })
  emitter.on('open-file', (source, file) => {
    // log('open-file', source, file)
    state.selectedFiles = [{
      fileName: file.fileName,
      type: file.type,
      source: source,
      parentFolder: state[`${source}NavigationPath`] // XXX
    }]
    emitter.emit('open-selected-files')
  })

  const DISMISSABLE_OVERLAY_TYPES = new Set(['confirm', 'alert', 'new-file', 'connection'])
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DISMISSABLE_OVERLAY_TYPES.has(state.overlay?.type)) {
      emitter.emit('overlay-button-clicked', null)
    }
  })

  emitter.on('overlay-button-clicked', (result) => {
    const prevType = state.overlay?.type
    state.overlay = null
    const fn = _overlayResolver
    _overlayResolver = null
    emitter.emit('render')
    if (fn) fn(result)
    if (terminalRouter) terminalRouter.terminal.focus()
    if (prevType === 'connection') resizeTerminal()
  })

  emitter.on('cancel-operation', async () => {
    if (state.isConnected) await serialBridge.keyboardInterrupt()
  })

  // DOWNLOAD AND UPLOAD FILES
  emitter.on('upload-files', async () => {
    // log('upload-files')
    try {
      // Check which files will be overwritten on the board
      if (terminalRouter) terminalRouter.setOperation('file-listing')
      const willOverwrite = await checkOverwrite({
        source: 'board',
        fileNames: state.selectedFiles.map(f => f.fileName),
        parentPath: serialBridge.getFullPath(
          state.boardNavigationRoot,
          state.boardNavigationPath,
          ''
        ),
      })

      if (willOverwrite.length > 0) {
        let message = `You are about to overwrite the following files/folders on your board:\n\n`
        willOverwrite.forEach(f => message += `**${f.fileName}**\n`)
        message += `\n`
        message += `Are you sure you want to proceed?`
        const confirmAction = await showConfirmOverlay(state, emitter, message, 'Cancel', 'Yes')
        if (!confirmAction) return
      }

      // Collect all open board tabs matching the upload destination — covers both
      // files already on the board (caught by checkOverwrite) and unsaved new tabs.
      const affectedTabs = findTabConflicts(
        'board',
        state.boardNavigationPath,
        state.selectedFiles.map(f => f.fileName)
      )

      // Warn separately about unsaved tabs not already covered by the board overwrite dialog.
      const overwrittenNames = new Set(willOverwrite.map(f => f.fileName.toLowerCase()))
      const tabOnlyConflicts = affectedTabs.filter(f => !overwrittenNames.has(f.fileName.toLowerCase()))
      if (tabOnlyConflicts.length > 0) {
        let message = `The following files are open in the editor with unsaved changes and will conflict with this upload:\n\n`
        tabOnlyConflicts.forEach(f => message += `**${f.fileName}**\n`)
        message += `\nUploading will overwrite the open version. Are you sure you want to proceed?`
        const confirmAction = await showConfirmOverlay(state, emitter, message, 'Cancel', 'Yes')
        if (!confirmAction) return
      }

      if (terminalRouter) terminalRouter.setOperation('file-uploading')
      state.overlay = { type: 'progress', props: { message: 'Uploading…', pct: 0 } }
      emitter.emit('render')

      for (let i in state.selectedFiles) {
        const file = state.selectedFiles[i]
        const srcPath = disk.getFullPath(
          state.diskNavigationRoot,
          file.parentFolder,
          file.fileName
        )
        const destPath = serialBridge.getFullPath(
          state.boardNavigationRoot,
          state.boardNavigationPath,
          file.fileName
        )

        if (file.type == 'folder') {
          await uploadFolder(
            srcPath, destPath,
            (progress, fileName) => {
              state.overlay = { type: 'progress', props: { message: 'Uploading…', pct: parseInt(progress) || 0, label: fileName } }
              emitter.emit('render')
            }
          )
        } else {
          await serialBridge.uploadFile(
            srcPath, destPath,
            (progress) => {
              state.overlay = { type: 'progress', props: { message: 'Uploading…', pct: parseInt(progress) || 0, label: file.fileName } }
              emitter.emit('render')
            }
          )
        }
      }
      state.selectedFiles = []

      // Reload open tabs that were overwritten so they reflect the uploaded content.
      for (const tab of affectedTabs) {
        if (terminalRouter) terminalRouter.setOperation('file-loading')
        const fileContent = await serialBridge.loadFile(
          serialBridge.getFullPath(state.boardNavigationRoot, state.boardNavigationPath, tab.fileName)
        )
        const content = new TextDecoder('utf-8').decode(new Uint8Array(fileContent))
        tab.editor.editor.dispatch({
          changes: { from: 0, to: tab.editor.editor.state.doc.length, insert: content }
        })
        tab.editor.content = content
        tab.parentFolder = state.boardNavigationPath
        tab.hasChanges = false
      }
    } catch (e) {
      await alertError(state, emitter, e, 'Upload failed')
    } finally {
      state.overlay = null
      if (terminalRouter) terminalRouter.setOperation('repl-interactive')
      emitter.emit('refresh-files')
      emitter.emit('render')
    }
  })
  emitter.on('download-files', async () => {
    // log('download-files')
    try {
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
        willOverwrite.forEach(f => message += `**${f.fileName}**\n`)
        message += `\n`
        message += `Are you sure you want to proceed?`
        const confirmAction = await showConfirmOverlay(state, emitter, message, 'Cancel', 'Yes')
        if (!confirmAction) return
      }

      if (terminalRouter) terminalRouter.setOperation('file-loading')
      state.overlay = { type: 'progress', props: { message: 'Downloading…', pct: 0 } }
      emitter.emit('render')

      for (let i in state.selectedFiles) {
        const file = state.selectedFiles[i]
        const srcPath = serialBridge.getFullPath(
          state.boardNavigationRoot,
          file.parentFolder,
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
            (progress) => {
              state.overlay = { type: 'progress', props: { message: 'Downloading…', pct: parseInt(progress) || 0, label: file.fileName } }
              emitter.emit('render')
            }
          )
        } else {
          await serialBridge.downloadFile(
            srcPath, destPath,
            (progress) => {
              state.overlay = { type: 'progress', props: { message: 'Downloading…', pct: parseInt(progress) || 0, label: file.fileName } }
              emitter.emit('render')
            }
          )
        }
      }
      state.selectedFiles = []
    } catch (e) {
      await alertError(state, emitter, e, 'Download failed')
    } finally {
      state.overlay = null
      if (terminalRouter) terminalRouter.setOperation('repl-interactive')
      emitter.emit('refresh-files')
      emitter.emit('render')
    }
  })

  // NAVIGATION
  emitter.on('navigate-board-folder', (folder) => {
    // log('navigate-board-folder', folder)
    if (terminalRouter) terminalRouter.setOperation('directory-navigation')
    state.boardNavigationPath = serialBridge.getNavigationPath(
      state.boardNavigationPath,
      folder
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('navigate-board-parent', () => {
    // log('navigate-board-parent')
    if (terminalRouter) terminalRouter.setOperation('directory-navigation')
    state.boardNavigationPath = serialBridge.getNavigationPath(
      state.boardNavigationPath,
      '..'
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  emitter.on('navigate-disk-folder', (folder) => {
    // log('navigate-disk-folder', folder)
    state.diskNavigationPath = disk.getNavigationPath(
      state.diskNavigationPath,
      folder
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })
  emitter.on('navigate-disk-parent', () => {
    // log('navigate-disk-parent')
    state.diskNavigationPath = disk.getNavigationPath(
      state.diskNavigationPath,
      '..'
    )
    emitter.emit('refresh-files')
    emitter.emit('render')
  })

  win.beforeClose(async () => {
    const unsaved = state.openFiles.filter(f => f.hasChanges)
    if (unsaved.length > 0) {
      const fileList = unsaved.map(f => f.fileName).join('\n')
      const message = `**Unsaved changes**\nThe following files have unsaved changes:\n${fileList}\n\nAre you sure you want to quit?`
      const response = await showConfirmOverlay(state, emitter, message, 'Cancel', 'Quit')
      if (!response) return false
    }
    await win.confirmClose()
  })

  win.onReady(() => {
    const openFile = state.openFiles.find(f => f.id === state.editingFile)
    if (openFile?.editor?.editor) openFile.editor.editor.focus()
  })

  win.onDisableShortcuts((disable) => {
    state.shortcutsDisabled = disable
  })

  win.onSelectLine(() => {
    const openFile = state.openFiles.find(f => f.id === state.editingFile)
    if (openFile?.editor?.editor) window.editorCommands.selectCurrentLine(openFile.editor.editor)
  })

  win.onSelectFunction(() => {
    const openFile = state.openFiles.find(f => f.id === state.editingFile)
    if (openFile?.editor?.editor) window.editorCommands.selectFunction(openFile.editor.editor)
  })
  
  win.onKeyboardShortcut((key) => {
    if (state.overlay !== null) return
    if (state.shortcutsDisabled) return
    if (key === shortcuts.CLOSE) {
      emitter.emit('close-tab', state.editingFile)
    }
    if (key === shortcuts.CONNECT) {
      emitter.emit('connect')
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
    if (key === shortcuts.NEW) {
      if (state.view != 'editor') return
      emitter.emit('create-new-file')
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
    if (key === shortcuts.TAB_NEXT || key === shortcuts.TAB_PREV) {
      if (state.view !== 'editor' || state.openFiles.length < 2) return
      const idx = state.openFiles.findIndex(f => f.id === state.editingFile)
      const next = key === shortcuts.TAB_NEXT
        ? (idx + 1) % state.openFiles.length
        : (idx - 1 + state.openFiles.length) % state.openFiles.length
      emitter.emit('select-tab', state.openFiles[next].id)
    }
    // if (key === shortcuts.ESC) {
    //   if (state.isConnectionDialogOpen) {
    //     emitter.emit('close-connection-dialog')
    //   }
    // }

  })

  function dismissOpenDialogs() {
    document.removeEventListener('keydown', dismissOpenDialogs)
  }

  // Ensures that even if the RUN button is clicked multiple times
  // there's a 100ms delay between each execution to prevent double runs
  // and entering an unstable state because of getPrompt() calls
  let preventDoubleRun = false
  function timedReset() {
    preventDoubleRun = true
    setTimeout(() => {
      preventDoubleRun = false
    }, 500)
    
  }

  function filterDoubleRun(onlySelected = false) {
    if (preventDoubleRun) return
    emitter.emit('run', onlySelected)
    timedReset()
  }

  function runCode() {
    if (canExecute({ view: state.view, isConnected: state.isConnected })) {
      filterDoubleRun()
    }
  }
  function runCodeSelection() {
    if (canExecute({ view: state.view, isConnected: state.isConnected })) {
      filterDoubleRun(true)
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

  // function createEmptyFile({ source, parentFolder }) {
  //   return createFile({
  //     fileName: generateFileName(),
  //     parentFolder,
  //     source,
  //     hasChanges: true
  //   })
  // }

  async function createNewTab(source, fileName = null, parentFolder = null) {
    const navigationPath = source == 'board' ? state.boardNavigationPath : state.diskNavigationPath
    const newFile = createFile({
      fileName: fileName === null ? generateFileName() : fileName,
      parentFolder: parentFolder,
      source: source,
      hasChanges: false
    })
    
    let fullPathExists = false
    
    if (parentFolder != null) {
      if (source == 'board') {
        try {
          if (terminalRouter) terminalRouter.setOperation('suppress')
          await serialBridge.getPrompt()
          fullPathExists = await serialBridge.fileExists(
            serialBridge.getFullPath(
              state.boardNavigationRoot,
              newFile.parentFolder,
              newFile.fileName
            )
          )
        } finally {
          if (terminalRouter && state.isConnected) terminalRouter.setOperation('repl-interactive')
        }
      } else if (source == 'disk') {
        fullPathExists = await disk.fileExists(
          disk.getFullPath(
            state.diskNavigationRoot,
            newFile.parentFolder,
            newFile.fileName
          )
        )
      }
    }
    const tabExists = state.openFiles.find(f => f.parentFolder === newFile.parentFolder && f.fileName === newFile.fileName && f.source === newFile.source)
    if (tabExists || fullPathExists) {
      const confirmation = await showConfirmOverlay(state, emitter, `File ${newFile.fileName} already exists on ${source}. Please choose another name.`, 'OK')
      return false
    }
    newFile.editor.onChange = function() {
      newFile.hasChanges = true
      emitter.emit('render')
    }
    state.openFiles.push(newFile)
    state.editingFile = newFile.id
    return true
  }

  // Returns open tabs that conflict with the given filenames at a destination folder.
  // parentFolder === null tabs are included — they are unsaved new files that will land
  // in destFolder when saved. Case-insensitive for board (FAT filesystem).
  function findTabConflicts(source, destFolder, fileNames, excludeId = null) {
    const eq = source === 'board'
      ? (a, b) => a.toLowerCase() === b.toLowerCase()
      : (a, b) => a === b
    return state.openFiles.filter(f =>
      f.id !== excludeId &&
      f.source === source &&
      (f.parentFolder === destFolder || f.parentFolder === null) &&
      fileNames.some(name => eq(f.fileName, name))
    )
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
    // log('saveDiskNavigationRootToStorage', e)
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
  return(entryA.fileName.localeCompare(entryB.fileName))
}

function generateHash() {
  return `${Date.now()}_${parseInt(Math.random()*1024)}`
}

async function getAvailablePorts() {
  return await serialBridge.loadPorts()
}

async function getBoardNavigationPath() {
  let output = await serialBridge.execFile(await getHelperFullPath())
  output = await serialBridge.run(`iget_root()`)
  let boardRoot = ''
  try {
    // Extracting the json output from serial response
    output = output.substring(
      output.indexOf('OK')+2,
      output.indexOf('\x04')
    )
    boardRoot = output
  } catch (e) {
    log('error', output)
  }
  return boardRoot
}

async function getBoardInfo() {
  await serialBridge.execFile(await getHelperFullPath())
  let output = await serialBridge.run(`iget_board_info()`)
  try {
    output = output.substring(
      output.indexOf('OK') + 2,
      output.indexOf('\x04')
    )
    return JSON.parse(output)
  } catch (e) {
    log('error', output)
    return null
  }
}

async function getBoardFiles(path) {
  await serialBridge.getPrompt()
  let files = await serialBridge.ilistFiles(path)

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
  await serialBridge.getPrompt()
  return serialBridge.fileExists(
    serialBridge.getFullPath(root, parentFolder, fileName)
  )
}

async function checkOverwrite({ fileNames = [], parentPath, source }) {
  let files = []
  if (source === 'board') {
    files = await getBoardFiles(parentPath)
  } else {
    files = await getDiskFiles(parentPath)
  }
  // Board filesystem (FAT) is case-insensitive, so compare lowercase for board source
  if (source === 'board') {
    const lowerNames = fileNames.map(n => n.toLowerCase())
    return files.filter((f) => lowerNames.indexOf(f.fileName.toLowerCase()) !== -1)
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
  let output = await serialBridge.execFile(await getHelperFullPath())
  await serialBridge.run(`delete_folder('${fullPath}')`)
}

async function uploadFolder(srcPath, destPath, dataConsumer) {
  dataConsumer = dataConsumer || function() {}
  await serialBridge.createFolder(destPath)
  let allFiles = await disk.ilistAllFiles(srcPath)
  for (let i in allFiles) {
    const file = allFiles[i]
    const relativePath = file.path.substring(srcPath.length)
    if (file.type === 'folder') {
      await serialBridge.createFolder(
        serialBridge.getFullPath(
          destPath,
          relativePath,
          ''
        )
      )
    } else {
      await serialBridge.uploadFile(
        disk.getFullPath(srcPath, relativePath, ''),
        serialBridge.getFullPath(destPath, relativePath, ''),
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
  let output = await serialBridge.execFile(await getHelperFullPath())
  output = await serialBridge.run(`ilist_all('${srcPath}')`)
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
      await serialBridge.downloadFile(
        serialBridge.getFullPath(srcPath, relativePath, ''),
        serialBridge.getFullPath(destPath, relativePath, '')
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
