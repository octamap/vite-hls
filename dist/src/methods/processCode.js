import fs from 'fs-extra';
import path from "path";
import locateVideoFile from "./locateVideoFile.js";
import convertToHLS from './convertToHLS.js';
export default async function processCode(code, codePath, publicFolder, distPath, hlsOutput, segmentDuration, dev) {
    const hlsDir = path.join(distPath, hlsOutput);
    if (!code.includes("?hls"))
        return null;
    // 1 - Find all string literals
    const findStrings = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
    const matches = [...code.matchAll(findStrings)];
    const hlsMatches = new Set();
    for (const match of matches) {
        const videoUrl = match[2];
        if (!videoUrl.endsWith("?hls")) {
            if (videoUrl.includes("hls")) {
                const innerMatches = [...videoUrl.matchAll(findStrings)];
                for (const innerMatch of innerMatches) {
                    const videoUrl = innerMatch[2];
                    hlsMatches.add(videoUrl);
                }
            }
            continue;
        }
        else {
            hlsMatches.add(videoUrl);
        }
    }
    let hasChanges = false;
    await Promise.all(Array.from(hlsMatches).map(async (videoUrl) => {
        const urlWithoutQuery = videoUrl.slice(0, -4); // Remove '?hls'
        // 2 - Convert that path to an absolute path on disk
        const absoluteVideoPath = await locateVideoFile(codePath, urlWithoutQuery, distPath, publicFolder);
        if (!absoluteVideoPath) {
            console.warn(`Warning: Video file not found: ${urlWithoutQuery}`);
            return;
        }
        // 3 - Ensure the HLS folder exists
        await fs.ensureDir(hlsDir);
        // 4 - Transcode to HLS
        const { hlsM3U8Relative, success } = await convertToHLS(absoluteVideoPath, distPath, hlsDir, segmentDuration);
        if (!success)
            return;
        // 5 - Prepare replacement string
        const newUrl = dev ? `.cache/${hlsM3U8Relative}` : hlsM3U8Relative;
        hasChanges = true;
        code = code.replace(videoUrl, newUrl);
    }));
    return hasChanges ? code : null;
}
