function PackageDetailView(pkg, emit) {
  const el = html`<div class="overlay-pkg-detail">
    <div class="overlay-pkg-detail-header">
      <button class="overlay-pkg-back" onclick=${() => emit('deselect-package')}>← Back</button>
      <button class="overlay-btn overlay-btn--primary overlay-pkg-action-btn" onclick=${() => emit('install-package-from-search', pkg)}>Install</button>
    </div>
    <div class="overlay-pkg-detail-body"></div>
  </div>`

  const body = el.querySelector('.overlay-pkg-detail-body')

  const name = document.createElement('div')
  name.className = 'overlay-pkg-detail-name'
  name.textContent = pkg.name
  body.appendChild(name)

  if (pkg.version) {
    const ver = document.createElement('div')
    ver.className = 'overlay-pkg-detail-meta'
    ver.textContent = `v${pkg.version}`
    body.appendChild(ver)
  }

  if (pkg.description) {
    const desc = document.createElement('div')
    desc.className = 'overlay-pkg-detail-desc'
    desc.textContent = pkg.description
    body.appendChild(desc)
  }

  const metas = []
  if (pkg.author) metas.push({ label: 'Author', value: pkg.author, link: false })
  if (pkg.license) metas.push({ label: 'License', value: pkg.license, link: false })
  if (pkg.url) metas.push({ label: 'URL', value: pkg.url, link: true })
  if (pkg.docs) metas.push({ label: 'Docs', value: pkg.docs, link: true })

  for (const { label, value, link } of metas) {
    const row = document.createElement('div')
    row.className = 'overlay-pkg-detail-row'
    const l = document.createElement('span')
    l.className = 'overlay-pkg-detail-label'
    l.textContent = label
    let v
    if (link) {
      v = document.createElement('a')
      v.className = 'overlay-pkg-detail-link'
      v.textContent = value
      v.addEventListener('click', (e) => { e.preventDefault(); emit('open-url', value) })
    } else {
      v = document.createElement('span')
      v.className = 'overlay-pkg-detail-value'
      v.textContent = value
    }
    row.appendChild(l)
    row.appendChild(v)
    body.appendChild(row)
  }

  if (pkg.tags?.length) {
    const tagRow = document.createElement('div')
    tagRow.className = 'overlay-pkg-tags'
    for (const tag of pkg.tags) {
      const t = document.createElement('span')
      t.className = 'overlay-pkg-tag'
      t.textContent = tag
      tagRow.appendChild(t)
    }
    body.appendChild(tagRow)
  }

  return el
}

function PackageSearchLayout(props, emit) {
  const el = html`<div class="overlay-package-search"></div>`

  if (props.selectedPackage) {
    el.appendChild(PackageDetailView(props.selectedPackage, emit))
    return el
  }

  const title = html`<p class="overlay-pkg-search-title">Install library</p>`
  const input = html`<input class="overlay-pkg-search-input" type="text" placeholder="Library name" value="${props.query}" />`
  const results = html`<div class="overlay-pkg-search-results"></div>`

  let debounceTimer = null
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => emit('search-packages', input.value.trim()), 350)
  })

  requestAnimationFrame(() => input.focus())

  if (props.loading) {
    results.textContent = 'Searching…'
  } else if (props.error) {
    const err = document.createElement('p')
    err.className = 'overlay-pkg-search-error'
    err.textContent = props.error
    results.appendChild(err)
  } else if (props.results.length === 0 && props.query) {
    results.textContent = 'No packages found'
  } else {
    for (const pkg of props.results) {
      const item = html`<div class="overlay-pkg-search-item">
        <div class="overlay-pkg-search-name">${pkg.name}</div>
        <div class="overlay-pkg-search-desc">${pkg.description || ''}</div>
      </div>`
      item.addEventListener('click', () => emit('select-package', pkg))
      results.appendChild(item)
    }
  }

  el.appendChild(title)
  el.appendChild(input)
  el.appendChild(results)
  return el
}

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
  const btn = html`<button class="overlay-close" aria-label="Close dialog" title="Close">✕</button>`
  btn.addEventListener('click', () => emit('overlay-button-clicked', null))
  return btn
}

function SpinnerLayout(props) {
  return html`<div><p>${props.message}</p></div>`
}

function PackageInstallLayout(props, emit) {
  const el = html`<div class="overlay-package-install">
    <div class="overlay-package-install-header">
      <p>${props.message}</p>
    </div>
    <div class="overlay-package-log"></div>
    <div class="overlay-pkg-activity${props.done ? ' overlay-pkg-activity--done' : ''}"><span>.</span><span>.</span><span>.</span></div>
    <div class="overlay-pkg-actions"></div>
  </div>`
  const log = el.querySelector('.overlay-package-log')
  log.textContent = props.log.join('\n')
  requestAnimationFrame(() => { log.scrollTop = log.scrollHeight })

  const actions = el.querySelector('.overlay-pkg-actions')
  if (props.done) {
    const btn = html`<button class="overlay-btn overlay-btn--primary overlay-pkg-action-btn" onclick=${() => emit('overlay-button-clicked', null)}>Done</button>`
    actions.appendChild(btn)
  } else if (props.confirmCancel) {
    const msg = document.createElement('span')
    msg.className = 'overlay-pkg-confirm-msg'
    msg.textContent = 'Cancel and remove partial install?'
    const yes = html`<button class="overlay-btn overlay-btn--danger overlay-pkg-action-btn" onclick=${() => emit('package-install-cancel')}>Yes, cancel</button>`
    const no = html`<button class="overlay-btn overlay-pkg-action-btn" onclick=${() => emit('package-install-uncancel')}>Keep going</button>`
    actions.appendChild(msg)
    actions.appendChild(no)
    actions.appendChild(yes)
  } else {
    const btn = html`<button class="overlay-btn overlay-pkg-action-btn" disabled=${props.cancelling} onclick=${() => emit('package-install-cancel')}>Cancel</button>`
    actions.appendChild(btn)
  }
  return el
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

function NewFileLayout(props, emit) {
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
    boardBtn = html`<button class="overlay-btn">Board</button>`
    boardBtn.addEventListener('click', () => {
      const fileName = input.value.trim() || input.placeholder
      emit('overlay-button-clicked', { device: 'board', fileName })
    })
    btnRow.appendChild(boardBtn)
  }
  const diskBtn = html`<button class="overlay-btn">Computer</button>`
  diskBtn.addEventListener('click', () => {
    const fileName = input.value.trim() || input.placeholder
    emit('overlay-button-clicked', { device: 'disk', fileName })
  })
  btnRow.appendChild(diskBtn)
  el.appendChild(btnRow)

  function setHighlighted(btn) {
    ;[boardBtn, diskBtn].filter(Boolean).forEach(b => b.classList.remove('overlay-btn--highlighted'))
    if (btn) btn.classList.add('overlay-btn--highlighted')
  }

  setHighlighted(diskBtn)
  input.addEventListener('focus', () => setHighlighted(diskBtn))
  if (boardBtn) boardBtn.addEventListener('focus', () => setHighlighted(null))
  diskBtn.addEventListener('focus', () => setHighlighted(null))

  const focusables = [input, ...(boardBtn ? [boardBtn] : []), diskBtn]
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const idx = focusables.indexOf(document.activeElement)
      const next = e.shiftKey
        ? focusables[(idx - 1 + focusables.length) % focusables.length]
        : focusables[(idx + 1) % focusables.length]
      next.focus()
    } else if (e.key === 'Enter' && document.activeElement === input) {
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
    if (type === 'package-search') {
      layout = PackageSearchLayout(props, emit)
      interactive = true
    } else if (type === 'package-install') {
      layout = PackageInstallLayout(props, emit)
      interactive = true
    } else if (type === 'spinner') {
      layout = SpinnerLayout(props)
    } else if (type === 'progress') {
      layout = ProgressLayout(props, emit)
    } else if (type === 'confirm' || type === 'alert') {
      layout = ConfirmLayout(props, emit)
      interactive = true
    } else if (type === 'new-file') {
      layout = NewFileLayout(props, emit)
      interactive = true
    } else if (type === 'connection') {
      layout = ConnectionLayout(state.availablePorts, emit, props)
      interactive = true
    } else if (type === 'settings') {
      layout = SettingsLayout(props, emit)
      interactive = true
    }
  } else if (state.diskFiles == null) {
    emit('load-disk-files')
    layout = SpinnerLayout({ message: 'Loading files...' })
  } else if (state.isConnecting) {
    layout = SpinnerLayout({ message: 'Connecting...' })
  } else if (state.isLoadingFiles) {
    layout = SpinnerLayout({ message: 'Loading files...' })
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

  return html`<div id="overlay" class="open${interactive ? ' interactive' : ''}" tabindex="-1" role="dialog" aria-modal="true">${layout}</div>`
}
