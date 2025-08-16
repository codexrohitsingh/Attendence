# Android Keystore Setup Guide

This guide explains how to generate and use an Android keystore for signing your app builds.

## Quick Start

To generate a keystore for your Android app, run:

```bash
npm run generate-keystore
```

This will execute the keytool command:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

## What This Command Does

- **`-genkey`**: Generates a new key pair (private and public keys)
- **`-v`**: Verbose output for detailed information
- **`-keystore my-release-key.keystore`**: Creates a keystore file in the project root directory
- **`-alias my-key-alias`**: Sets the alias name for the key (you'll need this later)
- **`-keyalg RSA`**: Uses RSA algorithm for key generation
- **`-keysize 2048`**: Sets the key size to 2048 bits (secure)
- **`-validity 10000`**: Makes the key valid for 10,000 days (~27 years)

## During Generation

You'll be prompted to enter:
1. **Keystore password** - Choose a strong password and remember it!
2. **Key password** - Can be the same as keystore password
3. **Distinguished Name information**:
   - First and last name
   - Organizational unit
   - Organization
   - City or locality
   - State or province
   - Two-letter country code

## Environment Variables Configuration

The project is configured to use environment variables for keystore credentials:

```bash
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

### Local Development Setup

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your actual credentials**:
   - Replace `your-store-password` with your actual keystore password
   - Replace `your-key-password` with your actual key password

### Android Configuration

The project includes:
- **`android/gradle.properties`**: Global Android build properties
- **`android/app/build.gradle`**: App-level configuration with signing setup
- **`eas.json`**: EAS Build configuration with environment variables

## Using with EAS Build

After generating your keystore:

1. **Update EAS environment variables** in `eas.json` with your actual passwords

2. **Build your app**:
   ```bash
   eas build -p android --profile production
   ```

The build will automatically use the keystore and credentials specified in the environment variables.

## Security Best Practices

✅ **DO:**
- Keep your keystore file secure and backed up
- Use strong passwords
- Store passwords in a secure password manager
- Keep the keystore file out of version control (already added to .gitignore)

❌ **DON'T:**
- Share your keystore file publicly
- Commit keystore files to Git
- Lose your keystore or passwords (you won't be able to update your app!)

## Building Your App

Once configured, you can build your app with:

```bash
# For production builds
eas build -p android --profile production

# For preview builds
eas build -p android --profile preview
```

## Troubleshooting

If you encounter issues:

1. **"keytool not found"**: Ensure Java JDK is installed and in your PATH
2. **Permission denied**: Run `chmod +x ./scripts/generate-keystore.sh`
3. **EAS credential errors**: Make sure you've uploaded the correct keystore file and credentials

## File Locations

- **Keystore script**: `./scripts/generate-keystore.sh`
- **Generated keystore**: `./android/app/my-release-key.keystore` (gitignored)
- **EAS config**: `./eas.json`