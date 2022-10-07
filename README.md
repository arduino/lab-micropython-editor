# Arduino MicroPython Lab
Arduino MicroPython Lab is an Integrated Development Environment (IDE) for MicroPython.

## Features
- MicroPython's Read Eval Print Loop (REPL)
	- Enter paste mode
	- Enter raw repl
	- Software reset
- File system management (Disk and MicroPythons File System)
	- Create
	- Rename
	- Remove
	- Upload
	- Download
- Text editor with Python syntax highlight
- Code execution controls
	- Run what's on text editor
	- Stop (keyboard interrupt)
	- Soft reset

## Technical

Arduino MicroPython Lab is an [Electron](https://www.electronjs.org/) app that has its main purpose to communicate over serial with a microprocessor running [MicroPython](https://micropython.org/). All Electron code is at `/index.js`.

All operations over serial are abstracted and packaged on `/micropython.js` which is an attempt of porting `pyboard.py`. The port has its [own repository](https://github.com/murilopolese/micropython.js) but for the sake of simplicity and transparency, `micropython.js` is committed as source code.

The User Interface (UI) source code stays inside `/ui` folder and is completely independent of the Electron code.

The communication between interface and Electron app is accomplished by using the methods and events specified by `/preload.js`.

## Folder structure

At the root of the repository you will find:

- `/.github`: Github's workflow configuration.
- `/build_resources`: Icons and other assets used during the build process.
- `/scripts`: Scripts executed during the build process.
- `/ui`: Available user interfaces.
- `/index.js`: Main Electron code.
- `/micropython.js`: Serial connection abstraction.
- `/preload.js`: Creates Disk and Serial APIs on Electron's main process and exposes it to Electron's renderer process (context bridge).

## Arduino UI

Arduino's default UI is a [choo-choo](https://github.com/choojs/choo) app. It has pre-built dependencies so no build process is required for the interface.

The dependencies and source code are included manually on the `/ui/arduino/index.html` file.

The app is a standard [choo-choo](https://github.com/choojs/choo) app and it has:

- `/ui/arduino/app.js`: A router deciding which view to load.
- `/ui/arduino/components`: HTML templates and components.
- `/ui/arduino/store.js`: A "store" that handles events emitted by the views, change the app state and orchestrate re-rendering.
- `/ui/arduino/libs`: Prebuilt dependencies.

It can be useful to learn more about [Choo]((https://github.com/choojs/choo) or the [Elm Architecture](https://guide.elm-lang.org/architecture/).

## Disk and Serial API

In order for the UI code to be independent of Electron code, there is an API defined at `/preload.js` that describes all the allowed operations.

There are 2 main operation "channels": Serial communication and local Filesystem operations. Both channels offer methods that always return promises and are used mostly using [`async`/`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

While the serial communication is mediated by `/micropython.js`, the local filesystem operations are done through Electron's `ipcRenderer` calls. The handlers for these calls are defined at `/index.js`

## Running Arduino MicroPython Lab from source code

1. Clone this repository: `git clone https://github.com/arduino/MicroPython_Lab.git`
2. Navigate to repository folder: `cd MicroPython_Lab`
3. Install dependencies: `npm install`
4. Run dev mode: `npm run dev`

Changes on the Electron code will require reopening the app but UI changes only require refreshing the window (ctrl-r/cmd-r).
