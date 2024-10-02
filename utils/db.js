#!/usr/bin/env node

// Implement a class DBClient that will be used to interact with the MongoDB database

import { MongoClient } from 'mongodb';

/**
 * Represents a MongoDB client for managing database connections and operations.
 *
 * The DBclient class provides methods to connect to a MongoDB database,
 * check the connection status, and perform operations such as counting
 * users and files. It uses the MongoClient from the mongodb library to
 * manage connections and interact with the database.
 */
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.connected = false;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.connect(database);
  }

  /**
   * Connect to the MongoDB database.
   * This method establishes a connection to the MongoDB server and initializes
   * the database reference. It logs a message indicating success or failure.
   *
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  async connect(database) {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB successfully');
      this.db = this.client.db(database);
      this.connected = true;
    } catch (error) {
      console.error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  /**
   * Check if the MongoDB client connection is active.
   *
   * @returns {boolean} true if connected, false otherwise.
   */
  isAlive() {
    return this.connected;
  }

  /**
   * Get the number of users in the users collection.
   *
   * @returns {Promise<number>} A promise that resolves to the number of users in the collection.
   * @throws {Error} If the database is not initialized (i.e., connect() has not been called).
   */
  async nbUsers() {
    if (!this.db) {
      throw new Error('Database not initialized. Connection might have failed.');
    }
    const userCount = await this.db.collection('users').countDocuments();
    return userCount;
  }

  /**
   * Get the number of files in the files collection.
   *
   * @returns {Promise<number>} A promise that resolves to the number of files in the collection.
   * @throws {Error} If the database is not initialized (i.e., connect() has not been called).
   */
  async nbFiles() {
    if (!this.db) {
      throw new Error('Database not initialized. Connection might have failed.');
    }
    const fileCount = await this.db.collection('files').countDocuments();
    return fileCount;
  }

  /**
   * Close the connection to the MongoDB database.
   * This method terminates the connection and logs a message confirming closure.
   *
   * @returns {Promise<void>} A promise that resolves when the connection is closed.
   */
  async close() {
    if (this.connected) {
      await this.client.close();
      console.log('Connection to MongoDB closed');
      this.connected = false;
    } else {
      console.log('Connection to MongoDB is not active.');
    }
  }
}

const dbClient = new DBClient();

export default dbClient;
