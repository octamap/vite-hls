import ffmpeg from 'fluent-ffmpeg';
import chalk from 'chalk';
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs-extra";
import ora from 'ora';
import generateVideoHash from './generateVideoHash.js';
import logText from '../logText.js';
const lastCheckedHash = new Map();
const ongoing = new Map();
export default async function convertToHLS(absoluteVideoPath, cachePath, hlsDir, segmentDuration) {
    try {
        const existingTask = ongoing.get(absoluteVideoPath);
        if (existingTask) {
            return await existingTask;
        }
        const task = (async () => {
            await fs.ensureDir(hlsDir);
            const base = path.parse(absoluteVideoPath).name;
            const targetFolder = path.join(hlsDir, base);
            await fs.ensureDir(targetFolder);
            const m3u8Path = path.join(targetFolder, "output.m3u8");
            // Skip if we already transcoded it (optional)
            const hlsM3U8Relative = path.relative(cachePath, m3u8Path);
            const hashPath = path.join(targetFolder, "tag");
            let hash;
            if (fs.existsSync(m3u8Path) && fs.existsSync(hashPath)) {
                const time = lastCheckedHash.get(hashPath);
                if (time != undefined && (Date.now() - time) < (1000 * 4)) {
                    return {
                        hlsM3U8Relative,
                        success: true
                    };
                }
                hash = await generateVideoHash(absoluteVideoPath);
                const hashFile = await fs.readFile(hashPath, "utf-8");
                lastCheckedHash.set(hashPath, Date.now());
                if (hashFile == hash) {
                    return {
                        hlsM3U8Relative,
                        success: true,
                    };
                }
            }
            let spinner = ora(logText(`Converting to HLS... (${chalk.blue(hlsM3U8Relative)})`)).start();
            try {
                // Use ffmpeg-static binary
                ffmpeg.setFfmpegPath(ffmpegPath || ""); // Set ffmpeg-static binary path
                // Run FFmpeg
                await new Promise((resolve, reject) => {
                    ffmpeg(absoluteVideoPath)
                        .outputOptions([
                        "-preset veryfast",
                        "-g 48",
                        "-sc_threshold 0",
                        `-hls_time ${segmentDuration}`,
                        "-hls_playlist_type vod",
                        `-hls_segment_filename ${path.join(targetFolder, "segment_%03d.ts")}`,
                    ])
                        .output(m3u8Path)
                        .on("end", resolve)
                        .on("error", reject)
                        .run();
                });
                hash ??= await generateVideoHash(absoluteVideoPath);
                await fs.writeFile(hashPath, hash, "utf-8");
                const hlsM3U8Relative = path.relative(cachePath, m3u8Path);
                spinner.succeed(logText(`Converted to HLS (${chalk.green(hlsM3U8Relative)})`));
                return { hlsM3U8Relative, success: true };
            }
            catch (error) {
                spinner.fail(logText(`"Error transcoding to HLS" (${chalk.green(hlsM3U8Relative)})`));
                console.error(error);
                return { hlsM3U8Relative: "", success: false };
            }
        })();
        ongoing.set(absoluteVideoPath, task);
        await task;
        setTimeout(() => {
            ongoing.delete(absoluteVideoPath);
        }, 1000 * 4);
        return task;
    }
    catch (err) {
        console.error("Error transcoding to HLS:", err);
        return { hlsM3U8Relative: "", success: false };
    }
}
