// Shared button row for confirm/alert overlays.
// buttons: [{ label, result, style }] where style is 'primary' or 'secondary'.
function ButtonRow(buttons, emit) {
  const row = html`<div class="overlay-btn-row"></div>`
  for (const btn of buttons) {
    const b = html`<button class="overlay-btn overlay-btn--${btn.style}">${btn.label}</button>`
    b.addEventListener('click', () => emit('overlay-button-clicked', btn.result))
    row.appendChild(b)
  }
  return row
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

function ConfirmLayout(props, emit) {
  const el = html`<div></div>`
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
    if (state.isSaving) {
      const pct = parseInt(state.savingProgress) || 0
      layout = ProgressLayout({ message: 'Saving file...', pct }, emit)
    }
    if (state.isTransferring) {
      const raw = state.transferringProgress || ''
      const parts = raw.split(': ')
      const pct = parseInt(parts[parts.length - 1]) || 0
      const label = parts.length > 1 ? parts.slice(0, -1).join(': ') : ''
      layout = ProgressLayout({ message: 'Transferring file', pct, label }, emit)
    }
  }

  if (!layout) return html`<div id="overlay" class="closed"></div>`
  return html`<div id="overlay" class="open${interactive ? ' interactive' : ''}">${layout}</div>`
}
