import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  /* The prototype has no Overview page (the platform's own one stays as is), so / opens the Academy. */
  async redirects() {
    return [{ source: "/", destination: "/academy", permanent: false }];
  },
};

export default nextConfig;
