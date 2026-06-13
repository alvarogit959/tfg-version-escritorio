'use strict'
import path from 'path'
import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

app.commandLine.appendSwitch('enable-features', 'Geolocation')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win

async function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 750,
    //resizable: false,
    
        frame: false,
            //transparent: true,
            // backgroundColor: '#00000000',
    webPreferences: {
            preload: path.join(__dirname, 'preload.js'),

      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')

    win.loadURL('app://./index.html')
  }
}
ipcMain.on('minimize-window', () => {
    console.log("MINIMIZE RECIBIDO");
  if (win) win.minimize();
});

ipcMain.on('close-window', () => {
    console.log("CLOSE RECIBIDO");
  if (win) win.close();
});

ipcMain.on('toggle-maximize', () => {
    console.log("TOGGLE MAXIMIZE RECIBIDO");
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});


app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {

  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {

    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
