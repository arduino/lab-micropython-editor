class CodeMirrorEditor extends Component {
  constructor() {
<<<<<<< Updated upstream
    super()
    this.editor = null
    this.content = ''
  }

  load(el) {
    this.editor = createEditor(this.content, el)
  }

  createElement(content) {
    this.content = content
=======
    console.log('cm construct')
    super()
    this.editor = null
    this.content = '# empty file'
  }

  load(el) {
    console.log('cm load')
    const onCodeChange = (update) => {
      this.content = update.state.doc.toString()
      console.log('code change', this.content)
    }
    this.editor = createEditor(this.content, el, onCodeChange)

  }

  createElement(content) {
    console.log('cm create')
    if (content) this.content = content
>>>>>>> Stashed changes
    return html`<div class="code-editor"></div>`
  }

  update() {
<<<<<<< Updated upstream
=======
    console.log('cm update')
>>>>>>> Stashed changes
    return false
  }

  codeChange() { return }
}
