const fs = require("node:fs/promises");
const path = require("node:path");
const {
  AndroidConfig,
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
} = require("expo/config-plugins");

// Artwork already includes safe padding; do not shrink the foreground again.
const launcherIcon = `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/iconBackground" />
  <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

module.exports = function withAndroidAppearance(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      mod.modResults,
    );
    application.$["android:icon"] = "@drawable/myd_launcher_icon";
    application.$["android:roundIcon"] = "@drawable/myd_launcher_icon";
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(
      mod.modResults,
    );
    activity.$["android:theme"] = "@style/Theme.MYD.SplashScreen";
    return mod;
  });

  config = withAndroidStyles(config, (mod) => {
    for (const [name, value, parent] of [
      ["android:windowLightNavigationBar", "false", "AppTheme"],
      ["android:enforceNavigationBarContrast", "false", "AppTheme"],
      ["android:windowBackground", "#121417", "AppTheme"],
      [
        "android:windowSplashScreenBrandingImage",
        "@drawable/myd_splash_branding",
        "Theme.MYD.SplashScreen",
      ],
    ]) {
      mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
        add: true,
        name,
        value,
        parent:
          parent === "Theme.MYD.SplashScreen"
            ? { name: parent, parent: "Theme.App.SplashScreen" }
            : { name: parent },
      });
    }
    return mod;
  });

  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const resources = path.join(
        mod.modRequest.platformProjectRoot,
        "app/src/main/res",
      );
      const drawable = path.join(resources, "drawable");
      const adaptive = path.join(resources, "drawable-v26");
      await fs.mkdir(drawable, { recursive: true });
      await fs.mkdir(adaptive, { recursive: true });
      await fs.writeFile(
        path.join(drawable, "myd_launcher_icon.xml"),
        '<inset xmlns:android="http://schemas.android.com/apk/res/android" android:drawable="@mipmap/ic_launcher" android:inset="0dp" />\n',
      );
      await fs.writeFile(
        path.join(adaptive, "myd_launcher_icon.xml"),
        launcherIcon,
      );
      await fs.copyFile(
        path.join(
          mod.modRequest.projectRoot,
          "assets/branding/launch-wordmark.xml",
        ),
        path.join(drawable, "myd_splash_branding.xml"),
      );
      return mod;
    },
  ]);
};
