function Toolbar(state, emit) {

  const isConnected = state.isConnected



  return html`
    <div class="toolbar">

      ${Button({
        icon: isConnected ? 'connect.svg' : 'disconnect.svg',
        tooltip: isConnected ? 'Disconnect' : 'Connect',
        onClick: () => emit('open-connection-dialog')
      })}

      <div class="separator"></div>

      ${Button({ icon: 'run.svg', tooltip: 'Run', disabled: true })}
      ${Button({ icon: 'stop.svg', tooltip: 'Stop', disabled: true })}
      ${Button({ icon: 'reboot.svg', tooltip: 'Reset', disabled: true })}

      <div class="separator"></div>

      ${Button({ icon: 'save.svg', tooltip: 'Save' })}

      <div class="separator"></div>

      ${Button({ icon: 'console.svg', tooltip: 'Editor and REPL' })}
      ${Button({ icon: 'files.svg', tooltip: 'File Manager' })}

    </div>
  `
}
