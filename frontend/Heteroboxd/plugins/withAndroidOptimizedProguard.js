const { withAppBuildGradle } = require("@expo/config-plugins")

module.exports = function withAndroidOptimizedProguard(config) {
  return withAppBuildGradle(config, (config) => {
    const oldConfiguration =
      'getDefaultProguardFile("proguard-android.txt")'
    const optimizedConfiguration =
      'getDefaultProguardFile("proguard-android-optimize.txt")'

    if (!config.modResults.contents.includes(oldConfiguration)) {
      throw new Error("Could not find the Android ProGuard configuration")
    }

    config.modResults.contents = config.modResults.contents.replace(
      oldConfiguration,
      optimizedConfiguration
    )

    return config
  })
}