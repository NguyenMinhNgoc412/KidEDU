# C13 — Local Android build boundary

Implements: `TA-ADR-001` (Expo/EAS baseline), technical architecture §5/20.
Depends on: local Java/Android SDK and owner signing configuration.
Status: Scripts implemented; signed native build pending.

## Scope / acceptance

Android preview uses Expo prebuild and local Gradle assembleDebug. Production checks quality, requires owner keystore/password/alias environment variables, and uses local bundleRelease with an explicit signing configuration. Remove Android EAS submit/preview configuration. iOS keeps EAS Free. README lists local APK/AAB outputs and Play Console upload.

## Tests / migration / rollback

Preview configuration preflight runs without a build. Production preflight must reject missing signing configuration. These checks do not validate Gradle or signing. No schema/dependency change; generated native output remains build output. Revert scripts/package configuration to roll back; EAS Android must not become the v1 baseline. No SOT change.

Signing is assigned in AGP `finalizeDsl`, after generated configuration and before variant finalization, following the [official AGP lifecycle guidance](https://developer.android.com/build/extend-agp). Actual Gradle execution is still pending.

## Out of scope

Actual APK/AAB build, device smoke, Play signing and upload require the owner's configured environment and credentials. No publishing performed.
