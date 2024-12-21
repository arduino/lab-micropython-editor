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
    <div id="navigation-bar">
      <div id="toolbar">
        ${Button({
          icon: state.isConnected ? 'connect.svg' : 'disconnect.svg',
          label: state.isConnected ? 'Disconnect' : 'Connect',
          tooltip: state.isConnected ? `Disconnect (${metaKeyString}+Shift+D)` : `Connect (${metaKeyString}+Shift+C)`,
          onClick: () => state.isConnected ? emit('disconnect') : emit('connect'),
          active: state.isConnected,
          first: true
        })}
        ${Button({
          icon: 'reboot.svg',
          label: 'Reset',
          tooltip: `Reset (${metaKeyString}+Shift+R)`,
          disabled: !_canExecute,
          onClick: () => emit('reset')
        })}
        <div class="separator"></div>

        ${Button({
          icon: 'run.svg',
          label: 'Run',
          tooltip: `Run (${metaKeyString}+R)`,
          disabled: !_canExecute,
          onClick: (e) => {
            if (e.altKey) {
              emit('run-from-button', true)
            }else{
              emit('run-from-button')
            }
          }
        })}
        ${Button({
          icon: 'stop.svg',
          label: 'Stop',
          tooltip: `Stop (${metaKeyString}+H)`,
          disabled: !_canExecute,
          onClick: () => emit('stop')
        })}

        <div class="separator"></div>

        ${Button({
          icon: 'new-file.svg',
          label: 'New',
          tooltip: `New (${metaKeyString}+N)`,
          disabled: state.view != 'editor',
          onClick: () => emit('create-new-file')
        })}

        ${Button({
          icon: 'save.svg',
          label: 'Save',
          tooltip: `Save (${metaKeyString}+S)`,
          disabled: !_canSave,
          onClick: () => emit('save')
        })}
      </div>
        
      <div id="app-views">
        ${Button({
          icon: 'code.svg',
          label: 'Editor',
          tooltip: `Editor (${metaKeyString}+Alt+1)`,
          active: state.view === 'editor',
          square: true,
          onClick: () => emit('change-view', 'editor')
        })}
        ${Button({
          icon: 'files.svg',
          label: 'Files',
          tooltip: `Files (${metaKeyString}+Alt+2)`,
          active: state.view === 'file-manager',
          square: true,
          onClick: () => emit('change-view', 'file-manager')
        })}
      
      </div>
    </div>
  `
}
