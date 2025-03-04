import { Plugin, ResolvedConfig } from "vite";
import fs from "fs-extra";
import fsPromises from "fs/promises";
import HlsPluginOptions from "./types/HLSPluginOptions.js";
import processCode from "./methods/processCode.js";
import path from "path";
import log from "./log.js";
import ora from "ora";
import logText from "./logText.js";

export default function ViteHLSPlugin(
    opts: HlsPluginOptions = {}
): Plugin {
    const {
        hlsOutput = "hls",
        segmentDuration = 10,
        publicFolder = "/public"
    } = opts;

    let config: ResolvedConfig;
    let absolutePublicFolder: string = path.resolve(process.cwd(), publicFolder.replace(/^\//, ""));

    let isDev = false;
    let hlsParentPath = ""
    async function compile(code: string, codePath: string) {
        if (!codePath.includes(".html")) return;
        await fs.ensureDir(hlsParentPath);
        return await processCode(code, codePath, absolutePublicFolder, hlsParentPath, hlsOutput, segmentDuration, isDev)
    }

    return {
        name: "vite-hls",
        config(config) {
            hlsParentPath = (config.publicDir ?? "public") + "/"
        },
        configResolved(resolvedConfig) {
            config = resolvedConfig;
            isDev = config.command == "serve"
        },
        async transform(code, codePath) {
            const html = await compile(code, codePath)
            if (!html) return;
            return {
                code: html
            }
        },
        async transformIndexHtml(code, meta) {
            const html = await compile(code, meta.path)
            if (!html) return;
            return {
                html,
                tags: []
            }
        },

        generateBundle: {
            order: "post",
            async handler(_) {
                if (isDev) return;
                const distDir = config.build?.outDir || 'dist'; // Default Vite output directory
                // Ensure output folder exists
                if (!fs.existsSync(distDir)) {
                    log('⚠️ Build directory does not exist. Skipping post-processing.', "warn");
                    return;
                }
                let spinner = ora(logText("🔄 Processing bundle...")).start();
                const processFiles = async (dir: string) => {
                    const children = await fsPromises.readdir(dir);
                    await Promise.all(children.map(async (file) => {
                        try {
                            const filePath = path.join(dir, file);
                            if ((await fsPromises.stat(filePath)).isDirectory()) {
                                await processFiles(filePath);
                            }
                            else {
                                let code = await fsPromises.readFile(filePath, 'utf-8');
                                if (code.includes("?hls")) {
                                    spinner.text = logText(`🔧 Processing HTML file: ${filePath}`);
                                    const response = await compile(code, filePath);
                                    if (response) {
                                        this.emitFile({
                                            type: "asset",
                                            fileName: path.relative(distDir, filePath),
                                            source:  response
                                        })
                                    }
                                }
                            }
                        } catch {
                            // File structure changed 
                        }
                    }));
                };
                await processFiles(distDir)
                spinner.succeed(logText("Bundle fully processed!"));
            }
        },
        async closeBundle() {
            if (isDev) return;
            let spinner = ora(logText("🔄 Post processing...")).start();
            const distDir = config.build?.outDir || 'dist'; // Default Vite output directory
            // Ensure output folder exists
            if (!fs.existsSync(distDir)) {
                spinner.fail(logText("Build directory does not exist. Skipping post-processing."))
                return;
            }
           
            // Remove the hlsOutput within cacheDir if it exists in the dist output

    
            // Check if "cachePath" is empty 
            if (await isDirectoryCompletelyEmpty(hlsParentPath)) {
                spinner.succeed(logText("Post processing finished"))
                return;
            }

            // Copy the files from cache (duplicate from cachePath to distDir hlsOutput)
            try {
                // Ensure the destination directory exists
                await fs.ensureDir(path.join(distDir, hlsOutput));
                // Copy the directory contents
                await fs.copy(hlsParentPath, distDir);
            } catch (error) {
                spinner.fail(logText("Failed to copy files"));
            }
            spinner.succeed(logText("Post processing finished"))
        },
    };
}

async function isDirectoryCompletelyEmpty(dirPath: string): Promise<boolean> {
    try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        // Check each entry in the directory
        for (const entry of entries) {
            if (entry.isFile()) {
                // If any file is found, return false
                return false;
            } else if (entry.isDirectory()) {
                // Recursively check the subdirectory
                const isEmpty = await isDirectoryCompletelyEmpty(path.join(dirPath, entry.name));
                if (!isEmpty) {
                    return false;
                }
            }
        }

        // If no files are found and all subdirectories are empty, return true
        return true;
    } catch (error) {
        // Handle errors (e.g., directory does not exist)
        console.error(logText("Error reading directory"))
        console.error(error);
        throw error;
    }
}

