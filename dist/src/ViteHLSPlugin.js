import fs from "fs-extra";
import processCode from "./methods/processCode.js";
import path from "path";
import log from "./log.js";
import ora from "ora";
export default function ViteHLSPlugin(opts = {}) {
    const { hlsOutput = "hls", segmentDuration = 10, cacheDir = ".cache", publicFolder = "/public" } = opts;
    let config;
    let absolutePublicFolder = path.resolve(process.cwd(), publicFolder.replace(/^\//, ""));
    async function compile(code, codePath) {
        const isDev = config.command === "serve";
        const targetDir = isDev
            ? `public/${cacheDir}`
            : config.build.outDir;
        await fs.ensureDir(targetDir);
        return await processCode(code, codePath, absolutePublicFolder, targetDir, hlsOutput, segmentDuration, isDev);
    }
    return {
        name: "vite-hls",
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        async transform(code, codePath) {
            if (config.command === "build")
                return;
            const html = await compile(code, codePath);
            if (!html)
                return;
            return {
                code: html
            };
        },
        async transformIndexHtml(code, meta) {
            if (config.command === "build")
                return;
            const html = await compile(code, meta.path);
            if (!html)
                return;
            return {
                html,
                tags: []
            };
        },
        async closeBundle() {
            log('🔄 Post-processing build output...');
            const distDir = config.build?.outDir || 'dist'; // Default Vite output directory
            // Ensure output folder exists
            if (!fs.existsSync(distDir)) {
                log('⚠️ Build directory does not exist. Skipping post-processing.', "warn");
                return;
            }
            let spinner = ora("[vite-hls] Processing files...").start();
            const processFiles = async (dir) => {
                const children = fs.readdirSync(dir);
                await Promise.all(children.map(async (file) => {
                    const filePath = path.join(dir, file);
                    if (fs.statSync(filePath).isDirectory()) {
                        await processFiles(filePath);
                    }
                    else {
                        let code = fs.readFileSync(filePath, 'utf-8');
                        if (code.includes("?hls")) {
                            spinner.text = `🔧 Processing HTML file: ${filePath}`;
                            const response = await compile(code, filePath);
                            if (response) {
                                fs.writeFileSync(filePath, response);
                            }
                        }
                    }
                }));
            };
            // Start processing
            await processFiles(distDir);
            spinner.succeed("[vite-hls] Build output post-processing completed!");
            // Remove the hlsOutput within cacheDir if it exists in the dist output
            const cacheHlsPath = path.resolve(distDir, cacheDir, hlsOutput);
            if (!fs.existsSync(cacheHlsPath))
                return;
            fs.removeSync(cacheHlsPath);
            const cacheDirPath = path.resolve(distDir, cacheDir);
            if (fs.existsSync(cacheDirPath)) {
                const cacheContents = fs.readdirSync(cacheDirPath);
                if (cacheContents.length === 0) {
                    fs.removeSync(cacheDirPath);
                    log(`Removed empty cache directory: ${cacheDirPath}`);
                }
            }
        },
    };
}
