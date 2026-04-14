# iOS App Store Compliance Report

**App:** PromptPal  
**Platform:** Expo React Native  
**Bundle ID:** com.mikhailspeaks.promptpal  
**Scan Date:** 2026-02-15  
**Scanner:** Greenlight CLI (App Store Compliance)

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| **CRITICAL** | 1 | Will cause rejection - Must fix |
| **WARN** | 4 | High rejection risk - Should fix |
| **INFO** | 1 | Best practice - Consider fixing |

**Overall Status:** 🔴 **NOT GREENLIT**  
**App Store Ready:** No - Critical issues must be resolved before submission

---

## Critical Issues (Will Cause Rejection)

### 1. Missing Privacy Manifest (PrivacyInfo.xcprivacy) — §2.1

**Severity:** CRITICAL  
**Guideline:** §2.1 - Performance: App Completeness  
**Effective Date:** Spring 2024 (Required for all new submissions and updates)

#### Description
Apple now requires all iOS apps to include a privacy manifest file (`PrivacyInfo.xcprivacy`) that declares:
- What data types the app collects
- Which Required Reason APIs are used (if any)
- Whether the app tracks users across other companies' apps and websites

This file must be included in the app bundle and is automatically scanned during App Review.

#### Impact
- **App will be rejected** if missing
- Cannot submit new apps or updates without it
- Required as of April 2024 for all submissions

#### Solution

**Option A: Create PrivacyInfo.xcprivacy for Expo**

Create a new file at `PromptPal/ios/PrivacyInfo.xcprivacy`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeUserID</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
                <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePerformanceData</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <false/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array/>
</dict>
</plist>
```

**Note:** Adjust the data types based on actual app functionality. The above assumes:
- User ID collection (for authentication via Clerk)
- Email address collection (for user accounts)
- Performance data (for analytics/leaderboards)

**Option B: Add to Expo Plugin Configuration**

In `app.json`, add the privacy manifest via a config plugin:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          "ios": {
            "privacyManifest": {
              "NSPrivacyTracking": false,
              "NSPrivacyCollectedDataTypes": [
                {
                  "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeUserID",
                  "NSPrivacyCollectedDataTypeLinked": true,
                  "NSPrivacyCollectedDataTypeTracking": false,
                  "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
                }
              ]
            }
          }
        }
      ]
    ]
  }
}
```

**Next Steps:**
1. Review all data collection in the app (authentication, analytics, etc.)
2. Update the manifest with accurate data types
3. Add the `expo-build-properties` plugin if using Option B
4. Run `npx expo prebuild` to regenerate iOS project files
5. Verify the manifest is included in the built IPA

---

## Warning Issues (High Rejection Risk)

### 2. Missing Account Deletion Option — §5.1.1

**Severity:** WARN  
**Guideline:** §5.1.1 - Legal: Data Collection and Storage  
**Detected In:** Authentication flow (Clerk integration)

#### Description
If your app allows users to create accounts, Apple requires that you also provide a way for users to delete their accounts directly within the app. This must:
- Be easily discoverable (typically in Settings/Profile)
- Actually delete the account and associated data (not just deactivate)
- Include a clear confirmation step
- Optionally allow data export before deletion

#### Impact
- High probability of rejection during review
- Reviewers specifically test for this feature
- Common reason for 5.1.1 rejections

#### Current State
The app uses Clerk for authentication (`@clerk/clerk-expo`), which supports user deletion. However, no account deletion UI has been detected in the codebase.

#### Solution

**Implementation Steps:**

1. **Add account deletion UI** in the Profile/Settings screen:

```typescript
// src/app/(tabs)/profile.tsx or settings screen
import { useUser } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const { user } = useUser();
  
  const handleDeleteAccount = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user via Clerk
              await user?.delete();
              // Navigate to login or show success
            } catch (error) {
              console.error('Failed to delete account:', error);
            }
          }
        }
      ]
    );
  };
  
  return (
    <View>
      {/* Other settings */}
      <TouchableOpacity onPress={handleDeleteAccount}>
        <Text style={{ color: 'red' }}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}
```

2. **Handle data deletion in Convex backend:**
   - Add a mutation to clean up user-related data (progress, XP, leaderboard entries)
   - Consider data retention policies for analytics

3. **Update app.json** with account deletion support declaration:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserNotificationUsageDescription": "...",
        "ITSAppUsesNonExemptEncryption": false,
        "UIUserInterfaceStyle": "Automatic"
      }
    }
  }
}
```

**Verification:**
- Ensure the delete button is visible on the Profile/Settings screen
- Test the full deletion flow in TestFlight before submission
- Document the deletion process for App Review (in App Store Connect notes)

---

### 3. Missing App Description in Configuration — §2.1

**Severity:** WARN  
**Guideline:** §2.1 - Performance: App Completeness  
**File:** `app.json`

#### Description
The `app.json` configuration file is missing a `description` field. While this is primarily metadata for Expo's ecosystem, it's good practice and some build tools expect it.

#### Current Configuration
```json
{
  "expo": {
    "name": "PromptPal",
    "slug": "PromptPal",
    "version": "1.0.0",
    // Missing: "description"
  }
}
```

#### Solution

Add a description field to `app.json`:

```json
{
  "expo": {
    "name": "PromptPal",
    "slug": "PromptPal",
    "version": "1.0.0",
    "description": "Master AI prompt engineering through interactive challenges. Learn to craft perfect prompts for image generation, coding, and copywriting while earning XP and competing on leaderboards.",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    // ... rest of config
  }
}
```

**Tips:**
- Keep it under 200 characters for optimal display
- Include key features and benefits
- Avoid promotional language that sounds like marketing copy

---

### 4. No Privacy Policy URL — §5.1.1

**Severity:** WARN  
**Guideline:** §5.1.1 - Legal: Data Collection and Storage  
**Location:** App Store Connect Configuration

#### Description
Apps that collect user data (including authentication data, analytics, etc.) must include a link to a privacy policy. This is configured in App Store Connect, not in the app code itself.

#### Required For
- Apps with user accounts (Clerk authentication)
- Apps collecting analytics or usage data
- Apps using third-party services that collect data (Clerk, Convex, etc.)

#### Solution

**Step 1: Create Privacy Policy**

Create a privacy policy page on your website. Include:
- What data you collect (email, user ID, progress data, etc.)
- How you use the data
- Third-party services (Clerk, Convex, etc.)
- Data retention policies
- User rights (access, deletion)
- Contact information

**Sample Structure:**
```
Privacy Policy for PromptPal

Last Updated: [Date]

1. Information We Collect
   - Account information (email, user ID via Clerk)
   - Progress data (XP, challenges completed, streaks)
   - Usage analytics

2. How We Use Your Information
   - Provide and maintain the app
   - Track learning progress
   - Improve user experience

3. Third-Party Services
   - Clerk (authentication)
   - Convex (data storage)

4. Your Rights
   - Access your data
   - Delete your account
   - Export your data

5. Contact Us
   - [Your contact email]
```

**Step 2: Add to App Store Connect**

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **App Information**
4. Add your privacy policy URL in the **Privacy Policy URL** field
5. Save changes

**Step 3: Add to app.json (optional but recommended)**

```json
{
  "expo": {
    "privacy": "public",
    "githubUrl": "https://github.com/yourusername/promptpal"
  }
}
```

---

### 5. Placeholder Content Detected — §2.1

**Severity:** WARN  
**Guideline:** §2.1 - Performance: App Completeness  
**Files Detected:**
- `mocks/challenge-generators.ts` - "Lorem ipsum" text
- `mocks/mockLeaderboard.ts` - "Lorem ipsum" text

#### Description
The scanner detected "Lorem ipsum" placeholder text in mock files. While these are likely used for development/testing and not shown to users, reviewers may flag any placeholder content in the codebase.

#### Assessment
These appear to be mock data files for development purposes. If they are:
- **Not bundled in production:** Safe to ignore (but document this)
- **Used in production:** Must replace with real content

#### Solution

**Option A: Verify mocks are excluded from production**

Ensure mock files are not included in the production bundle:

```json
// app.json
{
  "expo": {
    "assetBundlePatterns": [
      "**/*",
      "!mocks/**"  // Exclude mocks from bundle
    ]
  }
}
```

**Option B: Replace placeholder content**

Update mock files with realistic sample data:

```typescript
// mocks/challenge-generators.ts
// Replace:
// description: "Lorem ipsum dolor sit amet..."

// With:
description: "Create a detailed prompt that describes a serene mountain landscape at sunset, including specific details about lighting, colors, and atmosphere."
```

**Option C: Document for App Review**

If mocks are development-only, add a note in App Store Connect:
> "The files containing 'Lorem ipsum' are mock data files used exclusively for development testing. They are not included in the production build and are never displayed to users."

---

## Informational Issues (Best Practices)

### 6. Debug Logging in Production Code — §2.1

**Severity:** INFO  
**Guideline:** §2.1 - Performance: App Completeness  
**File:** `convex/seed.ts:36`

#### Description
Debug `console.log` statements were detected in production code. While this won't cause rejection, it's a best practice to remove or gate them.

#### Code Location
```typescript
// convex/seed.ts:36
console.log("Updated PromptPal limits");
```

#### Solution

Gate debug logging behind the `__DEV__` flag:

```typescript
// convex/seed.ts
if (__DEV__) {
  console.log("Updated PromptPal limits");
}
```

Or use a proper logging utility:

```typescript
// lib/logger.ts
export const logger = {
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  },
  info: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args)
};

// Usage
import { logger } from './lib/logger';
logger.debug("Updated PromptPal limits");  // Only logs in development
```

**Note:** This is in the Convex backend code (TypeScript functions), so `__DEV__` may not be available. Consider:
- Removing the log entirely
- Using Convex's built-in logging
- Adding an environment check

---

## Additional Compliance Checks

### Sign in with Apple — §4.8

**Status:** ✅ Already Implemented  
**File:** `app.json` line 22

The app already has `"usesAppleSignIn": true` configured, which is required when offering third-party authentication options (like Clerk's social logins). This satisfies guideline §4.8.

**Configuration:**
```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    }
  }
}
```

**Verification:** Ensure Sign in with Apple appears alongside other social login options in the UI.

### Required Device Capabilities

**Status:** Not Applicable  
**Guideline:** §2.1

No specific hardware requirements detected. The app appears to run on:
- iPhone (portrait orientation)
- iPad (supportsTablet: true)

### App Transport Security (ATS)

**Status:** Likely Compliant  
**Guideline:** §1.6

The app uses HTTPS (convex.dev, Clerk, etc.) and has `ITSAppUsesNonExemptEncryption: false` set, indicating standard encryption is used.

### Push Notifications Permission

**Status:** ✅ Compliant  
**Guideline:** §5.1.1  
**File:** `app.json` line 24

Purpose string is appropriately specific:
> "PromptPal uses notifications to remind you of daily challenges and learning streaks."

---

## Action Plan

### Phase 1: Critical (Must Complete Before Submission)

1. **Create Privacy Manifest** (PrivacyInfo.xcprivacy)
   - [ ] Review all data collection practices
   - [ ] Create PrivacyInfo.xcprivacy file
   - [ ] Add to iOS project
   - [ ] Test with `npx expo prebuild`

### Phase 2: High Priority (Should Complete)

2. **Implement Account Deletion**
   - [ ] Add delete account button in Profile/Settings
   - [ ] Implement Clerk user deletion
   - [ ] Add Convex mutation to clean up user data
   - [ ] Test deletion flow
   - [ ] Add confirmation dialogs

3. **Add Privacy Policy**
   - [ ] Create privacy policy page
   - [ ] Host on website
   - [ ] Add URL to App Store Connect

4. **Update app.json**
   - [ ] Add description field
   - [ ] Verify all metadata is complete

5. **Address Placeholder Content**
   - [ ] Verify mocks are excluded from production bundle
   - [ ] Or replace with realistic sample data

### Phase 3: Polish (Nice to Have)

6. **Clean Up Debug Logging**
   - [ ] Gate console.log behind __DEV__ flag
   - [ ] Or remove from production code

### Phase 4: Pre-Submission

7. **Re-run Compliance Scan**
   - [ ] Run `greenlight preflight .`
   - [ ] Verify GREENLIT status
   - [ ] Address any new issues

8. **TestFlight Testing**
   - [ ] Build and upload to TestFlight
   - [ ] Test on physical devices
   - [ ] Verify account deletion works
   - [ ] Check all app flows

9. **App Store Connect Preparation**
   - [ ] Complete app metadata
   - [ ] Upload screenshots for all device sizes
   - [ ] Write app description
   - [ ] Add keywords
   - [ ] Set age rating
   - [ ] Add privacy policy URL
   - [ ] Configure pricing

---

## Testing & Validation

### How to Re-run the Scan

```bash
# Navigate to the project directory
cd /Users/mikhail/Documents/CURSOR CODES/In Progress/Prompt Pal App/PromptPal

# Run full compliance scan
greenlight preflight .

# Run specific scans
greenlight codescan .              # Code patterns only
greenlight privacy .               # Privacy manifest only
greenlight preflight . --ipa build.ipa  # With binary inspection

# Get JSON output for CI/CD
greenlight preflight . --format json --output compliance-report.json
```

### Expected GREENLIT Output

Once all issues are resolved, you should see:

```
✅ GREENLIT - No critical issues found

Summary:
  CRITICAL: 0
  WARN: 0 (or minimal)
  INFO: 0 (or minimal)

You're ready for App Store submission!
```

### TestFlight Pre-Submission Checklist

Before submitting to App Review, verify:

- [ ] App launches without crashes
- [ ] All features work as expected
- [ ] Account creation and deletion work
- [ ] Sign in with Apple is functional
- [ ] No placeholder content is visible
- [ ] All buttons and links work
- [ ] App handles offline scenarios gracefully
- [ ] No debug UI or test data is visible

---

## Resources & References

### Apple Documentation
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Privacy Manifest Files](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [Account Deletion Requirements](https://developer.apple.com/support/offering-account-deletion-in-your-app)

### Expo Documentation
- [Expo iOS Configuration](https://docs.expo.dev/versions/latest/config/app/#ios)
- [Privacy Manifest in Expo](https://docs.expo.dev/guides/apple-privacy/)
- [Sign in with Apple in Expo](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

### Third-Party Services
- [Clerk User Deletion](https://clerk.com/docs/users/deleting-users)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices)

### Tools
- [Greenlight CLI](https://github.com/RevylAI/greenlight) - App Store compliance scanner
- [App Store Connect](https://appstoreconnect.apple.com) - App submission portal

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-15 | 1.0 | Initial compliance scan report |

---

## Contact & Questions

For questions about this compliance report:
- Review the specific guideline references above
- Consult Apple Developer Documentation
- Check Expo documentation for React Native specific guidance

**Next Review Date:** After implementing Phase 1 fixes
