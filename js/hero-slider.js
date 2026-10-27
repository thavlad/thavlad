// js/hero-slider.js - Clean Slider Engine
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');

function showSlide(index) {
  if (!slides.length) return;
  slides.forEach((s, i) => s.style.display = i === index ? 'block' : 'none');
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

if (slides.length > 0) {
  showSlide(0);
  setInterval(nextSlide, 5000);
}
