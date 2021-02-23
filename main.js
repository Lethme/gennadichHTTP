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
}, {
    label: 'HTTP',
    submenu: [{
        label: 'Get Test Page',
        click() {
            const request = require('request');
            request('http://lab.volpi.ru/examples/testpage.htm', (error, response, body) => {
                console.error('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.

                //saveFile('testpage', body);

                let links = [];

                body.match(/<link[\s]+([^>]+)>/gm).forEach(link => {
                    let temp_array = (new RegExp(/href=(["'])(.*?)\1/g)).exec(link);
                    if (temp_array[2].includes('.css')) links.push(temp_array[2]);
                });

                // /<[^>]+href\s*=\s*['"]([^'"]+)['"][^>]*>/gm
                console.log(links);
            });
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

app.on('window-all-closed', () => {
    app.quit();
});

function saveFile(filename, content) {
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