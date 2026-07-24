import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "zkxegnfkponvjpxhrwqg.supabase.co" },
    ],
  },
};

export default nextConfig;
