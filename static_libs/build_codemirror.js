import {
  EditorView, keymap, lineNumbers,
  highlightActiveLineGutter, highlightSpecialChars,
  drawSelection, dropCursor, crosshairCursor,
  rectangularSelection, highlightActiveLine
} from "@codemirror/view"
import { EditorState, EditorSelection } from "@codemirror/state"
import {
  history, defaultKeymap, historyKeymap,
  indentMore, indentLess
} from "@codemirror/commands"
import {
  foldGutter, foldKeymap, bracketMatching,
  syntaxHighlighting, defaultHighlightStyle,
  indentOnInput, syntaxTree
} from "@codemirror/language"
import {
  autocompletion, completionKeymap, closeBrackets,
  closeBracketsKeymap, acceptCompletion, startCompletion, completionStatus
} from "@codemirror/autocomplete"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { lintKeymap } from "@codemirror/lint"
import { python } from "@codemirror/lang-python"

function selectLine(view, pos) {
  const line = view.state.doc.lineAt(pos)
  view.dispatch({
    selection: EditorSelection.range(line.from, line.to),
    userEvent: "select"
  })
  view.focus()
}

function selectEnclosingFunction(view, pos) {
  const tree = syntaxTree(view.state)
  let node = tree.resolveInner(pos, 1)
  while (node && node.name !== 'FunctionDefinition') {
    node = node.parent
  }
  if (node) {
    view.dispatch({
      selection: EditorSelection.range(node.from, node.to),
      userEvent: "select"
    })
  } else {
    selectLine(view, pos)
  }
  view.focus()
}

const selectFunction = (view) => {
  const pos = view.state.selection.main.head
  selectEnclosingFunction(view, pos)
  return true
}

const selectCurrentLine = (view) => {
  const pos = view.state.selection.main.head
  selectLine(view, pos)
  return true
}

window.editorCommands = {
  selectFunction,
  selectCurrentLine
}

const customLineNumbers = lineNumbers({
  domEventHandlers: {
    mousedown(view, line, event) {
      if (event.detail === 1) {
        const lineInfo = view.state.doc.lineAt(line.from)
        if (event.shiftKey) {
          const anchor = view.state.selection.main.anchor
          const target = anchor <= lineInfo.from
            ? EditorSelection.range(anchor, lineInfo.to)
            : EditorSelection.range(anchor, lineInfo.from)
          view.dispatch({ selection: target, userEvent: "select" })
        } else {
          const indent = lineInfo.text.match(/^\s*/)[0].length
          view.dispatch({
            selection: { anchor: lineInfo.from + indent },
            userEvent: "select"
          })
        }
        view.focus()
        return true
      }
      if (event.detail === 2) {
        selectLine(view, line.from)
        return true
      }
      if (event.detail >= 3) {
        selectEnclosingFunction(view, line.from)
        return true
      }
      return false
    }
  }
})

const customSetup = [
  customLineNumbers,
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
]

let updateListenerExtension = (onChange) => EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    onChange(update)
  }
})

function unescapeUnicode(str) {
  if (!str) return str;
  return str.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });
}

window.createEditor = (doc, el, onChange) => {
  const customTabKeymap = keymap.of([
    {
      key: "Tab",
      run: (view) => {
        if (completionStatus(view.state) === "active") {
          return acceptCompletion(view);
        }
        return indentMore(view);
      }
    },
    {
      key: "Shift-Tab",
      run: indentLess
    },
    {
      key: "Ctrl-Space",
      run: startCompletion
    },
    {
      key: "Mod-Alt-l",
      run: selectCurrentLine
    },
    {
      key: "Mod-Alt-a",
      run: selectFunction
    }
  ]);
  const unescapedDoc = unescapeUnicode(doc || '');

  return new EditorView({
    doc: unescapedDoc,
    extensions: [
      customSetup,
      customTabKeymap,
      keymap.of([defaultKeymap]),
      python(),
      updateListenerExtension(onChange)
    ],
    parent: el
  });
};
