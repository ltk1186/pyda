import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
