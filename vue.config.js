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
        productName: "CarMeet Club Escritorio",
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
          target: ["nsis"],
          icon: "build/car.ico"
        },
        nsis: {
          artifactName: "${productName}-${version}-Setup.${ext}",
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          installerIcon: "build/car.ico",
          uninstallerIcon: "build/car.ico"
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
