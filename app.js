const express = require('express');
const http = require('http');
const { normalizePort, onError, onListening, URLChecker, wait } = require('./helpers');
const config = require('./config');
const cache = require('./cache');
const Browser = require('./Browser');
const chrome = new Browser();
const app = express();

const dontLoad = ['media', 'fonts', 'stylesheet']

// port
const port = normalizePort(process.env.PORT || config.port || '3010');
app.set('port', port);

app.get('/*', URLChecker, async (req, res) => {
    const startedReq = Date.now();
    const url = req.params[0];

    const browser = await chrome.browser;
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
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

        // scrolling because of lazy load
        const viewportHeight = page.viewport().height;
        let viewportIncr = 0;
        while (viewportIncr + viewportHeight < height) {
            await page.evaluate(_viewportHeight => {
                window.scrollBy(0, _viewportHeight);
            }, viewportHeight);
            await wait(20);
            viewportIncr = viewportIncr + viewportHeight;
        }
        await page.evaluate(_ => {
            window.scrollTo(0, 0);
        });
        await wait(100);
        await page.content();


        const meta = await page.evaluate(() => ([...document.querySelectorAll('head > meta')].map(e => e.outerHTML).join('')));
        await page.evaluate(() => { document.querySelectorAll('script').forEach(e => e.remove()) });

        const content = await page.content();
        await page.close();

        console.log(`Page has been loaded in: ${Date.now() - startedReq} ms.\nPage URL is: ${req.params[0]}\n`);

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

