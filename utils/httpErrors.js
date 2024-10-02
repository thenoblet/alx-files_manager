/**
 * HTTPError class to handle common HTTP errors.
 */
class HTTPError {
  /**
   * Respond with a 401 Unauthorized error.
   * @param {Object} response - The response object.
   * @param {string} [msg='Unauthorized'] - The error message.
   * @returns {Object} JSON response with the error message.
   */
  static unauthorized(response, msg = 'Unauthorized') {
    return response.status(401).json({ error: msg });
  }

  /**
   * Respond with a 400 Bad Request error.
   * @param {Object} response - The response object.
   * @param {string} [msg='Bad Request'] - The error message.
   * @returns {Object} JSON response with the error message.
   */
  static badRequest(response, msg = 'Bad Request') {
    return response.status(400).json({ error: msg });
  }

  /**
   * Respond with a 500 Internal Server Error.
   * @param {Object} response - The response object.
   * @param {string} [msg='Internal Server Error'] - The error message.
   * @returns {Object} JSON response with the error message.
   */
  static internalServerError(response, msg = 'Internal Server Error') {
    return response.status(500).json({ error: msg });
  }

  /**
   * Respond with a 404 Not Found error.
   * @param {Object} response - The response object.
   * @param {string} [msg='Not found'] - The error message.
   * @returns {Object} JSON response with the error message.
   */
  static notFound(response, msg = 'Not found') {
    return response.status(404).json({ error: msg });
  }

  /**
   * Respond with a 403 Forbidden error.
   * @param {Object} response - The response object.
   * @param {string} [msg='Forbidden'] - The error message.
   * @returns {Object} JSON response with the error message.
   */
  static forbidden(response, msg = 'Forbidden') {
    return response.status(403).json({ error: msg });
  }
}

export default HTTPError;
