import { ConfigFile } from '@back/ConfigFile';
import { CONFIG_FILENAME } from '@back/constants';
import { IAppConfigData } from '@shared/config/interfaces';
import { createErrorProxy } from '@shared/Util';
import { app, BrowserWindow, session, shell, dialog } from 'electron';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as mime from 'mime';
import * as path from 'path';
import { Init } from './types';
import { getMainFolderPath } from './Util';

type State = {
  window?: BrowserWindow;
  plugin: string;
  mainFolderPath: string;
  config: IAppConfigData;
  httpProxy: http.Server;
  httpProxyPort: number;
}

export function flash(init: Init): void {
  const state: State = {
    window: undefined,
    plugin: init.args.plugin || 'flash',
    mainFolderPath: createErrorProxy('mainFolderPath'),
    config: createErrorProxy('config'),
    httpProxy: new http.Server(onHttpServerRequest),
    httpProxyPort: -1,
  };

  startup();

  // -- Functions --

  function startup() {
    app.once('ready', onAppReady);
    app.once('window-all-closed', onAppWindowAllClosed);
    app.once('web-contents-created', onAppWebContentsCreated);
    app.on('activate', onAppActivate);

    const installed = fs.existsSync('./.installed');
    state.mainFolderPath = getMainFolderPath(installed);
    state.config = ConfigFile.readOrCreateFileSync(path.join(state.mainFolderPath, CONFIG_FILENAME));

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
    app.commandLine.appendSwitch('ppapi-flash-path', path.resolve(state.config.flashpointPath, 'Plugins', state.plugin + extension));

    // Start HTTP proxy
    listenHttpServer(state.httpProxy, 22501, 22599)
    .then(port => { state.httpProxyPort = port; })
    .catch(error => { console.error(error); });
  }

  function onAppReady(): void {
    if (!session.defaultSession) { throw new Error('Default session is missing!'); }

    if (state.httpProxyPort === -1) {
      dialog.showErrorBox(
        'Proxy error!',
        'If you see this error, please take a screenshot of this window and send it to the Flashpoint staff!\n\n'+
        'The application was ready before the proxy has started. This will cause the flash application to use the incorrect proxy settings.'
      );
    }

    // Reject all permission requests since we don't need any permissions.
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(false));

    session.defaultSession.setProxy({
      pacScript: '',
      proxyRules: `127.0.0.1:${state.httpProxyPort}`,
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
    webContents.on('will-navigate', onNewPage);
    webContents.on('new-window', onNewPage);

    function onNewPage(event: Electron.Event, navigationUrl: string): void {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
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

  function onHttpServerRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    let url: URL | undefined;
    let error: Error | undefined;

    try { url = new URL(req.url || ''); }
    catch (e) { error = e; }

    if (url) {
      const basePath = path.resolve(state.config.flashpointPath, 'Server/htdocs');
      const filePath = path.join(basePath, decodeURI(url.hostname), decodeURI(url.pathname));

      if (filePath.startsWith(basePath + path.sep) && (req.method === 'GET' || req.method === 'HEAD')) {
        fs.stat(filePath, (error, stats) => {
          if (error || stats && !stats.isFile()) {
            res.writeHead(404);
            res.end();
          } else {
            res.writeHead(200, {
              'Content-Type': mime.getType(path.extname(filePath)) || '',
              'Content-Length': stats.size,
            });
            if (req.method === 'GET') {
              const stream = fs.createReadStream(filePath);
              stream.on('error', error => {
                console.warn(`File server failed to stream file. ${error}`);
                stream.destroy(); // Calling "destroy" inside the "error" event seems like it could case an endless loop (although it hasn't thus far)
                if (!res.finished) { res.end(); }
              });
              stream.pipe(res);
            } else {
              res.end();
            }
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    } else {
      res.statusCode = 500;
      res.end();
    }
  }
}

/**
 * Make a http server listen at the first available port between minPort and maxPort (inclusive).
 * @param server Server that will listen.
 * @param minPort Minimum port number (inclusive).
 * @param maxPort Maximum port number (inclusive).
 * @returns A promise that resolves when it starts listening contining the port used; or a rejection with the error.
 */
function listenHttpServer(server: http.Server, minPort: number, maxPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    let port = minPort - 1;
    server.once('listening', onceListening);
    server.on('error', onError);
    tryListen();

    function onceListening() {
      done(undefined);
    }

    function onError(error: Error) {
      if ((error as any).code === 'EADDRINUSE') {
        tryListen();
      } else {
        done(error);
      }
    }

    function tryListen() {
      if (port++ < maxPort) {
        server.listen(port);
      } else {
        done(new Error(`All attempted ports are already in use (Ports: ${minPort} - ${maxPort}).`));
      }
    }

    function done(error: Error | undefined) {
      server.off('listening', onceListening);
      server.off('error', onError);
      if (error) {
        reject(error);
      } else {
        resolve(port);
      }
    }
  });
}
