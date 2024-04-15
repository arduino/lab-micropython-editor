# Arduino Lab for MicroPython

<p align="center">

<img src="https://github.com/arduino/lab-micropython-editor/blob/chore/docs/ui/arduino/documents/Screenshot%20from%202024-04-15%2009-48-25.png?raw=true" width="50%" />

</p>

Arduino Lab for MicroPython is a lightweight editor for MicroPython programs, supporting connection with a board, code upload, file transfer and interactive REPL shell.
This project is sponsored by Arduino, based on original work by [Murilo Polese](http://www.murilopolese.com). This is an experimental pre-release software, please direct any questions only to Github issues.

## Features
- MicroPython's Read Eval Print Loop (REPL)
	- Enter paste mode
	- Enter raw repl
	- Software reset
	- Tab to autocomplete
- File system management (Disk and MicroPython File System)
	- Create
	- Rename
	- Multiple file and folder selection
	- Remove
	- Upload
	- Download
- Text editor
	- Python syntax highlight and autocomplete
	- Multiple tabs
	- Rename tabs
- Code execution
	- Run what's on text editor
	- Stop (keyboard interrupt)
	- Soft reset

## Technical overview

Arduino Lab for MicroPython is an [Electron](https://www.electronjs.org/) app that has its main purpose to communicate over serial with a microprocessor running [MicroPython](https://micropython.org/). All Electron code is at `/index.js`.

All operations over serial are abstracted and packaged on `/micropython.js` which is an attempt of porting `pyboard.py`. The port has its [own repository](https://github.com/arduino/micropython.js) but for the sake of simplicity and transparency, `micropython.js` is committed as source code.

The User Interface (UI) source code stays inside `/ui` folder and is completely independent of the Electron code.

The communication between interface and Electron app is accomplished by using the methods and events specified by `/preload.js`.

## Folder structure

At the root of the repository you will find:

- `/.github`: Github's workflow configuration.
- `/build_resources`: Icons and other assets used during the build process.
- `/ui`: Available user interfaces.
- `/index.js`: Main Electron code.
- `/preload.js`: Creates Disk, Serial and Window APIs on Electron's main process and exposes it to Electron's renderer process (context bridge).

## User interface

Read more at [`/ui/arduino/README.md`](./ui/arduino/README.md)

## Disk and Serial API

In order for the UI code to be independent of Electron code, there is an API defined at `/preload.js` that describes all the allowed operations.

There are 3 main operation "channels": Serial communication, local filesystem and window operations. These channels offer methods that should always return promises and are used mostly through [`async`/`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

While the serial communication is mediated by `/micropython.js`, the local filesystem and window operations are done through Electron's `ipcRenderer` calls. The handlers for these calls are defined at `/index.js`

## Running Arduino Lab for MicroPython from source code

1. Clone this repository: `git clone https://github.com/arduino/lab-micropython-editor.git`
2. Navigate to repository folder: `cd lab-micropython-editor`
3. Install dependencies: `npm install`
4. Run dev mode: `npm run dev`

Some changes on the Electron code will require reopening the app but all UI changes will only require refreshing the window (ctrl-r/cmd-r).

## Trademarks

"Python" and the Python Logo are trademarks of the Python Software Foundation.

## Disclaimer

This software is provided “as is” and we make no express or implied warranties whatsoever with respect to its functionality, operability, or use, including, without limitation, any implied warranties of merchantability, fitness for a particular purpose, or infringement. We expressly disclaim any liability whatsoever for any direct, indirect, consequential, incidental or special damages, including, without limitation, lost revenues, lost profits, losses resulting from business interruption or loss of data, regardless of the form of action or legal theory under which the liability may be asserted, even if advised of the possibility or likelihood of such damages.
