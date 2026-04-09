const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: [],

  chainWebpack: config => {
    // Remove the problematic progress plugin
    config.plugins.delete('progress')
  },

  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
    }
  }
})