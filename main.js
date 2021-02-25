const path = require('path');
const url = require('url');
const valid_url = require('valid-url');
const fs = require('fs');
const request = require('request');
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');

let mainWindow;

//process.env.NODE_ENV = 'production';

const mainMenuTemplate = [{
    label: 'File',
    submenu: [{
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click() {
            app.quit();
        }
    }, {
        label: 'Test',
        click() {
            mainWindow.webContents.send('loader:start');
        }
    }]
}];

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [{
            label: 'Toggle DevTools',
            accelerator: 'CmdOrCtrl+I',
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

ipcMain.on('request:content', (e, uri) => {
    dialog.showOpenDialog({
        properties: ["openDirectory"]
    }).then(dir => {
        if (dir.canceled) return;

        fs.readdir(dir.filePaths[0], (err, files) => {
            if (err) return;

            if (files.length !== 0) {
                let result = dialog.showMessageBoxSync({
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    defaultId: 1,
                    title: 'Directory is not empty',
                    message: 'Do you want to continue?',
                    detail: 'Application will still save its files to choosen directory',
                    noLink: true
                });

                if (result === 1) return;
            }

            request({
                uri: uri.indexOf('//') == 0 ? 'https:' + uri : uri,
                method: 'GET',
                rejectUnauthorized: false,
                requestCert: true,
                agent: false,
                strictSSL: false
            }, (error, response, body) => {
                if (error && error.toString().includes('ENOTFOUND')) {
                    hideLoader();
                    dialog.showMessageBoxSync({
                        type: 'error',
                        buttons: ['Ok'],
                        defaultId: 0,
                        title: 'Request error',
                        message: 'Invalid URI',
                        detail: 'Did you write URI correctly?',
                        noLink: true
                    });
                    return;
                }

                let links = [];
                let link_tags = body && body !== '' ? body.match(/<link[\s]+([^>]+)>/gmi) : [];

                if (link_tags !== null) {
                    link_tags.forEach(link => {
                        let temp_array = (new RegExp(/href=(["'])(.*?)\1/gi)).exec(link);
                        if (temp_array[2].includes('.css') && temp_array.input.includes('stylesheet')) {
                            const isUrlAbsolute = (url) => (url.indexOf('://') > 0 || url.indexOf('//') === 0);
                            if (isUrlAbsolute(temp_array[2])) {
                                links.push(temp_array[2].indexOf('//') == 0 ? (new URL(uri)).protocol + temp_array[2] : temp_array[2]);
                            } else {
                                links.push(url.resolve(uri, temp_array[2]));
                            }
                        }
                    });
                }

                mainWindow.webContents.send(
                    'http:body',
                    body ? body.replace(/</gm, '&lt;').replace(/>/gm, '&gt;') : '',
                    links,
                    link_tags
                );

                // /<[^>]+href\s*=\s*['"]([^'"]+)['"][^>]*>/gm

                let request_count = links.length;

                if (links.length !== 0) saveFile(path.join(dir.filePaths[0], 'save.log'), '');
                links.forEach(link => {
                    request({
                        uri: link.indexOf('//') == 0 ? (new URL(uri)).protocol + link : link,
                        method: 'GET',
                        rejectUnauthorized: false,
                        requestCert: true,
                        agent: false,
                        strictSSL: false
                    }, (err, response, content) => {
                        let res = response && response.statusCode;

                        saveFile(
                            path.join(dir.filePaths[0], 'save.log'),
                            'URI: ' + link + '\n' +
                            'StatusCode: ' + res + '\n' +
                            'Error: ' + err + '\n\n',
                            true
                        );

                        let temp_uri = link.indexOf('//') == 0 ? (new URL(uri)).protocol + link : link;

                        mainWindow.webContents.send(
                            'request:result',
                            temp_uri,
                            'StatusCode: ' + res,
                            'Error: ' + err
                        );

                        if (err === null && response.statusCode.toString().match(/^2\d\d$/)) {
                            saveFile(
                                path.join(
                                    dir.filePaths[0],
                                    path.basename(link).includes('?') ? path.basename(link).substring(0, path.basename(link).indexOf('?')) : path.basename(link)
                                ),
                                content
                            );
                        }
                    });
                });
            });
        });
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

function saveFile(filename, content, append = false) {
    if (append) {
        fs.appendFile(filename, content, (err) => {
            if (err) console.log(err.code + ': ' + err.message);
            else console.log('Appended: ' + filename);
        });
    } else {
        fs.writeFile(filename, content, (err) => {
            if (err) console.log(err.code + ': ' + err.message);
            else console.log('Saved: ' + filename);
        });
    }
}

function showLoader() { mainWindow.webContents.send('loader:start'); }

function hideLoader() { mainWindow.webContents.send('loader:stop'); }