/*
  ==============================================================================

    SpeechEnhancement.cpp
    Created: 17 Feb 2025 3:14:25pm
    Author:  William Wedgwood

  ==============================================================================
*/

#include "AQUA/AudioClassification.h"

AudioClassification::AudioClassification() :
            env(ORT_LOGGING_LEVEL_WARNING, "ModelEnv"),
            onnxSession(nullptr) // Temporary initialization with nullptr
{
    // Use this method as the place to do any pre-playback initialisation that you need..
    testONNXRuntime();

    // Initialize ONNX Runtime environment and session
    env = Ort::Env(ORT_LOGGING_LEVEL_WARNING, "ModelEnv");
    Ort::SessionOptions session_options;
    session_options.SetIntraOpNumThreads(1);
    session_options.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
    
    // Debug: Check if memory_info is initialized
    if (!memory_info) {
        std::cerr << "Error: memory_info is not initialized!" << std::endl;
    } else {
        std::cout << "memory_info initialized successfully." << std::endl;
    }

    // Start from the common application data directory
    juce::File libraryDirectory = juce::File::getSpecialLocation(juce::File::commonApplicationDataDirectory)
                                    .getChildFile("Salsa/AQUA_v1");
    modelFile = libraryDirectory.getChildFile("yamnet_model.onnx");
    model_path = modelFile.getFullPathName().toStdString();

    onnxSession = Ort::Session(env, model_path.c_str(), session_options);
    std::cout << "ONNX model loaded successfully from " << model_path << std::endl;

    // Debug: Print input/output node information
    size_t num_input_nodes = onnxSession.GetInputCount();
    size_t num_output_nodes = onnxSession.GetOutputCount();

    std::cout << "Model has " << num_input_nodes << " inputs and " << num_output_nodes << " outputs." << std::endl;
}

AudioClassification::~AudioClassification()
{
}

void AudioClassification::prepareToPlay(const double sampleRate, const int samplesPerBlock, const int detectionFrequency)
{
    float classifierBufferSize = 15360.0f; // 0.96 secs at 16k
    float targetSRC = 16000.0f;
    float resampleRatio = sampleRate / targetSRC;
    
    classifierBuffer.resize(classifierBufferSize);
    output_0.resize(521); // Resize output_0 to match the expected size

    fifoSize = static_cast<int>(std::round(classifierBufferSize * resampleRatio));

    // Ensure fifoSize is even by rounding up if it's odd
    if (fifoSize % 2 != 0)
        fifoSize += 1;

    hopSize = fifoSize / 2;

    SRC.prepareToPlay(fifoSize, classifierBufferSize);

    inputFifo.resize(fifoSize, 0.0f);  // FIFO buffer
    outputFifo.resize(fifoSize, 0.0f);  // Buffer for processing

    pos = 0;
    count = 0;
}

void AudioClassification::processSample(const float sample)
{
    // Store new sample in circular FIFO
    inputFifo[pos] = sample;

    // Advance position (circular buffer logic)
    pos = (pos + 1) % fifoSize;

    // Track number of samples received
    count++;

    // When hopSize samples are processed, copy the latest classifierBufferSize samples in correct order
    if (count == hopSize)
    {
        count = 0;

        // Extract most recent classifierBufferSize samples, handling circular buffer
        for (int i = 0; i < fifoSize; ++i)
        {
            int fifoIndex = (pos + i) % fifoSize;
            outputFifo[i] = inputFifo[fifoIndex];
        }

        // Process the frame
        std::span<float> classifierBufferSpan(classifierBuffer.data(), classifierBuffer.size());
        std::span<float> outputFifoSpan(outputFifo.data(), outputFifo.size());
        SRC.interpolateAudio(outputFifoSpan, classifierBufferSpan);

        // Perform classification
        processClassification(classifierBufferSpan);

        maxIndex = static_cast<int>(std::distance(output_0.begin(), std::max_element(output_0.begin(), output_0.end())));
        DBG("Max index: " << maxIndex);
        
        // ======== Output Above Threshold =================
        float threshold = 0.5f; // Example threshold value

        // Vector to store indices of values greater than the threshold
        for (int i = 0; i < output_0.size(); ++i)
        {
            if (output_0[i] > threshold) // Check if value is above threshold
            {
                indicesAboveThreshold.push_back(i); // Store the index
            }
        }

        // // Optionally, print the indices above the threshold
        // for (int index : indicesAboveThreshold)
        // {
        //     DBG("Index above threshold: " << index);
        // }

    }
}
void AudioClassification::processClassification(std::span<float> waveform) {
    // Model input/output names
    const char* inputName[] = {"waveform"};
    const char* outputNames[] = {"output_0", "output_1", "output_2"};

    // Vector shapes
    std::vector<int64_t> waveform_shape = {15360};
    std::vector<int64_t> output_0_shape = {1, 521};
    std::vector<int64_t> output_1_shape = {1, 1024};
    std::vector<int64_t> output_2_shape = {96, 64};

    // Create input tensors
    std::vector<Ort::Value> input_tensors;
    input_tensors.emplace_back(Ort::Value::CreateTensor<float>(memory_info, waveform.data(), waveform.size(), waveform_shape.data(), 1));

    // Output placeholders
    std::vector<float> output_1(1 * 1024);  // Size based on expected output
    std::vector<float> output_2(96 * 64);  // Size based on expected output

    std::vector<Ort::Value> output_tensors;
    output_tensors.emplace_back(Ort::Value::CreateTensor<float>(memory_info, output_0.data(), output_0.size(), output_0_shape.data(), 2));
    output_tensors.emplace_back(Ort::Value::CreateTensor<float>(memory_info, output_1.data(), output_1.size(), output_1_shape.data(), 2));
    output_tensors.emplace_back(Ort::Value::CreateTensor<float>(memory_info, output_2.data(), output_2.size(), output_2_shape.data(), 2));

    // Perform inference
    onnxSession.Run(Ort::RunOptions{nullptr}, inputName, input_tensors.data(), input_tensors.size(), outputNames, output_tensors.data(), output_tensors.size());

    // // Release the lock after updating output_0
    // outputLock.clear(std::memory_order_release);
}

std::vector<float> AudioClassification::getOutputScores() const {
    // Wait until the lock is available
    // while (outputLock.test_and_set(std::memory_order_acquire)) {
    //     // Spin until the lock is released
    // }

    // Return the output_0 data
    //auto span = std::span<float>(output_0); // Directly construct span from std::vector

    return output_0;
}

// =====  Function to test ONNX Runtime initialization ======

void AudioClassification::testONNXRuntime() {
    Ort::Env env(ORT_LOGGING_LEVEL_WARNING, "Test");
    std::cout << "ONNX Runtime initialized successfully!" << std::endl;
}
