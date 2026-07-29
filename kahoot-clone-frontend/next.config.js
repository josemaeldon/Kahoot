/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
