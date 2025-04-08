/*
  ==============================================================================

    SpeechEnhancement.h
    Created: 17 Feb 2025 3:14:25pm
    Author:  William Wedgwood

  ==============================================================================
*/

#pragma once

#include <atomic>
#include <string>

#include <JuceHeader.h>
#include <cassert>
#include <juce_core/juce_core.h>
#include <juce_dsp/juce_dsp.h>
#include <onnxruntime_cxx_api.h>
#include <iostream>
#include <vector>
#include <cmath>
#include <span>

#include "SampleRateConversion.h"


//===============================================================================================
class AudioClassification
{
public:
    AudioClassification();
    virtual ~AudioClassification();
  
    std::vector<float> getOutputScores() const;
    
    void prepareToPlay(const double sampleRate, const int samplesPerBlock, const int detectionFrequency);
    
    void processSample(const float sample);
    void processClassification(std::span<float> stft_input);

    void testONNXRuntime();

private:
    SampleRateConversion SRC;

    // Handle Input to Classification
    int fifoSize = 0;  // Stores the computed buffer size
    int hopSize = 0;               // Hop size (half of classifierBufferSize)
    int pos = 0;                   // Position in the FIFO buffer
    int count = 0;                 // Tracks number of processed samples

    std::vector<float> inputFifo;      // Circular buffer for incoming samples
    std::vector<float> outputFifo;  // Buffer for processing
    
    std::vector<float> classifierBuffer; // Buffer for processing

    //std::array<float, 521> output_0; // Member container for output of classification model.
    std::vector<float> output_0;  // Size based on expected output
    
    Ort::Env env;
    Ort::Session onnxSession;
    std::string model_path;

    Ort::MemoryInfo memory_info = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);

    juce::File modelFile;

    //std::atomic_flag outputLock = ATOMIC_FLAG_INIT; // Spinlock for output_0
};
