var QueryString = require('querystring');

module.exports = function parseProps(markdown) {
      var props = {},
      match = [];

      // Parse out headers
      while( (match = markdown.match(/^([a-z]+):\s*(.*)\s*\n/i)) ) {
        var name = match[1].toLowerCase(),
            value = match[2];
            
        markdown = markdown.substr(match[0].length);
        props[name] = value;
      }
      
      props.markdown = markdown;

      if(props.categories !== undefined) {
        props.categories = props.categories.split(',').map(function(element){ 
          return QueryString.escape(element.trim());
        });
      }
      
      return props;
    }