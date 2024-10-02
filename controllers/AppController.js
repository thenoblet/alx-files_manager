#!/usr/bin/env node
import dbClient from '../utils/db';
import RedisClient from '../utils/redis';
import HTTPError from '../utils/httpErrors';

/**
 * Controller for handling application-related requests.
 *
 * The AppController class provides methods to get the application status
 * and statistics from the database. It interfaces with both a MongoDB
 * client and a Redis client to provide real-time data about the application's health.
 *
 * @class AppController
 */
class AppController {
/**
 * Get the status of Redis and the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} JSON response with the status of Redis and the database.
 * @throws {Error} Throws an error if there is an issue getting the status.
 */
  static async getStatus(request, response) {
    try {
      return response.status(200).json({ redis: RedisClient.isAlive(), db: dbClient.isAlive() });
    } catch (error) {
      console.log(`Error getting status of redis or mongodb: ${error}`);
      return HTTPError.internalServerError(response);
    }
  }

  /**
 * Get the number of users and files in the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} JSON response with the number of users and files in the database.
 * @throws {Error} Throws an error if there is an issue retrieving the statistics.
 */
  static async getStats(request, response) {
    try {
      return response
        .status(200)
        .json({ users: await dbClient.nbUsers(), files: await dbClient.nbFiles() });
    } catch (error) {
      console.log(`Unable to get stats from mongoDB: ${error}`);
      return HTTPError.internalServerError(response);
    }
  }
}

export default AppController;
