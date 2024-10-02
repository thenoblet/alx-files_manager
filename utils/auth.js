import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hashes a password using the SHA-1 algorithm.
 *
 * This function takes a password as input, hashes it using the SHA-1
 * algorithm, and returns the resulting hexadecimal hash string.
 *
 * @param {string} password - The password to hash.
 * @returns {string} The hashed password in hexadecimal format.
 * @throws {Error} If the hashing process fails.
 */
function hashPassword(password) {
  const hash = crypto.createHash('sha1');

  try {
    const hashedpassword = hash.update(password).digest('hex');
    return hashedpassword;
  } catch (error) {
    throw new Error(`Unable to hash password ${error}`);
  }
}

/**
 * Generates a random authentication token using UUID v4.
 *
 * This function generates and returns a new unique authentication token.
 *
 * @returns {string} The generated UUID token.
 * @throws {Error} If token generation fails.
 */
function generateAuthToken() {
  try {
    return uuidv4();
  } catch (error) {
    console.error(`Failed to generate uuid: ${error.message}`);
    throw new Error('Failed to generate uuid');
  }
}

/**
 * Verifies if a plain password matches the hashed password.
 *
 * This function hashes the plain password and compares it with the
 * provided hashed password to determine if they match.
 *
 * @param {string} plainPassword - The plain password to verify.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {boolean} True if the passwords match, false otherwise.
 */
function verifyPassword(plainPassword, hashedPassword) {
  const hashedPlainPassword = hashPassword(plainPassword);
  return hashedPlainPassword === hashedPassword;
}

export { hashPassword, generateAuthToken, verifyPassword };
