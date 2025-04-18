#include "AQUA/PluginProcessor.h"
#include <juce_audio_processors/juce_audio_processors.h>
#include "AQUA/PluginEditor.h"
#include "AQUA/ParameterIDs.hpp"
#include <cmath>
#include <functional>
#include <juce_dsp/juce_dsp.h>

namespace webview_plugin {
AudioPluginAudioProcessor::AudioPluginAudioProcessor()
    : AudioProcessor(
          BusesProperties()
#if !JucePlugin_IsMidiEffect
#if !JucePlugin_IsSynth
              .withInput("Input", juce::AudioChannelSet::stereo(), true)
#endif
              .withOutput("Output", juce::AudioChannelSet::stereo(), true)
#endif
              ),
      state{*this, nullptr, "PARAMETERS", createParameterLayout(parameters)} {
}

AudioPluginAudioProcessor::~AudioPluginAudioProcessor() {}

const juce::String AudioPluginAudioProcessor::getName() const {
  return JucePlugin_Name;
}

bool AudioPluginAudioProcessor::acceptsMidi() const {
#if JucePlugin_WantsMidiInput
  return true;
#else
  return false;
#endif
}

bool AudioPluginAudioProcessor::producesMidi() const {
#if JucePlugin_ProducesMidiOutput
  return true;
#else
  return false;
#endif
}

bool AudioPluginAudioProcessor::isMidiEffect() const {
#if JucePlugin_IsMidiEffect
  return true;
#else
  return false;
#endif
}

double AudioPluginAudioProcessor::getTailLengthSeconds() const {
  return 0.0;
}

int AudioPluginAudioProcessor::getNumPrograms() {
  return 1;  // NB: some hosts don't cope very well if you tell them there are 0
             // programs, so this should be at least 1, even if you're not
             // really implementing programs.
}

int AudioPluginAudioProcessor::getCurrentProgram() {
  return 0;
}

void AudioPluginAudioProcessor::setCurrentProgram(int index) {
  juce::ignoreUnused(index);
}

const juce::String AudioPluginAudioProcessor::getProgramName(int index) {
  juce::ignoreUnused(index);
  return {};
}

void AudioPluginAudioProcessor::changeProgramName(int index,
                                                  const juce::String& newName) {
  juce::ignoreUnused(index, newName);
}

void AudioPluginAudioProcessor::prepareToPlay(double sampleRate,
                                              int samplesPerBlock) {
  using namespace juce;

  audioClassifier.prepareToPlay(sampleRate, samplesPerBlock, 16000.0f);
}

void AudioPluginAudioProcessor::releaseResources() {
  // When playback stops, you can use this as an opportunity to free up any
  // spare memory, etc.
}

bool AudioPluginAudioProcessor::isBusesLayoutSupported(
    const BusesLayout& layouts) const {
#if JucePlugin_IsMidiEffect
  juce::ignoreUnused(layouts);
  return true;
#else
  // This is the place where you check if the layout is supported.
  // In this template code we only support mono or stereo.
  // Some plugin hosts, such as certain GarageBand versions, will only
  // load plugins that support stereo bus layouts.
  if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono() &&
      layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
    return false;

    // This checks if the input layout matches the output layout
#if !JucePlugin_IsSynth
  if (layouts.getMainOutputChannelSet() != layouts.getMainInputChannelSet())
    return false;
#endif

  return true;
#endif
}

void AudioPluginAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer,
                                             juce::MidiBuffer& midiMessages) {
  juce::ignoreUnused(midiMessages);

  juce::ScopedNoDenormals noDenormals;
  auto totalNumInputChannels = getTotalNumInputChannels();
  auto totalNumOutputChannels = getTotalNumOutputChannels();

  for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
    buffer.clear(i, 0, buffer.getNumSamples());

  auto* channelData = buffer.getWritePointer(0); // Use the first channel

  for (int i = 0; i < buffer.getNumSamples(); ++i)
  {
      audioClassifier.processSample(channelData[i]);
  }

  juce::dsp::AudioBlock<float> block{buffer};
  if (parameters.distortionType->getIndex() == 1) {
    // tanh(kx)/tanh(k)
    juce::dsp::AudioBlock<float>::process(block, block, [](float sample) {
      constexpr auto SATURATION = 5.f;
      static const auto normalizationFactor = std::tanh(SATURATION);
      sample = std::tanh(SATURATION * sample) / normalizationFactor;
      return sample;
    });
  } else if (parameters.distortionType->getIndex() == 2) {
    // sigmoid
    juce::dsp::AudioBlock<float>::process(block, block, [](float sample) {
      constexpr auto SATURATION = 5.f;
      sample = 2.f / (1.f + std::exp(-SATURATION * sample)) - 1.f;
      return sample;
    });
  }

  buffer.applyGain(parameters.gain->get());
}

bool AudioPluginAudioProcessor::hasEditor() const {
  return true;  // (change this to false if you choose to not supply an editor)
}

juce::AudioProcessorEditor* AudioPluginAudioProcessor::createEditor() {
  return new AudioPluginAudioProcessorEditor(*this);
}

void AudioPluginAudioProcessor::getStateInformation(
    juce::MemoryBlock& destData) {
  // You should use this method to store your parameters in the memory block.
  // You could do that either as raw data, or use the XML or ValueTree classes
  // as intermediaries to make it easy to save and load complex data.
  juce::ignoreUnused(destData);
}

void AudioPluginAudioProcessor::setStateInformation(const void* data,
                                                    int sizeInBytes) {
  // You should use this method to restore your parameters from this memory
  // block, whose contents will have been created by the getStateInformation()
  // call.
  juce::ignoreUnused(data, sizeInBytes);
}

juce::AudioProcessorValueTreeState::ParameterLayout
AudioPluginAudioProcessor::createParameterLayout(
    AudioPluginAudioProcessor::Parameters& parameters) {
  using namespace juce;
  AudioProcessorValueTreeState::ParameterLayout layout;

  {
    auto parameter = std::make_unique<AudioParameterFloat>(
        id::GAIN, "gain", NormalisableRange<float>{0.f, 1.f, 0.01f, 0.9f}, 1.f);
    parameters.gain = parameter.get();
    layout.add(std::move(parameter));
  }

  {
    auto parameter = std::make_unique<AudioParameterBool>(
        id::BYPASS, "bypass", false,
        AudioParameterBoolAttributes{}.withLabel("Bypass"));
    parameters.bypass = parameter.get();
    layout.add(std::move(parameter));
  }

  {
    auto parameter = std::make_unique<AudioParameterChoice>(
        id::DISTORTION_TYPE, "distortion type",
        StringArray{"none", "tanh(kx)/tanh(k)", "sigmoid"}, 0);
    parameters.distortionType = parameter.get();
    layout.add(std::move(parameter));
  }

  return layout;
}
}  // namespace webview_plugin

// This creates new instances of the plugin.
// This function definition must be in the global namespace.
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() {
  return new webview_plugin::AudioPluginAudioProcessor();
}
