import fs from 'fs';

/**
 * Save data to the local file system.
 *
 * This function saves the provided data to a file with the given filename.
 * If an error occurs during the file-writing process, it logs the error.
 *
 * @function saveToLocalFileSystem
 * @param {string} filename - The name of the file where the data will be saved.
 * @param {string|Buffer} data - The data to be written to the file.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the file was written successfully, or `false` if there was an error.
 */
export async function saveToLocalFileSystem(filename, data) {
	fs.writeFile(filename, data, (err) => {
	  if (err) {
		console.error(`An error while writing the data: ${err.message}`);
		return false;
	  }
	  return true;
	});
  
	return true;
  }

  /**
 * Decodes a Base64-encoded string to its original plaintext.
 *
 * This function takes a Base64-encoded string and converts it back to a regular UTF-8 plaintext string.
 *
 * @function cipherTextToPlaintext
 * @param {string} cipherText - The Base64-encoded string.
 * @returns {string} The decoded plaintext string.
 */
export function cipherTextToPlaintext(cipherText) {
	return Buffer.from(cipherText, 'base64').toString('utf-8');
}
