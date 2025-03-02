import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pg", "postgres", "pg-connection-string", "pgpass"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client-side bundling of server-only modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        fs: false,
        net: false,
        tls: false,
        pg: false,
        postgres: false,
        "pg-connection-string": false,
        pgpass: false,
      };
    }
    return config;
  },
};

export default nextConfig;
