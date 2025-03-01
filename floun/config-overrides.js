const webpack = require('webpack');

module.exports = function override(config) {
    // Disable unused Node.js core modules
    config.resolve.fallback = {
        ...config.resolve.fallback,
        os: false,
        path: false,
        fs: false,
    };

    return config;
};