"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [prompt, setPrompt] = React.useState("");
  const [image, setImage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [referenceImage, setReferenceImage] = React.useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [analyzing, setAnalyzing] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedAmount, setSelectedAmount] = React.useState(null);
  const [copySuccess, setCopySuccess] = React.useState(false);
  const copyToClipboard = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText("9212982160@ptyes");
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }, []);
  const analyzeImage = React.useCallback(async () => {
    if (!referenceImage) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/integrations/gpt-vision/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Describe this image in detail focusing on art style, composition, colors, and key elements. Make it suitable as a prompt for generating similar images.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: referenceImage,
                  },
                },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        setPrompt(data.choices[0].message.content);
      }
    } catch (err) {
      setError("Failed to analyze image");
    }
    setAnalyzing(false);
  }, [referenceImage]);
  const handleFileUpload = React.useCallback(
    async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          const { url, error } = await upload({ file });
          if (error) {
            setError("Failed to upload reference image");
            return;
          }
          setReferenceImage(url);
        } catch (err) {
          setError("Failed to upload reference image");
        }
      }
    },
    [upload]
  );
  const handleDonation = React.useCallback((amount) => {
    setSelectedAmount(amount);
    setShowModal(true);
  }, []);
  const generateImage = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const basePrompt = prompt + ", anime style, 2d, high quality";
      const finalPrompt = referenceImage
        ? `${basePrompt}, similar to reference image`
        : basePrompt;

      const response = await fetch(
        `/integrations/stable-diffusion-v-3/?prompt=${encodeURIComponent(
          finalPrompt
        )}&width=1024&height=1024`
      );
      const data = await response.json();
      if (data.data && data.data[0]) {
        setImage(data.data[0]);
      } else {
        setError("No image was generated. Please try again.");
      }
    } catch (err) {
      setError("Failed to generate image. Please try again.");
    }
    setLoading(false);
  }, [prompt, referenceImage]);

  return (
    <div className="min-h-screen bg-[#000000] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-6 text-center font-inter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          What do you want to generate?
        </h1>
        <p className="text-[#888888] text-center mb-12 text-xl font-light">
          Transform your ideas into stunning anime artwork with AI-powered
          generation
        </p>

        <div className="space-y-8">
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 shadow-lg">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="How can AI help you create anime art today?"
                  className="w-full h-24 p-4 bg-transparent text-white rounded-lg focus:outline-none placeholder-[#444444] text-lg resize-none border-none"
                />
              </div>
              {referenceImage && (
                <div className="w-24 h-24 relative">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setReferenceImage(null)}
                    className="absolute -top-2 -right-2 bg-[#FF0000] rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="absolute -bottom-2 -right-2 bg-[#0066FF] rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <i
                      className={`fas ${
                        analyzing ? "fa-spinner fa-spin" : "fa-magic"
                      }`}
                    ></i>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={generateImage}
                disabled={loading || !prompt}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm ${
                  loading || !prompt
                    ? "bg-[#222222] text-[#444444] cursor-not-allowed"
                    : "bg-[#0066FF] hover:bg-[#0052CC] transition-colors"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </span>
                ) : (
                  "Generate"
                )}
              </button>
              <label className="p-3 rounded-lg bg-[#111111] border border-[#333333] hover:bg-[#222222] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <i className="fas fa-image"></i>
              </label>
              <button className="p-3 rounded-lg bg-[#111111] border border-[#333333] hover:bg-[#222222] transition-colors">
                <i className="fas fa-link"></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-[#FF000022] border border-[#FF0000] text-[#FF0000] p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 shadow-lg">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[512px]">
                <div className="loading-container">
                  <div className="loading-circle"></div>
                  <div className="loading-pulse w-64 h-64 rounded-full"></div>
                </div>
                <p className="mt-6 text-[#888888] text-xl animate-pulse">
                  Creating your masterpiece...
                </p>
                <div className="loading-progress">
                  <div className="loading-bar"></div>
                </div>
              </div>
            ) : (
              image && (
                <div className="space-y-6">
                  <div className="relative group">
                    <img
                      src={image}
                      alt="Generated anime artwork"
                      className="w-full h-auto rounded-lg shadow-xl"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                      <div className="flex gap-4">
                        <a
                          href={image}
                          download="anime-art.png"
                          className="p-3 rounded-full bg-[#0066FF] hover:bg-[#0052CC] transition-colors"
                        >
                          <i className="fas fa-download text-xl"></i>
                        </a>
                        <button className="p-3 rounded-full bg-[#0066FF] hover:bg-[#0052CC] transition-colors">
                          <i className="fas fa-share text-xl"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setImage(null)}
                      className="py-3 px-6 bg-[#111111] border border-[#333333] hover:bg-[#222222] rounded-lg transition-colors text-sm"
                    >
                      Generate Another
                    </button>
                    <a
                      href={image}
                      download="anime-art.png"
                      className="py-3 px-6 bg-[#0066FF] hover:bg-[#0052CC] rounded-lg transition-colors text-sm"
                    >
                      Download Image
                    </a>
                  </div>
                </div>
              )
            )}
          </div>
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-2">Support the Project</h2>
            <p className="text-[#888888] mb-6">
              Help us keep the anime art generator free and improve it further!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleDonation(5)}
                className="p-6 bg-[#111111] border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors"
              >
                <div className="text-2xl font-bold mb-2">₹50</div>
                <div className="text-[#888888] mb-4">Basic Support</div>
                <div className="bg-[#0066FF] hover:bg-[#0052CC] py-2 px-4 rounded-lg transition-colors">
                  Donate Now
                </div>
              </button>

              <button
                onClick={() => handleDonation(10)}
                className="p-6 bg-[#111111] border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors"
              >
                <div className="text-2xl font-bold mb-2">₹100</div>
                <div className="text-[#888888] mb-4">Premium Support</div>
                <div className="bg-[#0066FF] hover:bg-[#0052CC] py-2 px-4 rounded-lg transition-colors">
                  Donate Now
                </div>
              </button>

              <button
                onClick={() => handleDonation(25)}
                className="p-6 bg-[#111111] border border-[#333333] rounded-lg hover:bg-[#222222] transition-colors"
              >
                <div className="text-2xl font-bold mb-2">₹250</div>
                <div className="text-[#888888] mb-4">Ultimate Support</div>
                <div className="bg-[#0066FF] hover:bg-[#0052CC] py-2 px-4 rounded-lg transition-colors">
                  Donate Now
                </div>
              </button>
            </div>

            <p className="text-center text-[#888888] text-sm mt-6">
              <i className="fas fa-credit-card mr-2"></i>
              Support securely using any payment method
            </p>
          </div>
        </div>

        <div className="mt-16 bg-[#111111] border border-[#333333] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Generations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#222222] rounded-lg p-4">
              <img
                src="/placeholder1.jpg"
                alt="Recent generation 1"
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
              <p className="text-sm text-[#888888]">
                Generated on January 15, 2025
              </p>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <img
                src="/placeholder2.jpg"
                alt="Recent generation 2"
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
              <p className="text-sm text-[#888888]">
                Generated on January 14, 2025
              </p>
            </div>
            <div className="bg-[#222222] rounded-lg p-4">
              <img
                src="/placeholder3.jpg"
                alt="Recent generation 3"
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
              <p className="text-sm text-[#888888]">
                Generated on January 13, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#111111] p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Support Us</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#888888] hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg">Selected Amount:</p>
                <p className="text-[#0066FF] text-3xl font-bold">
                  ₹{selectedAmount * 10}
                </p>
              </div>
              <div className="w-full space-y-4">
                <div className="text-center">
                  <p className="text-lg mb-2">UPI ID:</p>
                  <div className="relative">
                    <p className="text-[#0066FF] text-xl font-mono bg-[#1A1A1A] p-3 rounded-lg">
                      9212982160@ptyes
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#888888] hover:text-white transition-colors"
                    >
                      <i
                        className={`fas ${
                          copySuccess ? "fa-check" : "fa-copy"
                        }`}
                      ></i>
                    </button>
                  </div>
                </div>
                <p className="text-[#888888] text-center text-sm">
                  Copy the UPI ID and use it in your preferred payment app
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowModal(false)}
                    className="py-2 px-6 bg-[#333333] hover:bg-[#444444] rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
            box-shadow: 0 0 30px #0066FF;
          }
          50% {
            transform: scale(1);
            opacity: 0.8;
            box-shadow: 0 0 50px #0066FF;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.5;
            box-shadow: 0 0 30px #0066FF;
          }
        }
        
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        .loading-container {
          position: relative;
          width: 256px;
          height: 256px;
        }

        .loading-circle {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top-color: #0066FF;
          border-radius: 50%;
          animation: rotate 1.5s linear infinite;
        }
        
        .loading-pulse {
          background: radial-gradient(circle, #0066FF, transparent);
          animation: pulse 2s ease-in-out infinite;
          filter: blur(10px);
        }

        .loading-progress {
          width: 200px;
          height: 4px;
          background: #222222;
          border-radius: 2px;
          margin-top: 20px;
          overflow: hidden;
        }

        .loading-bar {
          height: 100%;
          background: #0066FF;
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;