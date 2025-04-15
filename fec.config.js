/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

const srcDir = path.resolve(__dirname, './src');

module.exports = {
  appName: 'content',
  appUrl: '/insights/content',
  debug: true,
  useAgent: true,
  useProxy: true,
  devtool: 'hidden-source-map',
  interceptChromeConfig: false,
  plugins: [],
  hotReload: process.env.HOT === 'true',
  moduleFederation: {
    exposes: {
      './RootApp': path.resolve(__dirname, './src/AppEntry.tsx'),
    },
    exclude: ['react-router-dom'],
    shared: [
      {
        'react-router-dom': {
          singleton: true,
          import: false,
          version: '^6.3.0',
        },
      },
      {
        '@unleash/proxy-client-react': {
          singleton: true,
          version: '*',
        },
      },
    ],
  },
  resolve: {
    modules: [srcDir, path.resolve(__dirname, './node_modules')],
  },
  routes: {
    ...(process.env.BACKEND_PORT && {
      '/api/content-sources/': {
        host: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
      },
    }),
  },
};
