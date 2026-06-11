const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: [],
  chainWebpack: config => {
    config.plugins.delete('progress')
  },
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      builderOptions: {
        appId: "com.carmeet.club",
        productName: "CarMeet Club",
        directories: {
          output: "dist_electron"
        },
        files: [
          "**/*"
        ],
        extraResources: [
          {
            "from": ".",
            "to": ".",
            "filter": [
              "serverCarmeet.js",
              "event-images/**/*",
              "profile-images/**/*"
            ]
          }
        ],
        win: {
          target: ["dir"],
          icon: "build/car.bmp" 
        },
        asar: true,
        asarUnpack: [
          "node_modules/bcrypt/**",
          "node_modules/mongoose/**",
          "node_modules/socket.io/**",
          "node_modules/socket.io-client/**"
        ]
      }
    }
  }
})
