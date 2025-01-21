import path from "path";
import locateVideoFile from "./locateVideoFile.js";
import convertToHLS from './convertToHLS.js';
import log from "../log.js";

export default async function processCode(
    code: string,
    codePath: string,
    publicFolder: string,
    cachePath: string,
    hlsOutput: string,
    segmentDuration: number,
    dev: boolean
) {
    const hlsDir = path.join(cachePath, hlsOutput);
    if (!code.includes("?hls")) return null;

    // 1 - Find all string literals
    const findStrings = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
    const matches = [...code.matchAll(findStrings)];

    const hlsMatches = new Set<string>()

    for (const match of matches) {
        const videoUrl = match[2];

        if (!videoUrl.endsWith("?hls")) {
            if (videoUrl.includes("hls")) {
                const innerMatches = [...videoUrl.matchAll(findStrings)]
                for (const innerMatch of innerMatches) {
                    const videoUrl = innerMatch[2];
                    hlsMatches.add(videoUrl)
                }
            }
            continue;
        } else {
            hlsMatches.add(videoUrl)
        }
    }
    
    let hasChanges = false;
    
    await Promise.all(Array.from(hlsMatches).map(async videoUrl => {
        const urlWithoutQuery = videoUrl.slice(0, -4); // Remove '?hls'

        // 2 - Convert that path to an absolute path on disk
        const absoluteVideoPath = await locateVideoFile(codePath, urlWithoutQuery, cachePath, publicFolder);

        if (!absoluteVideoPath) {
            log(`Warning: Video file not found: ${urlWithoutQuery}`, "warn");
            return;
        }

        // 4 - Transcode to HLS
        const { hlsM3U8Relative, success } = await convertToHLS(
            absoluteVideoPath,
            cachePath,
            hlsDir,
            segmentDuration
        );
        if (!success) return;

        // 5 - Prepare replacement string
        const newUrl = dev ? `.cache/${hlsM3U8Relative}` : hlsM3U8Relative;

        hasChanges = true
        code = code.replaceAll(videoUrl, newUrl)
    }))

    return hasChanges ? code : null;
}