/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Zapobiega podwójnemu montowaniu WebSocketów w trybie dev
  images: {
    domains: ['api.dicebear.com'],
  },
};

module.exports = nextConfig;
