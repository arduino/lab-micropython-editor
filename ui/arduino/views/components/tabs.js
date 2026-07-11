let _emit = null
let _containerWidth = 0
let _dropdownOpen = false
let _resizeObserver = null
let _windowStart = 0

// Each tab: 140px min-width + 20px padding + 6px gap = 166px slot
const TAB_SLOT = 166
// Overflow button width (button 36px + 10px gap)
const OVERFLOW_BTN_SLOT = 46

function calcVisibleCount(width, total) {
  if (total === 0) return 0
  // Try fitting all tabs first
  if (total * TAB_SLOT - 10 <= width) return total
  // Reserve space for overflow button
  const available = width - OVERFLOW_BTN_SLOT
  return Math.max(1, Math.floor((available + 10) / TAB_SLOT))
}

function initResizeObserver() {
  if (_resizeObserver) return
  _resizeObserver = new ResizeObserver(entries => {
    const width = entries[0].contentRect.width
    if (Math.abs(width - _containerWidth) > 5) {
      _containerWidth = width
      if (_emit) _emit('render')
    }
  })
}

function Tabs(state, emit) {
  _emit = emit
  initResizeObserver()

  const files = state.openFiles
  const activeIndex = files.findIndex(f => f.id === state.editingFile)
  const visibleCount = _containerWidth > 0
    ? calcVisibleCount(_containerWidth, files.length)
    : files.length

  // Clamp _windowStart so it never leaves trailing empty slots after resize/close
  _windowStart = Math.min(_windowStart, Math.max(0, files.length - visibleCount))
  _windowStart = Math.max(0, _windowStart)

  // Scroll only when active tab falls outside the current window
  if (activeIndex < _windowStart) {
    _windowStart = activeIndex
  } else if (activeIndex >= _windowStart + visibleCount) {
    _windowStart = activeIndex - visibleCount + 1
  }

  const start = _windowStart
  const end = Math.min(start + visibleCount, files.length)

  const visibleFiles = files.slice(start, end)
  const overflowFiles = [...files.slice(0, start), ...files.slice(end)]
  const hasOverflow = overflowFiles.length > 0

  function closeDropdown() {
    _dropdownOpen = false
    document.removeEventListener('click', closeDropdown)
    if (_emit) _emit('render')
  }

  function toggleDropdown(e) {
    e.stopPropagation()
    _dropdownOpen = !_dropdownOpen
    if (_dropdownOpen) {
      // Close on next outside click
      setTimeout(() => document.addEventListener('click', closeDropdown), 0)
    }
    emit('render')
  }

  const dropdown = _dropdownOpen ? html`
    <div id="tabs-overflow-list">
      ${overflowFiles.map(file => {
        const label = (file.hasChanges ? '* ' : '') + file.fileName
        return html`
          <div class="overflow-tab-item ${file.id === state.editingFile ? 'active' : ''}"
            onclick=${(e) => { e.stopPropagation(); closeDropdown(); emit('select-tab', file.id) }}>
            <img class="icon" src="media/${file.source === 'board' ? 'board.svg' : 'computer.svg'}" />
            <span>${label}</span>
          </div>
        `
      })}
    </div>
  ` : null

  const overflowBtn = hasOverflow ? html`
    <div id="tabs-overflow-btn" onclick=${toggleDropdown}>
      <img class="icon" src="media/arrow-down.svg" />
      <span class="count">${overflowFiles.length}</span>
      ${dropdown}
    </div>
  ` : null

  const tabs = html`
    <div id="tabs">
      ${visibleFiles.map((file) => {
        const fullPath = file.parentFolder ? `${file.parentFolder}/${file.fileName}` : file.fileName
        return Tab({
          text: file.fileName,
          fullPath,
          icon: file.source === 'board' ? 'board.svg' : 'computer.svg',
          active: file.id === state.editingFile,
          renaming: file.id === state.renamingTab,
          hasChanges: file.hasChanges,
          onSelectTab: () => emit('select-tab', file.id),
          onCloseTab: () => emit('close-tab', file.id),
          onStartRenaming: () => emit('rename-tab', file.id),
          onFinishRenaming: (value) => emit('finish-renaming-tab', value)
        })
      })}
      ${overflowBtn}
    </div>
  `

  // Observe container for width changes (nanomorph keeps same DOM node)
  requestAnimationFrame(() => {
    const el = document.getElementById('tabs')
    if (el && _resizeObserver && !el.dataset.observed) {
      el.dataset.observed = '1'
      _resizeObserver.observe(el)
    }
  })

  // Focus rename input when it appears
  const mutationObserver = new MutationObserver(() => {
    const el = tabs.querySelector('input')
    if (el) el.focus()
  })
  mutationObserver.observe(tabs, { childList: true, subtree: true })

  return tabs
}
