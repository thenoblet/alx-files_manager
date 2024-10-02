import { Buffer } from 'buffer';
import { generateAuthToken, verifyPassword } from '../utils/auth';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import HTTPError from '../utils/httpErrors';

/**
 * AuthController handles authentication-related operations.
 */
class AuthController {
  /**
   * Authenticates a user and generates an authentication token.
   *
   * This method extracts the Authorization header from the request,
   * validates the provided credentials, and generates a token if the
   * credentials are valid. The token is then stored in Redis.
   *
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<void>} Returns a promise that resolves to void.
   * @throws {Error} Throws an error if an unexpected issue occurs during authentication.
   */
  static async getConnect(request, response) {
    try {
      const authHeader = request.get('Authorization');
      if (!authHeader) {
        return HTTPError.unauthorized(response, 'Authorization header is missing');
      }

      const authParts = authHeader.split(' ');
      if (authParts.length !== 2 || authParts[0] !== 'Basic') {
        return HTTPError.badRequest(response, 'Invalid Authorization format');
      }

      const decodedCredentials = Buffer.from(authParts[1], 'base64').toString('utf-8');
      const [email, password] = decodedCredentials.split(':');

      const user = await dbClient.db.collection('users').findOne({ email });
      if (!user) {
        return HTTPError.unauthorized(response);
      }

      if (!verifyPassword(password, user.password)) {
        return HTTPError.unauthorized(response);
      }

      const token = generateAuthToken();
      await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

      return response.status(200).json({ token });
    } catch (error) {
      console.error(`Error during authentication: ${error.message}`);
      return HTTPError.internalServerError(response, 'An error occurred during authentication');
    }
  }

  /**
   * Logs out a user by deleting their authentication token.
   *
   * This method checks for the presence of a user token and removes it
   * from Redis to effectively log the user out.
   *
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<void>} Returns a promise that resolves to void.
   */
  static async getDisconnect(request, response) {
    if (!redisClient.isAlive()) {
      console.error('Redis client is not connected');
      return HTTPError.internalServerError(response);
    }

    try {
      const userToken = request.get('X-Token');
      if (!userToken) {
        return HTTPError.unauthorized(response);
      }

      const userID = await redisClient.get(`auth_${userToken}`);
      if (!userID) {
        return HTTPError.unauthorized(response, 'Invalid token');
      }

      await redisClient.del(`auth_${userToken}`);
      return response.sendStatus(204);
    } catch (error) {
      console.error(`Error during logout: ${error.message}`);
      return HTTPError.internalServerError(response, 'An error occurred during logout');
    }
  }
}

export default AuthController;
