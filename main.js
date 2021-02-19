const path = require('path');
const url = require('url');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

let mainWindow;
let testWindow;

const mainMenuTemplate = [{
    label: 'File',
    submenu: [{
        label: 'Test',
        click() {
            testWindow = new BrowserWindow({
                width: 400,
                height: 250,
                icon: __dirname + "/assets/img/icon.png",
                slashes: true,
                webPreferences: {
                    nativeWindowOpen: true,
                    nodeIntegrationInWorker: true,
                    nodeIntegration: true
                }
            });

            testWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'form.html'),
                protocol: 'file:',
                slashes: true,
            }));

            testWindow.on('close', () => {
                testWindow = null;
            });
        }
    }, {
        label: 'Exit',
        click() {
            app.quit();
        }
    }]
}];

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [{
            label: 'Toggle DevTools',
            accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
            click(item, focusedWindow) {
                focusedWindow.toggleDevTools();
            }
        }, {
            role: 'reload'
        }]
    });
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        icon: __dirname + "/assets/img/icon.png",
        slashes: true,
        webPreferences: {
            nativeWindowOpen: true,
            nodeIntegrationInWorker: true,
            nodeIntegration: true
        }
    });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    }));

    //mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        win = null;
        app.quit();
    });
});

ipcMain.on('item:test', (e, item) => {
    mainWindow.webContents.send('item:test', item);
});

app.on('window-all-closed', () => {
    app.quit();
});