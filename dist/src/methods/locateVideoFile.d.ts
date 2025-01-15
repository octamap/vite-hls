/**
 * Attempt to locate the original video file within `distDir` or `public` or wherever
 * you might have placed it. This is a naive approach:
 *  1) Check if `videoUrl` is already absolute (like /videos/foo.mp4),
 *     then see if that path is in dist.
 *  2) If not found, see if it's in `public` folder, or the original `src` folder.
 *  3) The video url might be relative to the currentPath, check if the video exists relative to currentPath
 */
export default function locateVideoFile(currentPath: string, videoUrl: string, distDir: string, publicDir: string): Promise<string | null>;
