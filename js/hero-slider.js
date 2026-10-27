// js/hero-slider.js

class HeroSlider {
    constructor() {
        this.slides = document.querySelectorAll('.hero-slide');
        this.currentIndex = 0;
        this.intervalTime = 5000; // Change slide every 5 seconds
        this.timer = null;

        if (this.slides.length > 0) {
            this.init();
        }
    }

    init() {
        this.showSlide(this.currentIndex);
        this.startAutoPlay();

        // Optional next/prev button bindings
        const nextBtn = document.getElementById('slider-next');
        const prevBtn = document.getElementById('slider-prev');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
    }

    showSlide(index) {
        this.slides.forEach((slide, i) => {
            slide.style.display = (i === index) ? 'block' : 'none';
        });
    }

    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this.showSlide(this.currentIndex);
        this.resetAutoPlay();
    }

    prevSlide() {
        this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.showSlide(this.currentIndex);
        this.resetAutoPlay();
    }

    startAutoPlay() {
        this.timer = setInterval(() => {
            this.nextSlide();
        }, this.intervalTime);
    }

    resetAutoPlay() {
        clearInterval(this.timer);
        this.startAutoPlay();
    }
}

// Global instance
const heroSlider = new HeroSlider();
