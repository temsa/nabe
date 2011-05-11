var mime = require('./extended-mime'),
connect  = require('connect'),
inspect  = require('util').inspect,
defaults = require('./default-config');

function buildConfig (configFile) {
    var config;
	try {
		config = require(configFile);
	} catch(e) {
		if (typeof configFile === "undefined")
			console.log("No config file provided, using defaults");
		else
			console.warn("config file '",configFile,"' is invalid, falling back on defaults");
		config={};
	}
	//initialise all config values using defaults if not defined	
	for (key in defaults)
		config[key] = ( typeof config[key] !== 'undefined' ? config[key] : defaults[key] );
	
	//console.log("Resulting configuration is :", config);
	return config;
};

// create and expose the server
module.exports = function server(configFile) {
	var config = buildConfig (configFile);

	var yabe = {
		buildConfig : buildConfig,
		server : (function createServer() {
			var routes   = require('./routes')(config),
			 server = connect.createServer(
				// good ol'apache like logging
				// you can customize how the log looks:
				// http://senchalabs.github.com/connect/middleware-logger.html
				connect.logger(),
				
				// call to trigger routes
				connect.router(routes),
				
				// maxAge is set to one month
				connect.static([config.path, config.themeDir, config.theme, 'public'].join('/'), {
					// set you cache maximum age, in milisecconds.
					// if you don't use cache break use a smaller value
					maxAge: 1000 * 60 * 60 * 24 * 30
				})
			)
			//var listen = server.listen;
			
			//overrides default listen port with config one
			//server.listen = function listenWithDefault(port){return listen(port || config.port)}
			
			return server;
		})(),
		configuration : config,
		configure : function configure (configuration) { config = configuration; return yabe}
	}
	
	//provides for each key in config a helper function providing a chain
	for (key in config)
		yabe[key] = function configProxy( value ){
				//configProxy.name=key+"CofigurationProxy" ;
				config[key] = value;
				return yabe
			};
		
	return yabe;
}

// this is a failsafe, it will catch the error silently and logged it the console
// while this works, you should really try to catch the errors with a try/catch block
// more on this here: http://nodejs.org/docs/v0.4.3/api/process.html#event_uncaughtException_
process.on('uncaughtException', function (err) {
   console.warn('Caught exception: ',err.stack);
});