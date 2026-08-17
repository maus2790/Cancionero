import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
            allowedOrigins: ['localhost:3000', '192.168.1.7:3000', '192.168.0.*', '192.168.1.*'],
        },
    },
};

export default nextConfig;
