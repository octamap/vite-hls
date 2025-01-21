import chalk from "chalk";
export default function logText(text) {
    return `${chalk.green("[vite-hls]")} ${text}`;
}
