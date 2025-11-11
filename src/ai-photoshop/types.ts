/**
 * AI Photoshop Plugin Types
 * Image transformation models and configurations
 */

// Available AI Photoshop models
export type AIPhotoshopModel =
  | 'seedream'          // SeeDream-4 (ByteDance)
  | 'nano_banana'       // Nano Banana (Google Gemini 2.5)
  | 'flux_multi_kontext' // FLUX Multi-Kontext
  | 'qwen_edit_plus'    // Qwen Image Edit Plus
  | 'flux_kontext_pro'  // FLUX Kontext Pro (8x faster)
  | 'seededit_3'        // SeedEdit 3.0 (4K support)
  | 'qwen_image_edit';  // Qwen Image Edit (SOTA)

// Image quality options
export type ImageQuality = '1K' | '2K' | '4K';

// Aspect ratio options
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';

// Camera angles for composition
export type CameraAngle =
  | 'medium_shot'
  | 'close_up'
  | 'extreme_close_up'
  | 'wide_shot'
  | 'high_angle'
  | 'low_angle'
  | 'dutch_angle'
  | 'over_shoulder'
  | 'profile_shot'
  | 'three_quarter'
  | 'bird_eye'
  | 'macro_beauty';

// Lighting setups
export type LightingSetup =
  | 'soft_natural'
  | 'dramatic'
  | 'golden_hour'
  | 'studio'
  | 'rembrandt'
  | 'butterfly'
  | 'split'
  | 'rim'
  | 'candlelight'
  | 'neon_noir'
  | 'morning'
  | 'sunset';

// Frame composition styles
export type FrameComposition =
  | 'center_weighted'
  | 'rule_thirds'
  | 'golden_ratio'
  | 'symmetrical'
  | 'negative_space'
  | 'leading_lines';

// AI Photoshop request configuration
export interface AIPhotoshopRequest {
  // Required fields
  imageUrl: string;           // URL to the source image
  prompt: string;             // User's editing instructions
  model: AIPhotoshopModel;    // Which AI model to use

  // Optional enhancements
  cameraAngle?: CameraAngle;
  lighting?: LightingSetup;
  composition?: FrameComposition;

  // Image settings
  quality?: ImageQuality;
  aspectRatio?: AspectRatio;
  variationsCount?: number;   // How many variations to generate

  // Advanced options
  seed?: number;              // For reproducible results
  guidanceScale?: number;     // How closely to follow the prompt (1-20)
}

// Processing result
export interface AIPhotoshopResult {
  success: boolean;
  imageUrl?: string;          // URL to the generated image
  error?: string;             // Error message if failed
  model: AIPhotoshopModel;    // Which model was used
  processingTime?: number;    // How long it took (ms)
  cost?: number;              // Cost in stars or USD
}

// Pricing configuration
export interface AIPhotoshopPricing {
  // Base USD costs per model
  modelsUSD: Record<AIPhotoshopModel, number>;

  // Markup multiplier for pricing
  markup: number;

  // Quality multipliers
  qualityMultipliers: Record<ImageQuality, number>;

  // Default settings
  defaultAspectRatio: AspectRatio;
}

// Session state for Telegram bot
export interface AIPhotoshopSession {
  step: 'model_selection' | 'image_upload' | 'prompt_input' | 'processing' | 'completed';
  model?: AIPhotoshopModel;
  imageUrl?: string;
  prompt?: string;
  cameraAngle?: CameraAngle;
  lighting?: LightingSetup;
  composition?: FrameComposition;
  quality?: ImageQuality;
  variationsCount?: number;
  awaitingImage?: boolean;
  awaitingPrompt?: boolean;
}

// Camera angle prompts (transferred from original)
export const CAMERA_ANGLE_PROMPTS: Record<CameraAngle, string> = {
  medium_shot: '[camera: medium shot, balanced composition, natural perspective]',
  close_up: '[camera: close-up shot, intimate detail, emotional connection]',
  extreme_close_up: '[camera: extreme close-up, fine detail focus, artistic impact]',
  wide_shot: '[camera: wide shot, environmental context, spacious composition]',
  high_angle: '[camera: high angle shot, looking down, vulnerable perspective]',
  low_angle: '[camera: low angle shot, looking up, empowering perspective]',
  dutch_angle: '[camera: dutch angle, dynamic tilt, creative composition]',
  over_shoulder: '[camera: over-the-shoulder shot, intimate perspective]',
  profile_shot: '[camera: profile shot, sculptural beauty, classic elegance]',
  three_quarter: '[camera: three-quarter view, dimensional depth, natural pose]',
  bird_eye: "[camera: bird's eye view, top-down perspective, unique angle]",
  macro_beauty: '[camera: macro beauty shot, skin texture perfection, luxury detail]',
};

// Lighting setup prompts
export const LIGHTING_SETUP_PROMPTS: Record<LightingSetup, string> = {
  soft_natural: '[lighting: soft natural light, gentle illumination, flattering glow]',
  dramatic: '[lighting: dramatic lighting, high contrast, artistic shadows]',
  golden_hour: '[lighting: golden hour warmth, magical illumination, perfect timing]',
  studio: '[lighting: professional studio setup, perfect illumination, commercial quality]',
  rembrandt: '[lighting: rembrandt lighting, classic portrait technique, artistic shadows]',
  butterfly: '[lighting: butterfly lighting, glamour technique, facial contouring]',
  split: '[lighting: split lighting, dramatic contrast, artistic division]',
  rim: '[lighting: rim lighting, edge illumination, subject separation]',
  candlelight: '[lighting: warm candlelight, intimate atmosphere, cozy ambiance]',
  neon_noir: '[lighting: neon noir, urban atmosphere, cyberpunk aesthetic]',
  morning: '[lighting: fresh morning light, clean illumination, new day energy]',
  sunset: "[lighting: warm sunset glow, romantic illumination, day's end beauty]",
};

// Frame composition prompts
export const FRAME_COMPOSITION_PROMPTS: Record<FrameComposition, string> = {
  center_weighted: '[composition: center-weighted balance, professional stability]',
  rule_thirds: '[composition: rule of thirds, dynamic balance, photographic standard]',
  golden_ratio: '[composition: golden ratio portrait, mathematical beauty, perfect proportion]',
  symmetrical: '[composition: symmetrical perfection, luxury brand precision, flawless geometry]',
  negative_space: '[composition: negative space elegant, minimalist sophistication]',
  leading_lines: '[composition: leading lines flow, premium visual journey, luxury storytelling]',
};
