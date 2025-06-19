import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EventSphere API',
            version: '1.0.0',
            description: 'API documentation for EventSphere event booking platform',
        },
        servers: [
            {
                url: 'http://localhost:5050',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "EventSphere API Documentation",
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showCommonExtensions: true,
    }
};

export default (app) => {
    // Serve Swagger UI with custom options
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
}; 