function Toolbar(state, emit) {
  const canSave = state.view === 'editor' && state.editingFile ? true : false

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
        disabled: !state.isConnected,
        onClick: () => emit('run')
      })}
      ${Button({
        icon: 'stop.svg',
        tooltip: 'Stop',
        disabled: !state.isConnected,
        onClick: () => emit('stop')
      })}
      ${Button({
        icon: 'reboot.svg',
        tooltip: 'Reset',
        disabled: !state.isConnected,
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
        onClick: () => emit('set-view', 'editor')
      })}
      ${Button({
        icon: 'files.svg',
        tooltip: 'File Manager',
        active: state.view === 'file-manager',
        onClick: () => emit('set-view', 'file-manager')
      })}
    </div>
  `
}
