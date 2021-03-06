const errorMeta = `
<!doctype html>
<html>
    <head>
        <meta name="description" value="Error">
    </head>
</html>
`

const defaultMeta = `
<!doctype html>
<html>
    <head>
    </head>
</html>
`

module.exports = {
    port: 3010,
    allowedURLs: [
        'https://reflektor.rs',
        'https://idjtv.com',
        'https://najboljamamanasvetu.com',
    ], // include schema and subdomain
    timeout: 9000,     // in ms
    defaultMeta,
    errorMeta,
    enableLogs: false
}

// sudo apt-get install redis-server
// sudo systemctl enable redis-server.service
// sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget