import java.util.Properties

val localProperties = Properties().apply {
    val localPropertiesFile = file("local.properties")
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use(::load)
    }
}

val githubTokenProvider = providers
    .environmentVariable("GITHUB_TOKEN")
    .orElse(localProperties.getProperty("github_token") ?: "")

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        if (githubTokenProvider.get().isNotBlank()) {
            maven {
                name = "MetaWearablesDAT"
                url = uri("https://maven.pkg.github.com/facebook/meta-wearables-dat-android")
                credentials {
                    username = ""
                    password = githubTokenProvider.get()
                }
                content {
                    includeGroup("com.meta.wearable")
                }
            }
        }
    }
}

rootProject.name = "VoiceDirectionGlass"
include(":app")
