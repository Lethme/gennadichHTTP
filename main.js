const path = require('path');
const url = require('url');
const { app, BrowserWindow, Menu } = require('electron');

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

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        icon: __dirname + "/assets/img/icon.png"
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
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    app.quit();
});