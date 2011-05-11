// Just a basic server setup for this site
var yabe = require('./lib/yabe')()/*using default configuration file, otherwise specify a conf module here*/
console.log(yabe);
yabe.server.listen(yabe.configuration.port); //port is set in configuration

console.log('Node Yabe server is running! and listening on', yabe.configuration.port);