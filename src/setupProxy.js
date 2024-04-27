const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://85.31.62.71:3333/',
      changeOrigin: true,
    })
  );
};