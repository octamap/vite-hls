import fs from 'fs-extra';
import path from "path";
import locateVideoFile from "./locateVideoFile.js";
import convertToHLS from './convertToHLS.js';
export default async function transformCode(code, codePath, publicFolder, distPath, hlsOutput, segmentDuration) {
    const hlsDir = path.join(distPath, hlsOutput);
    console.log(publicFolder);
    if (!code.includes("?hls"))
        return null;
    // 1 - Scan for references to MP4/MOV/etc in the HTML
    const regexPattern = /["']([^"']*\?hls)["']|(\b\w+\b[^"'`\s]*\?hls)/g;
    const regex = new RegExp(regexPattern);
    let match;
    let processed = new Set();
    let hasChanges = false;
    while ((match = regex.exec(code)) !== null) {
        let videoUrl = match[0];
        videoUrl = videoUrl.slice(1, -1);
        if (processed.has(videoUrl))
            continue;
        processed.add(videoUrl);
        const urlWithoutQuery = videoUrl.split("?").slice(0, -1).join("");
        // 2 - Convert that path to an absolute path on disk
        const absoluteVideoPath = await locateVideoFile(codePath, urlWithoutQuery, distPath, publicFolder);
        // 3 - Ensure the HLS folder exists
        await fs.ensureDir(hlsDir);
        if (!absoluteVideoPath) {
            console.warn(`Warning: Video file not found: ${urlWithoutQuery}`);
            continue;
        }
        // 4 - Transcode to HLS
        const { hlsM3U8Relative, success } = await convertToHLS(absoluteVideoPath, distPath, hlsDir, segmentDuration);
        if (!success)
            continue;
        // 5 - Rewrite in the HTML from e.g. src="videos/foo.mp4" -> src="hls/foo/output.m3u8"
        code = code.replace(videoUrl, hlsM3U8Relative);
        hasChanges = true;
    }
    return hasChanges ? code : null;
}
