import crypto from "crypto";
import fs from "fs";
export default async function generateVideoHash(filePath) {
    return new Promise((resolve, reject) => {
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
                hash.update((typeof chunk === "string" ? Buffer.from(chunk) : chunk));
            });
            readStream.on('end', () => {
                resolve(hash.digest('hex')); // Return the hash in hexadecimal format
            });
            readStream.on('error', (error) => {
                reject(error);
            });
        });
    });
}
