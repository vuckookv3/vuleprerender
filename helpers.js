const config = require('./config');

module.exports = {
    normalizePort: (val) => {
        const port = parseInt(val, 10);
        if (isNaN(port)) return val;
        if (port >= 0) return port;
        return false;
    },
    onError: (error, port) => {
        if (error.syscall !== 'listen') throw error;

        const bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    },
    onListening: (server) => {
        const addr = server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind);
    },
    URLChecker: (req, res, next) => {
        try {
            const parsedURL = new URL(req.params[0]);
           console.log(parsedURL.pathname) 
            if (!config.allowedURLs.includes(parsedURL.origin)) throw new Error('That URL is not allowed');
            return next();
        } catch (error) {
            return res.status(400).json({
                message: 'Invalid URL', error: error.message
            });
        }
    }
}