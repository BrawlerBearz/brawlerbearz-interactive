const webpack = require("webpack");

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};

  Object.assign(fallback, {
    crypto: false, // require.resolve("crypto-browserify")
    stream: false, // require.resolve("stream-browserify"),
    assert: false, // require.resolve("assert")
    http: false, // require.resolve("stream-http")
    https: false, // require.resolve("https-browserify")
    os: false, // require.resolve("os-browserify")
    url: false, // require.resolve("url")
    zlib: false, // require.resolve("browserify-zlib")
    querystring: false, // require.resolve("querystring-es3"),
    net: false,
    tls: false,
  });

  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);

  config.ignoreWarnings = [/Failed to parse source map/];

  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: "pre",
    loader: require.resolve("source-map-loader"),
    resolve: {
      fullySpecified: false,
    },
  });

  return config;
};
