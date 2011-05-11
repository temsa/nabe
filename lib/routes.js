
function defaultHandler(route) {
    return function(req, res, next) {
        console.log('Matching route ', route, ' for ', req.url, 'with params', req.params);
        next();
    };
}

function proxy(fn, context) {
    return function proxy(req, res, next) {
        return fn.apply(context, arguments);
    };
}

// create and expose router
module.exports = function buildRouter(config){
	var renderer = require('./renderer')(config);
	console.log('renderer',renderer);
	return function router(app) {
	    function addRoute(route, r) {
	    	//console.log('route',route,'r',r);
	        r = r || defaultHandler(route);
	        app.get(route, proxy(r, renderer));
	    };
	
	/*
	    // index
	    addRoute('/', renderer.index);
	
	    // rss feed
	    addRoute('/feed.xml', renderer.feed);
	
	    // category/tags support
	    addRoute('/category/:category', renderer.category);
	
	    // article
	    addRoute(/\/article\/(.+)\/?/, renderer.article);
	    addRoute(/\/article\/?/, renderer.index);
	  */  
	    //get routes from configuration and apply them
	    //console.log("applying routes :",config.routes);
	    Object.keys(config.routes).forEach(function (key) {
	    	var routes = config.routes[key];
	    	
	    	//thanks to this we can consider a generic case of multiple route
	    	if( !(routes instanceof Array))
	    		routes = [routes];
	    	//console.log('routes:',routes);
	    	routes.forEach(function (route) {
	    		console.log('Adding route:',route ,'to router', key);
	    		if (typeof route === 'function' && ! route instanceof RegExp)
	    			route = route(app, config, key)
	    		//console.log('key:',key,'route:',route);
	    		addRoute(route, renderer[key]);
	    	});
	    })
	    
	    // this must be the last route, its an addition to the static provider
	    app.get('*', function manageExceptionsInRoute(req, res, next) {
	        var reqPath = req.url,
	        userAgent = req.headers['user-agent'],
	        reqHost = req.headers.host;
	        
	        if (userAgent && userAgent.indexOf('MSIE') && reqPath.match(/\.html$/) || reqPath.match(/\.htm$/)) {
	          // use this header for html files, or add it as a meta tag
	          // to save header bytes serve it only to IE
	          res.setHeader('X-UA-Compatible', "IE=Edge,chrome=1"); 
	        }
	
	        // protect .files
	        if (reqPath.match(/(^|\/)\./)) {
	          return res.end("Not allowed"); 
	        }
	
	        // allow cross domain (for your subdomains)
	        // disallow other domains.
	        // you can get really specific by adding the file
	        // type extensions you want to allow to the if statement
	        if (reqHost && !reqHost.match(config.hostAddress)) {
	          console.log('what?', reqHost, !reqHost.match(config.hostAddress));
	          return res.end("Cross-domain is not allowed"); 
	        }
	
	        next();
	        // let the static server do the rest
	    });
	};
}