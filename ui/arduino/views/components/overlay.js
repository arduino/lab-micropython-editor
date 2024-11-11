function Overlay(state, emit) {
  let overlay = html`<div id="overlay" class="closed"></div>`

  if (state.diskFiles == null) {
    emit('load-disk-files')
    overlay = html`<div id="overlay" class="open"><p>Loading files...</p></div>`
  }

  if (state.isRemoving) overlay = html`<div id="overlay" class="open"><p>Removing...</p></div>`
  if (state.isConnecting) overlay = html`<div id="overlay" class="open"><p>Connecting...</p></div>`
  if (state.isLoadingFiles) overlay = html`<div id="overlay" class="open"><p>Loading files...</p></div>`
  if (state.isSaving) overlay = html`<div id="overlay" class="open"><p>Saving file... ${state.savingProgress}</p></div>`
  if (state.isTransferring) overlay = html`<div id="overlay" class="open"><p>Transferring file<br><br>${state.transferringProgress}</p></div>`

  return overlay
}
