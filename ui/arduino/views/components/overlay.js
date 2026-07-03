// Shared button row for confirm/alert overlays.
// buttons: [{ label, result, style }] where style is 'primary' or 'secondary'.
function ButtonRow(buttons, emit) {
  const row = html`<div class="overlay-btn-row"></div>`
  let focusTarget = null
  for (const btn of buttons) {
    const b = html`<button class="overlay-btn overlay-btn--${btn.style}">${btn.label}</button>`
    b.addEventListener('click', () => emit('overlay-button-clicked', btn.result))
    row.appendChild(b)
    if (btn.style === 'primary' || focusTarget === null) focusTarget = b
  }
  if (focusTarget) requestAnimationFrame(() => focusTarget.focus())
  return row
}

function CloseButton(emit) {
  const btn = html`<button class="overlay-close">✕</button>`
  btn.addEventListener('click', () => emit('overlay-button-clicked', null))
  return btn
}

function SpinnerLayout(props) {
  return html`<div><p>${props.message}</p></div>`
}

function ProgressLayout(props, emit) {
  const pct = props.pct || 0
  const el = html`<div>
    <p>${props.message}</p>
    <span class="overlay-pct">${pct}%</span>
    <div class="overlay-progress"><div class="overlay-progress-fill" style="width:${pct}%"></div></div>
    <button class="cancel-btn">Cancel</button>
  </div>`
  if (props.label) {
    const p = el.querySelector('p')
    p.appendChild(document.createElement('br'))
    const small = document.createElement('small')
    small.textContent = props.label
    p.appendChild(small)
  }
  el.querySelector('.cancel-btn').addEventListener('click', () => emit('cancel-operation'))
  return el
}

function InputLayout(props, emit) {
  const el = html`<div class="overlay-input-card dismissable"></div>`
  el.appendChild(CloseButton(emit))
  const title = document.createElement('p')
  title.textContent = props.title
  el.appendChild(title)
  const input = html`<input class="overlay-input" type="text" placeholder="${props.placeholder}" />`
  el.appendChild(input)
  const btnRow = html`<div class="overlay-input-btn-row"></div>`

  let boardBtn = null
  if (props.isConnected) {
    boardBtn = html`<button class="overlay-btn overlay-btn--secondary">Board</button>`
    boardBtn.addEventListener('click', () => {
      const fileName = input.value.trim() || input.placeholder
      emit('overlay-button-clicked', { device: 'board', fileName })
    })
    btnRow.appendChild(boardBtn)
  }
  const diskBtn = html`<button class="overlay-btn overlay-btn--secondary">Computer</button>`
  diskBtn.addEventListener('click', () => {
    const fileName = input.value.trim() || input.placeholder
    emit('overlay-button-clicked', { device: 'disk', fileName })
  })
  btnRow.appendChild(diskBtn)
  el.appendChild(btnRow)

  const focusables = [input, ...(boardBtn ? [boardBtn] : []), diskBtn]
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const idx = focusables.indexOf(document.activeElement)
      const next = e.shiftKey
        ? focusables[(idx - 1 + focusables.length) % focusables.length]
        : focusables[(idx + 1) % focusables.length]
      next.focus()
    } else if (e.key === 'Enter' && document.activeElement === input && !props.isConnected) {
      const fileName = input.value.trim() || input.placeholder
      emit('overlay-button-clicked', { device: 'disk', fileName })
    }
  })

  requestAnimationFrame(() => input.focus())
  return el
}

function ConfirmLayout(props, emit) {
  const el = html`<div class="dismissable"></div>`
  el.appendChild(CloseButton(emit))
  const p = document.createElement('p')
  props.message.split('\n').forEach((line, i, arr) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      const strong = document.createElement('strong')
      strong.textContent = line.slice(2, -2)
      p.appendChild(strong)
    } else {
      p.appendChild(document.createTextNode(line))
    }
    if (i < arr.length - 1) p.appendChild(document.createElement('br'))
  })
  el.appendChild(p)
  el.appendChild(ButtonRow(props.buttons, emit))
  return el
}

function ConnectionLayout(ports, emit, props) {
  const el = html`<div class="overlay-connection-card dismissable"></div>`
  el.appendChild(CloseButton(emit))
  const title = document.createElement('p')
  title.textContent = 'Connect to...'
  el.appendChild(title)
  if (props && props.error) {
    const error = document.createElement('p')
    error.textContent = props.error
    error.className = 'overlay-connection-error'
    el.appendChild(error)
  }
  const list = html`<div class="overlay-connection-list"></div>`
  for (const port of ports) {
    const item = html`<button class="overlay-connection-item" onclick=${() => emit('select-port', port)}>${port.path}</button>`
    list.appendChild(item)
  }
  const refreshBtn = html`<button class="overlay-connection-item overlay-connection-refresh" onclick=${() => emit('update-ports')}>Refresh</button>`
  list.appendChild(refreshBtn)
  el.appendChild(list)
  return el
}

function Overlay(state, emit) {
  let layout = null
  let interactive = false

  if (state.overlay) {
    const { type, props } = state.overlay
    if (type === 'spinner') {
      layout = SpinnerLayout(props)
    } else if (type === 'progress') {
      layout = ProgressLayout(props, emit)
    } else if (type === 'confirm' || type === 'alert') {
      layout = ConfirmLayout(props, emit)
      interactive = true
    } else if (type === 'input') {
      layout = InputLayout(props, emit)
      interactive = true
    } else if (type === 'connection') {
      layout = ConnectionLayout(state.availablePorts, emit, props)
      interactive = true
    }
  } else {
    // Legacy boolean shim — kept until boolean flags are migrated to state.overlay
    if (state.diskFiles == null) {
      emit('load-disk-files')
      layout = SpinnerLayout({ message: 'Loading files...' })
    }
    if (state.isRemoving)     layout = SpinnerLayout({ message: 'Removing...' })
    if (state.isConnecting)   layout = SpinnerLayout({ message: 'Connecting...' })
    if (state.isLoadingFiles) layout = SpinnerLayout({ message: 'Loading files...' })
    if (state.isTransferring) {
      const raw = state.transferringProgress || ''
      const parts = raw.split(': ')
      const pct = parseInt(parts[parts.length - 1]) || 0
      const label = parts.length > 1 ? parts.slice(0, -1).join(': ') : ''
      layout = ProgressLayout({ message: 'Transferring file', pct, label }, emit)
    }
  }

  if (!layout) return html`<div id="overlay" class="closed"></div>`

  // Immediately blur any focused element outside the overlay so it can't
  // receive keyboard events (e.g. Enter re-triggering the button that opened this).
  const currentOverlay = document.getElementById('overlay')
  if (document.activeElement &&
      document.activeElement !== document.body &&
      !currentOverlay?.contains(document.activeElement)) {
    document.activeElement.blur()
  }

  // After render: if no child claimed focus (button/input rAF runs first),
  // focus the overlay container so keyboard events are captured by it.
  requestAnimationFrame(() => {
    const overlayEl = document.getElementById('overlay')
    if (overlayEl && !overlayEl.contains(document.activeElement)) {
      overlayEl.focus()
    }
  })

  return html`<div id="overlay" class="open${interactive ? ' interactive' : ''}" tabindex="-1">${layout}</div>`
}
