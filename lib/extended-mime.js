var mime = require('mime');

mime.define({
    'application/x-font-woff': ['woff'],
    'image/vnd.microsoft.icon': ['ico'],
    'image/webp': ['webp'],
    'text/cache-manifest': ['manifest'],
    'text/x-component': ['htc'],
    'application/x-chrome-extension': ['crx']
});

module.exports = mime;