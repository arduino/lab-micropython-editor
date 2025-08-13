import { basicSetup } from "codemirror"
import { EditorView, keymap } from "@codemirror/view"
import { python } from "@codemirror/lang-python"
import { defaultKeymap } from "@codemirror/commands"
import { acceptCompletion, startCompletion, completionStatus } from "@codemirror/autocomplete"
import { indentMore, indentLess } from "@codemirror/commands"


let updateListenerExtension = (onChange) => EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    onChange(update)
  }
});

function unescapeUnicode(str) {
  if (!str) return str;
  return str.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });
}

// window.createEditor = (doc, el, onChange) => new EditorView({
//   doc: doc || '',
//   extensions: [
//     basicSetup,
//     keymap.of([indentWithTab]),
//     keymap.of([defaultKeymap]),
//     python(),
//     updateListenerExtension(onChange)
//   ],
//   parent: el
// })
window.createEditor = (doc, el, onChange) => {
  // Custom Tab keymap - Tab always indents, unless completing active suggestions
  const customTabKeymap = keymap.of([
    {
      key: "Tab",
      run: (view) => {
        // If completion popup is active, accept the current completion
        if (completionStatus(view.state) === "active") {
          return acceptCompletion(view);
        }
        
        // Always indent, regardless of cursor position or content
        return indentMore(view);
      }
    },
    {
      key: "Shift-Tab",
      run: indentLess
    },
    {
      key: "Ctrl-Space", // Trigger completion manually
      run: startCompletion
    }
  ]);
  const unescapedDoc = unescapeUnicode(doc || '');

  return new EditorView({
    doc: unescapedDoc,
    extensions: [
      basicSetup,
      customTabKeymap,
      keymap.of([defaultKeymap]),
      python(),
      updateListenerExtension(onChange)
    ],
    parent: el
  });
};