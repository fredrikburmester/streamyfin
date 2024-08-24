const { withAppDelegate } = require("@expo/config-plugins");

const withExpandedController = (config) => {
  return withAppDelegate(config, async (config) => {
    const contents = config.modResults.contents;

    // Looking for the initialProps string inside didFinishLaunchingWithOptions,
    // and injecting expanded controller config.
    // Should be updated once there is an expo config option - see https://github.com/react-native-google-cast/react-native-google-cast/discussions/537
    const injectionIndex = contents.indexOf("self.initialProps = @{};");
    config.modResults.contents =
      contents.substring(0, injectionIndex) +
      `\n [GCKCastContext sharedInstance].useDefaultExpandedMediaControls = true; \n` +
      contents.substring(injectionIndex);

    return config;
  });
};

module.exports = withExpandedController;
