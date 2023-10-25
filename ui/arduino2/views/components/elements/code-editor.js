const defaultCode = `from alvik import *

def setup():
    pass

def loop():
    background(0, 0, 0)

start(setup=setup, loop=loop)

`

function CodeEditor(state, emit) {
  const el = html`<div class="code-editor"></div>`
  const editor = createEditor(defaultCode, el)
  return el
}
