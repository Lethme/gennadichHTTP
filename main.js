const path = require('path');
const url = require('url');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

let mainWindow;

const mainMenuTemplate = [{
    label: 'File',
    submenu: [{
        label: 'Test',
        click() {

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
    });
});

app.on('window-all-closed', () => {
    app.quit();
});