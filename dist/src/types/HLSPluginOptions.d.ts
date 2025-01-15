/**
 * Example config:
 *   {
 *     exts: ['.mp4', '.mov'],
 *     hlsOutput: 'hls',    // subfolder inside dist
 *     segmentDuration: 10
 *   }
 */
export default interface HlsPluginOptions {
    /** Subfolder inside dist where HLS files go, e.g. 'hls' */
    hlsOutput?: string;
    /** Duration of each HLS segment (seconds) */
    segmentDuration?: number;
    cacheDir?: string;
    publicFolder?: string;
}
