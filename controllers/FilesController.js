/* eslint-disable */
import { ObjectId } from 'mongodb';
import fs from 'fs';
import UsersController from './UsersController';
import HTTPError from '../utils/httpErrors';
import dbClient from '../utils/db';
import { generateAuthToken as generateUUID } from '../utils/auth';
import { cipherTextToPlaintext, saveToLocalFileSystem } from '../utils/misc';

/**
 * FilesController handles file uploads, folder creation, and file validation.
 * It interacts with the file system and the database to store files and folders.
 */
class FilesController {
  /**
	 * Constructor initializes the file manager's folder path and accepted file types.
	 * If the folder path does not exist, it creates it.
	 */
  constructor() {
    this.folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    this.acceptedFileTypes = ['folder', 'file', 'image'];

    if (!fs.existsSync(this.folderPath)) {
      fs.mkdirSync(this.folderPath, { recursive: true });
    }
  }

  /**
	 * Handles file or folder upload by validating the request, checking user authorization,
	 * and saving the file or folder to the file system and database.
	 *
	 * @function postUpload
	 * @param {Object} request - Express request object.
	 * @param {Object} response - Express response object.
	 * @returns {Promise<Object>} The created file or folder document.
	 */
  static async postUpload(request, response) {
    const user = await UsersController.getUserData(request);
    const instance = new FilesController();
    if (!user) {
      return HTTPError.unauthorized(response);
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = request.body;

    const validationResult = await instance.validateFileRequest(request, response);
    if (validationResult.error) {
      return validationResult.error;
    }

    const validParentId = parentId === '0' ? null : ObjectId(parentId);

    const fileDocument = {
      userId: ObjectId(user._id),
      name,
      type,
      isPublic,
      parentId: validParentId,
    };

    if (type === 'folder') {
      return instance.createFolder(response, fileDocument);
    }

    return instance.createFile(response, fileDocument, data);
  }

  /**
	 * Validates the file upload request by checking for missing fields like
	 * `name`, `type`, and `data`.
	 * It also verifies the validity of the `parentId` if provided.
	 *
	 * @function validateFileRequest
	 * @param {Object} request - Express request object.
	 * @param {Object} response - Express response object.
	 * @returns {Promise<Object>} An object containing validation error
	 * (if any) and the parent folder document.
	 */
  async validateFileRequest(request, response) {
    if (!request.body.name) {
      return HTTPError.badRequest(response, 'Missing name');
    }

    const { type, parentId = '0', data } = request.body;

    if (!type || !this.acceptedFileTypes.includes(type)) {
      return HTTPError.badRequest(response, 'Missing type');
    }

    if (!data && type !== 'folder') {
      return HTTPError.badRequest(response, 'Missing data');
    }

    console.log(`Validating parentId: ${parentId}`);

    if (parentId !== '0') {
      if (!ObjectId.isValid(parentId)) {
        return HTTPError.badRequest(response, 'Invalid parentId format');
      }

      const parentFolder = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFolder) {
        return HTTPError.badRequest(response, 'Parent not found');
      }

      if (parentFolder.type !== 'folder') {
        return HTTPError.badRequest(response, 'Parent is not a folder');
      }
      request.body.parentId = 0;

      return { error: null, parentFolder };
    }

    return { error: null, parentFolder: null };
  }

  /**
	 * Creates a new folder in the database.
	 *
	 * @function createFolder
	 * @param {Object} response - Express response object.
	 * @param {Object} fileDocument - The document representing the folder to be created.
	 * @returns {Promise<Object>} The created folder document.
	 */
  async createFolder(response, fileDocument) {
    const newFolder = await dbClient.db.collection('files').insertOne(fileDocument);
    return response.status(201).json({
      id: newFolder.insertedId.toString(),
      userId: fileDocument.userId,
      name: fileDocument.name,
      type: fileDocument.type,
      isPublic: fileDocument.isPublic,
      parentId: fileDocument.parentId,
    });
  }

  /**
	 * Creates a new file, decodes the data, saves it to the file system,
	 * and then inserts the file metadata into the database.
	 *
	 * @function createFile
	 * @param {Object} response - Express response object.
	 * @param {Object} fileDocument - The document representing the file to be created.
	 * @param {string} data - The Base64-encoded file data to be saved.
	 * @returns {Promise<Object>} The created file document.
	 */
  async createFile(response, fileDocument, data) {
    try {
      const fileName = generateUUID();
      const filePath = `${this.folderPath}/${fileName}`;

      const decodedFileData = cipherTextToPlaintext(data);
      if (!await saveToLocalFileSystem(filePath, decodedFileData)) {
        return HTTPError.internalServerError(response);
      }

      const newFile = await dbClient.db.collection('files').insertOne({
        ...fileDocument,
        localPath: filePath,
      });

      return response.status(201).json({
        id: newFile.insertedId,
        ...fileDocument,
      });
    } catch (error) {
      return HTTPError.internalServerError(response);
    }
  }
}

export default FilesController;
