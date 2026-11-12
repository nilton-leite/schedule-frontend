const { createProxyMiddleware } = require('http-proxy-middleware');

// Só usado pelo servidor de desenvolvimento (yarn start).
// Encaminha /api para a API local; nunca para produção.
module.exports = function (app) {
  // http-proxy-middleware v3: pathFilter mantém o prefixo /api no caminho encaminhado
  // (montar com app.use('/api', ...) faria o Express remover o prefixo).
  app.use(
    createProxyMiddleware({
      pathFilter: '/api',
      target: process.env.API_PROXY_TARGET || 'http://localhost:3333'
    })
  );
};
