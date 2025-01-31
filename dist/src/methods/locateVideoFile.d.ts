/**
 * Attempt to locate the original video file within `distDir`, `publicDir`, or relative to `currentPath`.
 * This function checks different locations asynchronously.
 */
export default function locateVideoFile(currentPath: string, videoUrl: string, distDir: string, publicDir: string): Promise<string | null>;
