import Bull from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

/**
 * Generates a thumbnail image for a given file.
 *
 * @param {string} originalPath - The path to the original image file.
 * @param {number} width - The desired width of the thumbnail.
 * @returns {Promise<void>} - A promise that resolves when the thumbnail is generated.
 * @throws {Error} - Throws an error if thumbnail generation fails.
 */
const generateThumbnail = async (originalPath, width) => {
  try {
    const thumbnail = await imageThumbnail(originalPath, { width });
    const thumbnailPath = `${originalPath}_${width}`;
    await fs.promises.writeFile(thumbnailPath, thumbnail);
  } catch (error) {
    console.error(`Error generating thumbnail: ${error.message}`);
  }
};

/**
 * Processes jobs in the fileQueue to generate thumbnails for specified files.
 * The job expects the following data: fileId and userId.
 *
 * @param {Object} job - The job object containing data for processing.
 * @param {Object} job.data - The data associated with the job.
 * @param {string} job.data.fileId - The ID of the file for which the thumbnail is to be generated.
 * @param {string} job.data.userId - The ID of the user who owns the file.
 * @returns {Promise<void>} - A promise that resolves when the job is completed.
 * @throws {Error} - Throws an error if any required fields are missing or if the file is not found.
 */
fileQueue.process(async (job) => {
  try {
    const { fileId, userId } = job.data;

    if (!fileId) {
      throw new Error('Missing fileId');
    }

    if (!userId) {
      throw new Error('Missing userId');
    }

    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) {
      throw new Error('File not found');
    }

    const thumbnailSizes = [100, 250, 500];

    const thumbnailPromises = thumbnailSizes
      .map((size) => generateThumbnail(file.localPath, size));

    await Promise.all(thumbnailPromises);

    console.log(`Thumbnails generated for fileId: ${fileId} and userId: ${userId}`);
  } catch (error) {
    job.moveToFailed({ message: error.message }, true);
    console.error(`Job failed: ${error.message}`);
  }
});

export default fileQueue;
