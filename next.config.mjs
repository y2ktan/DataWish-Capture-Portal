/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark native modules as external for server-side only
      config.externals.push("better-sqlite3", "sharp", "@imgly/background-removal-node");
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["sharp", "@imgly/background-removal-node"]
  }
};

export default nextConfig;
