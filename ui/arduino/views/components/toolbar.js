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
        onClick: () => state.isConnected ? emit('disconnect') : emit('connect'),
        active: state.isConnected
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'run.svg',
        tooltip: `Run (${metaKeyString}+R)`,
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
        tooltip: `Stop (${metaKeyString}+H)`,
        disabled: !_canExecute,
        onClick: () => emit('stop')
      })}
      ${Button({
        icon: 'reboot.svg',
        tooltip: `Reset (${metaKeyString}+Shift+R)`,
        disabled: !_canExecute,
        onClick: () => emit('reset')
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'save.svg',
        tooltip: `Save (${metaKeyString}+S)`,
        disabled: !_canSave,
        onClick: () => emit('save')
      })}

      <div class="separator"></div>

      ${Button({
        icon: 'code.svg',
        tooltip: `Editor (${metaKeyString}+Alt+1)`,
        active: state.view === 'editor',
        onClick: () => emit('change-view', 'editor')
      })}
      ${Button({
        icon: 'files.svg',
        tooltip: `Files (${metaKeyString}+Alt+2)`,
        active: state.view === 'file-manager',
        onClick: () => emit('change-view', 'file-manager')
      })}
    </div>
  `
}
