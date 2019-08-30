const puppeteer = require('puppeteer');

class Browser {
    constructor() {
        const createBrowser = async () => {
            console.log('Launching browser...');
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=320,568']
            });
            this.browser.on("disconnected", createBrowser);
            console.log('Browser started!');
        }

        (async () => {
            await createBrowser();
        })();
    }
}

module.exports = Browser;