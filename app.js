const express = require('express');
const http = require('http');
const { normalizePort, onError, onListening, URLChecker } = require('./helpers');
const config = require('./config');
const Browser = require('./Browser');
const chrome = new Browser();
const app = express();

const dontLoad = ['stylesheet', 'image', 'media', 'font']


// port
const port = normalizePort(process.env.PORT || config.port || '3010');
app.set('port', port);

app.get('/*', URLChecker, async (req, res) => {
    const url = req.params[0];
    console.log(url)
    const browser = await chrome.browser;
    const page = await browser.newPage();
    try {
        await page.setRequestInterception(true)
        page.on('request', (req) => {
            if (dontLoad.includes(req.resourceType())) return req.abort();
            return req.continue();
        })

        await page.goto(url, { waitUntil: 'networkidle2', timeout: config.timeout || 30000 });
        console.log('POSLE GOTO')
        console.log()
        const meta = await page.evaluate(() => ([...document.querySelectorAll('head > meta')].map(e => e.outerHTML).join('')))
        await page.close();

        return res.send(`<!doctype html><html><head>${meta}</head></html>`);
    } catch (err) {
        await page.close();
        console.error(err);
        return res.send(config.defaultMeta);
    }

})


// make server
const server = http.createServer(app);
server.listen(port);
server.on('error', (err) => onError(err));
server.on('listening', () => onListening(server));

