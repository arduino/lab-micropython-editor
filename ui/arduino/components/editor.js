function Editor(state, emit) {
  function editFilename() {
    emit('start-editing-filename')
  }
  let filename = html`
    <div
      onclick=${editFilename}
      >
      ${state.selectedFile || 'undefined'}
    </div>
  `
  let fileIcon = 'icons/folder.png'
  if (state.isConnected && state.selectedDevice === 'serial') {
    fileIcon = 'icons/developer_board.png'
  }
  if (state.isEditingFilename) {
    function saveFileName(e) {
      emit('save-filename', e.target.value)
    }
    filename = html`
      <input
        type="text"
        value=${state.selectedFile || 'undefined'}
        onchange=${saveFileName}
        />
    `
  }
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
    return false
  }
}
