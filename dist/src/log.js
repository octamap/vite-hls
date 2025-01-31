import chalk from "chalk";
export default function log(text, type) {
    const methods = { "warn": console.warn, "error": console.error };
    const method = type ? methods[type] : console.log;
    const suffix = (() => {
        switch (type) {
            case "error":
                return " ❌ -";
            case "warn":
                return " ❓ -";
        }
        return "";
    })();
    method(`${chalk.blueBright(`[vite-hls]`)}${suffix} ${text}`);
}
