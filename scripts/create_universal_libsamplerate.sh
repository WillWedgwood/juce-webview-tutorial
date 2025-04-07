#!/bin/bash

# Input paths from arguments
X86_LIB="$1"
ARM64_LIB="$2"
UNIVERSAL_LIB="$3"

# Correctly derive the base universal directory
UNIVERSAL_DIR="$(dirname "$(dirname "$UNIVERSAL_LIB")")"  # Go two levels up to get the 'universal' directory
LIB_DIR="$UNIVERSAL_DIR/lib"                             # Directory for the universal library
INCLUDE_DIR="$UNIVERSAL_DIR/include"                     # Directory for the header file

# Ensure the output directories exist
mkdir -p "$LIB_DIR"
mkdir -p "$INCLUDE_DIR"

echo "x86 lib:        $X86_LIB"
echo "arm64 lib:      $ARM64_LIB"
echo "universal lib:  $UNIVERSAL_LIB"
echo "lib dir:        $LIB_DIR"
echo "include dir:    $INCLUDE_DIR"

# Check if source files exist
if [ ! -f "$X86_LIB" ]; then
    echo "❌ x86_64 libsamplerate not found!"
    exit 1
fi

if [ ! -f "$ARM64_LIB" ]; then
    echo "❌ arm64 libsamplerate not found!"
    exit 1
fi

# Copy the samplerate.h file to the universal include directory
HEADER_FILE="$(dirname "$X86_LIB")/../../include/samplerate.h"  # Adjust path if necessary
if [ -f "$HEADER_FILE" ]; then
    cp "$HEADER_FILE" "$INCLUDE_DIR" || {
        echo "❌ Failed to copy samplerate.h to $INCLUDE_DIR!"
        exit 1
    }
    echo "✅ samplerate.h copied to $INCLUDE_DIR"
else
    echo "❌ samplerate.h not found at $HEADER_FILE!"
    exit 1
fi

# Create the universal library in the lib directory
UNIVERSAL_LIB_PATH="$LIB_DIR/$(basename "$UNIVERSAL_LIB")"
if [ ! -f "$UNIVERSAL_LIB_PATH" ] || [ "$X86_LIB" -nt "$UNIVERSAL_LIB_PATH" ] || [ "$ARM64_LIB" -nt "$UNIVERSAL_LIB_PATH" ]; then
    echo "🔄 Creating universal libsamplerate..."
    lipo -create "$X86_LIB" "$ARM64_LIB" -output "$UNIVERSAL_LIB_PATH" || {
        echo "❌ lipo failed!"
        exit 1
    }
    echo "✅ Universal libsamplerate created: $UNIVERSAL_LIB_PATH"
else
    echo "✅ Universal libsamplerate is up to date."
fi