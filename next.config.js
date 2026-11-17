/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https://akzqcreation.com",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // 301 Permanent Redirects from legacy *.html URLs to clean routes
      {
        source: '/index.html',
        destination: '/',
        statusCode: 301,
      },
      {
        source: '/about.html',
        destination: '/about',
        statusCode: 301,
      },
      {
        source: '/services.html',
        destination: '/services',
        statusCode: 301,
      },
      {
        source: '/branding-identity.html',
        destination: '/branding-identity',
        statusCode: 301,
      },
      {
        source: '/web-design-development.html',
        destination: '/web-design-development',
        statusCode: 301,
      },
      {
        source: '/digital-marketing-seo.html',
        destination: '/digital-marketing-seo',
        statusCode: 301,
      },
      {
        source: '/media-content-production.html',
        destination: '/media-content-production',
        statusCode: 301,
      },
      {
        source: '/local-seo.html',
        destination: '/local-seo',
        statusCode: 301,
      },
      {
        source: '/kannur.html',
        destination: '/kannur',
        statusCode: 301,
      },
      {
        source: '/thalassery.html',
        destination: '/thalassery',
        statusCode: 301,
      },
      {
        source: '/portfolio.html',
        destination: '/portfolio',
        statusCode: 301,
      },
      {
        source: '/blog.html',
        destination: '/blog',
        statusCode: 301,
      },
      {
        source: '/blog-cost-of-seo-kerala.html',
        destination: '/blog-cost-of-seo-kerala',
        statusCode: 301,
      },
      {
        source: '/faq.html',
        destination: '/faq',
        statusCode: 301,
      },
      {
        source: '/contact.html',
        destination: '/contact',
        statusCode: 301,
      },
    ];
  },
};

module.exports = nextConfig;
