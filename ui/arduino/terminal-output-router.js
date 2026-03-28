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

class TerminalOutputRouter {
  constructor(terminalInstance) {
    this.terminal = terminalInstance
    this.operationHandlers = new Map()
    this.hooks = new Map()
    this._execPhase = 'wait'  // wait → stdout → stderr → done
    this._execBuffer = ''
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
    const afterHook = this.hooks.get(`${this.currentOperation}:after`)
    if (afterHook) afterHook(this)

    this.currentOperation = operationType
    if (operationType !== 'code-execution') {
      this._execPhase = 'wait'
      this._execBuffer = ''
    }
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
      // Success or errors should be shown
      if (data.includes('OK') || data.includes('Error') || data.includes('Traceback')) {
        terminal.write(data)
        terminal.scrollToBottom()
      }
    })

    this.operationHandlers.set('file-loading', (data, terminal) => {})

    this.operationHandlers.set('directory-navigation', (data, terminal) => {})

    // Code execution: stream stdout then stderr from the raw REPL exec protocol.
    // Protocol: enter_raw_repl → exec_raw → OK<stdout>\x04<stderr>\x04> → exit_raw_repl
    // Phases: wait (buffer until OK) → stdout (stream until \x04) → stderr (stream until \x04)
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

      // Process current chunk through stdout and potentially into stderr
      while (str.length > 0 && this._execPhase !== 'done') {
        const eotIndex = str.indexOf('\x04')
        if (eotIndex === -1) {
          terminal.write(str)
          terminal.scrollToBottom()
          break
        }
        const output = str.slice(0, eotIndex)
        if (output.length > 0) {
          terminal.write(output)
          terminal.scrollToBottom()
        }
        str = str.slice(eotIndex + 1)
        this._execPhase = this._execPhase === 'stdout' ? 'stderr' : 'done'
      }
    })

    // File uploading: suppress >OK/protocol noise per chunk, show only errors
    this.operationHandlers.set('file-uploading', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'rawReplEntry', 'banner', 'helpHint', 'rawOk', 'eot', 'prompt', 'rawPrompt')
      if (filtered.trim().length > 0 && (str.includes('Error') || str.includes('Traceback'))) {
        terminal.write(filtered)
        terminal.scrollToBottom()
      }
    })

    // Suppress: silently drop all output, no hooks (used internally e.g. during getPrompt)
    this.operationHandlers.set('suppress', () => {})

    // Stop: show traceback/errors but filter banner noise and >>> spam
    this.operationHandlers.set('stop', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'rawReplEntry', 'banner', 'helpHint', 'promptOnly', 'eot', 'rawPrompt')
      if (filtered.trim().length > 0) {
        terminal.write(filtered)
        terminal.scrollToBottom()
      }
    })

    // Reset: let output through but strip >>> prompts and the pre-reboot banner
    // (exit_raw_repl fires Ctrl+B before the actual reset, producing a spurious banner)
    this.operationHandlers.set('reset', (data, terminal) => {
      const str = toStr(data)
      const filtered = stripNoise(str, 'banner', 'helpHint', 'prompt')
      if (filtered.length > 0) {
        terminal.write(filtered)
        terminal.scrollToBottom()
      }
    })

    // Allow normal output for interactive REPL
    this.operationHandlers.set('repl-interactive', (data, terminal) => {
      terminal.write(data)
      terminal.scrollToBottom()
    })
  }
}
