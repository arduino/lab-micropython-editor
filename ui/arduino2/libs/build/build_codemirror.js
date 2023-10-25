import {EditorView, basicSetup} from "codemirror"
import {python} from "@codemirror/lang-python"

window.createEditor = (doc, el) => new EditorView({
  doc: doc || '',
  extensions: [basicSetup, python()],
  parent: el
})
