function Toolbar(state, emit) {
  const connect = Button({
    icon: state.isConnected ? 'icons/Connect.svg' : 'icons/Disconnect.svg',
    label: state.isConnected ? 'Disconnect' : 'Connect',
    disabled: false,
    color: 'default',
    onclick: () => {
      if (state.isConnected) {
        emit('disconnect')
      } else {
        emit('open-port-dialog')
      }
    },
  })

  const play = Button({
    icon: 'icons/Run.svg',
    label: 'Run',
    disabled: !state.isConnected,
    onclick: () => emit('run'),
    color: 'primary'
  })
  const stop = Button({
    icon: 'icons/Stop.svg',
    label: 'Stop',
    disabled: !state.isConnected,
    onclick: () => emit('stop'),
    color: 'primary'
  })
  const reset = Button({
    icon: 'icons/Reboot.svg',
    label: 'Reset',
    disabled: !state.isConnected,
    onclick: () => emit('reset'),
    color: 'primary'
  })

  const newFile = Button({
    icon: 'icons/New.svg',
    label: 'New',
    disabled: false,
    onclick: () => emit('open-new-file-dialog')
  })
  const openFolder = Button({
    icon: 'icons/Open.svg',
    label: 'Folder',
    disabled: false,
    onclick: () => emit('open-folder')
  })

  const canSaveBoard = state.isConnected 
    && state.selectedDevice === 'serial' 
    && state.selectedFile
  const canSaveDisk = state.selectedDevice === 'disk' 
    && state.selectedFile 
    && state.diskPath
  const save = Button({
    icon: 'icons/Save.svg',
    label: 'Save',
    disabled: !canSaveBoard && !canSaveDisk,
    onclick: () => emit('save')
  })

  const terminal = Button({
    icon: 'icons/Output.svg',
    label: 'Terminal',
    disabled: !state.isConnected,
    onclick: () => emit('show-terminal'),
    selected: state.isTerminalOpen,
  })
  const files = Button({
    icon: 'icons/File-Explorer.svg',
    label: 'Files',
    disabled: false,
    onclick: () => emit('show-files'),
    selected: state.isFilesOpen
  })

  return html`
    <div id="toolbar">
      ${connect}
      <div class="toolbar-spacing"></div>
      ${play}
      ${stop}
      ${reset}
      <div class="toolbar-spacing"></div>
      ${newFile}
      ${openFolder}
      ${save}
      <div class="toolbar-spacing"></div>
      ${terminal}
      ${files}
    </div>
  `
}
