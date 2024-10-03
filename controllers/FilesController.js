/* eslint-disable */
import fs from 'fs';
import Bull from 'bull';
import { ObjectId } from 'mongodb';

import HTTPError from '../utils/httpErrors';
import UsersController from './UsersController';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

import { generateAuthToken as generateUUID } from '../utils/auth';
import { cipherTextToPlaintext, saveToLocalFileSystem } from '../utils/misc';

const fileQueue = new Bull('fileQueue');

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


  static async getShow(request, response) {
    const token = request.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    
    if (!userId) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = request.params;

    try {
      const file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(id),
        userId: ObjectId(userId),
      });

      if (!file) {
        return response.status(404).json({ error: 'Not found' });
      }

	  const { localPath, _id, ...rest } = file;
	  const sanitizedFile = {
		id: _id.toString(), // Convert _id to string for consistency
		...rest,
	  };

      return response.status(200).json(sanitizedFile);
    } catch (err) {
      return response.status(500).json({ error: 'Server error' });
    }
  }

  static async getIndex(request, response) {
    try {
      const dbUser = await UsersController.getUserData(request);
      let parentId = request.query.parentId;
      const page = parseInt(request.query.page, 10) || 0;
      const itemsPerPage = 20;

      // Ensure parentId is either a number or a valid string
      if (parentId === '0') {
        parentId = null; // Treat string '0' as the number 0
      } else if (parentId && ObjectId.isValid(parentId)) {
		parentId = ObjectId(parentId); // Convert to ObjectId if valid
	  } else {
		parentId = null;
	  }

      try {
        const matchStage = {
          userId: dbUser._id,
          ...(parentId !== undefined ? { parentId } : {}),
        };

        const dbFiles = await dbClient.db
          .collection('files')
          .aggregate([
            { $match: matchStage },
            { $skip: page * itemsPerPage },
            { $limit: itemsPerPage },
          ])
          .toArray();

        // Remove the localPath field and rename _id to id for each file object
		const sanitizedFiles = dbFiles.map(({ _id, localPath, ...rest }) => ({
			id: _id,
			...rest,
		  }));

        return response.status(200).json(sanitizedFiles);
      } catch (error) {
        console.error(error.message);
        return HTTPError.internalServerError(response);
      }
    } catch (error) {
      return HTTPError.unauthorized(response);
    }
  }

  /**
   * Publishes a file, making it public.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Promise<Object>} - HTTP response.
   */
  static async putPublish(req, res) {
    return this._publishOrUnpublish(req, res, true);
  }

  /**
   * Unpublishes a file, making it private.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Promise<Object>} - HTTP response.
   */
  static async putUnpublish(req, res) {
    return this._publishOrUnpublish(req, res, false);
  }

/**
   * Publishes or unpublishes a file based on the isPublic flag.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {boolean} isPublic - Flag indicating whether to publish or unpublish the file.
   * @returns {Promise<Object>} - HTTP response.
   */
static async _publishOrUnpublish(req, res, isPublic) {
    try {
      const dbUser = await UsersController.getUserData(req);
      const dbFile = await dbClient.db
        .collection('files')
        .findOne({ userId: dbUser._id, _id: ObjectId(req.params.id) });

      if (!dbFile) {
        return HTTPError.notFound(res);
      }

      try {
        await dbClient.db
          .collection('files')
          .updateOne({ _id: dbFile._id }, { $set: { isPublic } });

        const updatedFile = await dbClient.db.collection('files').findOne({ _id: dbFile._id });

        return res.status(200).json({
          id: updatedFile._id,
          userId: updatedFile.userId,
          name: updatedFile.name,
          type: updatedFile.type,
          isPublic: updatedFile.isPublic,
          parentId: updatedFile.parentId,
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    } catch (error) {
      return HTTPError.unauthorized(res);
    }
  }

  static async getFile(req, res) {
    try {
      const dbUser = await UsersController.getUserData(req);
      const dbFile = await dbClient.db.collection('files').findOne({
        userId: dbUser._id,
        _id: ObjectId(req.params.id),
      });

      if (!dbFile) {
        return HTTPError.notFound(res);
      }

      if (dbFile.type === 'folder') {
        return HTTPError.badRequest(res, "A folder doesn't have content");
      }

      let localFilePath = dbFile.localPath;

      const { size } = req.query;
      if (size && ['100', '250', '500'].includes(size)) {
        localFilePath = `${localFilePath}_${size}`;
      }

      const mimeType = mime.lookup(dbFile.name) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);

      fs.readFile(localFilePath, (err, data) => {
        if (err) {
          return HTTPError.notFound(res);
        }
        return res.status(200).send(data);
      });


    } catch (error) {
      return HTTPError.unauthorized(res);
    }
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

    //console.log(`Validating parentId: ${parentId}`);

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

      if (fileDocument.type === 'image') {
        await fileQueue.add({
          userId: fileDocument.userId.toString(),
          fileId: newFile.insertedId.toString(),
        });
      }

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
