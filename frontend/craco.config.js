const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: {
      resolve: {
        fallback: {
          http: false,
          https: false,
          url: false,
          util: false,
          stream: false,
          crypto: false
        }
      }
    }
  }
};