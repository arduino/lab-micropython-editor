function Toolbar(state, emit) {
  return html`
    <div class="toolbar">

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

      ${Button({ icon: 'save.svg', tooltip: 'Save' })}

      <div class="separator"></div>

      ${Button({
        icon: 'console.svg',
        tooltip: 'Editor and REPL',
        active: true
      })}
      ${Button({
        icon: 'files.svg',
        tooltip: 'File Manager',
        active: false,
        disabled: true
      })}

    </div>
  `
}
