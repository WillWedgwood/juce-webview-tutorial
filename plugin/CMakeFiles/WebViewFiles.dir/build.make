# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.30

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:

#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:

# Disable VCS-based implicit rules.
% : %,v

# Disable VCS-based implicit rules.
% : RCS/%

# Disable VCS-based implicit rules.
% : RCS/%,v

# Disable VCS-based implicit rules.
% : SCCS/s.%

# Disable VCS-based implicit rules.
% : s.%

.SUFFIXES: .hpux_make_needs_suffix_list

# Command-line flag to silence nested $(MAKE).
$(VERBOSE)MAKESILENT = -s

#Suppress display of executed commands.
$(VERBOSE).SILENT:

# A target that is always out of date.
cmake_force:
.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /opt/homebrew/Cellar/cmake/3.30.5/bin/cmake

# The command to remove a file.
RM = /opt/homebrew/Cellar/cmake/3.30.5/bin/cmake -E rm -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /Users/will_salsa/Documents/GitHub/juce-webview-tutorial

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /Users/will_salsa/Documents/GitHub/juce-webview-tutorial

# Include any dependencies generated for this target.
include plugin/CMakeFiles/WebViewFiles.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include plugin/CMakeFiles/WebViewFiles.dir/compiler_depend.make

# Include the progress variables for this target.
include plugin/CMakeFiles/WebViewFiles.dir/progress.make

# Include the compile flags for this target's objects.
include plugin/CMakeFiles/WebViewFiles.dir/flags.make

plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp: plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/input_file_list
plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp: webview_files.zip
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --blue --bold --progress-dir=/Users/will_salsa/Documents/GitHub/juce-webview-tutorial/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Generating juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp, juce_binarydata_WebViewFiles/JuceLibraryCode/WebViewFiles.h"
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin && /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/_deps/juce-build/tools/extras/Build/juceaide/juceaide_artefacts/Debug/juceaide binarydata webview_files WebViewFiles.h /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin/juce_binarydata_WebViewFiles/JuceLibraryCode /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/input_file_list

plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/WebViewFiles.h: plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp
	@$(CMAKE_COMMAND) -E touch_nocreate plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/WebViewFiles.h

plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o: plugin/CMakeFiles/WebViewFiles.dir/flags.make
plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o: plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp
plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o: plugin/CMakeFiles/WebViewFiles.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --progress-dir=/Users/will_salsa/Documents/GitHub/juce-webview-tutorial/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Building CXX object plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o"
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin && /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o -MF CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o.d -o CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o -c /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp

plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Preprocessing CXX source to CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.i"
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin && /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp > CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.i

plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Compiling CXX source to assembly CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.s"
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin && /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp -o CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.s

# Object files for target WebViewFiles
WebViewFiles_OBJECTS = \
"CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o"

# External object files for target WebViewFiles
WebViewFiles_EXTERNAL_OBJECTS =

plugin/libWebViewFiles.a: plugin/CMakeFiles/WebViewFiles.dir/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp.o
plugin/libWebViewFiles.a: plugin/CMakeFiles/WebViewFiles.dir/build.make
plugin/libWebViewFiles.a: plugin/CMakeFiles/WebViewFiles.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --bold --progress-dir=/Users/will_salsa/Documents/GitHub/juce-webview-tutorial/CMakeFiles --progress-num=$(CMAKE_PROGRESS_3) "Linking CXX static library libWebViewFiles.a"
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin && $(CMAKE_COMMAND) -P CMakeFiles/WebViewFiles.dir/cmake_clean_target.cmake
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin && $(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/WebViewFiles.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
plugin/CMakeFiles/WebViewFiles.dir/build: plugin/libWebViewFiles.a
.PHONY : plugin/CMakeFiles/WebViewFiles.dir/build

plugin/CMakeFiles/WebViewFiles.dir/clean:
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin && $(CMAKE_COMMAND) -P CMakeFiles/WebViewFiles.dir/cmake_clean.cmake
.PHONY : plugin/CMakeFiles/WebViewFiles.dir/clean

plugin/CMakeFiles/WebViewFiles.dir/depend: plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/BinaryData1.cpp
plugin/CMakeFiles/WebViewFiles.dir/depend: plugin/juce_binarydata_WebViewFiles/JuceLibraryCode/WebViewFiles.h
	cd /Users/will_salsa/Documents/GitHub/juce-webview-tutorial && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /Users/will_salsa/Documents/GitHub/juce-webview-tutorial /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin /Users/will_salsa/Documents/GitHub/juce-webview-tutorial /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin /Users/will_salsa/Documents/GitHub/juce-webview-tutorial/plugin/CMakeFiles/WebViewFiles.dir/DependInfo.cmake "--color=$(COLOR)"
.PHONY : plugin/CMakeFiles/WebViewFiles.dir/depend

