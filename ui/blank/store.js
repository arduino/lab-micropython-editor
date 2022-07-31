function store(state, emitter) {
  const serial = window.MicropythonSerial

  state.connected = false

  // state.board = Micropython
  state.isPortDialogOpen = false
  state.ports = []

  state.panel = 'terminal' // terminal | files
  state.panelHeight = 200
  state.panelCollapsed = true

  state.selectedFile = null
  state.selectedDevice = 'disk' // disk | board
  state.diskFolder = null
  state.renamingFile = false

  state.diskFiles = []
  state.boardFiles = []

  state.status = 'Disconnected'

  emitter.on('open-port-dialog', () => {
    console.log('open-port-dialog')
    if (state.connected) {
      state.connect = false
      serial.close()
    }
    serial.listPorts()
      .then((ports) => {
        let serial = ports.filter(p => p.serialNumber)
        state.ports = serial
        state.isPortDialogOpen = true
        emitter.emit('render')
      })
      .catch(e => console.log)
  })
  emitter.on('close-port-dialog', () => {
    console.log('close-port-dialog')
    state.isPortDialogOpen = false
    emitter.emit('render')
  })
  emitter.on('toggle-port-dialog', () => {
    console.log('toggle-port-dialog')
    state.isPortDialogOpen = !state.isPortDialogOpen
    emitter.emit('render')
  })
  emitter.on('connect', (port) => {
    console.log('connect', port)
    serial.connect(port.path)
      .then(() => {
        console.log('connected')
        state.connected = true
        emitter.emit('close-port-dialog')
      })
  })
  emitter.on('resize-panel', (clientY) => {
    console.log('resize-panel')
    // Get DOM references
    let bar = document.querySelector('#bar')
    // Get current bar size
    let barBounds = bar.getBoundingClientRect()
    state.panelHeight = Math.max(
      barBounds.height
    )
    emitter.emit('render')
  })
  emitter.on('select-panel', (panel) => {
    console.log('select-panel', panel)
    state.panel = panel
    if (state.panel === 'files') {
      emitter.emit('update-files')
    }
    emitter.emit('render')
  })
  emitter.on('toggle-panel', () => {
    console.log('toggle-panel')
    state.panelCollapsed = !state.panelCollapsed
    emitter.emit('render')
  })
  emitter.on('terminal-input', (k) => {
    if (state.connected) {
      serial.write(k)
    }
  })
  emitter.on('run', () => {
    console.log('run')
    let editor = state.cache(AceEditor, 'editor').editor
    state.panelCollapsed = false
    state.panel = 'terminal'
    emitter.emit('render')
    serial.run(editor.getValue())
      .then(() => {
        console.log('finished running')
      })
  })
  emitter.on('stop', () => {
    console.log('stop')
    state.panelCollapsed = false
    state.panel = 'terminal'
    emitter.emit('render')
    serial.stop()
  })
  emitter.on('reset', () => {
    console.log('reset')
    state.panelCollapsed = false
    state.panel = 'terminal'
    emitter.emit('render')
    serial.reset()
  })

  emitter.on('list-board-folder', () => {
    console.log('list-board-folder')

  })
  emitter.on('select-board-file', (file) => {
    console.log('select-board-file')

  })

  emitter.on('open-disk-folder', () => {
    // window.diskBus.emit('open-folder')
  })
  emitter.on('select-disk-file', (file) => {
    console.log('select-disk-file', file)
    state.selectedDevice = 'disk'
    state.selectedFile = file
    // window.diskBus.emit(
    //   'load-file',
    //   {
    //     folder: state.diskFolder,
    //     filename: state.selectedFile
    //   }
    // )
    emitter.emit('render')
  })

  emitter.on('save-file', () => {
    console.log('save-file')
    let editor = state.cache(AceEditor, 'editor').editor

    // If no filename is given, defaults to untitled
    if (!state.selectedFile) {
      state.selectedFile = 'untitled'
    }

    if (state.selectedDevice === 'disk') {
      // window.diskBus.emit( 'save-file', {
      //   folder: state.diskFolder,
      //   filename: state.selectedFile,
      //   content: editor.getValue()
      // })
    }

    if (state.selectedDevice === 'board') {
      // window.serialBus.emit('save-file', state.selectedFile, editor.getValue())
    }
  })
  emitter.on('remove-file', () => {
    console.log('remove-file')
    if (state.selectedDevice === 'disk') {
      // window.diskBus.emit(
      //   'remove-file',
      //   {
      //     folder: state.diskFolder,
      //     filename: state.selectedFile
      //   }
      // )
    }

    if (state.selectedDevice === 'board') {
      // window.serialBus.emit('remove-file', state.selectedFile)
      state.selectedFile = null
      setTimeout(() => emitter.emit('list-board-folder'), 100)
    }
  })
  emitter.on('new-file', () => {
    console.log('new-file')
    state.selectedFile = null
    state.cache(AceEditor, 'editor').editor.setValue('')
    emitter.emit('render')
  })
  emitter.on('update-files', () => {
    if (state.connected) emitter.emit('list-board-folder')
    // if (state.diskFolder) window.diskBus.emit('update-folder', state.diskFolder)
  })

  emitter.on('start-renaming-file', () => {
    console.log('start-renaming-file')
    state.renamingFile = true
    emitter.emit('render')
  })
  emitter.on('end-renaming-file', (filename) => {
    console.log('end-renaming-file', filename)
    if (state.selectedDevice === 'disk') {
      // window.diskBus.emit(
      //   'rename-file',
      //   {
      //     folder: state.diskFolder,
      //     filename: state.selectedFile,
      //     newFilename: filename
      //   }
      // )
    }
    if (state.selectedDevice === 'board') {
      // window.serialBus.emit('rename-file', state.selectedFile, filename)
      state.selectedFile = filename
      state.renamingFile = false
      emitter.emit('render')
      setTimeout(() => emitter.emit('update-files'), 100)
    }

  })

  emitter.on('send-file-to-disk', () => {
    console.log('send-file-to-disk')
    let editor = state.cache(AceEditor, 'editor').editor
    // window.diskBus.emit(
    //   'save-file',
    //   {
    //     folder: state.diskFolder,
    //     filename: state.selectedFile,
    //     content: editor.getValue()
    //   }
    // )
    emitter.emit('update-files')
  })
  emitter.on('send-file-to-board', () => {
    console.log('send-file-to-board')
    let editor = state.cache(AceEditor, 'editor').editor
    // window.serialBus.emit('save-file', state.selectedFile, editor.getValue())
  })

  // window.serialBus.on('connected', (port) => {
  //   console.log('serialBus', 'connected', port)
  //   state.connected = true
  //   state.panelCollapsed = false
  //   state.status = 'Connected'
  //   emitter.emit('close-port-dialog')
  //   emitter.emit('list-board-folder')
  //   emitter.emit('render')
  // })
  // window.serialBus.on('disconnected', (port) => {
  //   console.log('serialBus', 'disconnected', port)
  //   state.connected = false
  //   state.boardFiles = []
  //   state.status = 'Disconnected'
  //   let buffer = Buffer.from('\r\nDisconnected\r\n')
  //   state.cache(XTerm, 'terminal').term.write(buffer)
  //   emitter.emit('render')
  // })
  // window.serialBus.on('ports', (ports) => {
  //   console.log('serialBus', 'ports', ports)
  //   state.ports = ports
  //   emitter.emit('render')
  // })
  // window.serialBus.on('data', (data) => {
  //   let buffer = Buffer.from(data)
  //   state.cache(XTerm, 'terminal').term.write(buffer)
  //   state.cache(XTerm, 'terminal').term.scrollToBottom()
  // })
  // window.serialBus.on('file-saved', () => {
  //   console.log('serialBus', 'file-saved')
  //   emitter.emit('update-files')
  // })
  //
  // window.diskBus.on('folder-opened', ({ folder, files }) => {
  //   console.log('diskBus', 'folder-opened', folder, files)
  //   state.diskFiles = files
  //   state.diskFolder = folder
  //   state.panelCollapsed = false
  //   emitter.emit('select-panel', 'files')
  // })
  // window.diskBus.on('folder-updated', ({ folder, files }) => {
  //   state.diskFiles = files
  //   emitter.emit('render')
  // })
  // window.diskBus.on('file-loaded', (fileContent) => {
  //   console.log('diskBus', 'file-loaded', fileContent)
  //   let code = new TextDecoder().decode(fileContent)
  //   state.cache(AceEditor, 'editor').editor.setValue(code)
  // })
  // window.diskBus.on('file-saved', () => {
  //   console.log('diskBus', 'file-saved')
  //   window.diskBus.emit('update-folder', state.diskFolder)
  // })
  // window.diskBus.on('file-removed', () => {
  //   console.log('diskBus', 'file-removed')
  //   state.selectedFile = null
  //   state.cache(AceEditor, 'editor').editor.setValue('')
  //   window.diskBus.emit('update-folder', state.diskFolder)
  // })
  // window.diskBus.on('file-renamed', (filename) => {
  //   state.renamingFile = false
  //   state.selectedFile = filename
  //   if (state.diskFolder) {
  //     window.diskBus.emit('update-folder', state.diskFolder)
  //   } else {
  //     emitter.emit('render')
  //   }
  // })
}
