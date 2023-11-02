function FileManagerView(state, emit) {
  return html`
    <div id="app">
      <div class="working-area">
        ${Toolbar(state, emit)}
        <div id="file-manager">
          <div id="board-files">
            <div class="device-header">
              <img class="icon" src="media/connect.svg" />
              <div class="text">/dev/ttyUSB0</div>
              <img class="icon" src="media/new-file.svg" />
            </div>
            <div class="file-list">
              <div class="list">
                <div class="item">..</div>
                <div class="item">
                  <img class="icon" src="media/folder.svg" />
                  <div class="text">lib</div>
                </div>
                <div class="item">
                  <div class="checkbox unchecked">
                    <img class="icon off" src="media/unchecked.svg" />
                    <img class="icon on" src="media/checked.svg" />
                    <img class="icon" src="media/file.svg" />
                  </div>
                  <div class="text">boot.py</div>
                  <div class="options"><img src="media/falafel.svg" /></div>
                </div>
                <div class="item">
                  <div class="checkbox checked">
                    <img class="icon off" src="media/unchecked.svg" />
                    <img class="icon on" src="media/checked.svg" />
                    <img class="icon" src="media/file.svg" />
                  </div>
                  <div class="text">main.py</div>
                  <div class="options"><img src="media/falafel.svg" /></div>
                </div>
              </div>
            </div>
          </div>
          <div id="file-actions">
            ${Button({
              icon: 'folder.svg',
              size: 'small',
              disabled: false
            })}
            ${Button({
              icon: 'arrow-left-white.svg',
              size: 'small',
              background: 'inverted',
              disabled: true
            })}
            ${Button({
              icon: 'arrow-right-white.svg',
              size: 'small',
              background: 'inverted',
              disabled: false
            })}
            ${Button({
              icon: 'delete.svg',
              size: 'small',
              disabled: false
            })}
          </div>
          <div id="local-files">
          <div class="device-header">
            <img class="icon" src="media/connect.svg" />
            <div class="text">/dev/ttyUSB0</div>
            <img class="icon" src="media/new-file.svg" />
          </div>
          <div class="file-list">
            <div class="list">
              <div class="item">..</div>
              <div class="item">
                <img class="icon" src="media/folder.svg" />
                <div class="text">lib</div>
              </div>
              <div class="item">
                <div class="checkbox unchecked">
                  <img class="icon off" src="media/unchecked.svg" />
                  <img class="icon on" src="media/checked.svg" />
                  <img class="icon" src="media/file.svg" />
                </div>
                <div class="text">boot.py</div>
                <div class="options"><img src="media/falafel.svg" /></div>
              </div>
              <div class="item">
                <div class="checkbox unchecked">
                  <img class="icon off" src="media/unchecked.svg" />
                  <img class="icon on" src="media/checked.svg" />
                  <img class="icon" src="media/file.svg" />
                </div>
                <div class="text">main.py</div>
                <div class="options"><img src="media/falafel.svg" /></div>
              </div>
              <div class="item">
                <div class="checkbox unchecked">
                  <img class="icon off" src="media/unchecked.svg" />
                  <img class="icon on" src="media/checked.svg" />
                  <img class="icon" src="media/file.svg" />
                </div>
                <div class="text">logo.jpg</div>
                <div class="options"><img src="media/falafel.svg" /></div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      ${ConnectionDialog(state, emit)}
    </div>
  `
}
