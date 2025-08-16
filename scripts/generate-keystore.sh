#!/bin/bash

# Generate Android keystore for app signing
# This script creates a keystore file that will be used to sign your Android app

echo "Generating Android keystore..."

# Create the keystore using the keytool command
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

echo "Keystore generated successfully!"
echo "Please make sure to:"
echo "1. Keep your keystore file safe and secure"
echo "2. Remember your keystore password and key alias password"
echo "3. Add the keystore file to your .gitignore to avoid committing it"
echo "4. Update your EAS build configuration with the keystore credentials"