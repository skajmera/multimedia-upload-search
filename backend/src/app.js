const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Swagger UI's static assets (CSS/JS) are loaded from a CDN instead of
// swagger-ui-express's local dist folder: Vercel's serverless bundler
// (@vercel/node) traces dependencies statically and misses files that
// express.static reads dynamically at runtime, so those assets 404 (falling
// through to swagger-ui-express's own catch-all and silently serving the
// wrong content) once deployed, even though it works fine locally.
const SWAGGER_UI_DOCS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Multimedia Upload & Search API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body style="margin:0">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({ url: '/api-docs.json', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>`;

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

  app.get('/api-docs', (req, res) => res.type('html').send(SWAGGER_UI_DOCS_HTML));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

  app.use('/api/auth', authRoutes);
  app.use('/api/files', fileRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
