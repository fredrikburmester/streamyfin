# 📺 Streamyfin

Welcome to Streamyfin, a simple and user-friendly Jellyfin client built with Expo. If you're looking for an alternative to other Jellyfin clients, we hope you'll find Streamyfin to be a useful addition to your media streaming toolbox.

<div style="display: flex; flex-direction: row; gap: 5px">
  <img width=100 src="./assets/images/screenshots/1.jpg" />
  <img width=100 src="./assets/images/screenshots/3.jpg" />
  <img width=100 src="./assets/images/screenshots/4.jpg" />
  <img width=100 src="./assets/images/screenshots/5.jpg" />
  <img width=100 src="./assets/images/screenshots/7.jpg" />
</div>

## 🌟 Features

- 📱 **Native video player**: Playback with the platform native video player. With support for subtitles, playback speed control, and more.
- 📺 **Picture in Picture** (iPhone only): Watch movies in PiP mode on your iPhone.
- 🔊 **Background audio**: Stream music in the background, even when locking the phone.
- 📥 **Download media** (Experimental): Save your media locally and watch it offline.
- 📡 **Chromecast** (Experimental): Cast your media to any Chromecast-enabled device.

## 🧪 Experimental Features

Streamyfin includes some exciting experimental features like media downloading and Chromecast support. These are still in development, and we appreciate your patience and feedback as we work to improve them.

### Downloading

Downloading works by using ffmpeg to convert a HLS stream into a video file on the device. This means that you can download and view any file you can stream! The file is converted by Jellyfin on the server in real time as it is downloaded. This means a **bit longer download times** but supports any file that your server can transcode.

### Collection rows

Jellyfin collections can be shown as rows or carousel on the home screen.
The following tags can be added to an collection to provide this functionality. 

Avaiable tags:
- sf_promoted: Wil make the collection an row on home
- sf_carousel: Wil make the collection an carousel on home.

A plugin exists to create collections based on external sources like mdblist. This makes managing collections like trending, most watched etc an automatic process.
See [Collection Import Plugin](https://github.com/lostb1t/jellyfin-plugin-collection-import) for more info.

## Roadmap for V1

Check out our [Roadmap](https://github.com/users/fredrikburmester/projects/5) to see what we're working on next. We are always open for feedback and suggestions, so please let us know if you have any ideas or feature requests.

## Get it now

<div style="display: flex; gap: 5px;">
  <a href="https://apps.apple.com/se/app/streamyfin/id6593660679?l=en-GB"><img height=50 alt="Get Streamyfin on App Store" src="./assets/Download_on_the_App_Store_Badge.png"/></a>
  <a href="https://play.google.com/store/apps/details?id=com.fredrikburmester.streamyfin"><img height=50 alt="Get the beta on Google Play" src="./assets/Google_Play_Store_badge_EN.svg"/></a>
</div>

Or download the APKs [here on GitHub](https://github.com/fredrikburmester/streamyfin/releases) for Android.

### Beta testing

Get the latest updates by using the TestFlight version of the app.

<a href="https://testflight.apple.com/join/CWBaAAK2">
  <img height=75 alt="Get the beta on TestFlight" src="./assets/Get_the_beta_on_Testflight.svg"/>
</a>

## 🚀 Getting Started

### Prerequisites

- Ensure you have an active Jellyfin server.
- Make sure your device is connected to the same network as your Jellyfin server.

## 🙌 Contributing

We welcome any help to make Streamyfin better. If you'd like to contribute, please fork the repository and submit a pull request. For major changes, it's best to open an issue first to discuss your ideas.

### Development info

Add this to AppDelegate.mm:

```
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
// @generated begin react-native-google-cast-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-8901be60b982d2ae9c658b1e8c50634d61bb5091
#if __has_include(<GoogleCast/GoogleCast.h>)
...

[GCKCastContext sharedInstance].useDefaultExpandedMediaControls = true;`
#endif
```

Add this to Info.plist:

```
<key>NSBonjourServices</key>
<array>
  <string>_googlecast._tcp</string>
  <string>_CC1AD845._googlecast._tcp</string>
</array>
<key>NSLocalNetworkUsageDescription</key>
<string>${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.</string>
```

## 📄 License

Streamyfin is licensed under the Mozilla Public License 2.0 (MPL-2.0).
This means you are free to use, modify, and distribute this software. The MPL-2.0 is a copyleft license that allows for more flexibility in combining the software with proprietary code.
Key points of the MPL-2.0:

- You can use the software for any purpose
- You can modify the software and distribute modified versions
- You must include the original copyright and license notices
- You must disclose your source code for any modifications to the covered files
- Larger works may combine MPL code with code under other licenses
- MPL-licensed components must remain under the MPL, but the larger work can be under a different license
- For the full text of the license, please see the LICENSE file in this repository.

## 🌐 Connect with Us

Join our Discord: [https://discord.gg/zyGKHJZvv4](https://discord.gg/zyGKHJZvv4)

If you have questions or need support, feel free to reach out:

- GitHub Issues: Report bugs or request features here.
- Email: [fredrik.burmester@gmail.com](mailto:fredrik.burmester@gmail.com)

## Support

<a href="https://www.buymeacoffee.com/fredrikbur3" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## 📝 Credits

Streamyfin is developed by Fredrik Burmester and is not affiliated with Jellyfin. The app is built with Expo, React Native, and other open-source libraries.

## ✨ Acknowledgements

I'd like to thank the following people and projects for their contributions to Streamyfin:

- [Reiverr](https://github.com/aleksilassila/reiverr) for great help with understanding the Jellyfin API.
- [Jellyfin TS SDK](https://github.com/jellyfin/jellyfin-sdk-typescript) for the TypeScript SDK.
- The Jellyfin devs for always being helpful in the Discord.
