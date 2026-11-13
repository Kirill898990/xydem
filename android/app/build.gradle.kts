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

// Игра хранится в ../game/index.html (тот же файл открывается в браузере).
// Перед сборкой оборачиваем её в полноценную HTML-страницу и кладём в assets.
val prepareGame by tasks.registering {
    val src = rootProject.file("../game/index.html")
    val out = file("src/main/assets/index.html")
    inputs.file(src)
    outputs.file(out)
    doLast {
        out.parentFile.mkdirs()
        out.writeText(
            "<!doctype html>\n<html lang=\"ru\">\n<head>\n<meta charset=\"utf-8\">\n" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n" +
                "</head>\n<body>\n" + src.readText() + "\n</body>\n</html>\n"
        )
    }
}
tasks.named("preBuild") { dependsOn(prepareGame) }
