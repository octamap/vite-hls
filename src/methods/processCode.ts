import fs from 'fs-extra';
import path from "path";
import locateVideoFile from "./locateVideoFile.js";
import convertToHLS from './convertToHLS.js';


export default async function processCode(
    code: string,
    codePath: string,
    publicFolder: string,
    distPath: string,
    hlsOutput: string,
    segmentDuration: number,
    dev: boolean
) {
    const hlsDir = path.join(distPath, hlsOutput);
    if (!code.includes("?hls")) return null;

    // 1 - Find all string literals
    const findStrings = /(['"])(.*?)\1/g;
    const matches = [...code.matchAll(findStrings)];

    const processed = new Set<string>();
    const replacements: { original: string; replacement: string }[] = [];

    for (const match of matches) {
        const fullMatch = match[0]; // Includes quotes
        const quote = match[1];
        const videoUrl = match[2];

        if (!videoUrl.endsWith("?hls")) continue;
        if (processed.has(videoUrl)) continue;

        processed.add(videoUrl);

        const urlWithoutQuery = videoUrl.slice(0, -4); // Remove '?hls'

        // 2 - Convert that path to an absolute path on disk
        const absoluteVideoPath = await locateVideoFile(codePath, urlWithoutQuery, distPath, publicFolder);

        if (!absoluteVideoPath) {
            console.warn(`Warning: Video file not found: ${urlWithoutQuery}`);
            continue;
        }

        // 3 - Ensure the HLS folder exists
        await fs.ensureDir(hlsDir);

        // 4 - Transcode to HLS
        const { hlsM3U8Relative, success } = await convertToHLS(
            absoluteVideoPath,
            distPath,
            hlsDir,
            segmentDuration
        );
        if (!success) continue;

        // 5 - Prepare replacement string
        const newUrl = dev ? `.cache/${hlsM3U8Relative}` : hlsM3U8Relative;
        const newFullMatch = `${quote}${newUrl}${quote}`;

        replacements.push({ original: fullMatch, replacement: newFullMatch });
    }

    // Apply all replacements
    if (replacements.length === 0) return null;

    let hasChanges = false;
    for (const { original, replacement } of replacements) {
        if (code.includes(original)) {
            code = code.split(original).join(replacement);
            hasChanges = true;
        }
    }

    return hasChanges ? code : null;
}