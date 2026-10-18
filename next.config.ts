const nextConfig = {
  // output: "export", // Forces static HTML export
  // images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    // Environment variable kill switch for image optimization
    unoptimized: process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPT === "true",

    // 1 year cache TTL for Twitch avatars to reduce image transformations
    minimumCacheTTL: 31536000, // 365 days in seconds
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static-cdn.jtvnw.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
      {
        protocol: "https",
        hostname: "*.twitch.tv",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
