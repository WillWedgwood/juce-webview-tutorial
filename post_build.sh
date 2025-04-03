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
    EXECUTABLE_DIRECTORY="$BUILT_PRODUCTS_DIR/Contents/MacOS"
    LOCAL_LIBSAMPLERATE_DIRECTORY="$LIBSAMPLERATE_DIR"
    LOCAL_ONNX_DIRECTORY="$ONNX_DIR"

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
        install_name_tool -id "@loader_path/libsamplerate.0.dylib" "$EXECUTABLE_DIRECTORY/libsamplerate/libsamplerate.0.dylib"
    else
        echo "Error: libsamplerate.0.dylib not found at $LOCAL_LIBSAMPLERATE_DIRECTORY"
        exit 1
    fi

    # Copy ONNX runtime library
    if [ -f "$LOCAL_ONNX_DIRECTORY/lib/libonnxruntime.1.18.1.dylib" ]; then
        cp "$LOCAL_ONNX_DIRECTORY/lib/libonnxruntime.1.18.1.dylib" "$EXECUTABLE_DIRECTORY/onnxruntime/libonnxruntime.1.18.1.dylib"
    else
        echo "Error: libonnxruntime.1.18.1.dylib not found at $LOCAL_ONNX_DIRECTORY"
        exit 1
    fi

    # Update library paths with install_name_tool
    install_name_tool -change \
        "/Users/will_salsa/Documents/GitHub/Speech_CleanUp_PlugIn/External_Libs/x86/libsamplerate/build/lib/libsamplerate.0.dylib" \
        "@loader_path/libsamplerate/libsamplerate.0.dylib" \
        "$EXECUTABLE_DIRECTORY/AQUA"

    install_name_tool -change \
        "@rpath/libonnxruntime.1.18.1.dylib" \
        "@loader_path/onnxruntime/libonnxruntime.1.18.1.dylib" \
        "$EXECUTABLE_DIRECTORY/AQUA"

    # Remove unwanted RPATH entries
    for rpath in \
        "/Users/will_salsa/Documents/GitHub/AQUA/AQUA/External_Libs/onnxruntime-osx-universal2-1.18.1/lib" \
        "/Users/will_salsa/Documents/GitHub/AQUA/AQUA/External_Libs/x86/libsamplerate/build/lib" \
        "/Users/will_salsa/Documents/GitHub/AQUA/AQUA/plugin/../External_Libs/onnxruntime-osx-universal2-1.18.1/lib"; do
        if otool -l "$EXECUTABLE_DIRECTORY/AQUA" | grep -q "$rpath"; then
            install_name_tool -delete_rpath "$rpath" "$EXECUTABLE_DIRECTORY/AQUA"
            echo "Removed RPATH: $rpath"
        else
            echo "RPATH not found, skipping: $rpath"
        fi
    done

    # Add correct RPATH entries
    install_name_tool -add_rpath "@loader_path/onnxruntime" "$EXECUTABLE_DIRECTORY/AQUA"
    install_name_tool -add_rpath "@loader_path/libsamplerate" "$EXECUTABLE_DIRECTORY/AQUA"

    # Remove existing code signature and sign the libraries and plugin
    codesign --remove-signature "$BUILT_PRODUCTS_DIR"
    codesign --sign "-" "$EXECUTABLE_DIRECTORY/onnxruntime/libonnxruntime.1.18.1.dylib"
    codesign --sign "-" "$BUILT_PRODUCTS_DIR"

    # Output the final product path for debugging
    echo "Build completed: ${BUILT_PRODUCTS_DIR}"
fi