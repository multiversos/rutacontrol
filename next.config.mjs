/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "mfnxkzlmsvlvmetybiuc.supabase.co",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
