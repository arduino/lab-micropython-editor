function Blocking(state, emit) {
  let blocking = null
  if (state.blocking) {
    blocking = html`
      <div id="blocking"></div>
    `
  }
  return blocking
}
