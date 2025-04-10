cmake_minimum_required(VERSION 3.22)
project(AQUA VERSION 0.1.0)

# Set up architecture for macOS builds
set(CMAKE_OSX_ARCHITECTURES "arm64;x86_64") # or "arm64;x86_64" for universal binary

# ==== JUCE Plugin Setup ====
juce_add_plugin(${PROJECT_NAME}
    COMPANY_NAME          SalsaSound
    IS_SYNTH              FALSE
    NEEDS_MIDI_INPUT      FALSE
    NEEDS_MIDI_OUTPUT     FALSE
    PLUGIN_MANUFACTURER_CODE WFSD
    PLUGIN_CODE           JWVT
    FORMATS               AU VST3 Standalone
    PRODUCT_NAME          "AQUA"
    NEEDS_WEBVIEW2        TRUE
)

juce_generate_juce_header(${PROJECT_NAME})

# ==== JUCE Modules ====
set(JUCE_MODULES
    juce_audio_basics
    juce_audio_devices
    juce_audio_formats
    juce_audio_plugin_client
    juce_audio_processors
    juce_audio_utils
    juce_core
    juce_data_structures
    juce_events
    juce_graphics
    juce_gui_basics
    juce_gui_extra
)

# ==== Include and Source Files ====
set(INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/include/AQUA")
file(GLOB SOURCE_FILES ${CMAKE_CURRENT_SOURCE_DIR}/source/*.cpp)
file(GLOB HEADER_FILES ${INCLUDE_DIR}/*.h)

target_sources(${PROJECT_NAME}
    PRIVATE ${SOURCE_FILES} ${HEADER_FILES}
)

target_include_directories(${PROJECT_NAME}
    PRIVATE
        ${INCLUDE_DIR}
        ${JUCE_SOURCE_DIR}/modules
       # ${PROJECT_SOURCE_DIR}/../External_Libs/libsamplerate/universal/include  # Add this line
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    SYSTEM PUBLIC
        ${JUCE_MODULES_DIR}
)

# ==== Product Info ====
get_target_property(PRODUCT_NAME ${PROJECT_NAME} JUCE_PRODUCT_NAME)
get_target_property(COMPANY_NAME ${PROJECT_NAME} JUCE_COMPANY_NAME)

target_compile_definitions(${PROJECT_NAME} PRIVATE
    JUCE_PRODUCT_NAME="${PRODUCT_NAME}"
    JUCE_COMPANY_NAME="${COMPANY_NAME}"
    JUCE_PRODUCT_VERSION="${PROJECT_VERSION}"
)

# ==== WebView UI Setup ====
set(WEBVIEW_FILES_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/react_ui/dist")
file(COPY "${JUCE_MODULES_DIR}/juce_gui_extra/native/javascript/"
     DESTINATION "${WEBVIEW_FILES_SOURCE_DIR}/js/juce/")

set(WEBVIEW_FILES_ZIP_NAME "webview_files.zip")
set(TARGET_WEBVIEW_FILES_ZIP_PATH "${CMAKE_BINARY_DIR}/${WEBVIEW_FILES_ZIP_NAME}")
file(ARCHIVE_CREATE
    OUTPUT "${TARGET_WEBVIEW_FILES_ZIP_PATH}"
    PATHS "${WEBVIEW_FILES_SOURCE_DIR}"
    FORMAT zip
    VERBOSE
)

juce_add_binary_data(WebViewFiles
    HEADER_NAME WebViewFiles.h
    NAMESPACE webview_files
    SOURCES ${TARGET_WEBVIEW_FILES_ZIP_PATH}
)

add_custom_command(
    OUTPUT ${WEBVIEW_FILES_SOURCE_DIR}/index.html
    COMMAND npm install && npm run build
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/ui
    COMMENT "Building React GUI with Vite"
)

add_custom_target(vite_build ALL DEPENDS ${WEBVIEW_FILES_SOURCE_DIR}/index.html)
add_dependencies(${PROJECT_NAME} vite_build)

# ==== External Dependencies ====

## libsamplerate
set(LIBSAMPLERATE_X86 "${PROJECT_SOURCE_DIR}/../External_Libs/libsamplerate/x86/libsamplerate/build/lib/libsamplerate.0.dylib")
set(LIBSAMPLERATE_ARM64 "${PROJECT_SOURCE_DIR}/../External_Libs/libsamplerate/arm64/libsamplerate/build/lib/libsamplerate.0.dylib")
set(LIBSAMPLERATE_UNIVERSAL "${PROJECT_SOURCE_DIR}/../External_Libs/libsamplerate/universal/lib/libsamplerate.0.dylib")

add_custom_command(
    OUTPUT ${LIBSAMPLERATE_UNIVERSAL}
    COMMAND ${CMAKE_COMMAND} -E echo "🔨 Creating universal libsamplerate..."
    COMMAND ${CMAKE_SOURCE_DIR}/scripts/create_universal_libsamplerate.sh
        ${LIBSAMPLERATE_X86}
        ${LIBSAMPLERATE_ARM64}
        ${LIBSAMPLERATE_UNIVERSAL}
    DEPENDS ${LIBSAMPLERATE_X86} ${LIBSAMPLERATE_ARM64}
    COMMENT "🏗️  Combining libsamplerate x86 and arm64 into universal binary"
)

add_custom_target(libsamplerate_universal ALL DEPENDS ${LIBSAMPLERATE_UNIVERSAL})
add_dependencies(${PROJECT_NAME} libsamplerate_universal)

# ==== Link Libraries ====
target_link_libraries(${PROJECT_NAME}
    PRIVATE
        ${JUCE_MODULES}
        juce::juce_audio_utils
        juce::juce_dsp
        WebViewFiles
        ${PROJECT_SOURCE_DIR}/../External_Libs/onnxruntime-osx-universal2-1.18.1/lib/libonnxruntime.1.18.1.dylib
        ${LIBSAMPLERATE_UNIVERSAL}
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# ==== Compiler Definitions & Flags ====
target_compile_definitions(${PROJECT_NAME}
    PUBLIC
        JUCE_WEB_BROWSER=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1
)

target_compile_options(${PROJECT_NAME}
    PRIVATE
        -Wno-shadow
        -Wno-extra-semi
        -Wno-sign-conversion
        -Wno-c++98-compat-extra-semi
)

# ==== Post Build Script ====
add_custom_command(
    TARGET "${PROJECT_NAME}_VST3"
    POST_BUILD
    COMMAND /bin/bash ${CMAKE_SOURCE_DIR}/scripts/post_build.sh
    ARGS
        "BUILT_PRODUCTS_DIR=$<TARGET_BUNDLE_DIR:${PROJECT_NAME}_VST3>"
        "PROJECT_DIR=${CMAKE_SOURCE_DIR}"
        "TARGETNAME=${PROJECT_NAME}_VST3"
        "LIBSAMPLERATE_DIR=${CMAKE_SOURCE_DIR}/External_Libs/libsamplerate/universal"
        "ONNX_DIR=${CMAKE_SOURCE_DIR}/External_Libs/onnxruntime-osx-universal2-1.18.1"
    COMMENT "Executing post-build script for ${PROJECT_NAME} - VST3"
)

# ==== Visual Studio Source Grouping (Optional) ====
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR}/..)
