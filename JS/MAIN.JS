// js/main.js - FUNZIONALITÀ PRINCIPALI
class CiaoCalderinoApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initAnimations();
        this.setupScrollEffects();
        console.log('🍕 Ciao Calderino - App inizializzata!');
    }

    setupEventListeners() {
        // Smooth scroll per navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Animazione pulsanti
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.animateButton(e.target);
            });
        });

        // Gestione ordini
        this.setupOrderSystem();
    }

    animateButton(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    initAnimations() {
        // Intersection Observer per animazioni on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Osserva gli elementi da animare
        document.querySelectorAll('.glass-card, .feature-card, .pizza-of-the-day').forEach(el => {
            observer.observe(el);
        });
    }

    setupScrollEffects() {
        let lastScrollY = window.scrollY;
        const nav = document.querySelector('.glass-nav');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                nav.style.background = 'rgba(0, 0, 0, 0.9)';
            } else {
                nav.style.background = 'rgba(0, 0, 0, 0.7)';
            }

            // Parallax effect per hero
            const scrolled = window.pageYOffset;
            const parallax = document.querySelector('.hero');
            if (parallax) {
                parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
            }

            lastScrollY = window.scrollY;
        });
    }

    setupOrderSystem() {
        // Gestione pulsante ordina
        const orderButtons = document.querySelectorAll('.btn-order, .btn-primary');
        
        orderButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleOrderClick(e);
            });
        });
    }

    handleOrderClick(e) {
        e.preventDefault();
        
        // Animazione di conferma
        const button = e.target;
        const originalText = button.textContent;
        
        button.textContent = '🎉 Aggiunto!';
        button.style.background = '#2ed573';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            
            // Reindirizza alla pagina ordini
            window.location.href = 'ordina-online.html';
        }, 1000);
    }

    // Gestione notifiche
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Gestione carrello
    setupCart() {
        this.cart = JSON.parse(localStorage.getItem('ciaoCalderinoCart')) || [];
        this.updateCartCounter();
    }

    addToCart(item) {
        this.cart.push(item);
        localStorage.setItem('ciaoCalderinoCart', JSON.stringify(this.cart));
        this.updateCartCounter();
        this.showNotification('🍕 Prodotto aggiunto al carrello!');
    }

    updateCartCounter() {
        const counter = document.getElementById('cart-counter');
        if (counter) {
            counter.textContent = this.cart.length;
            counter.style.display = this.cart.length > 0 ? 'block' : 'none';
        }
    }

    // Gestione WiFi detection per QR code
    setupWifiDetection() {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }
    }

    handleConnectionChange() {
        if (navigator.onLine) {
            this.showNotification('📡 Connesso al WiFi della pizzeria!', 'info');
        }
    }
}

// Utility functions
const Utils = {
    // Formattazione prezzi
    formatPrice(price) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    },

    // Debounce per performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Animazione countdown numbers
    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current.toString().padStart(2, '0');
            
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }
};

// Inizializzazione app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CiaoCalderinoApp();
});

// Gestione errori globale
window.addEventListener('error', (e) => {
    console.error('Errore globale:', e.error);
});

// Service Worker per funzionalità offline (opzionale)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrato:', registration);
            })
            .catch(error => {
                console.log('SW registrazione fallita:', error);
            });
    });
}
