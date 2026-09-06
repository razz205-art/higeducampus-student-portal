/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // pdfkit reads its built-in standard font metric (.afm) files from disk
  // at runtime, using a path built relative to its own module location.
  // When webpack bundles a route into a single chunk file, that relative
  // path gets rewritten to point inside .next/server/chunks instead of
  // node_modules/pdfkit, where the actual font files live — outputFileTracingIncludes
  // alone doesn't fix this, since the files exist in the deployment but not
  // at the path pdfkit is actually looking in post-bundling. Marking pdfkit
  // external keeps it as a normal node_modules require() at runtime instead
  // of bundling it, which preserves the correct relative path.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
    outputFileTracingIncludes: {
      "/api/attendance/report": ["./node_modules/pdfkit/js/data/**/*"],
      "/api/attendance/report/course": ["./node_modules/pdfkit/js/data/**/*"],
      "/api/results/report": ["./node_modules/pdfkit/js/data/**/*"],
      "/api/analytics/report": ["./node_modules/pdfkit/js/data/**/*"],
      "/api/test-reports/[id]/pdf": ["./node_modules/pdfkit/js/data/**/*"],
      "/api/certificates/[id]/download": ["./node_modules/pdfkit/js/data/**/*"],
    },
  },
};

export default nextConfig;
