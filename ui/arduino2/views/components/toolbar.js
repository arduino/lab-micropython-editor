function Toolbar(state, emit) {
  const canSave = window.canSave({
    view: state.view,
    isConnected: state.isConnected,
    openFiles: state.openFiles,
    editingFile: state.editingFile
  }) // TODO: How to avoid the window call?
  const canExecute = window.canExecute({
    view: state.view,
    isConnected: state.isConnected
  })

  return html`
    <div id="toolbar">
      ${Button({
        icon: state.isConnected ? 'connect.svg' : 'disconnect.svg',
        tooltip: state.isConnected ? 'Disconnect' : 'Connect',
        onClick: () => emit('open-connection-dialog'),
        active: state.isConnected
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'run.svg',
        tooltip: 'Run',
        disabled: !canExecute,
        onClick: () => emit('run')
      })}
      ${Button({
        icon: 'stop.svg',
        tooltip: 'Stop',
        disabled: !canExecute,
        onClick: () => emit('stop')
      })}
      ${Button({
        icon: 'reboot.svg',
        tooltip: 'Reset',
        disabled: !canExecute,
        onClick: () => emit('reset')
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'save.svg',
        tooltip: 'Save',
        disabled: !canSave,
        onClick: () => emit('save')
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'console.svg',
        tooltip: 'Editor and REPL',
        active: state.view === 'editor',
        onClick: () => emit('change-view', 'editor')
      })}
      ${Button({
        icon: 'files.svg',
        tooltip: 'File Manager',
        active: state.view === 'file-manager',
        onClick: () => emit('change-view', 'file-manager')
      })}
    </div>
  `
}
