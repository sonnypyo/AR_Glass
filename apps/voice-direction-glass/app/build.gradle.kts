import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) {
        file.inputStream().use(::load)
    }
}

val metaWearablesApplicationIdProvider = providers
    .environmentVariable("META_WEARABLES_APPLICATION_ID")
    .orElse(localProperties.getProperty("meta_wearables_application_id") ?: "")

val releaseStoreFileProvider = providers
    .environmentVariable("VOICE_DIRECTION_RELEASE_STORE_FILE")
    .orElse(localProperties.getProperty("voice_direction_release_store_file") ?: "")
val releaseStorePasswordProvider = providers
    .environmentVariable("VOICE_DIRECTION_RELEASE_STORE_PASSWORD")
    .orElse(localProperties.getProperty("voice_direction_release_store_password") ?: "")
val releaseKeyAliasProvider = providers
    .environmentVariable("VOICE_DIRECTION_RELEASE_KEY_ALIAS")
    .orElse(localProperties.getProperty("voice_direction_release_key_alias") ?: "")
val releaseKeyPasswordProvider = providers
    .environmentVariable("VOICE_DIRECTION_RELEASE_KEY_PASSWORD")
    .orElse(localProperties.getProperty("voice_direction_release_key_password") ?: "")
val releaseSigningConfigured = listOf(
    releaseStoreFileProvider,
    releaseStorePasswordProvider,
    releaseKeyAliasProvider,
    releaseKeyPasswordProvider,
).all { it.get().isNotBlank() }

android {
    namespace = "com.voicedirection.glass"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.voicedirection.glass"
        minSdk = 29
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        manifestPlaceholders["metaWearablesApplicationId"] = metaWearablesApplicationIdProvider.get()
    }

    buildFeatures {
        compose = true
    }

    if (releaseSigningConfigured) {
        signingConfigs {
            create("voiceDirectionUpload") {
                storeFile = rootProject.file(releaseStoreFileProvider.get())
                storePassword = releaseStorePasswordProvider.get()
                keyAlias = releaseKeyAliasProvider.get()
                keyPassword = releaseKeyPasswordProvider.get()
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (releaseSigningConfigured) {
                signingConfig = signingConfigs.getByName("voiceDirectionUpload")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(libs.activity.compose)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.compose.runtime)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.xr.runtime)
    implementation(libs.xr.projected)
    implementation(libs.xr.glimmer)

    debugImplementation(libs.compose.ui.tooling)

    testImplementation(libs.junit)
}
