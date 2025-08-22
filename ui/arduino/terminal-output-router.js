// TerminalOutputRouter:
// Routes serial data to terminal/REPL based on operation context
// Filters out unnecessary output clutter in the xterm instance

class TerminalOutputRouter {
  constructor(terminalInstance) {
    this.terminal = terminalInstance
    this.operationHandlers = new Map()
    this.defaultHandler = (data) => {
      this.terminal.write(data)
      this.terminal.scrollToBottom()
    }
    this.currentOperation = null
  }
  
  setOperation(operationType, customHandler = null) {
    this.currentOperation = operationType
    if (customHandler) {
      this.operationHandlers.set(operationType, customHandler)
    }
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
    this.operationHandlers.set('file-listing', (data, terminal) => {
      console.log('File listing output suppressed:', data) // remove after tests
    })
    
    this.operationHandlers.set('file-saving', (data, terminal) => {
      // Success or errors should be shown
      if (data.includes('OK') || data.includes('Error') || data.includes('Traceback')) {
        terminal.write(data)
        terminal.scrollToBottom()
      }
    })
    
    this.operationHandlers.set('file-loading', (data, terminal) => {
      // Silent - suppress file content output
      return
    })
    
    this.operationHandlers.set('directory-navigation', (data, terminal) => {
      // Silent - suppress directory listing output
      return
    })
    
    // Allow normal output for code execution
    this.operationHandlers.set('code-execution', (data, terminal) => {
      terminal.write(data)
      terminal.scrollToBottom()
    })
    
    // Allow normal output for interactive REPL
    this.operationHandlers.set('repl-interactive', (data, terminal) => {
      terminal.write(data)
      terminal.scrollToBottom()
    })
  }
}