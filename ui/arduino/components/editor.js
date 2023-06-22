function Editor(state, emit) {
  const el = state.cache(AceEditor, 'editor')
  el.codeChange = () => emit('code-change')
  return html`
    ${el.render()}
  `
}

class AceEditor extends Component {
  constructor() {
    super()
    this.editor = null
  }

  load(element) {
    this.editor = ace.edit("editor")
    this.editor.setShowPrintMargin(false)
    this.editor.setFontSize(14)
    this.editor.setTheme("ace/theme/github")
    this.editor.session.setMode("ace/mode/python")
    this.editor.setValue(`from time import sleep

for i in range(0, 10):
    print('.')
    sleep(0.1)

`)
    this.editor.session.on('change', () => this.codeChange())
  }

  createElement(content) {
    return html`<div id="editor" class="fill"></div>`
  }

  update(newContent) {
    if (newContent) {
      console.log('newContent', newContent)
      this.editor.setValue(newContent)
    }
    setTimeout(() => this.editor.resize(), 10)
    return false
  }

  codeChange() { return }
}
