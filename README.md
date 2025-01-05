`Gerar Pasta ANDROID`
npx expo prebuild --no-install

`Gerar executavel`
cd android
./gradlew assembleRelease

`Instalar no CELULAR`
adb install app/build/outputs/apk/release/app-release.apk


``Rodar no EAS``
eas build --platform android --profile production
