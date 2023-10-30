function Tabs(state, emit) {
  return html`
    <div class="tabs">
      <div class="tab active" tabindex="0">
        <img class="icon" src="media/computer.svg" />
        <div class="text">main.py</div>
        <div class="options" tabindex="0">x</div>
      </div>
      <div class="tab disabled" tabindex="0">
        <img class="icon" src="media/disconnect.svg" />
        <div class="text">main.py</div>
      </div>
      <div class="tab" tabindex="0">
        <img class="icon" src="media/computer.svg" />
        <div class="text">test.py</div>
      </div>
      <div class="button">
        <button class="small">+</button>
      </div>
    </div>
  `
}
