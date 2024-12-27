const PANEL_CLOSED = 45
const PANEL_TOO_SMALL = 65
const PANEL_DEFAULT = 320

function App(state, emit) {
  if (state.diskNavigationRoot == null) {
    return html`
      <div
        id="app"
        onclick=${() => emit('select-disk-navigation-root')}
        style="cursor: pointer;"
        >
        <p style="max-width: 420px">
          In order to use <strong>Lab for MicroPython Editor</strong>
          you must choose where to store your files. <br><br>
          Click anywhere to select a folder on your computer.
        </p>
      </div>
    `
  }

  if (state.view == 'file-manager') {
    return html`
      <div id="app">
        ${FileManagerView(state, emit)}
        ${Overlay(state, emit)}
      </div>
    `
  } else {
    return html`
      <div id="app">
        ${EditorView(state, emit)}
        ${Overlay(state, emit)}
      </div>
    `
  }
  return html`
    <div id="app">
      ${Overlay(state, emit)}
    </div>
  `
}

// document.fonts.ready.then(() => {
//   console.log("Fonts loaded");
//   console.log(document.fonts.check('12px RobotoMono'));
// });

window.addEventListener('load', () => {
  // const fontRobotoMono = new FontFace('RobotoMono', 'url(media/roboto-mono-latin-ext-400-normal.woff2)', {
  //   style: 'normal',
  //   weight: '400',
  //   display: 'swap'
  // });
  // fontRobotoMono.load().then((loadedFace) => {
  //   document.fonts.add(loadedFace);
  //   // The font will now be available for your CSS to use
  //   console.log('RobotoMono properties:', loadedFace);
  // });
  // const fontHack = new FontFace('Hack', 'url(media/hack-regular.woff2)');
  // fontHack.load().then((loadedFace) => {
  //   document.fonts.add(loadedFace);
  //   // The font will now be available for your CSS to use
  //   console.log('loaded face: ', loadedFace);
  // });
  let app = Choo()
  app.use(store);
  app.route('*', App)
  app.mount('#app')
  app.emitter.on('DOMContentLoaded', () => {
    if (app.state.diskNavigationRoot) {
      app.emitter.emit('refresh-files')
    }
  })
})
