import { Plugin, ResolvedConfig } from "vite";
import fs from "fs-extra";
import HlsPluginOptions from "./types/HLSPluginOptions.js";
import processCode from "./methods/processCode.js";
import path from "path";

export default function ViteHLSPlugin(
    opts: HlsPluginOptions = {}
): Plugin {
    const {
        hlsOutput = "hls",
        segmentDuration = 10,
        cacheDir = ".cache",
        publicFolder = "/public"
    } = opts;

    let config: ResolvedConfig;
    let absolutePublicFolder: string = path.resolve(process.cwd(), publicFolder.replace(/^\//, ""));

    return {
        name: "vite:hls-postbuild",
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        async transform(code, codePath) {
            const isDev = config.command === "serve";
            const targetDir = isDev
                ? `public/${cacheDir}`
                : config.build.outDir
            await fs.ensureDir(targetDir);
            const newCode = await processCode(code, codePath, absolutePublicFolder, targetDir, hlsOutput, segmentDuration, isDev)
            if (newCode) {
                return {
                    code: newCode
                }
            }
        },
        async transformIndexHtml(code, codePath) {
            const isDev = config.command === "serve";
            const targetDir = isDev
                ? `public/${cacheDir}`
                : config.build.outDir
        
            await fs.ensureDir(targetDir);
            const newCode = await processCode(code, codePath.path, absolutePublicFolder, targetDir, hlsOutput, segmentDuration, isDev)
            if (newCode) {
                return {
                    html: newCode,
                    tags: []
                }
            }
        }
    };
}
