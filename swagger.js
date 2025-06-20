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
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'User ID'
                        },
                        firstName: {
                            type: 'string',
                            description: 'User first name'
                        },
                        lastName: {
                            type: 'string',
                            description: 'User last name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email'
                        },
                        agreedToTerms: {
                            type: 'boolean',
                            description: 'Whether user agreed to terms and privacy policy'
                        },
                        subscribeNewsletter: {
                            type: 'boolean',
                            description: 'Whether user subscribed to newsletter'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'User creation date'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'User last update date'
                        }
                    }
                },
                Event: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Event ID'
                        },
                        title: {
                            type: 'string',
                            description: 'Event title'
                        },
                        description: {
                            type: 'string',
                            description: 'Event description'
                        },
                        date: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Event date and time'
                        },
                        category: {
                            type: 'string',
                            description: 'Event category'
                        },
                        price: {
                            type: 'number',
                            description: 'Ticket price'
                        },
                        availableTickets: {
                            type: 'number',
                            description: 'Number of available tickets'
                        },
                        location: {
                            type: 'string',
                            description: 'Event location'
                        },
                        organizer: {
                            type: 'string',
                            description: 'Event organizer'
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'cancelled', 'completed'],
                            description: 'Event status'
                        }
                    }
                },
                Booking: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Booking ID'
                        },
                        event: {
                            $ref: '#/components/schemas/Event',
                            description: 'Associated event'
                        },
                        user: {
                            $ref: '#/components/schemas/User',
                            description: 'User who made the booking'
                        },
                        numberOfTickets: {
                            type: 'number',
                            description: 'Number of tickets booked'
                        },
                        totalAmount: {
                            type: 'number',
                            description: 'Total amount for the booking'
                        },
                        paymentStatus: {
                            type: 'string',
                            enum: ['pending', 'completed', 'failed', 'refunded'],
                            description: 'Payment status'
                        },
                        status: {
                            type: 'string',
                            enum: ['confirmed', 'cancelled'],
                            description: 'Booking status'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Booking creation date'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        },
                        error: {
                            type: 'string',
                            description: 'Detailed error information'
                        }
                    }
                }
            }
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