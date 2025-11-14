// Калькулятор цен для всех моделей бота
// Формула: (basePrice_USD * duration_sec) / STAR_TO_USD * MARGIN

const STAR_TO_USD = 0.016; // 1⭐ = $0.016
const MARGIN = 1.5; // наценка 50%

const models = {
  // TEXT-TO-VIDEO
  'minimax': { basePrice: 0.5, duration: 5, fixed: 46 },
  'haiper-video-2': { basePrice: 0.05, duration: 5 },
  'ray-v2': { basePrice: 0.18, duration: 5, fixed: 16 },
  'wan-text-to-video': { basePrice: 0.25, duration: 5, fixed: 23 },
  'wan-2.2-t2v-fast-480p': { basePrice: 0.0256, duration: 5 },
  'wan-2.2-t2v-fast-720p': { basePrice: 0.03627, duration: 5 },
  'wan-2.2-t2v-fast-1080p': { basePrice: 0.05547, duration: 5 },
  'hunyuan-video-fast': { basePrice: 0.2, duration: 5, fixed: 18 },
  'veo3_fast': { basePrice: 0.64, duration: 8, fixed: 40 },
  'veo-3.1-fast': { basePrice: 0.64, duration: 8, fixed: 40 },
  'runway-aleph': { basePrice: 0.485, duration: 6, fixed: 182 },
  'sora-2-10s': { basePrice: 0.015, duration: 10, fixed: 9 },
  'sora-2-15s': { basePrice: 0.02667, duration: 15, fixed: 25 },
  'sora-2-pro': { basePrice: 0.045, duration: 10, fixed: 28 },
  'sora-2-pro-storyboard-10s': { basePrice: 0.045, duration: 10, fixed: 28 },
  'sora-2-pro-storyboard-15s': { basePrice: 0.045, duration: 15, fixed: 42 },
  'sora-2-pro-storyboard-25s': { basePrice: 0.051, duration: 25, fixed: 127 },
  'seedance-pro-480p': { basePrice: 0.03, duration: 5 },
  'seedance-pro-1080p': { basePrice: 0.15, duration: 5 },

  // IMAGE-TO-VIDEO
  'kling-v1.6-pro': { basePrice: 0.098, duration: 5, fixed: 9 },
  'kling-v1.6-standard': { basePrice: 0.056, duration: 5, fixed: 7 },
  'kling-v2.0': { basePrice: 0.28, duration: 5, fixed: 35 },
  'kling-v2.1-standard': { basePrice: 0.05, duration: 5 },
  'kling-v2.1-pro': { basePrice: 0.09, duration: 5 },
  'wan-image-to-video': { basePrice: 0.25, duration: 5, fixed: 23 },
  'wan-2.2-i2v-fast-480p': { basePrice: 0.02347, duration: 5 },
  'wan-2.2-i2v-fast-720p': { basePrice: 0.032, duration: 5 },
  'wan-2.2-i2v-fast-1080p': { basePrice: 0.04907, duration: 5 },
  'sora-2-i2v': { basePrice: 0.015, duration: 10, fixed: 9 },
  'sora-2-pro-i2v': { basePrice: 0.045, duration: 10, fixed: 28 },
  'veo-3.1-reference': { basePrice: 0.64, duration: 8, fixed: 40 },
};

console.log('\\n🎥 ПРАВИЛЬНЫЕ ЦЕНЫ ВСЕХ МОДЕЛЕЙ\\n');
console.log('Формула: (basePrice * duration) / STAR_TO_USD * MARGIN\\n');

Object.entries(models).forEach(([name, config]) => {
  const { basePrice, duration, fixed } = config;

  if (fixed) {
    // Используем фиксированную цену из кода
    const calculatedUSD = fixed * STAR_TO_USD;
    console.log(`${name}:`);
    console.log(`  Fixed: ${fixed}⭐ (~$${calculatedUSD.toFixed(3)})`);
    console.log(`  basePrice: $${basePrice}, duration: ${duration}s`);
    console.log('');
  } else {
    // Вычисляем по формуле
    const stars = Math.floor((basePrice * duration) / STAR_TO_USD * MARGIN);
    const usd = stars * STAR_TO_USD;
    console.log(`${name}:`);
    console.log(`  Calculated: ${stars}⭐ (~$${usd.toFixed(3)})`);
    console.log(`  basePrice: $${basePrice}, duration: ${duration}s`);
    console.log('');
  }
});

console.log('\\n📊 TOP-5 САМЫХ ДЕШЕВЫХ:\\n');
const sorted = Object.entries(models)
  .map(([name, config]) => {
    const stars = config.fixed || Math.floor((config.basePrice * config.duration) / STAR_TO_USD * MARGIN);
    return { name, stars, pricePerSec: stars / config.duration };
  })
  .sort((a, b) => a.pricePerSec - b.pricePerSec)
  .slice(0, 5);

sorted.forEach((model, i) => {
  console.log(`${i + 1}. ${model.name}: ${model.stars}⭐ (${model.pricePerSec.toFixed(2)}⭐/сек)`);
});

console.log('\\n📊 TOP-5 САМЫХ ДОРОГИХ:\\n');
const expensive = Object.entries(models)
  .map(([name, config]) => {
    const stars = config.fixed || Math.floor((config.basePrice * config.duration) / STAR_TO_USD * MARGIN);
    return { name, stars, pricePerSec: stars / config.duration };
  })
  .sort((a, b) => b.pricePerSec - a.pricePerSec)
  .slice(0, 5);

expensive.forEach((model, i) => {
  console.log(`${i + 1}. ${model.name}: ${model.stars}⭐ (${model.pricePerSec.toFixed(2)}⭐/сек)`);
});
