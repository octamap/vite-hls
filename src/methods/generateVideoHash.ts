import crypto, { BinaryLike } from "crypto"
import fs from "fs"
import log from "../log.js"
import chalk from "chalk"

const existingTasks = new Map<string, Promise<string>>()

export default async function generateVideoHash(filePath: string): Promise<string> {
  const existingTask = existingTasks.get(filePath)
  if (existingTask) {
    return existingTask
  }
  const newTask = new Promise<string>((resolve, reject) => {
    try {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          return reject(err);
        }

        // Use file size and last modification time to form the base of the hash
        const fileData = `${stats.size}-${stats.mtimeMs}`;

        // Read a portion of the file to include in the hash
        const readStream = fs.createReadStream(filePath, { end: 1024 }); // Read the first 1KB

        const hash = crypto.createHash('sha256');
        hash.update(fileData); // Add file data to the hash

        readStream.on('data', (chunk) => {
          hash.update((typeof chunk === "string" ? Buffer.from(chunk) : chunk) as BinaryLike);
        });

        readStream.on('end', () => {
          resolve(hash.digest('hex')); // Return the hash in hexadecimal format
        });

        readStream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      log("Failed at generating hash for " + chalk.blue(filePath), "error")
      console.error(error)
      reject(error)
    }
  });
  existingTasks.set(filePath, newTask)
  await newTask
  setTimeout(() => {
    existingTasks.delete(filePath)
  }, 1000 * 2);
  return newTask
}