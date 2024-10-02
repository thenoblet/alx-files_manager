import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import HTTPError from '../utils/httpErrors';
import { hashPassword } from '../utils/auth';
import redisClient from '../utils/redis';

/**
 * Controller for managing user-related actions.
 *
 * This class provides methods for user registration and authentication.
 */
class UsersController {
  /**
     * Creates a new user.
     *
     * This method handles the creation of a new user. It checks if the email
     * is provided, verifies that the user does not already exist, hashes the
     * provided password, and stores the new user in the database.
     *
     * @param {Object} request - The request object containing user data.
     * @param {Object} response - The response object for sending back results.
     * @returns {Promise<void>} A promise that resolves when the response is sent.
     */
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      return HTTPError.badRequest(response, 'Missing email');
    }

    if (!password) {
      return HTTPError.badRequest(response, 'Missing password');
    }

    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      return HTTPError.badRequest(response, 'Already exist');
    }

    try {
      const hashedPassword = hashPassword(password);
      const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
      return response.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      return HTTPError.internalServerError(response, 'Error: Unable to create user.');
    }
  }

  /**
   * Retrieves the current user's data.
   *
   * This method checks the authentication token and fetches user data if valid.
   *
   * @param {Object} request - The HTTP request object.
   * @param {Object} response - The HTTP response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  static async getMe(request, response) {
    try {
      const user = await this.getUserData(request);
      if (!user) {
        return HTTPError.unauthorized(request);
      }

      return response.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      console.error(`Error fetching user data: ${error}`);
      return HTTPError.unauthorized(response);
    }
  }

  /**
   * Retrieves user data based on the provided authentication token.
   *
   * @param {Object} request - The HTTP request object.
   * @returns {Promise<Object|null>} The user object if found, or null.
   */
  static async getUserData(request) {
    const userToken = request.get('X-Token');
    if (!userToken) {
      throw new Error('Token is missing');
    }

    const userId = await redisClient.get(`auth_${userToken}`);
    if (!userId) {
      return null;
    }

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export default UsersController;
