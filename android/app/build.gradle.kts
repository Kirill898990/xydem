plugins {
    id("com.android.application")
}

android {
    namespace = "ru.shkola.gidroogorod"
    compileSdk = 35

    defaultConfig {
        applicationId = "ru.shkola.gidroogorod"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Игра хранится в ../docs/game/index.html — тот же файл открывается на сайте (GitHub Pages).
// Перед сборкой копируем её в assets приложения.
val prepareGame by tasks.registering(Copy::class) {
    from(rootProject.file("../docs/game/index.html"))
    into(layout.projectDirectory.dir("src/main/assets"))
}
tasks.named("preBuild") { dependsOn(prepareGame) }
