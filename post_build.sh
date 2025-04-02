#!/bin/bash

# Parse arguments
for ARG in "$@"; do
    eval "$ARG"
done

# Debug output to verify variables
echo "BUILT_PRODUCTS_DIR: $BUILT_PRODUCTS_DIR"
echo "PROJECT_DIR: $PROJECT_DIR"
echo "TARGETNAME: $TARGETNAME"
echo "LIBSAMPLERATE_DIR: $LIBSAMPLERATE_DIR"
echo "ONNX_DIR: $ONNX_DIR"

if [ "$TARGETNAME" = "AQUA_VST3" ]; then

    echo "Running post-build script for $TARGETNAME"

    # Paths
    EXECUTABLE_DIRECTORY="$BUILT_PRODUCTS_DIR/VST3/AQUA.vst3/Contents/MacOS"
    LOCAL_LIBSAMPLERATE_DIRECTORY="$LIBSAMPLERATE_DIR"  # Use the argument input for libsamplerate
    LOCAL_ONNX_DIRECTORY="$ONNX_DIR"                   # Use the argument input for ONNX runtime

    # Debug paths
    echo "EXECUTABLE_DIRECTORY: $EXECUTABLE_DIRECTORY"
    echo "LOCAL_LIBSAMPLERATE_DIRECTORY: $LOCAL_LIBSAMPLERATE_DIRECTORY"
    echo "LOCAL_ONNX_DIRECTORY: $LOCAL_ONNX_DIRECTORY"

    # Create necessary directories
    mkdir -p "$EXECUTABLE_DIRECTORY/libsamplerate" || { echo "Failed to create libsamplerate directory"; exit 1; }
    mkdir -p "$EXECUTABLE_DIRECTORY/onnxruntime" || { echo "Failed to create onnxruntime directory"; exit 1; }

    # Copy libsamplerate library
    if [ -f "$LOCAL_LIBSAMPLERATE_DIRECTORY/build/lib/libsamplerate.0.dylib" ]; then
        cp "$LOCAL_LIBSAMPLERATE_DIRECTORY/build/lib/libsamplerate.0.dylib" "$EXECUTABLE_DIRECTORY/libsamplerate/libsamplerate.0.dylib"

        # cp "$LOCAL_LIBSAMPLERATE_DIRECTORY/COPYING" "$EXECUTABLE_DIRECTORY/libsamplerate/COPYING"

        # Change install name of libsamplerate to be relative
        install_name_tool -id "@loader_path/libsamplerate.0.dylib" "$EXECUTABLE_DIRECTORY/libsamplerate/libsamplerate.0.dylib"

    else
        echo "Error: libsamplerate.0.dylib not found at $LOCAL_LIBSAMPLERATE_DIRECTORY"
        exit 1
    fi

    # Copy ONNX runtime library
    if [ -f "$LOCAL_ONNX_DIRECTORY/lib/libonnxruntime.1.18.1.dylib" ]; then
        cp "$LOCAL_ONNX_DIRECTORY/lib/libonnxruntime.1.18.1.dylib" "$EXECUTABLE_DIRECTORY/onnxruntime/libonnxruntime.1.18.1.dylib"

        # cp "$LOCAL_ONNX_DIRECTORY/LICENSE" "$EXECUTABLE_DIRECTORY/onnxruntime/LICENSE"
    else
        echo "Error: libonnxruntime.1.18.1.dylib not found at $LOCAL_ONNX_DIRECTORY"
        exit 1
    fi

    # Update library paths with install_name_tool
    install_name_tool -change \
        "$LOCAL_LIBSAMPLERATE_DIRECTORY/build/lib/libsamplerate.0.dylib" \
        "@loader_path/libsamplerate/libsamplerate.0.dylib" \
        "$EXECUTABLE_DIRECTORY/AQUA"

    install_name_tool -change \
        "@rpath/libonnxruntime.1.18.1.dylib" \
        "@loader_path/onnxruntime/libonnxruntime.1.18.1.dylib" \
        "$EXECUTABLE_DIRECTORY/AQUA"

    # Remove unwanted RPATH
    install_name_tool -delete_rpath \
        "/Users/will_salsa/Documents/GitHub/AQUA/AQUA/Builds/MacOSX/../../External_Libs/onnxruntime-osx-universal2-1.18.1/lib" \
        "$EXECUTABLE_DIRECTORY/AQUA"

    # Optional: Add a new RPATH if necessary
    # install_name_tool -add_rpath "@loader_path/onnxruntime" "$EXECUTABLE_DIRECTORY/AQUA_v1

    # Remove existing code signature and sign the libraries and plugin
    codesign --remove-signature "$EXECUTABLE_DIRECTORY/AQUA.vst3"
    codesign --sign "-" "$EXECUTABLE_DIRECTORY/onnxruntime/libonnxruntime.1.18.1.dylib"
    codesign --sign "-" "$EXECUTABLE_DIRECTORY/AQUA.vst3"

    # Output the final product path for debugging
    echo "Build completed: ${TARGET_BUILD_DIR}/${FULL_PRODUCT_NAME}"
fi