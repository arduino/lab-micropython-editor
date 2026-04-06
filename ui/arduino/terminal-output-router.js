// TerminalOutputRouter:
// Routes serial data to terminal/REPL based on operation context
// Filters out unnecessary output clutter in the xterm instance
//
// Hooks: register callbacks for operation lifecycle events.
// Event format: '<operation>:before' or '<operation>:after'
// Callback receives the router instance so it can call router.write().
// Example:
//   terminalRouter.setHook('reset:before', (router) => {
//     router.write('\r\n--- Resetting board ---\r\n')
//   })

function toStr(data) {
  if (typeof data === 'string') return data
  return new TextDecoder().decode(new Uint8Array(data))
}

// Named noise patterns for raw REPL protocol and MicroPython banner fragments.
// Centralised here so handlers stay readable and changes propagate everywhere.
const NOISE = {
  banner:       /MicroPython [^\r\n]+\r?\n?/g,
  helpHint:     /Type "help\(\)" for more information\.\r?\n?/g,
  // prompt: strips >>> including any preceding \r\n (use where that newline is pure noise)
  prompt:       /(\r?\n)?>>>\s*/g,
  // promptOnly: strips >>> but keeps the preceding \r\n (use where it separates real content)
  promptOnly:   />>>\s*/g,
  eot:          /\x04/g,
  rawPrompt:    /^>\s*\r?\n?/gm,
  rawReplEntry: /raw REPL; CTRL-B to exit\r?\n?/g,
  rawOk:        /(>OK)+/g,
}

function stripNoise(str, ...keys) {
  return keys.reduce((s, key) => s.replace(NOISE[key], ''), str)
}

function classifyError(str) {
  return str.includes('KeyboardInterrupt') ? 'warning' : 'error'
}

// Semantic ANSI colour levels mapped to the terminal theme palette.
// Each function wraps text in the appropriate escape sequence and resets after.
const ANSI = {
  error:   (text) => `\x1b[31m${text}\x1b[0m`,  // red    #ff6b6b
  warning: (text) => `\x1b[33m${text}\x1b[0m`,  // yellow #ffd166
  info:    (text) => `\x1b[36m${text}\x1b[0m`,  // cyan   #00d4aa
  muted:   (text) => `\x1b[2m${text}\x1b[0m`,   // dim
}

class TerminalOutputRouter {
  constructor(terminalInstance) {
    this.terminal = terminalInstance
    this.operationHandlers = new Map()
    this.hooks = new Map()
    this._execPhase = 'wait'  // wait → stdout → stderr → done
    this._execBuffer = ''
    this._stderrBuffer = ''
    this._stopBuffer = ''
    this._resetBuffer = ''
    this._replErrorBuffer = null  // null = not buffering; string = buffering traceback
    this.defaultHandler = (data) => {
      this.terminal.write(data)
      this.terminal.scrollToBottom()
    }
    this.currentOperation = null
    this.registerHandlers()
  }

  setHook(event, fn) {
    this.hooks.set(event, fn)
  }

  write(message) {
    this.terminal.write(message)
    this.terminal.scrollToBottom()
  }

  setOperation(operationType, customHandler = null) {
    // Flush stop buffer before firing after hook.
    // Residual stdout lines (e.g. print() output still in-flight when stop was triggered)
    // were already displayed during execution — skip them and show only the error context.
    if (this.currentOperation === 'stop' && this._stopBuffer.trim().length > 0) {
      const tracebackIndex = this._stopBuffer.indexOf('Traceback')
      const kiIndex = this._stopBuffer.indexOf('KeyboardInterrupt')
      // Start from whichever error marker appears first; fall back to 0 if neither found
      const errorStart = tracebackIndex >= 0 && (kiIndex < 0 || tracebackIndex <= kiIndex)
                       ? tracebackIndex
                       : kiIndex >= 0 ? kiIndex : 0
      const errorContent = this._stopBuffer.slice(errorStart)
      if (errorContent.trim().length > 0) {
        const level = classifyError(errorContent)
        this.terminal.write(ANSI[level](errorContent))
        this.terminal.scrollToBottom()
      }
      this._stopBuffer = ''
    }

    const afterHook = this.hooks.get(`${this.currentOperation}:after`)
    if (afterHook) afterHook(this)

    this.currentOperation = operationType
    if (operationType !== 'code-execution') {
      this._execPhase = 'wait'
      this._execBuffer = ''
      this._stderrBuffer = ''
    }
    this._stopBuffer = ''
    this._resetBuffer = ''
    // Flush any partially-buffered traceback (e.g. board disconnected before >>> arrived)
    if (this._replErrorBuffer !== null && this._replErrorBuffer.trim().length > 0) {
      const level = classifyError(this._replErrorBuffer)
      this.terminal.write(ANSI[level](this._replErrorBuffer))
      this.terminal.scrollToBottom()
    }
    this._replErrorBuffer = null
    if (customHandler) {
      this.operationHandlers.set(operationType, customHandler)
    }

    const beforeHook = this.hooks.get(`${operationType}:before`)
    if (beforeHook) beforeHook(this)
  }

  clearOperation() {
    this.currentOperation = null
  }

  routeData(data) {
    if (this.currentOperation && this.operationHandlers.has(this.currentOperation)) {
      const handler = this.operationHandlers.get(this.currentOperation)
      handler(data, this.terminal)
    } else {
      if (this.currentOperation) {
        console.warn(`TerminalOutputRouter: no handler registered for operation '${this.currentOperation}' — falling through to defaultHandler`)
      }
      this.defaultHandler(data)
    }
  }

  registerHandlers() {
    // file-listing: ilistFiles produces >OK[...] protocol bytes — drop everything.
    this.operationHandlers.set('file-listing', (data, terminal) => {})

    // file-saving: fs_save produces raw REPL protocol bytes that are already stripped
    // by the file-uploading handler's noise patterns, but here we only care about errors.
    // No stripNoise needed — the only relevant output is an error/traceback from the board.
    this.operationHandlers.set('file-saving', (data, terminal) => {
      const str = toStr(data)
      if (str.includes('Error') || str.includes('Traceback')) {
        terminal.write(ANSI.error(str))
        terminal.scrollToBottom()
      }
    })

    // file-loading: fs_cat produces raw binary content returned via invoke, not serial-on-data.
    // Anything arriving here is protocol noise — drop it.
    this.operationHandlers.set('file-loading', (data, terminal) => {})

    // directory-navigation: path computation is local; any serial data arriving here is
    // residual protocol noise from the preceding operation — drop it.
    this.operationHandlers.set('directory-navigation', (data, terminal) => {})

    // Code execution: stream stdout, buffer+colorise stderr from the raw REPL exec protocol.
    // Protocol: enter_raw_repl → exec_raw → OK<stdout>\x04<stderr>\x04> → exit_raw_repl
    // Phases: wait (buffer until OK) → stdout (stream) → stderr (buffer) → done (emit coloured)
    // No stripNoise here — the protocol structure is parsed explicitly by phase.
    this.operationHandlers.set('code-execution', (data, terminal) => {
      let str = toStr(data)

      if (this._execPhase === 'wait') {
        this._execBuffer += str
        const okIndex = this._execBuffer.indexOf('OK')
        if (okIndex === -1) return
        str = this._execBuffer.slice(okIndex + 2)
        this._execBuffer = ''
        this._execPhase = 'stdout'
      }

      while (str.length > 0 && this._execPhase !== 'done') {
        const eotIndex = str.indexOf('\x04')
        if (eotIndex === -1) {
          if (this._execPhase === 'stdout') {
            terminal.write(str)
            terminal.scrollToBottom()
          } else {
            this._stderrBuffer += str
          }
          break
        }
        const output = str.slice(0, eotIndex)
        str = str.slice(eotIndex + 1)
        if (this._execPhase === 'stdout') {
          if (output.length > 0) {
            terminal.write(output)
            terminal.scrollToBottom()
          }
          this._execPhase = 'stderr'
        } else {
          // End of stderr: colorise based on content and emit
          this._stderrBuffer += output
          if (this._stderrBuffer.trim().length > 0) {
            const level = classifyError(this._stderrBuffer)
            terminal.write(ANSI[level](this._stderrBuffer))
            terminal.scrollToBottom()
          }
          this._stderrBuffer = ''
          this._execPhase = 'done'
        }
      }
    })

    // file-uploading: fs_put sends chunks via raw REPL, each producing >OK protocol bytes.
    // Strip rawOk (>OK per chunk), eot (\x04), rawReplEntry/banner/helpHint (enter/exit raw REPL),
    // prompt/rawPrompt (>>> and bare >). Keep errors — a board write failure produces a Traceback.
    this.operationHandlers.set('file-uploading', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'rawReplEntry', 'banner', 'helpHint', 'rawOk', 'eot', 'prompt', 'rawPrompt')
      if (filtered.trim().length > 0 && (str.includes('Error') || str.includes('Traceback'))) {
        terminal.write(ANSI.error(filtered))
        terminal.scrollToBottom()
      }
    })

    // suppress: intentional blackhole — used around getPrompt()/fileExists() calls where
    // raw REPL entry/exit bytes would otherwise reach the terminal. No patterns needed.
    this.operationHandlers.set('suppress', () => {})

    // stop: buffer all chunks, flush+colorise in setOperation when leaving stop.
    // Buffering is needed because KeyboardInterrupt arrives in a later chunk than
    // the start of the traceback, so per-chunk coloring produces partial output.
    // Uses promptOnly (not prompt) to keep the \r\n before >>> — it separates the
    // traceback from the prompt visually. rawOk not stripped here because stop output
    // never contains >OK chunks (stop uses get_prompt, not exec_raw).
    this.operationHandlers.set('stop', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'rawReplEntry', 'banner', 'helpHint', 'promptOnly', 'eot', 'rawPrompt')
      if (filtered.trim().length > 0) {
        this._stopBuffer += filtered
      }
    })

    // reset: buffer all reboot output until '>>> ' arrives, then strip noise and display.
    //
    // store.js suppresses stop()/exit_raw_repl() output before entering this mode, so
    // every byte seen here is genuine reboot output. Any '>>> ' is therefore the final
    // prompt — no board-specific heuristics needed.
    //
    // Strip the reboot banner and helpHint, display only MPY: reboot lines in cyan,
    // write '>>> ', and transition to repl-interactive.
    this.operationHandlers.set('reset', (data, terminal) => {
      this._resetBuffer += toStr(data)
      const promptIdx = this._resetBuffer.search(/>>>\s*/)
      if (promptIdx === -1) return

      const content = this._resetBuffer.slice(0, promptIdx)
      this._resetBuffer = ''

      const filtered = stripNoise(content, 'banner', 'helpHint')
      if (filtered.trim().length > 0) {
        terminal.write(ANSI.info(filtered))
        terminal.scrollToBottom()
      }
      terminal.write('>>> ')
      terminal.scrollToBottom()
      this.setOperation('repl-interactive')
    })

    // Interactive REPL: pass through normally, but detect tracebacks and colorise them.
    // Tracebacks span multiple chunks so we buffer from the trigger word until the next
    // >>> prompt, then flush with the appropriate colour level.
    this.operationHandlers.set('repl-interactive', (data, terminal) => {
      let str = toStr(data)

      if (this._replErrorBuffer !== null) {
        this._replErrorBuffer += str
        const promptIndex = this._replErrorBuffer.search(/>>>\s*/)
        if (promptIndex !== -1) {
          const errorContent = this._replErrorBuffer.slice(0, promptIndex)
          const prompt = this._replErrorBuffer.slice(promptIndex)
          const level = classifyError(errorContent)
          if (errorContent.trim().length > 0) terminal.write(ANSI[level](errorContent))
          terminal.write(prompt)
          terminal.scrollToBottom()
          this._replErrorBuffer = null
        }
        return
      }

      const triggerIndex = str.search(/Traceback|KeyboardInterrupt/)
      if (triggerIndex !== -1) {
        if (triggerIndex > 0) terminal.write(str.slice(0, triggerIndex))
        const rest = str.slice(triggerIndex)
        const promptIndex = rest.search(/>>>\s*/)
        if (promptIndex !== -1) {
          const errorContent = rest.slice(0, promptIndex)
          const level = classifyError(errorContent)
          if (errorContent.trim().length > 0) terminal.write(ANSI[level](errorContent))
          terminal.write(rest.slice(promptIndex))
        } else {
          this._replErrorBuffer = rest
        }
      } else {
        terminal.write(str)
      }
      terminal.scrollToBottom()
    })
  }
}
