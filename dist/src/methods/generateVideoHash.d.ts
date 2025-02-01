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
export default function generateVideoHash(filePath: string): Promise<string>;
