function Editor(state, emit) {
  // File icon: disk or board
  let fileIcon = 'icons/Open.svg'
  if (state.isConnected && state.selectedDevice === 'serial') {
    fileIcon = 'icons/Connect.svg'
  }
  // Filename input
  function onBlur(e) {
    emit('save-filename', e.target.value)
  }
  function onKeyDown(e) {
    if(e.key.toLowerCase() === 'enter') {
      e.target.blur()
    }
  }
  /*
  XXX: If this input is blurred because person clicked on another serial file,
  it triggers both a `save-filename` and a `select-file` event and
  filesystem panel will act up. It will require only re-opening it.
  */
  let filename = html`
    <input
      type="text"
      value=${state.selectedFile || 'undefined'}
      onblur=${onBlur}
      onkeydown=${onKeyDown}
      />
  `
  return html`
    <div class="editor-filename">
      ${Icon(fileIcon)}
      ${filename}
    </div>
    ${state.cache(AceEditor, 'editor').render()}
  `
}

class AceEditor extends Component {
  constructor() {
    super()
    this.editor = null
  }

  load(element) {
    this.editor = ace.edit("editor")
    this.editor.setFontSize(14)
    this.editor.setTheme("ace/theme/github")
    this.editor.session.setMode("ace/mode/python")
    this.editor.setValue(`from time import sleep

for i in range(0, 10):
    print('.')
    sleep(0.1)

`)
  }

  createElement(content) {
    return html`<div id="editor" class="fill"></div>`
  }

  update(newContent) {
    if (newContent) {
      this.editor.setValue(newContent)
    }
    setTimeout(() => this.editor.resize(), 10)
    return false
  }
}
