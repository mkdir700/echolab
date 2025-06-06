#!/bin/bash

# --- Configuration ---
# Version to run in dev mode (current version)
CURRENT_APP_VERSION="0.1.0"
# Version to be hosted on the local server (new version)
NEXT_APP_VERSION="0.2.0"

# Electron-builder output directory structure from your package.json build config
# It's "release/${version}", so for NEXT_APP_VERSION it will be "release/$NEXT_APP_VERSION"
OUTPUT_BASE_DIR="release"
NEXT_VERSION_OUTPUT_DIR="$OUTPUT_BASE_DIR/$NEXT_APP_VERSION"

# HTTP Server port (must match what's in your src/main/handlers/updateHandlers.ts)
HTTP_SERVER_PORT="8384"
PACKAGE_JSON_FILE="package.json"

# --- Helper functions ---
update_package_version() {
  local version_to_set=$1
  echo "Updating $PACKAGE_JSON_FILE to version $version_to_set..."
  if ! node -e "let pkg = require('./$PACKAGE_JSON_FILE'); pkg.version = '$version_to_set'; require('fs').writeFileSync('./$PACKAGE_JSON_FILE', JSON.stringify(pkg, null, 2));"; then
    echo "❌ Error: Failed to update $PACKAGE_JSON_FILE version. Ensure Node.js is installed and $PACKAGE_JSON_FILE exists."
    exit 1
  fi
  echo "✅ $PACKAGE_JSON_FILE version updated to $version_to_set."
}

cleanup_and_exit() {
  echo "🧹 Restoring $PACKAGE_JSON_FILE to original version: $ORIGINAL_PACKAGE_VERSION..."
  update_package_version "$ORIGINAL_PACKAGE_VERSION"
  echo "✨ Script finished."
  exit 0
}

# Trap EXIT signal to ensure cleanup
trap cleanup_and_exit EXIT

# --- Main script ---
echo "🚀 Starting auto-update test script..."

# 0. Check for http-server
if ! command -v http-server &> /dev/null; then
    echo "❌ Error: http-server command not found. Please install it globally: npm install -g http-server"
    exit 1
fi
echo "✅ http-server found."

# 1. Get original package.json version (to restore later)
ORIGINAL_PACKAGE_VERSION=$(node -p "require('./$PACKAGE_JSON_FILE').version")
if [ -z "$ORIGINAL_PACKAGE_VERSION" ]; then
  echo "❌ Error: Could not read original version from $PACKAGE_JSON_FILE."
  exit 1
fi
echo "ℹ️ Original $PACKAGE_JSON_FILE version: $ORIGINAL_PACKAGE_VERSION. This will be restored when the script exits."
echo "ℹ️ Script will use CURRENT_APP_VERSION=$CURRENT_APP_VERSION and NEXT_APP_VERSION=$NEXT_APP_VERSION."
echo "-----------------------------------------------------"

# 2. Build NEXT_APP_VERSION to generate artifacts and manifest
echo "🔧 Building NEXT_APP_VERSION ($NEXT_APP_VERSION)..."
update_package_version "$NEXT_APP_VERSION"

echo "👉 Running electron-builder to create distributables for version $NEXT_APP_VERSION..."
echo "   This will use the 'build' configuration in your $PACKAGE_JSON_FILE."
# We run electron-builder directly. It will pick up config from package.json and electron-builder.yml
# Adding --publish never to prevent accidental publishing, though your config points to a generic provider.
if ! npx electron-builder --publish never; then
  echo "❌ Error: Build for $NEXT_APP_VERSION failed."
  # Cleanup will be handled by the EXIT trap
  exit 1 # Trap will catch this
fi
echo "✅ NEXT_APP_VERSION ($NEXT_APP_VERSION) built successfully."
echo "📦 Artifacts (installers, latest.yml, etc.) should be in '$NEXT_VERSION_OUTPUT_DIR' (or platform/arch specific subdirectories within it)."
echo "   For example, for Mac, it might be '$NEXT_VERSION_OUTPUT_DIR/mac/' or similar."
echo "   The 'latest*.yml' file is crucial."
echo "-----------------------------------------------------"

# 3. Determine the exact directory for the http-server
# electron-builder for generic provider usually puts 'latest.yml' (or platform specific like 'latest-mac.yml')
# directly in the output directory specified in publish config, or in a flat structure within directories.output.
# Since publish.url is 'https://echolab.vip/auto-updates', electron-builder will prepare files for that structure.
# The `latest.yml` and installers will likely be in a directory structure like:
# release/0.2.0/echolab-0.2.0-mac.dmg
# release/0.2.0/latest-mac.yml
# Or, if it's a universal build for 'generic' provider, it might be simpler.
# We need to serve from the directory containing 'latest.yml' (or 'latest-mac.yml' etc.)

echo "🖥️ Starting local HTTP server for NEXT_APP_VERSION artifacts..."
echo "   The update server needs to serve the files generated by electron-builder, especially the 'latest*.yml' manifest."
echo "   These files are typically in a subdirectory of '$PWD/$NEXT_VERSION_OUTPUT_DIR/'."
echo "   You'll need to identify the exact directory containing 'latest.yml' or platform-specific manifest (e.g., 'latest-mac.yml')."
echo "   Commonly, for a Mac build, this might be '$PWD/$NEXT_VERSION_OUTPUT_DIR/' or '$PWD/$NEXT_VERSION_OUTPUT_DIR/mac/' or '$PWD/$NEXT_VERSION_OUTPUT_DIR/mac-arm64/' etc."
echo "   Please inspect the '$PWD/$NEXT_VERSION_OUTPUT_DIR' directory after the build."
echo ""
echo "👉 Please open a new terminal window/tab."
echo "   1. Navigate to the correct subdirectory within '$PWD/$NEXT_VERSION_OUTPUT_DIR' that contains the 'latest.yml' (or e.g. 'latest-mac.yml') and the installer files (.dmg, .exe, .zip)."
echo "   2. In that directory, run the following command to start the server:"
echo "      http-server . -p $HTTP_SERVER_PORT --cors -c-1"
echo "      (-c-1 disables caching, which is good for testing)"
echo ""
echo "🕒 Press [Enter] here once the HTTP server is running correctly in the other terminal..."
read -r
echo "-----------------------------------------------------"

# 4. Set package.json to CURRENT_APP_VERSION for the dev app
echo "🔧 Setting $PACKAGE_JSON_FILE to CURRENT_APP_VERSION ($CURRENT_APP_VERSION) for the dev app..."
update_package_version "$CURRENT_APP_VERSION"
echo "✅ $PACKAGE_JSON_FILE set to $CURRENT_APP_VERSION."
echo "-----------------------------------------------------"

# 5. Instructions for the user
echo ""
echo "🎉 Setup complete! Now, to test the auto-update:"
echo "1. 👉 Ensure your local HTTP server (http-server) is still running in the other terminal."
echo "      It should be serving files from the correct subdirectory of '$PWD/$NEXT_VERSION_OUTPUT_DIR'."
echo "2. 👉 In a new terminal (or this one, if you prefer), run your application in development mode:"
echo "      pnpm dev"
echo "3. 👉 Once the app starts (it should report version $CURRENT_APP_VERSION), go to your application's"
echo "      settings/update section and trigger 'Check for Updates'."
echo "4. 👀 You should see a notification for version $NEXT_APP_VERSION being available."
echo "5. ⚙️ Follow the prompts to download and (if you choose) install the update."
echo ""
echo "🧹 After testing, remember to stop the http-server (Ctrl+C in its terminal)."
echo "   This script will automatically restore $PACKAGE_JSON_FILE to version $ORIGINAL_PACKAGE_VERSION when it exits."
echo "-----------------------------------------------------"

# Cleanup will be handled by the EXIT trap when script ends or is interrupted.
# Dummy command to keep script alive until user exits with Ctrl+C or it finishes.
echo "Script is now idle. Press Ctrl+C to exit and restore package.json, or let it exit naturally."
wait # Or some other mechanism to wait if needed, though trap on EXIT should handle it.