import ConvertResult from "../types/ConvertResult.js";
export default function convertToHLS(absoluteVideoPath: string, cachePath: string, hlsDir: string, segmentDuration: number): Promise<ConvertResult>;
