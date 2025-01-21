import chalk from "chalk"


export default function logText(text: string) {
    return `${chalk.green("[vite-hls]")} ${text}`
}