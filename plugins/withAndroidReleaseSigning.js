const { withAppBuildGradle } = require("expo/config-plugins");

const BEGIN = "// @generated begin myd-release-signing";
const END = "// @generated end myd-release-signing";

const SIGNING = `
${BEGIN}
// Credentials are supplied only to the build process, never embedded in source.
android {
    signingConfigs {
        mydRelease {
            def signingFile = System.getenv("MYD_ANDROID_KEYSTORE_FILE")
            if (signingFile) {
                storeFile file(signingFile)
                storePassword System.getenv("MYD_ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("MYD_ANDROID_KEY_ALIAS")
                keyPassword System.getenv("MYD_ANDROID_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.mydRelease
        }
    }
}

gradle.taskGraph.whenReady { graph ->
    if (graph.allTasks.any { it.project == project && it.name.toLowerCase().contains("release") }) {
        ["MYD_ANDROID_KEYSTORE_FILE", "MYD_ANDROID_KEYSTORE_PASSWORD", "MYD_ANDROID_KEY_ALIAS", "MYD_ANDROID_KEY_PASSWORD"].each { name ->
            if (!System.getenv(name)) {
                throw new GradleException("Missing release signing environment variable: " + name + ". Use scripts/build-android.ps1.")
            }
        }
    }
}
${END}
`;

function applyReleaseSigning(contents) {
  const start = contents.indexOf(BEGIN);
  const end = contents.indexOf(END);
  if (start < 0 !== end < 0 || (start >= 0 && end < start)) {
    throw new Error(
      "Incomplete MYD signing block; review the generated Gradle file",
    );
  }
  const clean =
    start < 0
      ? contents
      : contents.slice(0, start) + contents.slice(end + END.length);
  return clean.trimEnd() + "\n" + SIGNING;
}

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") {
      throw new Error("MYD release signing requires a Groovy app/build.gradle");
    }
    mod.modResults.contents = applyReleaseSigning(mod.modResults.contents);
    return mod;
  });
};

module.exports.applyReleaseSigning = applyReleaseSigning;
