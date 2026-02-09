# App Store Connect Upload Guide

This guide will walk you through the steps to build and upload your app to App Store Connect using EAS (Expo Application Services).

## Prerequisites

1.  **Apple Developer Account**: Ensure you have a paid Apple Developer Program membership.
2.  **Expo Account**: Ensure you have an Expo account and are logged in.

## Steps

### 1. Login to EAS

Open your terminal and run:

```bash
npx eas login
```

### 2. Configure Project (Link to EAS)

Run the following command to link your project to EAS. This will generate a Project ID in your `app.json`.

```bash
npx eas build:configure
```

- Select `iOS` when prompted.
- If asked to create a new project, select `yes`.

### 3. Build and Submit

Run the following command to build your app and automatically submit it to App Store Connect:

```bash
npx eas build --platform ios --auto-submit
```

- You will be prompted to log in to your Apple ID.
- EAS will handle certificate generation and provisioning profiles automatically.

## Troubleshooting

- **Bundle Identifier**: Ensure `ios.bundleIdentifier` in `app.json` is unique and matches what you intend to use.
- **Version**: Increment the `version` in `app.json` for each new submission.
- **Build Number**: `eas.json` is configured to auto-increment the build number (`"autoIncrement": true`).
