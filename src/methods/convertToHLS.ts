import ffmpeg from 'fluent-ffmpeg';
import chalk from 'chalk';
import ffmpegPath from "ffmpeg-static";
import path from "path";
import ConvertResult from "../types/ConvertResult.js";
import fs from "fs-extra"
import ora from 'ora';

const ongoing = new Map<string, Promise<ConvertResult>>()

export default async function convertToHLS(
    absoluteVideoPath: string,
    distDir: string,
    hlsDir: string,
    segmentDuration: number
): Promise<ConvertResult> {
    try {
        const base = path.parse(absoluteVideoPath).name;
        const targetFolder = path.join(hlsDir, base);
        await fs.ensureDir(targetFolder);

        const m3u8Path = path.join(targetFolder, "output.m3u8");

        // Skip if we already transcoded it (optional)
        const hlsM3U8Relative = path.relative(distDir, m3u8Path)
        if (fs.existsSync(m3u8Path)) {
            return {
                hlsM3U8Relative,
                success: true,
            };
        }

        const existingTask = ongoing.get(absoluteVideoPath)
        if (existingTask) {
            return await existingTask
        }
        let spinner = ora(`Converting to HLS... (${chalk.blue(hlsM3U8Relative)})`).start()
        const task: Promise<ConvertResult> = (async () => {
            try {
                // Use ffmpeg-static binary
                ffmpeg.setFfmpegPath(ffmpegPath || ""); // Set ffmpeg-static binary path

                // Run FFmpeg
                await new Promise<any>((resolve, reject) => {
                    ffmpeg(absoluteVideoPath)
                        .outputOptions([
                            "-preset veryfast",
                            "-g 48",
                            "-sc_threshold 0",
                            `-hls_time ${segmentDuration}`,
                            "-hls_playlist_type vod",
                            `-hls_segment_filename ${path.join(
                                targetFolder,
                                "segment_%03d.ts"
                            )}`,
                        ])
                        .output(m3u8Path)
                        .on("end", resolve)
                        .on("error", reject)
                        .run();
                });

                const hlsM3U8Relative = path.relative(distDir, m3u8Path);
                return { hlsM3U8Relative, success: true };
            } catch (error) {
                console.error("Error transcoding to HLS:", error);
                return { hlsM3U8Relative: "", success: false };
            }
        })()
        ongoing.set(absoluteVideoPath, task)
        await task
        spinner.succeed(`Converted to HLS (${chalk.green(hlsM3U8Relative)})`)
        return task;
    } catch (err) {
        console.error("Error transcoding to HLS:", err);
        return { hlsM3U8Relative: "", success: false };
    }
}