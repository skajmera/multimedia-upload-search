const swaggerJSDoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multimedia Upload & Search API',
      version: '1.0.0',
      description:
        'API for uploading multimedia files (images, videos, audio, PDFs) to Cloudinary, ' +
        'storing metadata in MongoDB, and searching/ranking results by relevance.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
});

module.exports = swaggerSpec;
