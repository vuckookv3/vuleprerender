const express = require('express');
const http = require('http');
const { normalizePort, onError, onListening, URLChecker } = require('./helpers');
const config = require('./config');
const Browser = require('./Browser');
const chrome = new Browser();
const apicache = require('apicache');
const app = express();
const onlyStatus200 = (req, res) => res.statusCode === 200

const cache = apicache.middleware;

const dontLoad = ['image', 'media', 'fonts', 'stylesheet']

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}


// port
const port = normalizePort(process.env.PORT || config.port || '3010');
app.set('port', port);

app.get('/*', URLChecker, /*cache('1 day', onlyStatus200),*/ async (req, res) => {
    const startedReq = Date.now();
    // console.log(`User-Agent: ${req.headers["user-agent"]}`)
    const url = req.params[0];

    const browser = await chrome.browser;
    const page = await browser.newPage();
    try {
        await page.setRequestInterception(true)
        page.on('request', (req) => {
            if (dontLoad.includes(req.resourceType())) return req.abort();
            return req.continue();
        })
        await page.setUserAgent('Prerender')
        await page.goto(url, { waitUntil: 'networkidle2', timeout: config.timeout || 30000 });


        const bodyHandle = await page.$('body');
        const { height } = await bodyHandle.boundingBox();
        await bodyHandle.dispose();

        // Scroll one viewport at a time, pausing to let content load
        const viewportHeight = page.viewport().height;
        let viewportIncr = 0;
        while (viewportIncr + viewportHeight < height) {
            await page.evaluate(_viewportHeight => {
                window.scrollBy(0, _viewportHeight);
            }, viewportHeight);
            await wait(200);
            viewportIncr = viewportIncr + viewportHeight;
        }

        // Scroll back to top
        await page.evaluate(_ => {
            window.scrollTo(0, 0);
        });

        // Some extra delay to let images load
        await wait(100);

        const meta = await page.evaluate(() => ([...document.querySelectorAll('head > meta')].map(e => e.outerHTML).join('')))
        const content = await page.content();
        await page.close();
        console.log(`Page has been loaded in: ${Date.now() - startedReq} ms.\nPage URL is: ${req.params[0]}\n`)
        return res.send(`<!-- PRERENDER -->` + content)
    } catch (err) {
        await page.close();
        console.error(`There was an error loading page: ${req.params[0]}.\nError: ${err}`);
        return res.status(400).send(config.errorMeta);
    }

})


// make server
const server = http.createServer(app);
server.listen(port);
server.on('error', (err) => onError(err, port));
server.on('listening', () => onListening(server));

