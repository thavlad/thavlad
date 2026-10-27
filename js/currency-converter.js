// js/currency-converter.js

class CurrencyConverter {
    constructor() {
        // Base currency is USD ($) with sample exchange rates
        this.rates = {
            USD: 1.00,
            EUR: 0.92,
            GBP: 0.79,
            CAD: 1.35
        };
        this.currentCurrency = localStorage.getItem('selected_currency') || 'USD';
        this.init();
    }

    init() {
        this.updateUI();
        this.attachEventListeners();
        this.convertAllPrices();
    }

    setCurrency(currency) {
        if (this.rates[currency]) {
            this.currentCurrency = currency;
            localStorage.setItem('selected_currency', currency);
            this.convertAllPrices();
            this.updateUI();
        }
    }

    convertPrice(amountInUSD) {
        const rate = this.rates[this.currentCurrency] || 1.00;
        const converted = amountInUSD * rate;
        
        const symbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            CAD: 'CA$'
        };

        const symbol = symbols[this.currentCurrency] || '$';
        return `${symbol}${converted.toFixed(2)}`;
    }

    convertAllPrices() {
        document.querySelectorAll('[data-price-usd]').forEach(el => {
            const usdPrice = parseFloat(el.getAttribute('data-price-usd'));
            el.textContent = this.convertPrice(usdPrice);
        });
    }

    updateUI() {
        const selector = document.getElementById('currency-selector');
        if (selector) {
            selector.value = this.currentCurrency;
        }
    }

    attachEventListeners() {
        const selector = document.getElementById('currency-selector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.setCurrency(e.target.value);
            });
        }
    }
}

// Global instance
const currencyConverter = new CurrencyConverter();
