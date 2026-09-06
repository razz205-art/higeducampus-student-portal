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
  // at runtime via fs.readFileSync, but Vercel's serverless file tracing
  // can't detect that dynamic read, so those files get left out of the
  // deployed function bundle and every PDF-generating route 500s with
  // ENOENT ".../data/Helvetica.afm". Explicitly including pdfkit's data
  // directory for each route that renders a PDF fixes this for all of them.
  experimental: {
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


