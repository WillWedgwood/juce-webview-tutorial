cmake_minimum_required(VERSION 3.22)

# Version is needed by JUCE.
project(AQUA VERSION 0.1.0)

# Specify the target architecture(s)
set(CMAKE_OSX_ARCHITECTURES "arm64") # Universal binary for Apple Silicon and Intel

# Adds a plugin target (that's basically what the Projucer does).
juce_add_plugin(${PROJECT_NAME}
    COMPANY_NAME SalsaSound
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    PLUGIN_MANUFACTURER_CODE WFSD
    PLUGIN_CODE JWVT
    FORMATS AU VST3 Standalone
    PRODUCT_NAME "AQUA"
    # This will force JUCE to look for the WebView2 NuGet package on Windows
    NEEDS_WEBVIEW2 TRUE
)

# Generate the JuceHeader.h file for this project
juce_generate_juce_header(${PROJECT_NAME})

get_target_property(PRODUCT_NAME ${PROJECT_NAME} JUCE_PRODUCT_NAME)
get_target_property(COMPANY_NAME ${PROJECT_NAME} JUCE_COMPANY_NAME)
target_compile_definitions(${PROJECT_NAME} PRIVATE
  JUCE_PRODUCT_NAME="${PRODUCT_NAME}"
  JUCE_COMPANY_NAME="${COMPANY_NAME}"
  JUCE_PRODUCT_VERSION="${PROJECT_VERSION}")

# Automatically collect all .cpp and .h files in the source and include directories
file(GLOB SOURCE_FILES ${CMAKE_CURRENT_SOURCE_DIR}/source/*.cpp)
file(GLOB HEADER_FILES ${INCLUDE_DIR}/*.h)

# Sets the source files of the plugin project
target_sources(${PROJECT_NAME}
    PRIVATE
        ${SOURCE_FILES}
        ${HEADER_FILES} # Optional: Include headers for IDE organization
)

# Adding a directory with the library/application name as a subfolder of the
# include folder is a good practice. It helps avoid name clashes later on.
set(INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/include/AQUA")

# Sets the include directories of the plugin project
target_include_directories(${PROJECT_NAME}
    PRIVATE
        ${JUCE_SOURCE_DIR}/modules
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Mark JUCE headers as system headers to suppress warnings in them
target_include_directories(${PROJECT_NAME} SYSTEM PUBLIC ${JUCE_MODULES_DIR})

# Folder where web UI data reside
set(WEBVIEW_FILES_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/ui/public")

# Copy JUCE frontend library to plugin UI files
file(COPY "${JUCE_MODULES_DIR}/juce_gui_extra/native/javascript/" DESTINATION "${WEBVIEW_FILES_SOURCE_DIR}/js/juce/")

# Zip WebView files
set(WEBVIEW_FILES_ZIP_NAME "webview_files.zip")
set(TARGET_WEBVIEW_FILES_ZIP_PATH "${CMAKE_BINARY_DIR}/${WEBVIEW_FILES_ZIP_NAME}")
get_filename_component(PUBLIC_PATH "${WEBVIEW_FILES_SOURCE_DIR}" ABSOLUTE)
file(
  ARCHIVE_CREATE
  OUTPUT
  "${TARGET_WEBVIEW_FILES_ZIP_PATH}"
  PATHS
  "${PUBLIC_PATH}"
  FORMAT
  zip
  VERBOSE
)

# Package web UI sources as binary data
juce_add_binary_data(WebViewFiles
    HEADER_NAME WebViewFiles.h
    NAMESPACE webview_files
    SOURCES ${TARGET_WEBVIEW_FILES_ZIP_PATH}
)

# List of JUCE modules found in your project
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

# Links to all necessary dependencies. The present ones are recommended by JUCE.
# If you use one of the additional modules, like the DSP module, you need to specify it here.
target_link_libraries(${PROJECT_NAME}
    PRIVATE
        juce::juce_audio_utils
        juce::juce_dsp
        ${JUCE_MODULES}
        ${PROJECT_SOURCE_DIR}/../External_Libs/onnxruntime-osx-universal2-1.18.1/lib/libonnxruntime.1.18.1.dylib
        ${PROJECT_SOURCE_DIR}/../External_Libs/arm64/libsamplerate/build/lib/libsamplerate.0.dylib
        WebViewFiles
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# Add JUCE include directories
target_include_directories(${PROJECT_NAME} PRIVATE ${JUCE_SOURCE_DIR}/modules)

target_compile_definitions(${PROJECT_NAME}
    PUBLIC
        # JUCE_WEB_BROWSER=1 is important for using WebBrowserComponent
        JUCE_WEB_BROWSER=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        # This will enable WebView2 as the WebView backend on Windows
        JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1
)

set_source_files_properties(${SOURCES} PROPERTIES COMPILE_OPTIONS "${CXX_PROJECT_WARNINGS}")

# In Visual Studio this command provides a nice grouping of source files in "filters".
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR}/..)

# Suppress warnings from ONNX Runtime
target_compile_options(${PROJECT_NAME}
    PRIVATE
        -Wno-shadow
        -Wno-extra-semi
        -Wno-sign-conversion
        -Wno-c++98-compat-extra-semi
)