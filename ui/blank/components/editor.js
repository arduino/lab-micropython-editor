
function Editor(state, emit) {
  const diskIcon = Image({ src: 'icons/folder.png' })
  const serialIcon = Image({ src: 'icons/developer_board.png' })
  let icon = null
  if (state.selectedDevice === 'serial') icon = serialIcon
  if (state.selectedDevice === 'disk') icon = diskIcon

  let fileName = html`
    <div class="file-name" onclick=${() => emit('start-renaming-file')}>
      ${state.selectedFile || 'untitled'}
    </div>
  `
  if (state.renamingFile) {
    let input = html`
      <input
        type="text"
        name="filename"
        value="${state.selectedFile || 'untitled'}"
        onchange=${(e) => emit('end-renaming-file', e.target.value)}
        onblur=${(e) => emit('end-renaming-file', e.target.value)}
      />
    `
    fileName = html`
      <div class="file-name" onclick=${() => emit('start-renaming-file')}>
        ${input}
      </div>
    `
    setTimeout(() => {
      input.focus()
      input.select()
    }, 50)
  }


  return html`
    <div id="file-header" class="row lightgray align-center">
      <div class="device-icon">${icon}</div>
      ${fileName}
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
