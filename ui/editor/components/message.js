function Message(state, emit) {
  let className = state.isShowingMessage ? 'show' : ''
  return html`
    <div id="message" class="${className}">${state.messageText}</div>
  `
}
