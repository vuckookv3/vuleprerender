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
    port: undefined,
    allowedURLs: ['https://reflektor.rs', 'https://idjtv.com', 'https://najboljamamanasvetu.com', 'https://mame.rtech.rs'],      // include schema and subdomain
    timeout: undefined,                         // in ms
    defaultMeta,
    errorMeta,
}