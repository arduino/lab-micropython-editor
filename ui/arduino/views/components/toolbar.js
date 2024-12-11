function Toolbar(state, emit) {
  const _canSave = window.canSave({
    view: state.view,
    isConnected: state.isConnected,
    openFiles: state.openFiles,
    editingFile: state.editingFile
  }) // TODO: How to avoid the window call?
  const _canExecute = window.canExecute({
    view: state.view,
    isConnected: state.isConnected
  })
  const metaKeyString = state.platform === 'darwin' ? 'Cmd' : 'Ctrl'
  
  return html`
    <div id="toolbar">
      ${Button({
        icon: state.isConnected ? 'connect.svg' : 'disconnect.svg',
        tooltip: state.isConnected ? `Disconnect (${metaKeyString}+Shift+D)` : `Connect (${metaKeyString}+Shift+C)`,
        onClick: () => emit('open-connection-dialog'),
        active: state.isConnected
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'run.svg',
        tooltip: `Run (${metaKeyString}+r)`,
        disabled: !_canExecute,
        onClick: (e) => {
          if (e.altKey) {
            emit('run', true)
          }else{
            emit('run')
          }
        }
      })}
      ${Button({
        icon: 'stop.svg',
        tooltip: `Stop (${metaKeyString}+h)`,
        disabled: !_canExecute,
        onClick: () => emit('stop')
      })}
      ${Button({
        icon: 'reboot.svg',
        tooltip: `Reset (${metaKeyString}+Shift+r)`,
        disabled: !_canExecute,
        onClick: () => emit('reset')
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'save.svg',
        tooltip: `Save (${metaKeyString}+s)`,
        disabled: !_canSave,
        onClick: () => emit('save')
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'editor.svg',
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
