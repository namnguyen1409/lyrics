import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

async function createPNGIcons() {
  const svgPath = path.join(process.cwd(), 'public', 'icon-192x192.svg')
  const publicDir = path.join(process.cwd(), 'public')
  
  try {
    // Create 192x192 PNG
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192x192.png'))
    
    // Create 512x512 PNG
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512x512.png'))
      
    console.log('✅ PNG icons created successfully!')
    console.log('- icon-192x192.png')
    console.log('- icon-512x512.png')
    
  } catch (error) {
    console.error('❌ Error creating PNG icons:', error)
    
    // Fallback: create simple colored PNG icons
    await createFallbackIcons(publicDir)
  }
}

async function createFallbackIcons(publicDir) {
  console.log('Creating fallback PNG icons...')
  
  // Create simple purple circle icons
  const svg192 = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="24" fill="#8b5cf6"/>
    <circle cx="96" cy="96" r="60" fill="white"/>
    <text x="96" y="110" text-anchor="middle" fill="#8b5cf6" font-size="48" font-weight="bold" font-family="Arial">♪</text>
  </svg>`
  
  const svg512 = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#8b5cf6"/>
    <circle cx="256" cy="256" r="160" fill="white"/>
    <text x="256" y="300" text-anchor="middle" fill="#8b5cf6" font-size="128" font-weight="bold" font-family="Arial">♪</text>
  </svg>`
  
  // Convert SVG to PNG
  await sharp(Buffer.from(svg192))
    .png()
    .toFile(path.join(publicDir, 'icon-192x192.png'))
    
  await sharp(Buffer.from(svg512))
    .png()
    .toFile(path.join(publicDir, 'icon-512x512.png'))
    
  console.log('✅ Fallback PNG icons created!')
}

createPNGIcons()
