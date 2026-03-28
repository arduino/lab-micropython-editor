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

// Semantic ANSI colour levels mapped to the terminal theme palette.
// Each function wraps text in the appropriate escape sequence and resets after.
const ANSI = {
  error:   (text) => `\x1b[31m${text}\x1b[0m`,  // red    #ff6b6b
  warning: (text) => `\x1b[33m${text}\x1b[0m`,  // yellow #ffd166
  success: (text) => `\x1b[32m${text}\x1b[0m`,  // teal   #4ecdc4
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
    this._replErrorBuffer = null  // null = not buffering; string = buffering traceback
    this.defaultHandler = (data) => {
      this.terminal.write(data)
      this.terminal.scrollToBottom()
    }
    this.currentOperation = null
  }

  setHook(event, fn) {
    this.hooks.set(event, fn)
  }

  write(message) {
    this.terminal.write(message)
    this.terminal.scrollToBottom()
  }

  setOperation(operationType, customHandler = null) {
    // Flush stop buffer before firing after hook
    if (this.currentOperation === 'stop' && this._stopBuffer.trim().length > 0) {
      const tracebackIndex = this._stopBuffer.indexOf('Traceback')
      if (tracebackIndex > 0) {
        this.terminal.write(this._stopBuffer.slice(0, tracebackIndex))
      }
      const traceback = tracebackIndex >= 0 ? this._stopBuffer.slice(tracebackIndex) : this._stopBuffer
      if (traceback.trim().length > 0) {
        const level = traceback.includes('KeyboardInterrupt') ? 'warning' : 'error'
        this.terminal.write(ANSI[level](traceback))
      }
      this.terminal.scrollToBottom()
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
      this.defaultHandler(data)
    }
  }

  registerHandlers() {
    // File listing should not produce output
    this.operationHandlers.set('file-listing', (data, terminal) => {})

    this.operationHandlers.set('file-saving', (data, terminal) => {
      const str = toStr(data)
      if (str.includes('Error') || str.includes('Traceback')) {
        terminal.write(ANSI.error(str))
        terminal.scrollToBottom()
      }
    })

    this.operationHandlers.set('file-loading', (data, terminal) => {})

    this.operationHandlers.set('directory-navigation', (data, terminal) => {})

    // Code execution: stream stdout, buffer+colorise stderr from the raw REPL exec protocol.
    // Protocol: enter_raw_repl → exec_raw → OK<stdout>\x04<stderr>\x04> → exit_raw_repl
    // Phases: wait (buffer until OK) → stdout (stream) → stderr (buffer) → done (emit coloured)
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
            const level = this._stderrBuffer.includes('KeyboardInterrupt') ? 'warning' : 'error'
            terminal.write(ANSI[level](this._stderrBuffer))
            terminal.scrollToBottom()
          }
          this._stderrBuffer = ''
          this._execPhase = 'done'
        }
      }
    })

    // File uploading: suppress >OK/protocol noise per chunk, show only errors
    this.operationHandlers.set('file-uploading', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'rawReplEntry', 'banner', 'helpHint', 'rawOk', 'eot', 'prompt', 'rawPrompt')
      if (filtered.trim().length > 0 && (str.includes('Error') || str.includes('Traceback'))) {
        terminal.write(ANSI.error(filtered))
        terminal.scrollToBottom()
      }
    })

    // Suppress: silently drop all output, no hooks (used internally e.g. during getPrompt)
    this.operationHandlers.set('suppress', () => {})

    // Stop: buffer all chunks, flush+colorise in setOperation when leaving stop.
    // Buffering is needed because KeyboardInterrupt arrives in a later chunk than
    // the start of the traceback, so per-chunk coloring produces partial output.
    this.operationHandlers.set('stop', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'rawReplEntry', 'banner', 'helpHint', 'promptOnly', 'eot', 'rawPrompt')
      if (filtered.trim().length > 0) {
        this._stopBuffer += filtered
      }
    })

    // Reset: colorise MPY: soft reboot line as info, strip banner/>>>
    // (exit_raw_repl fires Ctrl+B before the actual reset, producing a spurious banner)
    this.operationHandlers.set('reset', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'banner', 'helpHint', 'prompt')
      if (filtered.length > 0) {
        terminal.write(filtered.includes('MPY:') ? ANSI.info(filtered) : filtered)
        terminal.scrollToBottom()
      }
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
          const level = errorContent.includes('KeyboardInterrupt') ? 'warning' : 'error'
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
          const level = errorContent.includes('KeyboardInterrupt') ? 'warning' : 'error'
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
