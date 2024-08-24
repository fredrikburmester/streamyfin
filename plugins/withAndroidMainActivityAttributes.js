const { withAndroidManifest } = require("@expo/config-plugins");

function addAttributesToMainActivity(androidManifest, attributes) {
  const { manifest } = androidManifest;

  if (!Array.isArray(manifest["application"])) {
    console.warn("withAndroidMainActivityAttributes: No application array in manifest?");
    return androidManifest;
  }

  const application = manifest["application"].find(
    (item) => item.$["android:name"] === ".MainApplication"
  );
  if (!application) {
    console.warn("withAndroidMainActivityAttributes: No .MainApplication?");
    return androidManifest;
  }

  if (!Array.isArray(application["activity"])) {
    console.warn("withAndroidMainActivityAttributes: No activity array in .MainApplication?");
    return androidManifest;
  }

  const activity = application["activity"].find(
    (item) => item.$["android:name"] === ".MainActivity"
  );
  if (!activity) {
    console.warn("withAndroidMainActivityAttributes: No .MainActivity?");
    return androidManifest;
  }

  activity.$ = { ...activity.$, ...attributes };

  return androidManifest;
}

module.exports = function withAndroidMainActivityAttributes(config, attributes) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addAttributesToMainActivity(config.modResults, attributes);
    return config;
  });
};