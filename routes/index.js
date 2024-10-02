#!/usr/bin/env node

/**
 * Express Router module for application status and statistics.
 *
 * This module defines the routes for checking the status of the application
 * and retrieving statistics. It utilizes the AppController to handle the
 * requests and responses.
 *
 */

import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = Router();

/**
 * Route to get the status of the of redis and mongoBD.
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

/**
 * Route to create a new user.
 * @name POST /users
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.post('users', async (request, response) => UsersController.postNew(request, response));

export default router;
