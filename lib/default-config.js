module.exports = {
  // control cross domain if you want. allow cross domain (for your subdomains) disallow other domains.
  // you can get really specific by using a regex here
  // hostAddress: 'localhost',
  hostAddress: /localhost|127\.0\.0\.1/,
  // server port
  port: 3001,
  //root of path for articles and themes
  path: module.filename.split('/').slice(0,-2).join('/'),
  // articles dir path
  // you could set up whatever folder you like here `articles/any/sub/level/folder`
  articleDir: 'articles',
  // themes folder path
  themeDir: 'themes',
  // theme folder name
  theme: 'testr',
  routes: {
  	index : ['/', /\/article\/?/ ],
	feed : '/feed.xml',
	category : '/category/:category',
	article : /\/article\/(.+)\/?/
  }
};