// TODO: DRY-out this file
var fs = require('fs'),
jqtpl = require('node-jqtpl'),
ghm = require('github-flavored-markdown'),
prettify = require('prettify'),
QueryString = require('querystring'),
res = require('http').ServerResponse.prototype,
inspect = require('util').inspect;

//require config


// expose the Renderer Object via
module.exports = function(config) {

/**
* Renderer Object. Actions goes there, declared in the public API.
*/
  var Renderer = (function Renderer() {
  	
	var path = config.path;//process.cwd(),
	var sidebarize = require("./sidebar")(config);
    var parseProps = require("./article-parser");
    
    /**
	* Define a custom render method on ServerResponse.
	*
	* Usage:
	*  res.render(view, data, force = false)
	*/
	Object.defineProperty(res, 'render', {value: sidebarize});
    /** Read and caches templates*/
    function loadTemplate (base, file) {
      fs.readFile(base + file, 'utf8', function(err, tmpl) {
        if (err) throw err;
        
        var templateName = 'tmpl.' + file.replace(/\.\w+/i, '');

        if(jqtpl.template[templateName]) {
          delete jqtpl.template[templateName]; 
        }
        
        jqtpl.template(templateName, tmpl);
      }); 
    }
    
    /** load template files and watch any modification on them for reloading them automagically*/
    function addTemplate(file) {
      var filename = /\./.test(file) ? file : file + '.html',
      base = [config.path, config.themeDir, config.theme, ''].join('/');
          
      // adding templates      
      loadTemplate(base, filename);
      
      // also register to file changes to automatically recompile them
      fs.watchFile(base + filename, function(curr, prev) {
        if(+curr.mtime !== +prev.mtime) {
          loadTemplate(base, filename); 
        }
      });
    }
    
    // https://gist.github.com/825583/
    function readDir(start, callback) {
      
      // Use lstat to resolve symlink if we are passed a symlink
      fs.lstat(start, function(err, stat) {
        if(err) return callback(err);
            
        var found = {dirs: [], files: []},
        total = 0,
        processed = 0,
        isDir = function isDir(abspath) {
          fs.stat(abspath, function(err, stat) {
            if(stat.isDirectory()) {
              found.dirs.push(abspath);
              // If we found a directory, recurse!
              readDir(abspath, function(err, data) {
                found.dirs = found.dirs.concat(data.dirs);
                found.files = found.files.concat(data.files);
                if(++processed == total) {
                  callback(null, found);
                }
              });
            } else {
              found.files.push(abspath);
              if(++processed == total) {
                callback(null, found);
              }
            }
          });
        };

        // Read through all the files in this directory
        if(stat.isDirectory()) {
          fs.readdir(start, function (err, files) {
            total = files.length;
            files.forEach(function(file, i){
              isDir([start, file].join('/'));              
            });
          });
        } else {
          return callback(new Error("path: " + start + " is not a directory"));
        }
      });
    };
    
    
    
    
    return {
      
        options: config,
        
        init: function(o) {
          this.options = config;
          
          addTemplate.call(this, 'layout');
          addTemplate.call(this, 'article');
          addTemplate.call(this, 'index');
          addTemplate.call(this, 'feed.xml');
          
          return this;
        },
        
        index: function(req, res, next, cb) {
        
          function render(articles) {
            articles.sort(function(a, b) {
              return (Date.parse(b.date)) - (Date.parse(a.date));
            });
            
            if(cb) {
              return cb(articles);
            }
            
            res.render('index', {
              articles: articles
            });
          }
          
          var abspath = [config.path, config.articleDir].join('/');
          
          if(cb && typeof cb === 'string') {
            // we're given a specific abspath, defaults to default behaviour
            abspath = cb;
            cb = null;
          }
          
          
          readDir(abspath, function(err, results) {
            
            var files = [],
            articles = [],
            ln;
            
            if(err || !results || !results.files) {
              return next(err);
            }
            
          
            // Filter out non markdown files and special ones
            results.files.forEach(function(filename, i) {
              if (!(/\.markdown$/.test(filename)) || /_sidebar\.markdown$/.test(filename)) {
                return;
              }
              
              files.push(filename);
            });
            

            ln = files.length - 1;
            
            // Then handle each files
            files.forEach(function(filename, i) {
              fs.readFile(filename, function(err, markdown) {
                var props;
                if (err) throw err;

                if (typeof markdown !== 'string') {
                  markdown = markdown.toString();
                }

                props = parseProps(markdown);
                props.name = filename
                  .replace([config.path, config.articleDir, ''].join('/'), '')
                  .replace('.markdown', '');
                  
                props.markdown = ghm.parse(props.markdown.substr(0, props.markdown.indexOf("##")));
            
                articles.push(props);
                
                if(i === ln) {
                  render(articles);
                }
              });
            });
          });
          
          
          return;
        },
        
        category: function(req, res, next) {},
        
        article: function(req, res, next) {
            var article = req.params[0],
            abspath = [config.path, config.articleDir, article].join('/').replace(/\/$/, ''),
            self = this;
            
            fs.readFile(abspath + '.markdown', 'utf8', function (err, body) {
                var props;
                if (err) {
                  // if it's a valid dir, serves its files
                  return fs.stat(abspath, function(err, stat) {
                    if(err || !stat.isDirectory()) return next(err);
                    
                    self.index(req, res, next, abspath);
                  });
                }
                
                props = parseProps(body);
                props.name = article;
                res.render('article', {
                  article: props,
                  author: {name: props.author},
                  content: ghm.parse(body)
                });
            });
        },
        
        feed: function(req, res, next){
            return this.index(req, res, next, function(articles) {
                res.render('feed', {articles: articles}, true);
            });
        }
    };
  })();


  return Object.create(Renderer).init(config);
}