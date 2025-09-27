// js/daily-pizza.js - SISTEMA PIZZA DEL GIORNO CON COUNTDOWN
class DailyPizzaSystem {
    constructor() {
        this.dailyPizzas = this.getDailyPizzas();
        this.currentPizza = null;
        this.countdownInterval = null;
        this.init();
    }

    // Database pizze del giorno
    getDailyPizzas() {
        return {
            0: { // Domenica
                name: "🏡 Domenica in Famiglia",
                ingredients: "Mozzarella di bufala, prosciutto crudo DOP, funghi porcini, rucola fresca",
                price: 16.00,
                originalPrice: 19.50,
                badge: "👨‍👩‍👧‍👦 FAMILY SIZE",
                image: "domenica-special.jpg",
                discount: 18
            },
            1: { // Lunedì
                name: "⚡ Lunedì Energy",
                ingredients: "Mozzarella, salsiccia di maiale nero, friarielli croccanti, provola affumicata",
                price: 13.50,
                originalPrice: 16.00,
                badge: "🔥 FORNO A LEGNA",
                image: "lunedi-energy.jpg",
                discount: 15
            },
            2: { // Martedì
                name: "💫 Serata Speciale",
                ingredients: "Mozzarella di bufala, crudo di Parma, scaglie di parmigiano, rucola, aceto balsamico",
                price: 14.00,
                originalPrice: 17.00,
                badge: "✨ PREMIUM",
                image: "serata-speciale.jpg",
                discount: 18
            },
            3: { // Mercoledì
                name: "🎯 Metà Settimana",
                ingredients: "Mozzarella, cotechino, verza stufata, grana padano",
                price: 12.50,
                originalPrice: 15.00,
                badge: "🍝 TRADIZIONE BOLOGNESE",
                image: "meta-settimana.jpg",
                discount: 17
            },
            4: { // Giovedì
                name: "🌟 Aspettando il Weekend",
                ingredients: "Mozzarella, mortadella DOP, pistacchi di Bronte, burrata cremosa",
                price: 15.50,
                originalPrice: 18.50,
                badge: "👑 GOURMET",
                image: "weekend-special.jpg",
                discount: 16
            },
            5: { // Venerdì
                name: "🌊 Voglia di Mare",
                ingredients: "Mozzarella, gamberi freschi, zucchine, pomodorini confit, prezzemolo",
                price: 17.00,
                originalPrice: 20.00,
                badge: "🐟 SPECIALITÀ DI MARE",
                image: "pizza-mare.jpg",
                discount: 15
            },
            6: { // Sabato
                name: "🎉 Sabato Italiano",
                ingredients: "Mozzarella, tartufo nero, funghi porcini, salsiccia, scaglie di grana",
                price: 18.00,
                originalPrice: 22.00,
                badge: "💎 LIMITED EDITION",
                image: "sabato-italiano.jpg",
                discount: 18
            }
        };
    }

    init() {
        this.updateDailyPizza();
        this.startCountdown();
        this.setupPizzaAnimation();
    }

    // Ottiene il giorno della settimana (0=Domenica, 1=Lunedì, etc.)
    getCurrentDay() {
        return new Date().getDay();
    }

    // Aggiorna la pizza del giorno in base al giorno corrente
    updateDailyPizza() {
        const today = this.getCurrentDay();
        this.currentPizza = this.dailyPizzas[today];
        
        this.updatePizzaDisplay();
    }

    // Aggiorna l'interfaccia con la pizza del giorno
    updatePizzaDisplay() {
        if (!this.currentPizza) return;

        // Aggiorna nome
        const nameElement = document.getElementById('daily-pizza-name');
        if (nameElement) {
            nameElement.textContent = this.currentPizza.name;
        }

        // Aggiorna ingredienti
        const ingredientsElement = document.getElementById('daily-pizza-ingredients');
        if (ingredientsElement) {
            ingredientsElement.textContent = this.currentPizza.ingredients;
        }

        // Aggiorna prezzi
        const priceElement = document.getElementById('daily-pizza-price');
        const originalPriceElement = document.getElementById('daily-original-price');
        
        if (priceElement) {
            priceElement.textContent = `€${this.currentPizza.price.toFixed(2)}`;
        }
        if (originalPriceElement) {
            originalPriceElement.textContent = `€${this.currentPizza.originalPrice.toFixed(2)}`;
        }

        // Aggiorna immagine (placeholder per ora)
        const imgElement = document.getElementById('daily-pizza-img');
        if (imgElement) {
            imgElement.alt = this.currentPizza.name;
            // imgElement.src = `assets/images/${this.currentPizza.image}`;
        }

        // Aggiorna badge
        this.updatePizzaBadge();
    }

    updatePizzaBadge() {
        const badgeElement = document.querySelector('.pizza-badge');
        if (badgeElement && this.currentPizza) {
            badgeElement.innerHTML = `
                ${this.currentPizza.badge} 
                <span class="discount">-${this.currentPizza.discount}%</span>
            `;
        }
    }

    // Countdown per la pizza del giorno (scade a mezzanotte)
    startCountdown() {
        this.updateCountdown(); // Aggiorna immediatamente
        
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    updateCountdown() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Imposta a mezzanotte
        
        const diff = midnight - now;
        
        if (diff <= 0) {
            // È mezzanotte, cambia pizza del giorno
            clearInterval(this.countdownInterval);
            this.updateDailyPizza();
            this.startCountdown();
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        this.animateCountdown(hours, minutes, seconds);
    }

    // Animazione fluida del countdown
    animateCountdown(hours, minutes, seconds) {
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');

        if (hoursElement) {
            this.flipNumber(hoursElement, hours.toString().padStart(2, '0'));
        }
        if (minutesElement) {
            this.flipNumber(minutesElement, minutes.toString().padStart(2, '0'));
        }
        if (secondsElement) {
            this.flipNumber(secondsElement, seconds.toString().padStart(2, '0'));
        }
    }

    // Effetto flip per i numeri del countdown
    flipNumber(element, newValue) {
        if (element.textContent === newValue) return;

        const currentValue = element.textContent;
        
        // Crea effetto flip
        element.style.transform = 'rotateX(90deg)';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'rotateX(0deg)';
        }, 150);
    }

    // Animazioni speciali per la pizza del giorno
    setupPizzaAnimation() {
        const pizzaCard = document.querySelector('.pizza-of-the-day');
        if (pizzaCard) {
            pizzaCard.addEventListener('mouseenter', this.animatePizzaCard.bind(this));
            pizzaCard.addEventListener('click', this.pulseAnimation.bind(this));
        }
    }

    animatePizzaCard() {
        const pizzaImage = document.querySelector('.pizza-image img');
        if (pizzaImage) {
            pizzaImage.style.transform = 'scale(1.05) rotate(2deg)';
        }
    }

    pulseAnimation() {
        const card = document.querySelector('.pizza-of-the-day');
        if (card) {
            card.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.6)';
            setTimeout(() => {
                card.style.boxShadow = '';
            }, 600);
        }
    }

    // Metodo per ordinare la pizza del giorno
    orderDailyPizza() {
        if (!this.currentPizza) return;

        const orderData = {
            type: 'daily_pizza',
            pizza: this.currentPizza.name,
            price: this.currentPizza.price,
            ingredients: this.currentPizza.ingredients,
            timestamp: new Date().toISOString()
        };

        // Salva nel localStorage o invia al server
        this.saveOrder(orderData);
        
        // Mostra conferma
        this.showOrderConfirmation();
    }

    saveOrder(orderData) {
        const orders = JSON.parse(localStorage.getItem('dailyPizzaOrders')) || [];
        orders.push(orderData);
        localStorage.setItem('dailyPizzaOrders', JSON.stringify(orders));
    }

    showOrderConfirmation() {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(`🎉 ${this.currentPizza.name} aggiunta all'ordine!`);
        }
        
        // Animazione speciale
        const button = document.querySelector('.btn-order');
        if (button) {
            button.classList.add('order-success');
            setTimeout(() => {
                button.classList.remove('order-success');
            }, 2000);
        }
    }

    // Metodo per ottenere statistiche (per admin)
    getDailyStats() {
        const orders = JSON.parse(localStorage.getItem('dailyPizzaOrders')) || [];
        const today = new Date().toDateString();
        
        return orders.filter(order => {
            const orderDate = new Date(order.timestamp).toDateString();
            return orderDate === today;
        }).length;
    }

    // Cleanup
    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.dailyPizzaSystem = new DailyPizzaSystem();
});

// Export per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyPizzaSystem;
}
