import assert from "node:assert/strict";
import { test } from "node:test";
import signingPlugin from "../plugins/withAndroidReleaseSigning.js";

const { applyReleaseSigning } = signingPlugin;

test("prebuild repeatedly applies release signing without touching debug configuration", () => {
  const original =
    "android { buildTypes { debug { signingConfig signingConfigs.debug } } }\n";
  const once = applyReleaseSigning(original);
  assert.equal(applyReleaseSigning(once), once);
  assert.ok(once.startsWith(original));
  assert.equal(once.split("// @generated begin myd-release-signing").length, 2);
  assert.match(once, /release\s*\{\s*signingConfig signingConfigs\.mydRelease/);
  assert.match(
    once,
    /throw new GradleException\("Missing release signing environment variable/,
  );
  for (const name of [
    "MYD_ANDROID_KEYSTORE_FILE",
    "MYD_ANDROID_KEYSTORE_PASSWORD",
    "MYD_ANDROID_KEY_ALIAS",
    "MYD_ANDROID_KEY_PASSWORD",
  ]) {
    assert.ok(once.includes(`System.getenv("${name}")`));
  }
});

test("prebuild refuses a partial signing block instead of silently changing release identity", () => {
  assert.throws(
    () => applyReleaseSigning("// @generated begin myd-release-signing"),
    /Incomplete/,
  );
  assert.throws(
    () => applyReleaseSigning("// @generated end myd-release-signing"),
    /Incomplete/,
  );
  assert.throws(
    () =>
      applyReleaseSigning(
        "// @generated end myd-release-signing\n// @generated begin myd-release-signing",
      ),
    /Incomplete/,
  );
});
