#!/usr/bin/env node

/**
 * Express Router module for application status and statistics.
 *
 * This module defines the routes for checking the status of the application
 * and retrieving statistics. It utilizes the AppController to handle the
 * requests and responses.
 *
 * @module routes/app
 * @requires express
 * @requires ../controllers/AppController
 */

import Router from 'express';
import AppController from '../controllers/AppController';

const router = Router();

/**
 * Route to get the status of the application.
 * @name GET /status
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.get('/status', async (request, response) => AppController.getStatus(request, response));

/**
 * Route to get statistics about the application.
 * @name GET /stats
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.get('/stats', async (request, response) => AppController.getStats(request, response));

export default router;
