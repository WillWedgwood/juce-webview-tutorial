/*
  ==============================================================================

    WriteToWav.h
    Created: 3 Mar 2025 3:17:21pm
    Author:  William Wedgwood

  ==============================================================================
*/

#pragma once

#include <JuceHeader.h>
#include <vector>

// Noise gate processing
class WriteToWav
{
public:
    void writeVectorToWav(const std::vector<float>& audioData, const juce::File& file, const double sampleRate, const int bitsPerSample, const int numChannels);
};
