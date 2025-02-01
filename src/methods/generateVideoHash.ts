import crypto from "crypto";
import fs from "fs/promises";

/**
 * Generates an MD5 hash for a file by reading:
 * - The file size,
 * - The first 0.5 KB,
 * - 0.5 KB from the middle,
 * - The last 0.5 KB.
 *
 * This ensures the hash changes when the file size or sampled content changes.
 *
 * @param filePath Path to the file.
 * @returns A promise that resolves with the MD5 hash.
 */
export default async function generateVideoHash(filePath: string): Promise<string> {
  // Open the file for reading.
  const fileHandle = await fs.open(filePath, "r");
  try {
    const { size } = await fileHandle.stat();
    const segmentLength = 512; // 0.5 KB per segment
    const buffers: Buffer[] = [];

    // Function to read a segment at a given offset.
    const readSegment = async (offset: number) => {
      const buf = Buffer.alloc(segmentLength);
      const { bytesRead } = await fileHandle.read(buf, 0, segmentLength, offset);
      buffers.push(bytesRead < segmentLength ? buf.slice(0, bytesRead) : buf);
    };

    // Read the first segment.
    await readSegment(0);

    // Read the middle segment (centered).
    const middleOffset = Math.max(0, Math.floor(size / 2) - Math.floor(segmentLength / 2));
    await readSegment(middleOffset);

    // Read the last segment.
    const lastOffset = size > segmentLength ? size - segmentLength : 0;
    await readSegment(lastOffset);

    // Create an MD5 hash.
    const hash = crypto.createHash("md5");

    // Update the hash with the file size.
    hash.update(String(size));

    // Update the hash with each buffer segment.
    for (const buf of buffers) {
      hash.update(buf);
    }

    return hash.digest("hex");
  } finally {
    await fileHandle.close();
  }
}