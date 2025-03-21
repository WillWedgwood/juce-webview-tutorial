/*
  ==============================================================================

    SampleRateConversion.h
    Created: 3 Mar 2025 3:35:32pm
    Author:  William Wedgwood

  ==============================================================================
*/

#pragma once

#include <JuceHeader.h>
#include <vector>
#include <samplerate.h> // For libsamplerate (SRC)
#include <span>

class SampleRateConversion
{
    public:
        SampleRateConversion();
        ~SampleRateConversion();
    
        void prepareToPlay(const int inBufferSize, const int outBufferSize);
        void releaseResources();

        void interpolateAudio(const std::span<float>& inputBuffer, std::span<float>& outputBuffer);
    
    private:
        SRC_STATE* resampleState;
        int resampleError;
    
        SRC_DATA srcData;
    
        double resampleRatio; // The exact resampleRatio has to be calculated based on the input/output size
};
