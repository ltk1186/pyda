import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
