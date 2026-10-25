import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.18.50',
    'localhost',
    '127.0.0.1',
    'learn.cel.my.id',
    '*.cel.my.id',
    'usual-boxing-pre-liked.trycloudflare.com',
    '*.trycloudflare.com'
  ],
};

export default nextConfig;
