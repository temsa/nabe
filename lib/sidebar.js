var fs = require('fs'),
ghm = require('github-flavored-markdown'),
prettify = require('prettify'),
jqtpl = require('node-jqtpl');

//this is used  in order to alter the res.render method for handling an optional sidebar
module.exports = function configureSidebar(config) {
	/*fn will be called with 3 arguments: target, data and force*/
	//TODO : handle per target
	function sidebarize(fn) {
		var cache;
		
		return function retrieveSidebar(target, data, force) {
			var self = this, args = arguments;
		
			if(cache) {
				data.sidebar = cache;
				data.has_sidebar = true;
				return fn.apply(this, arguments); 
			}
		
			// lookup for a special _sidebar.markdown file
			fs.readFile([config.path, config.articleDir, '_sidebar.markdown'].join('/'), 'utf8',
				function (err, body) {
					if (!err) {
						data.sidebar = cache = ghm.parse(body);
						data.has_sidebar = true;
					}
		    
		    		// whatever we've got (err), trigger callback
		    		fn.apply(self, args);
				});
		};
	};

return sidebarize(function render(target, data, force) {
    var partial = jqtpl.tmpl('tmpl.' + target, data),
    layout = !force ?
    	jqtpl.tmpl('tmpl.layout', {content: partial}) :
    	partial;
  
    // prettify snippets of code
    layout = layout.replace(/<pre><code>[^<]+<\/code><\/pre>/g, function (code) {
      code = code.match(/<code>([\s\S]+)<\/code>/)[1];
      code = prettify.prettyPrintOne(code);
      return "<pre><code>" + code + "</code></pre>";
    });
  
    // with feeds, the ' escape made it non valid feed.
    layout = layout.replace(/&#39/g, "'");
  
    this.writeHead(200, {
        'Content-Type': /feed/.test(target) ? 'application/rss+xml' : 'text/html',
        'Content-Length': layout.length
    });
  
    this.end(layout);
  })



}
