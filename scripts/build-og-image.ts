import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function generateOgImage() {
  console.log('Launching browser...')
  const browser = await puppeteer.launch({
    headless: true,
  })

  const page = await browser.newPage()

  // Set viewport to OG image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2, // For better quality
  })

  // Read the Sint image and convert to base64
  const sintImagePath = path.join(__dirname, '../public/sint.png')
  const sintImageBuffer = fs.readFileSync(sintImagePath)
  const sintImageBase64 = `data:image/png;base64,${sintImageBuffer.toString('base64')}`

  // Create HTML content with embedded styles
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            width: 1200px;
            height: 630px;
            overflow: hidden;
          }

          .og-image {
            width: 1200px;
            height: 630px;
            background: rgb(127, 29, 29);
            padding: 80px;
            display: flex;
          }

          .content {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            gap: 60px;
          }

          .text-content {
            display: flex;
            flex-direction: column;
            max-width: 650px;
            flex: 1;
          }

          .title {
            font-size: 96px;
            font-weight: 700;
            color: rgb(244, 205, 96);
            margin: 0 0 40px 0;
            line-height: 1;
          }

          .description {
            font-size: 32px;
            font-weight: 600;
            color: rgb(244, 205, 96);
            margin: 0 0 20px 0;
            line-height: 1.4;
          }

          .tagline {
            font-size: 32px;
            font-weight: 600;
            color: rgb(244, 205, 96);
            margin: 0;
            line-height: 1.4;
          }

          .image-container {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .sint-image {
            width: 380px;
            height: 380px;
            object-fit: cover;
            border-radius: 12px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          }
        </style>
      </head>
      <body>
        <div class="og-image">
          <div class="content">
            <div class="text-content">
              <h1 class="title">SintGPT</h1>
              <p class="description">
                ChatGPT kan geen leuke Sinterklaasgedichten schrijven.
              </p>
              <p class="tagline">SintGPT wel!</p>
              <p class="tagline">
                Snel & makkelijk. Klaar binnen 30 seconden!
              </p>
            </div>

            <div class="image-container">
              <img src="${sintImageBase64}" alt="Sinterklaas" class="sint-image">
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  await page.setContent(html, { waitUntil: 'networkidle0' })

  console.log('Generating screenshot...')

  // Take screenshot
  const outputPath = path.join(__dirname, '../public/og-image.png')
  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
    },
  })

  await browser.close()

  console.log('✅ OG image generated successfully at public/og-image.png')
}

generateOgImage().catch(console.error)
