import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateOgImage() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set viewport to OG image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2, // For better quality
  });

  // Read the Sint image and convert to base64
  const sintImagePath = path.join(__dirname, '../public/sint.png');
  const sintImageBuffer = fs.readFileSync(sintImagePath);
  const sintImageBase64 = `data:image/png;base64,${sintImageBuffer.toString('base64')}`;

  // Create HTML content with embedded styles matching the Vue component
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700;900&family=IM+Fell+DW+Pica:ital@0;1&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            width: 1200px;
            height: 630px;
            overflow: hidden;
          }

          .og-image {
            width: 1200px;
            height: 630px;
            background: linear-gradient(135deg, #6b0f2b 0%, #8b1538 30%, #5c0f26 70%, #3d0a19 100%);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Background texture layer */
          .bg-texture {
            position: absolute;
            inset: 0;
            background-image:
              radial-gradient(ellipse at 30% 20%, rgba(244, 205, 96, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(244, 205, 96, 0.08) 0%, transparent 40%),
              url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10 L52 20 L50 17 L48 20 Z' fill='%23d4a853' fill-opacity='0.06'/%3E%3Ccircle cx='20' cy='60' r='1.5' fill='%23d4a853' fill-opacity='0.04'/%3E%3Ccircle cx='80' cy='40' r='1' fill='%23d4a853' fill-opacity='0.05'/%3E%3C/svg%3E");
            background-size: 100px 100px;
            pointer-events: none;
          }

          /* Vignette effect */
          .bg-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at center, transparent 40%, rgba(30, 5, 15, 0.5) 100%);
            pointer-events: none;
          }

          /* Golden decorative frame */
          .golden-frame {
            position: absolute;
            inset: 24px;
            pointer-events: none;
          }

          .frame-corner {
            position: absolute;
            width: 60px;
            height: 60px;
          }

          .frame-corner::before,
          .frame-corner::after {
            content: '';
            position: absolute;
            background: linear-gradient(135deg, #f4cd60 0%, #d4a853 50%, #b8923c 100%);
          }

          .frame-tl { top: 0; left: 0; }
          .frame-tl::before { width: 60px; height: 4px; top: 0; left: 0; }
          .frame-tl::after { width: 4px; height: 60px; top: 0; left: 0; }

          .frame-tr { top: 0; right: 0; }
          .frame-tr::before { width: 60px; height: 4px; top: 0; right: 0; }
          .frame-tr::after { width: 4px; height: 60px; top: 0; right: 0; }

          .frame-bl { bottom: 0; left: 0; }
          .frame-bl::before { width: 60px; height: 4px; bottom: 0; left: 0; }
          .frame-bl::after { width: 4px; height: 60px; bottom: 0; left: 0; }

          .frame-br { bottom: 0; right: 0; }
          .frame-br::before { width: 60px; height: 4px; bottom: 0; right: 0; }
          .frame-br::after { width: 4px; height: 60px; bottom: 0; right: 0; }

          .frame-edge {
            position: absolute;
            background: linear-gradient(90deg, transparent, #d4a853 20%, #d4a853 80%, transparent);
          }

          .frame-top { top: 0; left: 80px; right: 80px; height: 2px; }
          .frame-bottom { bottom: 0; left: 80px; right: 80px; height: 2px; }
          .frame-left {
            left: 0;
            top: 80px;
            bottom: 80px;
            width: 2px;
            background: linear-gradient(180deg, transparent, #d4a853 20%, #d4a853 80%, transparent);
          }
          .frame-right {
            right: 0;
            top: 80px;
            bottom: 80px;
            width: 2px;
            background: linear-gradient(180deg, transparent, #d4a853 20%, #d4a853 80%, transparent);
          }

          /* Floating decorative elements */
          .floating-elements {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }

          .float-item {
            position: absolute;
            opacity: 0.4;
          }

          .float-star-1 {
            top: 60px;
            left: 100px;
            font-size: 28px;
            color: #f4cd60;
          }

          .float-star-2 {
            top: 120px;
            right: 140px;
            font-size: 20px;
            color: #d4a853;
          }

          .float-star-3 {
            bottom: 100px;
            left: 160px;
            font-size: 24px;
            color: #f4cd60;
          }

          .float-gift {
            top: 80px;
            right: 80px;
            font-size: 36px;
            opacity: 0.3;
            transform: rotate(15deg);
          }

          .float-scroll {
            bottom: 80px;
            right: 180px;
            font-size: 32px;
            opacity: 0.25;
            transform: rotate(-10deg);
          }

          /* Main content layout */
          .content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            max-width: 1100px;
            padding: 0 60px;
            position: relative;
            z-index: 10;
          }

          /* Text section */
          .text-section {
            flex: 1;
            max-width: 600px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          /* Logo area */
          .logo-area {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .logo-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #f4cd60 0%, #d4a853 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            box-shadow:
              0 4px 20px rgba(0, 0, 0, 0.3),
              0 0 30px rgba(244, 205, 96, 0.3);
          }

          .brand-name {
            font-family: 'Cinzel Decorative', serif;
            font-size: 52px;
            font-weight: 900;
            color: #f4cd60;
            margin: 0;
            letter-spacing: 0.02em;
            text-shadow:
              2px 2px 0 rgba(0, 0, 0, 0.3),
              0 0 40px rgba(244, 205, 96, 0.4);
          }

          /* Headline area */
          .headline-area {
            margin-top: 8px;
          }

          .pre-headline {
            font-family: 'IM Fell DW Pica', serif;
            font-size: 28px;
            color: #fffdf0;
            margin: 0 0 8px 0;
            opacity: 0.9;
            font-style: italic;
          }

          .main-headline {
            font-family: 'Cinzel', serif;
            font-size: 72px;
            font-weight: 900;
            margin: 0;
            line-height: 1;
            display: flex;
            align-items: baseline;
            gap: 16px;
          }

          .highlight-line {
            color: #f4cd60;
            text-shadow:
              3px 3px 0 rgba(0, 0, 0, 0.3),
              0 0 60px rgba(244, 205, 96, 0.5);
          }

          .normal-line {
            color: #fffdf0;
            font-size: 64px;
            text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
          }

          /* Tagline area */
          .tagline-area {
            display: flex;
            align-items: center;
          }

          .tagline-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, rgba(244, 205, 96, 0.15) 0%, rgba(212, 168, 83, 0.1) 100%);
            border: 2px solid rgba(244, 205, 96, 0.4);
            border-radius: 50px;
            padding: 12px 24px;
          }

          .badge-icon {
            font-size: 24px;
          }

          .badge-text {
            font-family: 'Cinzel', serif;
            font-size: 20px;
            font-weight: 600;
            color: #f4cd60;
            letter-spacing: 0.02em;
          }

          /* Divider */
          .divider {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 8px 0;
          }

          .divider-line {
            flex: 1;
            max-width: 120px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #d4a853);
          }

          .divider-line:last-child {
            background: linear-gradient(90deg, #d4a853, transparent);
          }

          .divider-diamond {
            color: #f4cd60;
            font-size: 14px;
            text-shadow: 0 0 10px rgba(244, 205, 96, 0.5);
          }

          /* Features */
          .features {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }

          .feature {
            font-family: 'IM Fell DW Pica', serif;
            font-size: 20px;
            color: #fffdf0;
            opacity: 0.85;
          }

          .feature-dot {
            color: #d4a853;
            font-size: 12px;
          }

          /* Image section */
          .image-section {
            position: relative;
            flex-shrink: 0;
          }

          .sint-glow {
            position: absolute;
            width: 380px;
            height: 380px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(244, 205, 96, 0.25) 0%, transparent 70%);
            border-radius: 50%;
            filter: blur(20px);
          }

          .sint-frame {
            position: relative;
            width: 320px;
            height: 320px;
            background: linear-gradient(135deg, #f4cd60 0%, #d4a853 50%, #b8923c 100%);
            border-radius: 50%;
            padding: 8px;
            box-shadow:
              0 10px 40px rgba(0, 0, 0, 0.4),
              0 0 60px rgba(244, 205, 96, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
          }

          .sint-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            border: 4px solid #8b1538;
          }

          .quill-decoration {
            position: absolute;
            bottom: -10px;
            right: -20px;
            font-size: 64px;
            transform: rotate(25deg);
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
          }

          /* Bottom decorative band */
          .bottom-band {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 16px;
            overflow: hidden;
          }

          .band-pattern {
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
              90deg,
              #d4a853 0px,
              #d4a853 30px,
              #f4cd60 30px,
              #f4cd60 60px
            );
          }
        </style>
      </head>
      <body>
        <div class="og-image">
          <!-- Layered background with texture -->
          <div class="bg-texture"></div>
          <div class="bg-vignette"></div>

          <!-- Decorative golden frame -->
          <div class="golden-frame">
            <div class="frame-corner frame-tl"></div>
            <div class="frame-corner frame-tr"></div>
            <div class="frame-corner frame-bl"></div>
            <div class="frame-corner frame-br"></div>
            <div class="frame-edge frame-top"></div>
            <div class="frame-edge frame-bottom"></div>
            <div class="frame-edge frame-left"></div>
            <div class="frame-edge frame-right"></div>
          </div>

          <!-- Floating decorative elements -->
          <div class="floating-elements">
            <span class="float-item float-star-1">✦</span>
            <span class="float-item float-star-2">✧</span>
            <span class="float-item float-star-3">✦</span>
            <span class="float-item float-gift">🎁</span>
            <span class="float-item float-scroll">📜</span>
          </div>

          <!-- Main content area -->
          <div class="content">
            <!-- Left side: Text content -->
            <div class="text-section">
              <!-- Brand logo area -->
              <div class="logo-area">
                <div class="logo-icon">🎅</div>
                <h1 class="brand-name">SintGPT</h1>
              </div>

              <!-- Main headline -->
              <div class="headline-area">
                <p class="pre-headline">ChatGPT kan niet rijmen...</p>
                <h2 class="main-headline">
                  <span class="highlight-line">SintGPT</span>
                  <span class="normal-line">wél!</span>
                </h2>
              </div>

              <!-- Value proposition -->
              <div class="tagline-area">
                <div class="tagline-badge">
                  <span class="badge-icon">⚡</span>
                  <span class="badge-text">Gedicht klaar in 30 seconden</span>
                </div>
              </div>

              <!-- Decorative divider -->
              <div class="divider">
                <span class="divider-line"></span>
                <span class="divider-diamond">◆</span>
                <span class="divider-line"></span>
              </div>

              <!-- Features -->
              <div class="features">
                <span class="feature">✓ Perfect rijm</span>
                <span class="feature-dot">•</span>
                <span class="feature">✓ Persoonlijk</span>
                <span class="feature-dot">•</span>
                <span class="feature">✓ Gratis proberen</span>
              </div>
            </div>

            <!-- Right side: Sinterklaas image -->
            <div class="image-section">
              <div class="sint-glow"></div>
              <div class="sint-frame">
                <img src="${sintImageBase64}" alt="Sinterklaas" class="sint-image">
              </div>
              <!-- Quill decoration -->
              <div class="quill-decoration">🪶</div>
            </div>
          </div>

          <!-- Bottom decorative band -->
          <div class="bottom-band">
            <div class="band-pattern"></div>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html, {
    waitUntil: 'networkidle0',
    timeout: 60000, // Increase timeout for fonts
  });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');

  console.log('Generating screenshot...');

  // Take screenshot
  const outputPath = path.join(__dirname, '../public/og-image.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
    },
  });

  await browser.close();

  console.log(
    '✅ OG image generated successfully at public/og-image.png'
  );
}

generateOgImage().catch(console.error);
