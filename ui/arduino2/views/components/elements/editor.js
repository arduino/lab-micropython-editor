class CodeMirrorEditor extends Component {
  constructor() {
    super()
    this.editor = null
    this.content = ''
  }

  load(el) {
    this.editor = createEditor(this.content, el)
  }

  createElement(content) {
    this.content = content
    return html`<div class="code-editor"></div>`
  }

  update() {
    return false
  }

  codeChange() { return }
}
