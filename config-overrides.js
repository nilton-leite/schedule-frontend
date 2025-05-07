module.exports = {
    webpack: function override(config, env) {
      config.resolve.fallback = {
        stream: require.resolve('stream-browserify'),
        "util": require.resolve("util/"),
        "buffer": require.resolve("buffer/"),
      };
      return config;
    },
  };