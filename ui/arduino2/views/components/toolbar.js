function Toolbar(state, emit) {
  return html`
  <div class="toolbar">
    <div class="button">
      <button><img class="icon" src="media/disconnect.svg" /></button>
      <div class="tooltip">Connect</div>
    </div>

    <div class="separator"></div>

    <div class="button">
      <button disabled><img class="icon" src="media/run.svg" /></button>
      <div class="tooltip">Run</div>
    </div>
    <div class="button">
      <button disabled><img class="icon" src="media/stop.svg" /></button>
      <div class="tooltip">Stop</div>
    </div>
    <div class="button">
      <button disabled><img class="icon" src="media/reboot.svg" /></button>
      <div class="tooltip">Reset</div>
    </div>

    <div class="separator"></div>

    <div class="button">
      <button><img class="icon" src="media/save.svg" /></button>
      <div class="tooltip">Save</div>
    </div>

    <div class="separator"></div>

    <div class="button">
      <button class="active"><img class="icon" src="media/console.svg" /></button>
      <div class="tooltip">Editor and REPL</div>
    </div>
    <div class="button">
      <button><img class="icon" src="media/files.svg" /></button>
      <div class="tooltip">File Manager</div>
    </div>
  </div>
  `
}
