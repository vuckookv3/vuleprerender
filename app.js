require('dotenv').config({ path: `${__dirname}/.env` })
const express = require('express');
const http = require('http');
const { normalizePort, onError, onListening, URLChecker, wait } = require('./helpers');
const config = require('./config');
const { redis, cache } = require('./cache');
const Browser = require('./Browser');
const chrome = new Browser();
const app = express();

const debug = false;
const timeout = Number(process.env.TIMEOUT) || config.timeout || 30000;
const enableLogs = Boolean(process.env.ENABLE_LOGS);

const dontLoad = ['image', 'media', 'fonts', 'stylesheet'];

// port
const port = normalizePort(process.env.PORT || config.port || '3010');
app.set('port', port);

app.get('/extend', async (req, res) => {
    const allKeys = await redis.keys('*');
    for (const e of allKeys) {
        await redis.expire(e, 60 * 60 * 24);
    }
    res.json('OK');
})

app.get('/*', URLChecker, cache, async (req, res) => {
    const startedReq = Date.now();
    let url = new URL(req.params[0]);
    const origin = url.origin;
    url = url.origin + url.pathname;

    const browser = await chrome.browser;
    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 568 });
    try {
        await page.setRequestInterception(true)
        page.on('request', (req) => {
            if (dontLoad.includes(req.resourceType())) return req.abort();
            return req.continue();
        })
        await page.setUserAgent('Prerender')

        await page.goto(url, { waitUntil: 'networkidle2', timeout })
            .catch(err => {
                enableLogs && console.error(err.message);
                enableLogs && console.error(url);
                return Promise.resolve();
            });

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
            await wait(200);
            viewportIncr = viewportIncr + viewportHeight;
        }
        await page.evaluate(_ => {
            window.scrollTo(0, 0);
        });
        await wait(100);
        await page.content();


        const meta = await page.evaluate(() => ([...document.querySelectorAll('head > meta')].map(e => e.outerHTML).join('')));
        await page.evaluate(() => { document.querySelectorAll('script').forEach(e => e.remove()) });
        await page.evaluate(() => { document.querySelectorAll('iframe').forEach(e => e.remove()) });
        debug && await page.evaluate(() => {
            const base = document.createElement('base');
            base.setAttribute('href', origin)
            document.head.appendChild(base);
        })

        const content = await page.content();
        await page.close();

        enableLogs && console.log(`Page has been loaded in: ${Date.now() - startedReq} ms.\nPage URL is: ${req.params[0]}\n`);


        // save to redis
        await redis.multi().set(url, `<!-- PRERENDER -->` + content).expire(url, 60 * 60 * 24).exec();

        return res.send(`<!-- PRERENDER -->` + content)
    } catch (err) {
        await page.close();
        enableLogs && console.error(`There was an error loading page: ${req.params[0]}.\nError: ${err}`);
        return res.status(400).send(config.errorMeta);
    }

})


// make server
const server = http.createServer(app);
server.listen(port);
server.on('error', (err) => onError(err, port));
server.on('listening', () => onListening(server));

