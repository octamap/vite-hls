import fs from 'fs-extra';
import path from "path";


/**
 * Attempt to locate the original video file within `distDir` or `public` or wherever
 * you might have placed it. This is a naive approach:
 *  1) Check if `videoUrl` is already absolute (like /videos/foo.mp4),
 *     then see if that path is in dist.
 *  2) If not found, see if it's in `public` folder, or the original `src` folder.
 *  3) The video url might be relative to the currentPath, check if the video exists relative to currentPath
 */
export default async function locateVideoFile(
    currentPath: string,
    videoUrl: string,
    distDir: string,
    publicDir: string
): Promise<string | null> {
    // Remove leading slash if present
    const trimmedUrl = videoUrl.replace(/^\//, "");

    // Check in dist directory
    const candidateDistPath = path.join(distDir, trimmedUrl);
    if (fs.existsSync(candidateDistPath)) {
        return candidateDistPath;
    }

    // Check in public directory
    const candidatePublicPath = path.join(publicDir, trimmedUrl);
    if (fs.existsSync(candidatePublicPath)) {
        return candidatePublicPath;
    }

    // Check relative to currentPath
    const candidateRelativePath = path.join(currentPath, trimmedUrl);
    if (fs.existsSync(candidateRelativePath)) {
        return candidateRelativePath;
    }

    // If not found in any location, return null
    return null;
}
