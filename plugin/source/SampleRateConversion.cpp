/*
  ==============================================================================

    SampleRateConversion.cpp
    Created: 3 Mar 2025 3:35:32pm
    Author:  William Wedgwood
 
    notes for usage:
    When using this, you must first calculate the size of output buffer in the parent function. This will be static int cast of the sample rate / target sample rate.
    When its passed to this function, we must calculate the exact value needed between the input buffer and output buffer size. This will vary unless the resample ratio is an interger value or divisible by the output buffer size.

  ==============================================================================
*/

#include "AQUA/SampleRateConversion.h"

SampleRateConversion::SampleRateConversion()
{
}

SampleRateConversion::~SampleRateConversion()
{
}

void SampleRateConversion::prepareToPlay(const int inBufferSize, const int outBufferSize)
{
    if (resampleState) src_delete(resampleState); // Cleanup if already initialized

    resampleState = src_new(SRC_SINC_BEST_QUALITY, 1, &resampleError);
    if (!resampleState) {
        std::cerr << "Error initializing upsample SRC_STATE: " << src_strerror(resampleError) << std::endl;
        return;
    }

    resampleRatio = static_cast<double>(outBufferSize) / static_cast<double>(inBufferSize);

    srcData.input_frames = inBufferSize;
    srcData.output_frames = outBufferSize;
    srcData.src_ratio = resampleRatio;
    srcData.end_of_input = 0;
}

void SampleRateConversion::releaseResources()
{
    if (resampleState) {
        src_delete(resampleState);
        resampleState = nullptr;
    }
}

void SampleRateConversion::interpolateAudio(const std::span<float> &inputBuffer, std::span<float> &outputBuffer)
{
    if (resampleRatio == 1.0f)  // Bypass if no resampling needed
    {
        std::copy(inputBuffer.begin(), inputBuffer.end(), outputBuffer.begin());
        return;
    }
    
    srcData.data_in = inputBuffer.data();
    srcData.data_out = outputBuffer.data();
    
    int processError = src_process(resampleState, &srcData);
    if (processError) {
        std::cerr << "Error during resampling: " << src_strerror(processError) << std::endl;
    }
}
