import crypto from 'crypto';

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

export default hashPassword;
