#include "AQUA/PluginEditor.h"
#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_events/juce_events.h>
#include <optional>
#include <ranges>
#include "AQUA/PluginProcessor.h"
#include "juce_core/juce_core.h"
#include "juce_graphics/juce_graphics.h"
#include "juce_gui_extra/juce_gui_extra.h"
#include "AQUA/ParameterIDs.hpp"
#include <WebViewFiles.h>

namespace webview_plugin {
namespace {
std::vector<std::byte> streamToVector(juce::InputStream& stream) {
  using namespace juce;
  const auto sizeInBytes = static_cast<size_t>(stream.getTotalLength());
  std::vector<std::byte> result(sizeInBytes);
  stream.setPosition(0);
  [[maybe_unused]] const auto bytesRead =
      stream.read(result.data(), result.size());
  jassert(bytesRead == static_cast<ssize_t>(sizeInBytes));
  return result;
}

static const char* getMimeForExtension(const juce::String& extension) {
  static const std::unordered_map<juce::String, const char*> mimeMap = {
      {{"htm"}, "text/html"},
      {{"html"}, "text/html"},
      {{"txt"}, "text/plain"},
      {{"jpg"}, "image/jpeg"},
      {{"jpeg"}, "image/jpeg"},
      {{"svg"}, "image/svg+xml"},
      {{"ico"}, "image/vnd.microsoft.icon"},
      {{"json"}, "application/json"},
      {{"png"}, "image/png"},
      {{"css"}, "text/css"},
      {{"map"}, "application/json"},
      {{"js"}, "text/javascript"},
      {{"woff2"}, "font/woff2"}};

  if (const auto it = mimeMap.find(extension.toLowerCase());
      it != mimeMap.end())
    return it->second;

  jassertfalse;
  return "";
}

juce::Identifier getExampleEventId() {
  static const juce::Identifier id{"exampleEvent"};
  DBG("Hello from c++");
  return id;
}

std::vector<std::byte> getWebViewFileAsBytes(const juce::String& filepath) {
  juce::MemoryInputStream zipStream{webview_files::webview_files_zip,
                                    webview_files::webview_files_zipSize,
                                    false};
  juce::ZipFile zipFile{zipStream};

  // We have to enumerate zip entries instead of retrieving them by name
  // because their names may have prefixes
  for (const auto i : std::views::iota(0, zipFile.getNumEntries())) {
    const auto* zipEntry = zipFile.getEntry(i);

    if (zipEntry->filename.endsWith(filepath)) {
      const std::unique_ptr<juce::InputStream> entryStream{
          zipFile.createStreamForEntry(*zipEntry)};
      return streamToVector(*entryStream);
    }
  }

  return {};
}

constexpr auto LOCAL_DEV_SERVER_ADDRESS = "http://127.0.0.1:8080";
}  // namespace

AudioPluginAudioProcessorEditor::AudioPluginAudioProcessorEditor(
    AudioPluginAudioProcessor& p)
    : AudioProcessorEditor(&p),
      processorRef(p),
      webView{
          juce::WebBrowserComponent::Options{}
              .withBackend(
                  juce::WebBrowserComponent::Options::Backend::webview2)
              .withWinWebView2Options(
                  juce::WebBrowserComponent::Options::WinWebView2{}
                      .withBackgroundColour(juce::Colours::white)
                      // this may be necessary for some DAWs; include for safety
                      .withUserDataFolder(juce::File::getSpecialLocation(
                          juce::File::SpecialLocationType::tempDirectory)))
              .withNativeIntegrationEnabled()
              .withResourceProvider(
                  [this](const auto& url) { return getResource(url); },
                  // allowedOriginIn parameter is necessary to
                  // retrieve resources from the C++ backend even if
                  // on live server
                  juce::URL{LOCAL_DEV_SERVER_ADDRESS}.getOrigin())
              .withInitialisationData("vendor", JUCE_COMPANY_NAME)
              .withInitialisationData("pluginName", JUCE_PRODUCT_NAME)
              .withInitialisationData("pluginVersion", JUCE_PRODUCT_VERSION)
              .withUserScript("console.log(\"C++ backend here: This is run "
                              "before any other loading happens\");")
              .withNativeFunction(
                  juce::Identifier{"nativeFunction"},
                  [this](const juce::Array<juce::var>& args,
                         juce::WebBrowserComponent::NativeFunctionCompletion
                             completion) {
                    nativeFunction(args, std::move(completion));
                  })
                }
  {
  addAndMakeVisible(webView);

  // WebBrowserComponent can display any URL
  // webView.goToURL("https://juce.com");

  // This is necessary if we want to use a ResourceProvider
  webView.goToURL(juce::WebBrowserComponent::getResourceProviderRoot());

  // This can be used for hot reloading
  // webView.goToURL(LOCAL_DEV_SERVER_ADDRESS);

  setResizable(true, true);
  setSize(800, 600);

  startTimer(60);
}

AudioPluginAudioProcessorEditor::~AudioPluginAudioProcessorEditor() {}

void AudioPluginAudioProcessorEditor::resized() {
  auto bounds = getBounds();
  webView.setBounds(getLocalBounds().reduced(10));
}

void AudioPluginAudioProcessorEditor::timerCallback() {
  webView.emitEventIfBrowserIsVisible("outputLevel", juce::var{});
}

auto AudioPluginAudioProcessorEditor::getResource(const juce::String& url) const
    -> std::optional<Resource> {
  //std::cout << "ResourceProvider called with " << url << std::endl;

  const auto resourceToRetrieve =
      url == "/" ? "index.html" : url.fromFirstOccurrenceOf("/", false, false);

  if (resourceToRetrieve == "outputLevel.json") {
    juce::DynamicObject::Ptr levelData{new juce::DynamicObject{}};
  
    // Get the maxIndex from the audio classifier
    int maxIndex = processorRef.getAudioClassification().maxIndex; // Ensure this method exists
    std::span outputScores = processorRef.getAudioClassification().output; // Ensure this method exists

    // Set the maxIndex as the "left" property
    levelData->setProperty("left", maxIndex);

    // Convert outputScores (std::span<float>) to juce::Array<juce::var>
    juce::Array<juce::var> scoresArray;
    for (const auto& score : outputScores) {
        scoresArray.add(score);
    }

    // Add the scoresArray to levelData
    levelData->setProperty("scores", scoresArray);

    const auto jsonString = juce::JSON::toString(levelData.get());
    juce::MemoryInputStream stream{jsonString.getCharPointer(),
                                   jsonString.getNumBytesAsUTF8(), false};
    return juce::WebBrowserComponent::Resource{
        streamToVector(stream), juce::String{"application/json"}};
  }

  const auto resource = getWebViewFileAsBytes(resourceToRetrieve);
  if (!resource.empty()) {
    const auto extension =
        resourceToRetrieve.fromLastOccurrenceOf(".", false, false);
    return Resource{std::move(resource), getMimeForExtension(extension)};
  }

  return std::nullopt;
}

void AudioPluginAudioProcessorEditor::nativeFunction(
    const juce::Array<juce::var>& args,
    juce::WebBrowserComponent::NativeFunctionCompletion completion) {
  using namespace std::views;
  juce::String concatenatedString;
  for (const auto& string : args | transform(&juce::var::toString)) {
    concatenatedString += string;
  }
  completion("nativeFunction callback: All OK!");
}
}  // namespace webview_plugin
