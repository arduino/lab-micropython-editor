const Preferences = {
  cursorAtEnd: true
}

class CodeMirrorEditor extends Component {
  constructor() {
    super()
    this.editor = null
    this.content = '# empty file'
    this.scrollTop = 0
    this._scrollHandler = (e) => { this.scrollTop = e.target.scrollTop }
  }

  createElement(content) {
    if (content) this.content = content
    return html`<div id="code-editor"></div>`
  }

  load(el) {
    if (!this.editor) {
      const onCodeChange = (update) => {
        this.content = update.state.doc.toString()
        this.onChange()
      }
      this.editor = createEditor(this.content, el, onCodeChange)
      this.editor.scrollDOM.addEventListener('scroll', this._scrollHandler)
      if (Preferences.cursorAtEnd) {
        const end = this.editor.state.doc.length
        this.editor.dispatch({ selection: { anchor: end } })
      }
      this.editor.focus()
    } else {
      el.appendChild(this.editor.dom)
    }
    requestAnimationFrame(() => {
      if (this.editor) {
        this.editor.scrollDOM.scrollTo({ top: this.scrollTop, left: 0 })
        this.editor.focus()
      }
    })
  }

  update() {
    return false
  }

  unload() {
    // intentionally empty — editor stays alive for re-activation
  }

  destroy() {
    if (this.editor) {
      this.editor.scrollDOM.removeEventListener('scroll', this._scrollHandler)
      this.editor.destroy()
      this.editor = null
    }
  }

  onChange() {
    return false
  }
}
