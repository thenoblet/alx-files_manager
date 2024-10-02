import dbClient from '../utils/db';
import HTTPError from '../utils/httpErrors';
import hashPassword from '../utils/auth';

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

    const userEmail = await dbClient.db.collection('users').findOne({ email });
    if (userEmail) {
      return HTTPError.badRequest(response, 'Already exists');
    }

    try {
      const hashedPassword = hashPassword(password);
      const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
      return response.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      return HTTPError.internalServerError(response, 'An error occurred while creating new user');
    }
  }
}

export default UsersController;
