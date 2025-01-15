# Vite HLS Plugin

**Effortlessly enable HLS (HTTP Live Streaming) for videos in your Vite project.**

Transform your video workflow with the power of HLS. With this plugin, you can seamlessly prepare your SPA website to use adaptive streaming for videos, making them perform better across devices and network conditions. No need for third-party services like Cloudflare Stream—just simple, effective HLS integration.

## 🚀 Key Features

- **Automatic HLS Conversion**
  - During build and development, the plugin automatically creates `.m3u8` files and segmented video files for your videos.
- **Code Transformation**
  - Automatically updates your `<video>` elements to point to the `.m3u8` files.
- **Simplified Deployment**
  - Publish your SPA with HLS-enabled videos, ready to be streamed by modern browsers.
- **No Extra Costs**
  - Avoid relying on external video streaming services—everything stays local.

## 🎯 Why HLS?

HLS (HTTP Live Streaming) is a streaming protocol that breaks videos into small segments, enabling adaptive bitrate streaming. This ensures your videos:

- Load faster
- Play smoothly on poor network connections
- Deliver an optimized experience for each user’s device

## ✨ Example Usage

### Input
```html
<video src="/videos/my-video.mov?hls"></video>
```

### Output
```html
<video src="hls/my-video/output.m3u8"></video>
```

### How It Works
- The plugin processes videos with the `?hls` suffix.
- It generates the `.m3u8` and segment files.
- Updates the `<video>` element source to point to the `.m3u8` file.

## 📦 Installation

Install the plugin via npm:

```bash
npm install @octamap/vite-hls
```

Or with yarn:

```bash
yarn add @octamap/vite-hls
```

## 🔧 Configuration

Add the plugin to your `vite.config.ts` file:

```typescript
import { ViteHLSPlugin } from "@octamap/vite-hls";

export default defineConfig({
  plugins: [
    ViteHLSPlugin(),
  ],
});
```

## ⚙️ Options

Customize the plugin with `HlsPluginOptions`:

```typescript
export default interface HlsPluginOptions {
    /** Subfolder inside dist where HLS files go, e.g. 'hls' */
    hlsOutput?: string;
    /** Duration of each HLS segment (seconds) */
    segmentDuration?: number;
    /** Directory for caching intermediate files */
    cacheDir?: string;
    /** Public folder for input videos */
    publicFolder?: string;
}
```

### Example Configuration

```typescript
import { ViteHLSPlugin } from "@octamap/vite-hls";

export default defineConfig({
  plugins: [
    ViteHLSPlugin({
      hlsOutput: 'hls',
      segmentDuration: 10,
      cacheDir: '.hls-cache',
      publicFolder: 'public',
    }),
  ],
});
```

## 🖥️ Development and Build Process

- **Development**: Use the `?hls` suffix to preview HLS-enabled videos during local development.
- **Build**: The plugin ensures all HLS files are properly generated and placed in the specified `hlsOutput` directory.

## 🎥 Full Example

```html
<video controls>
  <source src="/videos/my-video.mov?hls" type="application/vnd.apple.mpegurl">
</video>
```

### Output Structure (after build)
```
/public
  /videos
    my-video.mov
/dist
  /hls
    my-video
      output.m3u8
      segment-0.ts
      segment-1.ts
```

## 🛠️ Compatibility
- Modern browsers with HLS support.
- Works out-of-the-box with any Vite-based project.

## 📚 Learn More
- [What is HLS?](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)

## 🤝 Contributions
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-repo/vite-hls-plugin/issues).

## 📜 License
This project is licensed under the [MIT License](LICENSE).

---

**Transform your video streaming experience today with Vite HLS Plugin!**
