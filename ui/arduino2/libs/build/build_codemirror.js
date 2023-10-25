import {EditorView, basicSetup} from "codemirror"
import {python} from "@codemirror/lang-python"

window.createEditor = (el) => new EditorView({
  extensions: [basicSetup, python()],
  parent: el
})
