#!/usr/bin/env node

/**
 * Express application module for managing the server and routes.
 *
 * This module initializes an Express application, sets up middleware for
 * routing, and starts the server on a specified port. It uses routes
 * defined in the routes/index module.
 *
 */

import express from 'express';
import routes from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Use the defined routes
app.use(express.json());
app.use(routes);

// Starts the server
app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
