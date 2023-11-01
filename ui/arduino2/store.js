function MyFile(args) {
  const {
    type = null,
    path = null,
    content = null,
    editor = null
  } = args
  return {
    id: 'id_'+parseInt(Date.now()*Math.random()),
    type: type,
    path: path,
    content: content,
    editor: editor
  }
}

async function store(state, emitter) {
  const log = console.log
  const serial = window.BridgeSerial
  const disk = window.BridgeDisk

  // DIALOGS
  state.dialogs = {}
  emitter.on('open-connection-dialog', async () => {
    log('open-connection-dialog')
    if (state.isConnected) {
      emitter.emit('disconnect')
    }
    state.isPanelOpen = false
    state.dialogs['connection'] = true
    state.availablePorts = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('close-dialog', () => {
    log('close-dialog')
    Object.keys(state.dialogs).forEach(k => {
      state.dialogs[k] = false
    })
    emitter.emit('render')
  })

  // CONNECTION
  state.availablePorts = []
  state.isTerminalBound = false
  emitter.on('load-ports', async () => {
    log('load-ports')
    state.availablePorts = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('disconnect', async () => {
    log('disconnect')
    if (state.isConnected) {
      emitter.emit('message', 'Disconnected')
    }
    state.serialPort = null
    state.isConnected = false
    state.isPanelOpen = false

    await serial.disconnect()

    emitter.emit('render')
  })
  emitter.on('connect', async (port) => {
    const path = port.path
    log('connect', path)

    emitter.emit('message', 'Connecting')

    await serial.connect(path)

    // Stop whatever is going on
    // Recover from getting stuck in raw repl
    await serial.get_prompt()

    state.isConnected = true
    state.isPanelOpen = true
    emitter.emit('close-dialog')

    // Make sure there is a lib folder
    log('creating lib folder')
    await serial.createFolder('lib')
    state.serialPort = path

    emitter.emit('message', 'Connected', 1000)

    emitter.emit('render')

    // Bind terminal
    let term = state.cache(XTerm, 'terminal').term
    if (!state.isTerminalBound) {
      state.isTerminalBound = true
      term.onData((data) => {
        serial.eval(data)
        term.scrollToBottom()
      })
    }
    serial.onData((data) => {
      term.write(data)
      term.scrollToBottom()
    })
    serial.onDisconnect(() => emitter.emit('disconnect'))
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
      console.log('error', e)
    }
    emitter.emit('render')
  })
  emitter.on('stop', async () => {
    log('stop')
    await serial.get_prompt()
    emitter.emit('render')
  })
  emitter.on('reset', async () => {
    log('reset')
    await serial.reset()
    emitter.emit('update-files')
    emitter.emit('render')
  })

  // TERMINAL PANEL
  state.isPanelOpen = false
  emitter.on('toggle-panel', () => {
    log('toggle-panel')
    if (state.isPanelOpen) {
      state.isPanelOpen = false
    } else {
      state.isPanelOpen = true
    }
    emitter.emit('render')
  })
  emitter.on('clean-terminal', () => {
    log('clean-terminal')
    state.cache(XTerm, 'terminal').term.clear()
  })

  // FILES
  state.editingFile = null
  state.diskFiles = null
  state.openedFiles = []
  state.selectedFiles = []
  state.diskNavigationRoot = localStorage.getItem('diskNavigationRoot')
  if (!state.diskNavigationRoot || state.diskNavigationRoot == 'null') {
    state.diskNavigationRoot = null
  }

  emitter.on('load-disk-files', async () => {
    log('load-disk-files')
    if (!state.diskNavigationRoot) return false

    const files = await disk.ilistFiles(state.diskNavigationRoot)
    state.diskFiles = files.map(MyFile)
    // Load file contents
    for (let i in state.diskFiles) {
      if (state.diskFiles[i].type == 'file') {
        state.diskFiles[i].content = await disk.loadFile(
          state.diskNavigationRoot + '/' + state.diskFiles[i].path
        )
        state.diskFiles[i].editor = state.cache(CodeMirrorEditor, `editor_${state.diskFiles[i].id}`)
        // Temporary: Open all the files
        state.openedFiles.push(state.diskFiles[i].id)
      }
    }
    if (state.openedFiles && state.openedFiles.length > 0) {
      // Temporary: Select first file
      state.editingFile = state.openedFiles[0]
    }
    emitter.emit('render')
  })
  emitter.on('open-folder', async () => {
    log('open-folder')
    state.diskNavigationRoot = null
    let { folder, files } = await disk.openFolder()
    if (folder !== 'null' && folder !== null) {
      localStorage.setItem('diskNavigationRoot', folder)
      state.diskNavigationRoot = folder
    }
    state.diskFiles = await disk.ilistFiles(state.diskNavigationRoot)
    emitter.emit('load-disk-files')
    emitter.emit('render')
  })

  // TABS
  emitter.on('select-tab', (id) => {
    log('select-tab', id)
    if (state.editingFile !== id) {
      state.editingFile = id
      emitter.emit('render')
    }
  })
  emitter.on('close-tab', (id) => {
    log('close-tab', id)
    state.openedFiles = state.openedFiles.filter(f => f !== id)
    if (state.editingFile === id) {
      // Temporary: Select first file
      state.editingFile = null
    }
    if (state.editingFile == null && state.openedFiles.length > 0) {
      state.editingFile = state.openedFiles[0]
    }
    emitter.emit('render')
  })


}
