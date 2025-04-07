#!/bin/bash

# Parse arguments
for ARG in "$@"; do
    eval "$ARG"
done

# Constants
EXECUTABLE_NAME="AQUA"
LIBSAMPLERATE_NAME="libsamplerate.0.dylib"
ONNX_NAME="libonnxruntime.1.18.1.dylib"

# Debug: Show important paths
echo "BUILT_PRODUCTS_DIR: $BUILT_PRODUCTS_DIR"
echo "PROJECT_DIR: $PROJECT_DIR"
echo "TARGETNAME: $TARGETNAME"
echo "LIBSAMPLERATE_DIR: $LIBSAMPLERATE_DIR"
echo "ONNX_DIR: $ONNX_DIR"

# Only run for VST3 target
if [ "$TARGETNAME" = "AQUA_VST3" ]; then
    echo "Running post-build script for $TARGETNAME"

    EXECUTABLE_PATH="$BUILT_PRODUCTS_DIR/Contents/MacOS/$EXECUTABLE_NAME"
    LIBSAMPLERATE_DST="$BUILT_PRODUCTS_DIR/Contents/MacOS/libsamplerate"
    ONNX_DST="$BUILT_PRODUCTS_DIR/Contents/MacOS/onnxruntime"

    # Create destination directories
    mkdir -p "$LIBSAMPLERATE_DST" || exit 1
    mkdir -p "$ONNX_DST" || exit 1

    # Copy libsamplerate
    LIBSAMPLERATE_SRC="$LIBSAMPLERATE_DIR/lib/$LIBSAMPLERATE_NAME"
    if [ -f "$LIBSAMPLERATE_SRC" ]; then
        cp "$LIBSAMPLERATE_SRC" "$LIBSAMPLERATE_DST/$LIBSAMPLERATE_NAME"
        install_name_tool -id "@loader_path/libsamplerate.0.dylib" "$LIBSAMPLERATE_DST/$LIBSAMPLERATE_NAME"
    else
        echo "❌ libsamplerate not found at $LIBSAMPLERATE_SRC"
        exit 1
    fi

    # Copy ONNX Runtime (universal version)
    ONNX_SRC="$ONNX_DIR/lib/$ONNX_NAME"
    if [ -f "$ONNX_SRC" ]; then
        cp "$ONNX_SRC" "$ONNX_DST/$ONNX_NAME"
    else
        echo "❌ ONNX Runtime not found at $ONNX_SRC"
        exit 1
    fi

    # Update dependencies in main executable
    install_name_tool -change "$LIBSAMPLERATE_SRC" "@loader_path/libsamplerate/$LIBSAMPLERATE_NAME" "$EXECUTABLE_PATH"
    install_name_tool -change "@rpath/$ONNX_NAME" "@loader_path/onnxruntime/$ONNX_NAME" "$EXECUTABLE_PATH"

    # Remove outdated RPATHs
    OLD_RPATHS=(
        "$PROJECT_DIR/External_Libs/onnxruntime-osx-universal2-1.18.1/lib"
        "$PROJECT_DIR/External_Libs/universal/libsamplerate/build/lib"
        "$PROJECT_DIR/plugin/../External_Libs/onnxruntime-osx-universal2-1.18.1/lib"
    )
    for rpath in "${OLD_RPATHS[@]}"; do
        if otool -l "$EXECUTABLE_PATH" | grep -q "$rpath"; then
            install_name_tool -delete_rpath "$rpath" "$EXECUTABLE_PATH"
            echo "Removed old RPATH: $rpath"
        fi
    done

    # Add updated RPATHs
    install_name_tool -add_rpath "@loader_path/onnxruntime" "$EXECUTABLE_PATH"
    install_name_tool -add_rpath "@loader_path/libsamplerate" "$EXECUTABLE_PATH"

    # Codesign libs and executable (remove existing first)
    codesign --remove-signature "$EXECUTABLE_PATH" 2>/dev/null
    codesign --sign - "$ONNX_DST/$ONNX_NAME"
    codesign --sign - "$LIBSAMPLERATE_DST/$LIBSAMPLERATE_NAME"
    codesign --sign - "$EXECUTABLE_PATH"

    echo "✅ Build script completed for $EXECUTABLE_PATH"
fi
