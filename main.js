const path = require('path');
const url = require('url');
const valid_url = require('valid-url');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

let mainWindow;
let testWindow;

const mainMenuTemplate = [{
    label: 'File',
    submenu: [{
        label: "Save test file",
        click() {
            const { dialog } = require('electron');
            dialog.showOpenDialog({ properties: ["openDirectory"] }).then(dir => {
                saveFile(path.join(dir.filePaths[0], 'test.txt'), 'Some text');
            });
        }
    }, {
        label: 'Test',
        click() {
            testWindow = new BrowserWindow({
                width: 500,
                height: 350,
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
                slashes: true
            }));

            testWindow.on('close', () => {
                testWindow = null;
            });
        }
    }, {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
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
    //if (valid_url.isUri(uri) === undefined) uri = 'http://' + uri;
    const { dialog } = require('electron');
    dialog.showOpenDialog({
        properties: ["openDirectory"]
    }).then(dir => {
        const request = require('request');
        request({
            uri: uri.indexOf('//') == 0 ? 'https:' + uri : uri,
            method: 'GET',
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
            strictSSL: false
        }, (error, response, body) => {
            // console.error('error:', error);
            // console.log('statusCode:', response && response.statusCode);
            // console.log(body);

            //saveFile('testpage', body);

            let links = [];
            let link_tags = body.match(/<link[\s]+([^>]+)>/gmi);

            if (link_tags !== null) {
                link_tags.forEach(link => {
                    let temp_array = (new RegExp(/href=(["'])(.*?)\1/gi)).exec(link);
                    if (temp_array[2].includes('.css') && temp_array.input.includes('stylesheet')) {
                        const isUrlAbsolute = (url) => (url.indexOf('://') > 0 || url.indexOf('//') === 0);
                        if (isUrlAbsolute(temp_array[2])) {
                            links.push(temp_array[2]);
                        } else {
                            const url = require('url');
                            links.push(url.resolve(uri, temp_array[2]));
                            //links.push(new URL(temp_array[2], 'http://lab.volpi.ru/examples/').href);
                        }
                    }
                });
            }

            mainWindow.webContents.send(
                'http:body',
                body.replace(/</gm, '&lt;').replace(/>/gm, '&gt;'),
                links,
                link_tags
            );

            // /<[^>]+href\s*=\s*['"]([^'"]+)['"][^>]*>/gm

            saveFile(path.join(dir.filePaths[0], 'output.txt'), '');
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
                        path.join(dir.filePaths[0], 'output.txt'),
                        'Uri: ' + link + '\n' +
                        'StatusCode: ' + res + '\n' +
                        'Error: ' + err + '\n\n',
                        true
                    );

                    let temp_uri = link.indexOf('//') == 0 ? (new URL(uri)).protocol + link : link;

                    mainWindow.webContents.send(
                        'request:result',
                        'Uri: ' + temp_uri,
                        'StatusCode: ' + res,
                        'Error: ' + err
                    );

                    if (err === null && response.statusCode.toString()[0] === '2') {
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

app.on('window-all-closed', () => {
    app.quit();
});

function saveFileDialog(filename, content) {
    const { dialog } = require('electron');
    const path = require('path');
    const fs = require('fs')
    dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '../assets/' + filename + '.txt'),
        // defaultPath: path.join(__dirname, '../assets/'), 
        buttonLabel: 'Save',
        // Restricting the user to only Text Files. 
        filters: [{
            name: 'Text Files',
            extensions: ['txt', 'docx']
        }, ],
        properties: []
    }).then(file => {
        // Stating whether dialog operation was cancelled or not. 
        console.log(file.canceled);
        if (!file.canceled) {
            console.log(file.filePath.toString());
            // Creating and Writing to the sample.txt file 
            fs.writeFile(file.filePath.toString(),
                content,
                function(err) {
                    if (err) throw err;
                    console.log('Saved as "' + file.filePath + '"');
                });
        }
    }).catch(err => {
        console.log(err)
    });
}

function saveFile(filename, content, append = false) {
    const path = require('path');
    const fs = require('fs');

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