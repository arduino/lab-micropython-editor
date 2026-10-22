function SettingsLayout(props, emit) {
  const theme = props.theme || 'system'
  const indentSize = props.indentSize || 4

  const el = html`<div class="overlay-settings-card dismissable"></div>`
  el.appendChild(CloseButton(emit))

  const title = document.createElement('h2')
  title.className = 'overlay-settings-title'
  title.textContent = 'Settings'
  el.appendChild(title)

  // Theme (not yet implemented — display only)
  const themeSection = html`<div class="settings-section settings-section--disabled">
    <label class="settings-label">Theme</label>
    <div class="settings-segmented">
      <button class="settings-seg-btn ${theme === 'dark'   ? 'settings-seg-btn--active' : ''}">Dark</button>
      <button class="settings-seg-btn ${theme === 'light'  ? 'settings-seg-btn--active' : ''}">Light</button>
      <button class="settings-seg-btn ${theme === 'system' ? 'settings-seg-btn--active' : ''}">System</button>
    </div>
  </div>`
  el.appendChild(themeSection)

  el.appendChild(html`<div class="settings-divider"></div>`)

  // Sketches path
  const noPath = !props.diskNavigationRoot
  const pathSection = html`<div class="settings-section ${noPath ? 'settings-section--highlight' : ''}">
    <label class="settings-label">Local sketches folder</label>
    <div class="settings-path-row">
      <span class="settings-path-value${noPath ? ' text--warning' : ''}">${props.diskNavigationRoot || 'No folder selected'}</span>
      <button class="settings-path-btn">${noPath ? 'Select…' : 'Change…'}</button>
    </div>
  </div>`
  pathSection.querySelector('.settings-path-btn').addEventListener('click', () => emit('settings-change-path'))
  el.appendChild(pathSection)

  el.appendChild(html`<div class="settings-divider"></div>`)

  // Default indent
  const indentSection = html`<div class="settings-section">
    <label class="settings-label">Default indent for new files</label>
    <div class="settings-segmented">
      <button class="settings-seg-btn ${indentSize === 2 ? 'settings-seg-btn--active' : ''}">2 spaces</button>
      <button class="settings-seg-btn ${indentSize === 4 ? 'settings-seg-btn--active' : ''}">4 spaces</button>
    </div>
  </div>`
  const [indent2Btn, indent4Btn] = indentSection.querySelectorAll('.settings-seg-btn')
  indent2Btn.addEventListener('click', (e) => { e.currentTarget.blur(); emit('settings-set', { indentSize: 2 }) })
  indent4Btn.addEventListener('click', (e) => { e.currentTarget.blur(); emit('settings-set', { indentSize: 4 }) })
  indentSection.querySelector('.settings-segmented').addEventListener('mouseup', () => emit('render'))
  el.appendChild(indentSection)

  return el
}
