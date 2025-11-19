<template>
  <div class="og-image">
    <!-- Decorative corner elements -->
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="content">
      <div class="text-content">
        <h1 class="title">SintGPT</h1>
        <p class="description">
          ChatGPT kan geen leuke Sinterklaasgedichten schrijven.
          <br />
          <span class="highlight">SintGPT wel!</span>
        </p>
        <p class="tagline">
          Snel & makkelijk. <br />Klaar binnen 30 seconden!
        </p>
      </div>

      <div class="image-container">
        <img src="/sint.png" alt="Sinterklaas" class="sint-image" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@400;700;900&family=IM+Fell+DW+Pica+SC&family=IM+Fell+DW+Pica:ital@0;1&display=swap');

.og-image {
  width: 1200px;
  height: 630px;
  background-color: #7f1d1d; /* Red-900 */
  background-image:
    radial-gradient(#f4cd60 1px, transparent 1px),
    radial-gradient(#f4cd60 1px, transparent 1px);
  background-size: 50px 50px;
  background-position:
    0 0,
    25px 25px;
  padding: 80px;
  display: flex;
  position: relative;
  overflow: hidden;
  border: 16px solid #f4cd60;
  box-sizing: border-box;
}

/* Corner Decorations */
.corner {
  position: absolute;
  width: 100px;
  height: 100px;
  background: #f4cd60;
  transform: rotate(45deg);
  z-index: 1;
}

.corner-tl {
  top: -50px;
  left: -50px;
}

.corner-tr {
  top: -50px;
  right: -50px;
}

.corner-bl {
  bottom: -50px;
  left: -50px;
}

.corner-br {
  bottom: -50px;
  right: -50px;
}

.content {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  position: relative;
  z-index: 2;
}

.text-content {
  display: flex;
  flex-direction: column;
  max-width: 650px;
  flex: 1;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: 110px;
  font-weight: 900;
  color: #f4cd60;
  margin: 0 0 30px 0;
  line-height: 0.9;
  text-shadow: 4px 4px 0px rgba(0, 0, 0, 0.3);
}

.description {
  font-family: 'Cinzel', serif;
  font-size: 36px;
  font-weight: 700;
  color: #fffdf0;
  margin: 0 0 30px 0;
  line-height: 1.3;
  text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3);
}

.highlight {
  color: #f4cd60;
  font-size: 1.2em;
  text-decoration: underline;
  text-decoration-color: #f4cd60;
  text-underline-offset: 8px;
}

.tagline {
  font-family: 'IM Fell DW Pica', serif;
  font-size: 38px;
  font-weight: 600;
  color: #fffdf0;
  margin: 0;
  line-height: 1.4;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px 24px;
  border-radius: 12px;
  border-left: 6px solid #f4cd60;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.image-container::before {
  content: '';
  position: absolute;
  inset: -10px;
  background: #f4cd60;
  border-radius: 50%;
  opacity: 0.3;
  filter: blur(10px);
}

.sint-image {
  width: 400px;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 8px solid #f4cd60;
  transform: rotate(3deg);
}
</style>
