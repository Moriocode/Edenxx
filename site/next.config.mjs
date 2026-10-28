/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [
      {
        // Upstream image CDNs (HentaiFox's i3 host) answer 403 to a foreign
        // Referer and 200 to none, so the whole site must never send one.
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
