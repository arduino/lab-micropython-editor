class CodeMirrorEditor extends Component {
  constructor() {
    super()
    this.editor = null
    this.content = '# empty file'
    this.scrollTop = 0
  }

  createElement(content) {
    if (content) this.content = content
    return html`<div id="code-editor"></div>`
  }


  load(el) {
    const onCodeChange = (update) => {
      this.content = update.state.doc.toString()
      this.onChange()
    }
    this.editor = createEditor(this.content, el, onCodeChange)

    setTimeout(() => {
      this.editor.scrollDOM.addEventListener('scroll', this.updateScrollPosition.bind(this))
      this.editor.scrollDOM.scrollTo({
        top: this.scrollTop,
        left: 0
      })
    }, 10)
  }

  update() {
    return false
  }

  unload() {
    this.editor.scrollDOM.removeEventListener('scroll', this.updateScrollPosition)
  }

  updateScrollPosition(e) {
    this.scrollTop = e.target.scrollTop
  }

  onChange() {
    return false
  }
}
