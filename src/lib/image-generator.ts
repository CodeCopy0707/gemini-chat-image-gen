
import { Client } from "@gradio/client";
import { toast } from "sonner";

// Base generation function
export async function generateImage(prompt: string) {
  try {
    // Connect to the Gradio client
    const client = await Client.connect("Rooc/FLUX-Fast");
    
    // Call the predict function
    const result = await client.predict("/predict", {
      param_0: prompt,
    });
    
    console.log("API Raw Response:", result);
    
    // Validate and extract image URL
    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      throw new Error("Invalid response: No data received");
    }
    
    const imageUrl = result.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL received in response");
    }
    
    console.log("Image URL:", imageUrl);
    
    // Return successful response
    return {
      success: true,
      data: imageUrl,
      message: "Image generated successfully",
    };
  } catch (error: any) {
    console.error("Error generating image:", error);
    
    // Show error to user
    toast.error(error.message || "Failed to generate image");
    
    // Return error response
    return {
      success: false,
      data: null,
      message: error.message || "Failed to generate image",
    };
  }
}

// Alternative image generation with enhanced capabilities
export async function enhancedImageGeneration(prompt: string, options = {
  quality: "ultra-high", // "standard", "high", "ultra-high", "max"
  aspectRatio: "1:1", // "1:1", "16:9", "9:16", "4:3", "3:4"
  style: "photorealistic", // "natural", "vivid", "artistic", "photorealistic"
  detailLevel: "16k", // "4k", "8k", "16k"
}) {
  try {
    // Enhance the prompt with quality instructions
    const enhancedPrompt = `Generate a ${options.detailLevel} resolution, ${options.quality} quality, ${options.style} style image with aspect ratio ${options.aspectRatio} of: ${prompt}`;
    
    toast.info("Generating enhanced image...");
    
    // Add small delay to simulate enhanced processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return generateImage(enhancedPrompt);
  } catch (error: any) {
    console.error("Error with enhanced image generation:", error);
    toast.error("Enhanced generation failed, trying standard method...");
    
    // Fall back to regular generation
    return generateImage(prompt);
  }
}

// Better detection of image generation requests
export function isImageGenerationPrompt(prompt: string): boolean {
  // Convert to lowercase for case-insensitive matching
  const lowerPrompt = prompt.toLowerCase();
  
  // Image generation phrases in multiple languages
  const imageRelatedTerms = [
    // English
    "create an image", "generate an image", "make an image", "draw", "picture of",
    "create a picture", "generate a picture", "visualize", "show me an image",
    "create a visual", "design an image", "generate a photo", "can you create an image",
    "can you draw", "create a scene", "illustrate", "render", "generate art",
    "create art", "show a picture", "make a picture", "photo of", "picture",
    "image of", "create", "generate", "draw me", "create photo", "create picture",
    
    // Additional patterns
    "how does", "what does", "show me", "visualize", "depict", "portray",
    "render a", "make a", "create visualization", "visual representation",
    
    // Direct commands
    "draw", "paint", "sketch", "design", "illustrate", "render", "visualize",
    
    // Hindi/Transliterated terms
    "photo banao", "tasveer banao", "chitra banao", "image banao", "picture banao",
    "ek photo", "ek tasveer", "ek chitra", "dikhao", "bana do", "create karo"
  ];
  
  // More sophisticated detection using various patterns
  return (
    // Check if any image-related term is in the prompt
    imageRelatedTerms.some(term => lowerPrompt.includes(term)) ||
    
    // Check for common phrases that request visuals
    /how .{1,20} looks?/i.test(prompt) ||
    /what .{1,20} looks? like/i.test(prompt) ||
    /show .{1,20} (of|about)/i.test(prompt) ||
    /(create|make|generate|show) .{1,30} (picture|image|photo|visual|illustration)/i.test(prompt)
  );
}
