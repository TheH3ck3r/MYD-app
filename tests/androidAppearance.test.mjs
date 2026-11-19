import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("Expo prebuild retains the launcher wrapper, splash branding and dark system bars", () => {
  const config = JSON.parse(
    execFileSync(
      process.execPath,
      ["node_modules/expo/bin/cli", "config", "--type", "introspect", "--json"],
      { encoding: "utf8" },
    ),
  );
  const { manifest, styles, colors } = config._internal.modResults.android;
  const application = manifest.manifest.application[0];
  assert.equal(application.$["android:icon"], "@drawable/myd_launcher_icon");
  assert.equal(
    application.$["android:roundIcon"],
    "@drawable/myd_launcher_icon",
  );
  const activity = application.activity.find(
    (item) => item.$["android:name"] === ".MainActivity",
  );
  assert.equal(activity.$["android:theme"], "@style/Theme.MYD.SplashScreen");
  const theme = (name) =>
    styles.resources.style.find((item) => item.$.name === name);
  const value = (style, name) =>
    theme(style).item.find((item) => item.$.name === name)?._;
  assert.equal(
    theme("Theme.MYD.SplashScreen").$.parent,
    "Theme.App.SplashScreen",
  );
  assert.equal(
    value("Theme.MYD.SplashScreen", "android:windowSplashScreenBrandingImage"),
    "@drawable/myd_splash_branding",
  );
  assert.equal(value("AppTheme", "android:windowLightNavigationBar"), "false");
  assert.equal(
    value("AppTheme", "android:enforceNavigationBarContrast"),
    "false",
  );
  assert.equal(
    colors.resources.color.find(
      (item) => item.$.name === "splashscreen_background",
    )._,
    "#121417",
  );
  assert.equal(
    colors.resources.color.find((item) => item.$.name === "iconBackground")._,
    "#121417",
  );
});

test("splash wordmark contains vector outlines rather than a serialized geometry object", () => {
  const xml = readFileSync(
    new URL("../assets/branding/launch-wordmark.xml", import.meta.url),
    "utf8",
  );
  const path = xml.match(/android:pathData="([^"]+)"/)?.[1];
  assert.ok(path && path.length > 100);
  assert.match(path, /^M/);
  assert.doesNotMatch(path, /[^MmZzLlHhVvCcSsQqTtAaEe0-9.,+\-\s]/);
});
