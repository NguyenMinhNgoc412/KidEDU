# KidEDU Maestro Flows

These flows are smoke tests for the local-first MVP. They do not depend on real family/user data.

Run with an installed app id:

```sh
APP_ID=host.exp.Exponent maestro test maestro/parent-create-deck-autoplay.yaml
```

Use `host.exp.Exponent` for Expo Go, or the package id from a dev build.

The media flow opens the customization controls and validates the stable UI entrypoints. Completing the OS photo/video picker requires a device-specific media fixture, so that part is intentionally not automated here.
