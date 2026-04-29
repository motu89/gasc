# Hero Section Background Images

This directory contains the sliding background images for the home page hero section.

## Current Setup
- 5 placeholder images have been created: `hero-1.jpg` through `hero-5.jpg`
- Images automatically slide every 5 seconds with a smooth fade transition
- A dark overlay is applied to ensure text remains readable

## How to Replace Images

Replace these placeholder files with your own images:

1. **Image Requirements:**
   - Format: JPG or PNG
   - Recommended size: 1920x1080 pixels (16:9 aspect ratio)
   - File size: Optimize for web (under 500KB per image recommended)
   - Keep the same filenames: `hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg`, `hero-4.jpg`, `hero-5.jpg`

2. **Replace Images:**
   - Simply overwrite the existing files with your new images
   - Keep the exact same filenames
   - No code changes needed!

3. **Image Tips:**
   - Use high-quality images that relate to your marketplace
   - Avoid very bright images (the overlay helps, but darker images work best)
   - Consider images with space for text overlay
   - Test how your images look with the white text on top

## Customization

If you want to change the sliding speed, open `components/home/Hero.tsx` and modify:
```typescript
}, 5000) // Change image every 5 seconds
```
Change `5000` to any value in milliseconds (e.g., 3000 for 3 seconds, 7000 for 7 seconds).
