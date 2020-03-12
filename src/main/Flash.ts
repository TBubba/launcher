import { APP_TITLE } from '@shared/constants';
import { app, BrowserWindow, session, shell } from 'electron';
import * as path from 'path';
import { Init } from './types';

type State = {
  window?: BrowserWindow;
}

export function flash(init: Init): void {
  const state: State = {
    window: undefined,
  };

  startup();

  // -- Functions --

  function startup() {
    app.once('ready', onAppReady);
    app.once('window-all-closed', onAppWindowAllClosed);
    app.once('web-contents-created', onAppWebContentsCreated);
    app.on('activate', onAppActivate);

    const flashPath = path.join(process.cwd(), 'flash.dll');
    app.commandLine.appendSwitch('ppapi-flash-path', flashPath);
  }

  function onAppReady(): void {
    if (!session.defaultSession) { throw new Error('Default session is missing!'); }

    // Reject all permission requests since we don't need any permissions.
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(false));

    session.defaultSession.setProxy({
      pacScript: '',
      proxyRules: '',
      proxyBypassRules: '',
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({ ...details.responseHeaders });
    });

    createFlashWindow();
  }

  function onAppWindowAllClosed(): void {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  function onAppWebContentsCreated(event: Electron.Event, webContents: Electron.WebContents): void {
    // Open links to web pages in the OS-es default browser
    // (instead of navigating to it with the electron window that opened it)
    webContents.on('will-navigate', (event, navigationUrl) => {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    });
  }

  function onAppActivate(): void {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!state.window) { createFlashWindow(); }
  }

  function createFlashWindow(): BrowserWindow {
    const window = new BrowserWindow({
      title: APP_TITLE,
      icon: path.join(__dirname, '../window/images/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        plugins: true,
        sandbox: true,
      },
    });
    window.setMenu(null); // Remove the menu bar
    window.loadURL(init.rest); // and load the index.html of the app.

    //window.webContents.openDevTools();

    return window;
  }
}
