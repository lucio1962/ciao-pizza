// js/checkout-system.js - SISTEMA DI CHECKOUT COMPLETO
class CheckoutSystem {
    constructor() {
        this.currentStep = 1;
        this.orderData = {
            items: [],
            customer: {},
            delivery: {},
            payment: {},
            totals: {},
            metadata: {}
        };
        this.init();
    }

    init() {
        this.loadCartData();
        this.setupEventListeners();
        this.updateOrderSummary();
        this.setupDeliveryOptions();
        this.setupPaymentOptions();
        console.log('💳 Sistema checkout inizializzato');
    }

    // Carica dati dal carrello
    loadCartData() {
        if (window.cartSystem) {
            this.orderData.items = window.cartSystem.cart;
            this.calculateTotals();
        } else {
            this.showError('Impossibile caricare il carrello');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Delivery type change
        document.querySelectorAll('input[name="delivery-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleDeliveryTypeChange(e.target.value);
            });
        });

        // Payment method change
        document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handlePaymentMethodChange(e.target.value);
            });
        });

        // Promo code
        document.getElementById('apply-promo')?.addEventListener('click', () => {
            this.applyPromoCode();
        });

        document.getElementById('promo-code')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyPromoCode();
            }
        });

        // Form validation
        this.setupFormValidation();
    }

    // Setup opzioni consegna
    setupDeliveryOptions() {
        this.handleDeliveryTypeChange('asporto'); // Default
    }

    // Setup opzioni pagamento
    setupPaymentOptions() {
        this.handlePaymentMethodChange('contanti'); // Default
    }

    // Gestione cambio tipo consegna
    handleDeliveryTypeChange(type) {
        const domicilioFields = document.querySelector('.domicilio-fields');
        const deliveryCost = document.getElementById('delivery-cost');

        if (type === 'domicilio') {
            domicilioFields.style.display = 'block';
            deliveryCost.textContent = '€2.50';
            this.orderData.delivery.type = 'domicilio';
            this.orderData.delivery.cost = 2.50;
        } else {
            domicilioFields.style.display = 'none';
            deliveryCost.textContent = 'Gratuita';
            this.orderData.delivery.type = 'asporto';
            this.orderData.delivery.cost = 0;
        }

        this.calculateTotals();
        this.updateOrderSummary();
    }

    // Gestione cambio metodo pagamento
    handlePaymentMethodChange(method) {
        const cardFields = document.querySelector('.card-fields');

        if (method === 'carta') {
            cardFields.style.display = 'block';
        } else {
            cardFields.style.display = 'none';
        }

        this.orderData.payment.method = method;
    }

    // Applica codice promozionale
    applyPromoCode() {
        const promoInput = document.getElementById('promo-code');
        const promoCode = promoInput.value.trim().toUpperCase();
        const discountElement = document.getElementById('discount');

        if (!promoCode) {
            this.showNotification('Inserisci un codice promozionale', 'error');
            return;
        }

        // Codici promozionali validi
        const validPromos = {
            'CALDERINO10': { discount: 10, type: 'percent' },
            'BENVENUTO5': { discount: 5, type: 'euro' },
            'PIZZA2024': { discount: 15, type: 'percent', minOrder: 20 }
        };

        const promo = validPromos[promoCode];

        if (!promo) {
            this.showNotification('Codice promozionale non valido', 'error');
            return;
        }

        // Verifica condizioni
        if (promo.minOrder && this.orderData.totals.subtotal < promo.minOrder) {
            this.showNotification(`Ordine minimo €${promo.minOrder} per questo codice`, 'error');
            return;
        }

        // Calcola sconto
        let discountAmount = 0;
        if (promo.type === 'percent') {
            discountAmount = (this.orderData.totals.subtotal * promo.discount) / 100;
        } else {
            discountAmount = promo.discount;
        }

        // Applica sconto
        this.orderData.totals.discount = discountAmount;
        discountElement.textContent = `-€${discountAmount.toFixed(2)}`;
        discountElement.parentElement.style.display = 'flex';

        this.calculateTotals();
        this.updateOrderSummary();

        this.showNotification(`🎉 Codice applicato! Sconto: €${discountAmount.toFixed(2)}`, 'success');
        promoInput.disabled = true;
        document.getElementById('apply-promo').disabled = true;
    }

    // Calcola totali
    calculateTotals() {
        const subtotal = this.orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const deliveryCost = this.orderData.delivery.cost || 0;
        const discount = this.orderData.totals.discount || 0;
        const grandTotal = subtotal + deliveryCost - discount;

        this.orderData.totals = {
            subtotal,
            delivery: deliveryCost,
            discount,
            grandTotal
        };

        // Aggiorna UI
        document.getElementById('subtotal').textContent = `€${subtotal.toFixed(2)}`;
        document.getElementById('grand-total').textContent = `€${grandTotal.toFixed(2)}`;
    }

    // Aggiorna riepilogo ordine
    updateOrderSummary() {
        const itemsContainer = document.getElementById('checkout-items');
        const miniSummary = document.getElementById('mini-order-summary');

        if (this.orderData.items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="empty-order">
                    <p>Il carrello è vuoto</p>
                    <span>😔</span>
                    <a href="menu.html" class="btn-primary">Sfoglia il Menù</a>
                </div>
            `;
            return;
        }

        // Riepilogo principale
        itemsContainer.innerHTML = this.orderData.items.map(item => `
            <div class="checkout-item">
                <div class="item-image">
                    <img src="assets/images/${item.immagine || 'pizza-default.jpg'}" 
                         alt="${item.nome}">
                </div>
                <div class="item-details">
                    <h4>${item.nome}</h4>
                    <p>Quantità: ${item.quantity}</p>
                </div>
                <div class="item-price">€${item.totalPrice.toFixed(2)}</div>
            </div>
        `).join('');

        // Riepilogo mini
        if (miniSummary) {
            miniSummary.innerHTML = this.orderData.items.slice(0, 3).map(item => `
                <div class="mini-item">
                    <span>${item.quantity}x ${item.nome}</span>
                    <span>€${item.totalPrice.toFixed(2)}</span>
                </div>
            `).join('');

            if (this.orderData.items.length > 3) {
                miniSummary.innerHTML += `<div class="mini-more">+${this.orderData.items.length - 3} altri prodotti</div>`;
            }
        }
    }

    // Setup validazione form
    setupFormValidation() {
        const forms = document.querySelectorAll('.checkout-step form, .checkout-step');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required], select[required]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
        });
    }

    // Validazione campo
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch (field.type) {
            case 'text':
                isValid = value.length >= 2;
                message = 'Inserisci almeno 2 caratteri';
                break;
            case 'tel':
                isValid = /^[+]?[\d\s-]{10,}$/.test(value);
                message = 'Numero di telefono non valido';
                break;
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                message = 'Email non valida';
                break;
            case 'number':
                isValid = !isNaN(value) && value > 0;
                message = 'Inserisci un numero valido';
                break;
        }

        if (field.id === 'card-number') {
            isValid = this.validateCardNumber(value);
            message = 'Numero carta non valido';
        }

        if (field.id === 'card-expiry') {
            isValid = this.validateCardExpiry(value);
            message = 'Data scadenza non valida';
        }

        if (field.id === 'card-cvc') {
            isValid = /^\d{3,4}$/.test(value);
            message = 'CVC non valido';
        }

        this.setFieldValidity(field, isValid, message);
        return isValid;
    }

    // Validazione numero carta
    validateCardNumber(number) {
        // Rimuovi spazi
        number = number.replace(/\s/g, '');
        
        // Algoritmo di Luhn
        let sum = 0;
        let isEven = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number[i], 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    // Validazione scadenza carta
    validateCardExpiry(expiry) {
        const [month, year] = expiry.split('/');
        if (!month || !year) return false;

        const now = new Date();
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        
        return expiryDate > now;
    }

    // Imposta validità campo
    setFieldValidity(field, isValid, message) {
        field.style.borderColor = isValid ? '#2ed573' : '#ff4757';
        
        // Rimuovi messaggio precedente
        const existingMessage = field.parentNode.querySelector('.error-message');
        if (existingMessage) existingMessage.remove();

        if (!isValid) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = message;
            errorMessage.style.cssText = 'color: #ff4757; font-size: 0.8rem; margin-top: 5px;';
            field.parentNode.appendChild(errorMessage);
        }
    }

    // Navigazione tra step
    nextStep(targetStep) {
        if (!this.validateStep(this.currentStep)) {
            this.showNotification('Completa tutti i campi obbligatori', 'error');
            return;
        }

        this.saveStepData(this.currentStep);
        this.showStep(targetStep);
    }

    prevStep(targetStep) {
        this.showStep(targetStep);
    }

    // Mostra step
    showStep(stepNumber) {
        // Nascondi tutti gli step
        document.querySelectorAll('.checkout-step').forEach(step => {
            step.classList.remove('active');
        });

        // Mostra step corrente
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        // Aggiorna progress bar
        document.querySelectorAll('.checkout-steps .step').forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) <= stepNumber) {
                step.classList.add('active');
            }
        });

        this.currentStep = stepNumber;
    }

    // Valida step corrente
    validateStep(step) {
        const currentStep = document.getElementById(`step-${step}`);
        const requiredFields = currentStep.querySelectorAll('input[required], select[required]');
        
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validazioni specifiche per step
        if (step === 3) {
            const consent = document.getElementById('privacy-consent');
            if (!consent.checked) {
                this.showNotification('Devi accettare i termini di servizio', 'error');
                isValid = false;
            }
        }

        return isValid;
    }

    // Salva dati step
    saveStepData(step) {
        switch (step) {
            case 1:
                this.orderData.customer = {
                    name: document.getElementById('customer-name').value,
                    phone: document.getElementById('customer-phone').value,
                    email: document.getElementById('customer-email').value,
                    notes: document.getElementById('order-notes').value
                };

                if (this.orderData.delivery.type === 'domicilio') {
                    this.orderData.delivery.address = document.getElementById('delivery-address').value;
                    this.orderData.delivery.city = document.getElementById('delivery-city').value;
                    this.orderData.delivery.zip = document.getElementById('delivery-zip').value;
                }
                break;

            case 2:
                this.orderData.payment = {
                    method: document.querySelector('input[name="payment-method"]:checked').value,
                    details: {}
                };

                if (this.orderData.payment.method === 'carta') {
                    this.orderData.payment.details = {
                        cardNumber: document.getElementById('card-number').value,
                        expiry: document.getElementById('card-expiry').value,
                        cvc: document.getElementById('card-cvc').value,
                        name: document.getElementById('card-name').value
                    };
                }
                break;
        }
    }

    // Prepara riepilogo ordine
    prepareReview() {
        // Dettagli ordine
        document.getElementById('review-order-details').innerHTML = 
            this.orderData.items.map(item => `
                <div class="review-item">
                    <span>${item.quantity}x ${item.nome}</span>
                    <span>€${item.totalPrice.toFixed(2)}</span>
                </div>
            `).join('') + `
            <div class="review-total">
                <strong>Totale: €${this.orderData.totals.grandTotal.toFixed(2)}</strong>
            </div>
        `;

        // Dettagli consegna
        const deliveryHtml = this.orderData.delivery.type === 'domicilio' ? `
            <p><strong>Indirizzo:</strong> ${this.orderData.delivery.address}</p>
            <p><strong>Città:</strong> ${this.orderData.delivery.city} (${this.orderData.delivery.zip})</p>
            <p><strong>Tipo:</strong> Consegna a domicilio (€${this.orderData.delivery.cost.toFixed(2)})</p>
        ` : `
            <p><strong>Tipo:</strong> Asporto in pizzeria</p>
            <p><strong>Indirizzo:</strong> Via Roma, 123 - Calderino</p>
        `;
        document.getElementById('review-delivery-details').innerHTML = deliveryHtml;

        // Dettagli pagamento
        document.getElementById('review-payment-details').innerHTML = `
            <p><strong>Metodo:</strong> ${this.getPaymentMethodLabel(this.orderData.payment.method)}</p>
        `;

        // Dettagli conferma
        document.getElementById('confirmed-total').textContent = `€${this.orderData.totals.grandTotal.toFixed(2)}`;
        document.getElementById('confirmed-payment').textContent = this.getPaymentMethodLabel(this.orderData.payment.method);
    }

    // Etichetta metodo pagamento
    getPaymentMethodLabel(method) {
        const labels = {
            'contanti': 'Contanti alla consegna',
            'carta': 'Carta di credito',
            'satispay': 'Satispay'
        };
        return labels[method] || method;
    }

    // Conferma ordine
    async placeOrder() {
        if (!this.validateStep(3)) {
            this.showNotification('Completa tutti i campi obbligatori', 'error');
            return;
        }

        this.saveStepData(3);
        this.prepareReview();

        // Animazione caricamento
        const confirmBtn = document.querySelector('.btn-confirm');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '⏳ Elaborazione...';
        confirmBtn.disabled = true;

        try {
            // Simula invio ordine
            await this.submitOrder();
            
            // Genera ID ordine
            const orderId = 'CALD-' + Date.now();
            document.getElementById('order-id').textContent = orderId;
            
            // Salva ordine nel localStorage
            this.orderData.metadata = {
                orderId,
                status: 'confirmed',
                timestamp: new Date().toISOString(),
                estimatedTime: this.calculateEstimatedTime()
            };

            this.saveOrderToHistory();

            // Mostra conferma
            this.showStep(4);

            // Invia notifica
            this.sendOrderNotification();

            // Svuota carrello
            if (window.cartSystem) {
                window.cartSystem.clearCart();
            }

        } catch (error) {
            this.showNotification('Errore durante l\'ordine. Riprova.', 'error');
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }

    // Calcola tempo stimato
    calculateEstimatedTime() {
        const baseTime = 30; // minuti base
        const itemTime = this.orderData.items.length * 2; // 2 minuti per prodotto
        const busyMultiplier = this.isPeakHour() ? 1.5 : 1;
        
        return Math.round((baseTime + itemTime) * busyMultiplier);
    }

    // Verifica ora di punta
    isPeakHour() {
        const now = new Date();
        const hour = now.getHours();
        return (hour >= 19 && hour <= 21) || (hour >= 12 && hour <= 14);
    }

    // Simula invio ordine
    async submitOrder() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simula successo 90% delle volte
                if (Math.random() > 0.1) {
                    resolve({ success: true });
                } else {
                    reject(new Error('Simulated error'));
                }
            }, 2000);
        });
    }

    // Salva ordine nella cronologia
    saveOrderToHistory() {
        const orderHistory = JSON.parse(localStorage.getItem('ciaoCalderinoOrderHistory')) || [];
        orderHistory.unshift(this.orderData);
        localStorage.setItem('ciaoCalderinoOrderHistory', JSON.stringify(orderHistory.slice(0, 10))); // Ultimi 10 ordini
    }

    // Invia notifica ordine
    sendOrderNotification() {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(`🎉 Ordine #${this.orderData.metadata.orderId} confermato!`, 'success');
        }

        // Simula SMS
        if (this.orderData.customer.phone) {
            console.log(`SMS inviato a ${this.orderData.customer.phone}: Il tuo ordine è in preparazione!`);
        }
    }

    // Modifica carrello
    editCart() {
        window.location.href = 'menu.html';
    }

    // Stampa ricevuta
    printOrder() {
        window.print();
    }

    // Notifiche
    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutSystem = new CheckoutSystem();
});
