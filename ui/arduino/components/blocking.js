function Blocking(state, emit) {
  let blocking = html`<div id="blocking"></div>`
  if (state.blocking) {
    blocking.classList.add('active')
  }
  return blocking
}
