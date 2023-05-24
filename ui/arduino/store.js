const log = console.log
const DEFAULT_PANEL_HEIGHT = '15rem'


function store(state, emitter) {
  const serial = window.BridgeSerial
  const disk = window.BridgeDisk
  const win = window.BridgeWindow

  win.setWindowSize(720, 640)

  state.ports = []
  state.diskFiles = []
  state.serialFiles = []
  state.selectedFile = null
  state.selectedDevice = 'disk'

  state.diskPath = localStorage.getItem('diskPath')
  state.serialPath = null

  state.diskNavigation = '/'
  state.serialNavigation = '/'

  state.isConnected = false
  state.isPortDialogOpen = false
  state.isTerminalOpen = false
  state.isFilesOpen = false
  state.isEditingFilename = false

  state.messageText = 'Disconnected'
  state.isShowingMessage = true
  state.messageTimeout = 0

  state.isTerminalBound = false // XXX
  state.panelHeight = null

  // SERIAL CONNECTION
  emitter.on('load-ports', async () => {
    log('load-ports')
    state.ports = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('open-port-dialog', async () => {
    log('open-port-dialog')
    emitter.emit('disconnect')
    state.isPortDialogOpen = true
    emitter.emit('render')
    state.ports = await serial.loadPorts()
    emitter.emit('render')
  })
  emitter.on('close-port-dialog', async () => {
    log('close-port-dialog')
    state.isPortDialogOpen = false
    emitter.emit('render')
  })

  emitter.on('disconnect', () => {
    log('disconnect')
    if (state.isConnected) {
      emitter.emit('message', 'Disconnected')
    }
    state.isConnected = false
    state.serialNavigation = '/'
    state.serialPath = null
    state.isTerminalOpen = false
    state.serialFiles = []

    // When you disconnect with a serial file selected, keep the editor content
    if (state.selectedDevice === 'serial') {
      state.selectedDevice = 'disk'
      state.selectedFile = null
    }

    emitter.emit('render')
    resizeEditor(state)
  })
  emitter.on('connect', async (path) => {
    log('connect', path)

    await serial.connect(path)
    emitter.emit('message', 'Connected', 150)
    await serial.stop()
    // This must be set after the serial operations
    state.serialPath = path
    state.serialNavigation = '/'

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
    state.isConnected = true
    emitter.emit('update-files')
    emitter.emit('close-port-dialog')
    if (!state.isFilesOpen) {
      emitter.emit('show-terminal')
    }
    emitter.emit('render')
  })

  // CODE EXECUTION
  emitter.on('run', async () => {
    log('run')
    if (!state.isTerminalOpen) emitter.emit('show-terminal')
    let editor = state.cache(AceEditor, 'editor').editor
    let code = editor.getValue()
    await serial.run(code)
    emitter.emit('render')
  })
  emitter.on('stop', async () => {
    log('stop')
    await serial.stop()
    emitter.emit('render')
  })
  emitter.on('reset', async () => {
    log('reset')
    await serial.reset()
    emitter.emit('update-files')
    emitter.emit('render')
  })

  // FILE MANAGEMENT
  emitter.on('new-file', (dev) => {
    log('new-file', dev)
    state.selectedDevice = dev
    let editor = state.cache(AceEditor, 'editor').editor
    state.selectedFile = null
    editor.setValue('')
    emitter.emit('close-new-file-dialog')
    emitter.emit('render')
  })
  emitter.on('save', async () => {
    log('save')
    let editor = state.cache(AceEditor, 'editor').editor
    let contents = editor.getValue()
    let filename = state.selectedFile || 'undefined'
    let deviceName = state.selectedDevice === 'serial' ? 'board' : 'disk'

    if (state.selectedDevice === 'serial') {
      await serial.saveFileContent(
        cleanPath(state.serialNavigation + '/' + filename),
        contents
      )
    }

    if (state.selectedDevice === 'disk' && state.diskPath) {
      await disk.saveFileContent(
        cleanPath(state.diskPath + '/' + state.diskNavigation),
        filename,
        contents
      )
    }

    setTimeout(() => emitter.emit('update-files'), 1000)
    emitter.emit('message', `${filename} is saved on ${deviceName}.`, 1000)
  })
  emitter.on('remove', async () => {
    log('remove')
    let deviceName = state.selectedDevice === 'serial' ? 'board' : 'disk'
    if (confirm(`Do you want to remove ${state.selectedFile} from ${deviceName}?`)) {
      if (state.selectedDevice === 'serial') {
        await serial.removeFile(state.serialNavigation + '/' + state.selectedFile)
        emitter.emit('new-file', 'serial')
      }
      if (state.selectedDevice === 'disk') {
        await disk.removeFile(
          state.diskPath + '/' + state.diskNavigation,
          state.selectedFile
        )
        emitter.emit('new-file', 'disk')
      }
      emitter.emit('update-files')
      emitter.emit('render')
    }
  })
  emitter.on('select-file', async (device, filename) => {
    log('select-file')

    state.selectedDevice = device

    /*
    XXX: If user is changing a file name, do not request the file from the board
    over serial to prevent two commands being executed at the same time.
    TODO: Create a queue of actions and execute them in order
    */
    if (state.selectedDevice === 'serial' && state.isEditingFilename) return

    state.selectedFile = filename

    let content = ''
    if (state.selectedDevice === 'serial') {
      content = await serial.loadFile(
        cleanPath(state.serialNavigation + '/' + filename)
      )
    }

    if (state.selectedDevice === 'disk') {
      content = await disk.loadFile(
        cleanPath(state.diskPath + '/' + state.diskNavigation),
        filename
      )
    }

    let editor = state.cache(AceEditor, 'editor').editor
    editor.setValue(content)

    emitter.emit('render')
  })
  emitter.on('open-folder', async () => {
    log('open-folder')
    let { folder, files } = await disk.openFolder()
    state.diskNavigation = '/'
    if (folder !== 'null' && folder !== null) {
      localStorage.setItem('diskPath', folder)
      state.diskPath = folder
      state.diskFiles = files
    }
    if (!state.isFilesOpen) emitter.emit('show-files')
    emitter.emit('update-files')
  })
  emitter.on('update-files', async () => {
    log('update-files')
    function sortFoldersFirst(allFiles) {
      let folders = allFiles.filter(f => f.type === 'folder')
      let files = allFiles.filter(f => f.type === 'file')
      folders = folders.sort((a, b) => a.path.localeCompare(b.path))
      files = files.sort((a, b) => a.path.localeCompare(b.path))
      return folders.concat(files)
    }
    if (state.isConnected) {
      await serial.stop()
      try {
        const files = await serial.ilistFiles(
          cleanPath(state.serialNavigation)
        )
        state.serialFiles = files.map(f => ({
          path: f[0],
          type: f[1] === 0x4000 ? 'folder' : 'file'
        }))
        // Filter out dot files
        state.serialFiles = state.serialFiles.filter(
          f => f.path.indexOf('.') !== 0
        )
        // Sort alphabetically in case-insensitive fashion
        state.serialFiles = state.serialFiles.sort(
          (a, b) => a.path.localeCompare(b.path)
        )
        // Sort folders first
        state.serialFiles = sortFoldersFirst(state.serialFiles)
      } catch (e) {
        state.serialNavigation = '/'
        state.serialPath = null
        state.serialFiles = []
        console.log('error', e)
      }
    }
    if (state.diskPath) {
      try {
        state.diskFiles = await disk.ilistFiles(
          cleanPath(state.diskPath + '/' + state.diskNavigation)
        )
        // Filter out dot files
        state.diskFiles = state.diskFiles.filter(f => f.path.indexOf('.') !== 0)
        // Sort alphabetically in case-insensitive fashion
        state.diskFiles = state.diskFiles.sort(
          (a, b) => a.path.localeCompare(b.path)
        )
        // Sort folders first
        state.diskFiles = sortFoldersFirst(state.diskFiles)
      } catch (e) {
        state.diskNavigation = '/'
        state.diskPath = null
        state.diskFiles = []
        localStorage.setItem('diskPath', null)
        console.log('error', e)
      }
    }
    emitter.emit('render')
  })
  emitter.on('upload', async () => {
    log('upload')
    let confirmation = true
    if (state.serialFiles.find(f => f.path === state.selectedFile)) {
      confirmation = confirm(`Do you want to overwrite ${state.selectedFile} on board?`)
    }
    if (confirmation) {
      emitter.emit('message', 'Uploading file... Please wait')
      let editor = state.cache(AceEditor, 'editor').editor
      let contents = editor.getValue()
      await disk.saveFileContent(
        cleanPath(state.diskPath + '/' + state.diskNavigation),
        state.selectedFile,
        contents
      )
      await serial.uploadFile(
        cleanPath(state.diskPath + '/' + state.diskNavigation),
        cleanPath(state.serialNavigation),
        state.selectedFile
      )
      emitter.emit('message', 'File uploaded!', 500)
      setTimeout(() => emitter.emit('update-files'), 500)
      emitter.emit('render')
    }
  })
  emitter.on('download', async () => {
    log('download')
    let confirmation = true
    if (state.diskFiles.find(f => f.path === state.selectedFile)) {
      confirmation = confirm(`Do you want to overwrite ${state.selectedFile} on disk?`)
    }
    if (confirmation) {
      emitter.emit('message', 'Downloading file... Please wait')
      let editor = state.cache(AceEditor, 'editor').editor
      let contents = editor.getValue()
      await serial.saveFileContent(
        cleanPath(state.serialNavigation + '/' + state.selectedFile),
        contents
      )
      await serial.downloadFile(
        cleanPath(state.serialNavigation),
        cleanPath(state.diskPath + '/' + state.diskNavigation),
        state.selectedFile
      )
      emitter.emit('message', 'File downloaded!', 500)
      setTimeout(() => emitter.emit('update-files'), 500)
      emitter.emit('render')
    }
  })

  // PANEL MANAGEMENT
  emitter.on('show-terminal', () => {
    log('show-terminal')
    if (state.panelHeight === null) state.panelHeight = DEFAULT_PANEL_HEIGHT
    state.isTerminalOpen = !state.isTerminalOpen
    state.isFilesOpen = false
    emitter.emit('render')
    resizeEditor(state)
  })
  emitter.on('show-files', () => {
    log('show-files')
    if (state.panelHeight === null) state.panelHeight = DEFAULT_PANEL_HEIGHT
    state.isTerminalOpen = false
    state.isFilesOpen = !state.isFilesOpen
    emitter.emit('update-files')
    emitter.emit('render')
    resizeEditor(state)
  })
  emitter.on('close-panel', () => {
    log('close-panel')
    state.isTerminalOpen = false
    state.isFilesOpen = false
    emitter.emit('render')
    resizeEditor(state)
  })
  emitter.on('start-resizing-panel', () => {
    log('start-resizing-panel')
    function handleMouseMove(e) {
      let height = Math.max(window.innerHeight - e.clientY, 200)
      height = Math.min(height, window.innerHeight - 200)
      state.panelHeight = `${height}px`
      emitter.emit('render')
      resizeEditor(state)
    }
    function stopMouseListener() {
      window.removeEventListener('mousemove', handleMouseMove)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', (e) => {
      stopMouseListener()
    }, { once: true })
  })

  emitter.on('clean-terminal', () => {
    state.cache(XTerm, 'terminal').term.clear()
  })

  // NAMING/RENAMING FILE
  emitter.on('edit-filename', () => {
    state.isEditingFilename = true
    emitter.emit('render')
  })
  emitter.on('save-filename', async (filename) => {
    log('save-filename', filename)
    let oldFilename = state.selectedFile
    state.selectedFile = filename
    let deviceName = state.selectedDevice === 'serial' ? 'board' : 'disk'

    let editor = state.cache(AceEditor, 'editor').editor
    let contents = editor.getValue()

    if (state.selectedDevice === 'serial') {
      // Ask for confirmation to overwrite existing file
      let confirmation = true
      if (state.serialFiles.find(f => f.path === filename)) {
        confirmation = confirm(`Do you want to overwrite ${filename} on ${deviceName}?`)
      }

      if (confirmation) {
        if (state.serialFiles.find(f => f.path === oldFilename)) {
          // If old name exists, save old file and rename
          await serial.saveFileContent(
            cleanPath(state.serialNavigation + '/' + oldFilename),
            contents
          )
          await serial.renameFile(
            cleanPath(state.serialNavigation + '/' + oldFilename),
            filename
          )
        } else {
          // If old name doesn't exist create new file
          await serial.saveFileContent(
            cleanPath(state.serialNavigation + '/' + oldFilename),
            contents
          )
        }
        state.isEditingFilename = false
        emitter.emit('update-files')
        emitter.emit('render')

        emitter.emit('message', `${filename} is saved on ${deviceName}.`, 1000)
      } else {
        state.selectedFile = oldFilename
        state.isEditingFilename = false
        emitter.emit('render')
      }
    }

    if (state.diskPath !== null && state.selectedDevice === 'disk') {
      // Ask for confirmation to overwrite existing file
      let confirmation = true
      if (state.diskFiles.find((f) => f.path === filename)) {
        confirmation = confirm(`Do you want to overwrite ${filename} on ${deviceName}?`)
      }
      if (confirmation) {
        if (state.diskFiles.find((f) => f.path === oldFilename)) {
          // If old name exists, save old file and rename
          await disk.saveFileContent(
            cleanPath(state.diskPath + '/' + state.diskNavigation),
            oldFilename,
            contents
          )
          await disk.renameFile(
            cleanPath(state.diskPath + '/' + state.diskNavigation),
            oldFilename,
            filename
          )
        } else {
          // If old name doesn't exist create new file
          await disk.saveFileContent(
            cleanPath(state.diskPath + '/' + state.diskNavigation),
            filename,
            contents
          )
        }
        state.isEditingFilename = false
        emitter.emit('update-files')
        emitter.emit('render')

        emitter.emit('message', `${filename} is saved on ${deviceName}.`, 1000)
      } else {
        state.selectedFile = oldFilename
        state.isEditingFilename = false
        emitter.emit('render')
      }
    }


  })

  // NAVIGATION
  emitter.on('navigate-to', (device, fullPath) => {
    log('navigate-to', device, fullPath)
    fullPath = fullPath || '/'
    if (device === 'serial') {
      state.serialNavigation += '/' + fullPath
      state.serialNavigation = cleanPath(state.serialNavigation)
    }
    if (device === 'disk') {
      state.diskNavigation += '/' + fullPath
      state.diskNavigation = cleanPath(state.diskNavigation)
    }
    if (state.selectedDevice === device) {
      state.selectedFile = null
    }
    emitter.emit('update-files')
  })
  emitter.on('navigate-to-parent', (device) => {
    log('navigate-to-parent', device)
    if (device === 'serial') {
      const navArray = state.serialNavigation.split('/')
      navArray.pop()
      state.serialNavigation = cleanPath(
        '/' + navArray.join('/')
      )
    }
    if (device === 'disk') {
      const navArray = state.diskNavigation.split('/')
      navArray.pop()
      state.diskNavigation = cleanPath(
        '/' + navArray.join('/')
      )
    }
    if (state.selectedDevice === device) {
      state.selectedFile = null
    }
    emitter.emit('update-files')
  })

  emitter.on('message', (text, timeout) => {
    log('message', text)
    state.messageText = text
    state.isShowingMessage = true
    if (timeout) {
      clearInterval(state.messageTimeout)
      state.messageTimeout = setTimeout(() => {
        state.isShowingMessage = false
        emitter.emit('render')
      }, timeout)
    }
    emitter.emit('render')
  })

  window.addEventListener('resize', () => {
    console.log('resize window')
    state.cache(AceEditor, 'editor').render()
  })

}

function resizeEditor(state) {
  const el = state.cache(AceEditor, 'editor').element
  if (state.isTerminalOpen || state.isFilesOpen) {
    el.style.height = `calc(100% - ${state.panelHeight || DEFAULT_PANEL_HEIGHT})`
  } else {
    el.style.height = '100%'
  }
}

function cleanPath(path) {
  return '/' + path.split('/').filter(f => f).join('/')
}
