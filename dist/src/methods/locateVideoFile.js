import fs from 'fs/promises';
import path from "path";
/**
 * Attempt to locate the original video file within `distDir`, `publicDir`, or relative to `currentPath`.
 * This function checks different locations asynchronously.
 */
export default async function locateVideoFile(currentPath, videoUrl, distDir, publicDir) {
    // Remove leading slash if present
    const trimmedUrl = videoUrl.replace(/^\//, "");
    // Possible paths to check
    const candidatePaths = [
        path.join(distDir, trimmedUrl),
        path.join(publicDir, trimmedUrl),
        path.join(currentPath, trimmedUrl)
    ];
    // Check if file exists in any of these paths
    for (const candidatePath of candidatePaths) {
        try {
            await fs.access(candidatePath);
            return candidatePath; // Return first found path
        }
        catch {
            // If access fails, move to the next candidate path
        }
    }
    // If not found in any location, return null
    return null;
}
