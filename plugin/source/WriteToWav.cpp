/*
  ==============================================================================

    WriteToWav.cpp
    Created: 3 Mar 2025 3:17:21pm
    Author:  William Wedgwood

  ==============================================================================
*/

#include "AQUA/WriteToWav.h"

void WriteToWav::writeVectorToWav(const std::vector<float>& audioData, const juce::File& file, const double sampleRate, const int bitsPerSample, const int numChannels)
{
    juce::WavAudioFormat wavFormat;
    
    std::unique_ptr<juce::FileOutputStream> fileStream(file.createOutputStream());
    
    if (fileStream != nullptr)
    {
        std::unique_ptr<juce::AudioFormatWriter> writer;

        writer.reset(
            wavFormat.createWriterFor(fileStream.get(), sampleRate, numChannels, bitsPerSample,
                                      {}, 0)
        );

        if (writer != nullptr)
        {
            fileStream.release(); // The writer now owns the stream

            juce::AudioBuffer<float> buffer(numChannels, static_cast<int>(audioData.size() / numChannels));
            
            for (int channel = 0; channel < numChannels; ++channel)
            {
                buffer.copyFrom(channel, 0, audioData.data() + channel * buffer.getNumSamples(), buffer.getNumSamples());
            }

            writer->writeFromAudioSampleBuffer(buffer, 0, buffer.getNumSamples());
        }
    }
}
