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
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

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
router.post('/users', async (request, response) => UsersController.postNew(request, response));

/**
 * Route to authenticate a user.
 *
 * @name GET /connect
 * @function
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.get('/connect', async (request, response) => AuthController.getConnect(request, response));

/**
 * Route to disconnect a user.
 *
 * @name GET /disconnect
 * @function
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.get('/disconnect', async (request, response) => AuthController.getDisconnect(request, response));

/**
 * Route to retrieve the currently authenticated user.
 *
 * @name GET /users/me
 * @function
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.get('/users/me', async (request, response) => UsersController.getMe(request, response));

/**
 * @route POST /files
 * @description Route to upload a new file to the system.
 * @async
 * @param {Object} request - Express request object containing the file data in the body.
 * @param {Object} response - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.post('/files', async (request, response) => FilesController.postUpload(request, response));

/**
 * @route GET /files/:id
 * @description Route to retrieve a file by its ID.
 * @param {Object} request - request object containing the file ID in the request parameters.
 * @param {Object} response - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.get('/files/:id', async (request, response) => FilesController.getShow(request, response));

/**
 * @route GET /files
 * @description Route to retrieve a list of all files available in the system.
 * @async
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
router.get('/files', async (request, response) => FilesController.getIndex(request, response));

/**
 * @route PUT /files/:id/publish
 * @group Files - Operations about files
 * @param {string} id.path.required - The ID of the file
 * @returns {object} 200 - An object containing the updated file details
 * @returns {Error} 404 - File not found
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Internal server error
 * @description Publishes a file, making it public.
 */
router.put('/files/:id/publish', async (req, res) => FilesController.putPublish(req, res));

/**
 * @route PUT /files/:id/unpublish
 * @group Files - Operations about files
 * @param {string} id.path.required - The ID of the file
 * @returns {object} 200 - An object containing the updated file details
 * @returns {Error} 404 - File not found
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Internal server error
 * @description Unpublishes a file, making it private.
 */
router.put('/files/:id/unpublish', async (req, res) => FilesController.putUnpublish(req, res));

/**
 * Return the data stored in a file.
 */
router.get('/files/:id/data', async (req, res) => FilesController.getFile(req, res));

export default router;
