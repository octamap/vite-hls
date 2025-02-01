import ffmpeg from 'fluent-ffmpeg';
import chalk from 'chalk';
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs/promises";
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
            await fs.mkdir(hlsDir, { recursive: true });
            const base = path.parse(absoluteVideoPath).name;
            const targetFolder = path.join(hlsDir, base);
            await fs.mkdir(targetFolder, { recursive: true });
            // 1 - Skip transpile if we already have an up to date transpile inside the cache folder
            let hash;
            const filesOfTarget = await fs.readdir(targetFolder, { withFileTypes: true });
            try {
                const outputFileName = filesOfTarget.find(x => x.name.endsWith(".m3u8"));
                if (outputFileName) {
                    const m3u8Path = path.join(targetFolder, outputFileName.name);
                    const time = lastCheckedHash.get(m3u8Path);
                    if (time != undefined && (Date.now() - time) < (1000 * 4)) {
                        return {
                            hlsM3U8Relative: path.relative(cachePath, m3u8Path),
                            success: true
                        };
                    }
                    hash = await generateVideoHash(absoluteVideoPath);
                    const currentHash = outputFileName.name.slice(0, outputFileName.name.indexOf("."));
                    lastCheckedHash.set(m3u8Path, Date.now());
                    if (currentHash == hash) {
                        return {
                            hlsM3U8Relative: path.relative(cachePath, m3u8Path),
                            success: true,
                        };
                    }
                }
            }
            catch {
            }
            hash ??= await generateVideoHash(absoluteVideoPath);
            const m3u8Path = path.join(targetFolder, hash + ".m3u8");
            const hlsM3U8Relative = path.relative(cachePath, m3u8Path);
            let spinner = ora(logText(`Converting to HLS... (${chalk.blue(hlsM3U8Relative)})`)).start();
            try {
                // Use ffmpeg-static binary
                ffmpeg.setFfmpegPath(ffmpegPath || ""); // Set ffmpeg-static binary path
                // Clear the target folder
                const filesToRemove = filesOfTarget.map(x => path.join(targetFolder, x.name));
                await Promise.all(filesToRemove.map(x => fs.rm(x)));
                // Run FFmpeg
                await new Promise((resolve, reject) => {
                    ffmpeg(absoluteVideoPath)
                        .outputOptions([
                        "-preset veryfast",
                        "-g 48",
                        "-sc_threshold 0",
                        `-hls_time ${segmentDuration}`,
                        "-hls_playlist_type vod",
                        `-hls_segment_filename ${path.join(targetFolder, `${hash}_%03d.ts`)}`,
                    ])
                        .output(m3u8Path)
                        .on("end", resolve)
                        .on("error", reject)
                        .run();
                });
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
