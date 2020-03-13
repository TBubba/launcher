import { ConfigFile } from '@back/ConfigFile';
import { CONFIG_FILENAME } from '@back/constants';
import { app, BrowserWindow, session, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { Init } from './types';
import { getMainFolderPath } from './Util';

type State = {
  window?: BrowserWindow;
  plugin: string;
}

export function flash(init: Init): void {
  const state: State = {
    window: undefined,
    plugin: init.args.plugin || 'flash',
  };

  startup();

  // -- Functions --

  function startup() {
    app.once('ready', onAppReady);
    app.once('window-all-closed', onAppWindowAllClosed);
    app.once('web-contents-created', onAppWebContentsCreated);
    app.on('activate', onAppActivate);

    const installed = fs.existsSync('./.installed');
    const mainFolderPath = getMainFolderPath(installed);

    const config = ConfigFile.readOrCreateFileSync(path.join(mainFolderPath, CONFIG_FILENAME));

    let extension = '';
    switch (process.platform) {
      case 'win32':
        extension = '.dll';
        break;
      case 'linux':
        extension = '.so';
        break;
      case 'darwin':
        // @TODO Find out the extension on mac
        break;
      default:
        console.error(`No plguin file extension is assigned to the current operating system (platform: "${process.platform}").`);
        break;
    }
    app.commandLine.appendSwitch('ppapi-flash-path', path.resolve(config.flashpointPath, 'Plugins', state.plugin + extension));
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
      title: `Flashpoint Flash Player (${state.plugin})`,
      icon: path.join(__dirname, '../window/images/icon.png'),
      useContentSize: true,
      width: init.args.width,
      height: init.args.height,
      webPreferences: {
        nodeIntegration: false,
        plugins: true,
        sandbox: true,
      },
    });
    window.setMenu(null); // Remove the menu bar
    window.loadURL(init.rest); // and load the index.html of the app.

    // window.webContents.openDevTools();

    return window;
  }
}
