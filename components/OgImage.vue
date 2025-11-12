<template>
  <div class="og-image">
    <div class="content">
      <div class="text-content">
        <h1 class="title">SintGPT</h1>
        <p class="description">
          ChatGPT kan geen leuke Sinterklaasgedichten schrijven.
          <br />
          SintGPT wel!
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
.og-image {
  width: 1200px;
  height: 630px;
  background: rgb(127, 29, 29); /* bg-red-900 */
  padding: 80px;
  display: flex;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
  color: rgb(244, 205, 96); /* text-[rgb(244,205,96)] from header */
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
