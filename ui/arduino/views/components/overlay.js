function Overlay(state, emit) {
  let overlay = html`<div id="overlay" class="closed"></div>`

  if (state.diskFiles == null) {
    emit('load-disk-files')
    overlay = html`<div id="overlay" class="open"><p>Loading files...</p></div>`
  }

  if (state.isRemoving) overlay = html`<div id="overlay" class="open"><p>Removing...</p></div>`
  if (state.isConnecting) overlay = html`<div id="overlay" class="open"><p>Connecting...</p></div>`
  if (state.isLoadingFiles) overlay = html`<div id="overlay" class="open"><p>Loading files...</p></div>`
  if (state.isSaving) {
    const pct = parseInt(state.savingProgress) || 0
    overlay = html`<div id="overlay" class="open">
      <div>
        <p>Saving file...</p>
        <span class="overlay-pct">${pct}%</span>
        <div class="overlay-progress"><div class="overlay-progress-fill" style="width:${pct}%"></div></div>
        <button class="cancel-btn" onclick=${() => emit('cancel-operation')}>Cancel</button>
      </div>
    </div>`
  }
  if (state.isTransferring) {
    const raw = state.transferringProgress || ''
    const parts = raw.split(': ')
    const pct = parseInt(parts[parts.length - 1]) || 0
    const label = parts.length > 1 ? parts.slice(0, -1).join(': ') : ''
    overlay = html`<div id="overlay" class="open">
      <div>
        <p>Transferring file${label ? html`<br><small>${label}</small>` : ''}</p>
        <span class="overlay-pct">${pct}%</span>
        <div class="overlay-progress"><div class="overlay-progress-fill" style="width:${pct}%"></div></div>
        <button class="cancel-btn" onclick=${() => emit('cancel-operation')}>Cancel</button>
      </div>
    </div>`
  }

  return overlay
}
