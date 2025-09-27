// utils/price-calculator.js - MOTORE DI CALCOLO PREZZI E SCONTI
class PriceCalculator {
    constructor() {
        this.taxRate = 0.00; // IVA inclusa nei prezzi
        this.currency = 'EUR';
        this.rounding = 2; // Decimali
        this.init();
    }

    init() {
        console.log('💰 PriceCalculator inizializzato');
    }

    // CALCOLO BASE PREZZI

    // Calcola totale carrello
    calculateCartTotal(cartItems, deliveryCost = 0, discount = 0) {
        const subtotal = this.calculateSubtotal(cartItems);
        const totalBeforeTax = subtotal + deliveryCost - discount;
        const taxAmount = this.calculateTax(totalBeforeTax);
        const grandTotal = totalBeforeTax + taxAmount;

        return {
            subtotal: this.roundPrice(subtotal),
            delivery: this.roundPrice(deliveryCost),
            discount: this.roundPrice(discount),
            tax: this.roundPrice(taxAmount),
            total: this.roundPrice(grandTotal),
            currency: this.currency
        };
    }

    // Calcola subtotale
    calculateSubtotal(cartItems) {
        if (!cartItems || !Array.isArray(cartItems)) return 0;

        return cartItems.reduce((total, item) => {
            const itemTotal = this.calculateItemTotal(item);
            return total + itemTotal;
        }, 0);
    }

    // Calcola totale per item
    calculateItemTotal(item) {
        if (!item || !item.prezzo || !item.quantity) return 0;

        const basePrice = this.parsePrice(item.prezzo);
        const quantity = parseInt(item.quantity) || 1;
        
        return basePrice * quantity;
    }

    // Calcola tasse
    calculateTax(amount) {
        return amount * (this.taxRate / 100);
    }

    // SCONTI E PROMOZIONI

    // Applica codice sconto
    applyPromoCode(subtotal, promoCode, cartItems = []) {
        const promotion = this.validatePromoCode(promoCode, subtotal, cartItems);
        
        if (!promotion.valid) {
            return {
                valid: false,
                discount: 0,
                message: promotion.message,
                newTotal: subtotal
            };
        }

        const discount = this.calculateDiscount(subtotal, promotion);
        const newTotal = subtotal - discount;

        return {
            valid: true,
            discount: this.roundPrice(discount),
            message: promotion.successMessage,
            promotion: promotion,
            newTotal: this.roundPrice(newTotal)
        };
    }

    // Valida codice promozionale
    validatePromoCode(promoCode, subtotal, cartItems) {
        const promotions = this.getAvailablePromotions();
        const promotion = promotions.find(p => 
            p.codice === promoCode.toUpperCase() || 
            p.id === promoCode.toLowerCase()
        );

        if (!promotion) {
            return { valid: false, message: 'Codice promozionale non valido' };
        }

        if (!promotion.disponibile) {
            return { valid: false, message: 'Promozione non disponibile' };
        }

        if (promotion.ordine_minimo && subtotal < promotion.ordine_minimo) {
            return { 
                valid: false, 
                message: `Ordine minimo €${promotion.ordine_minimo} per questa promozione` 
            };
        }

        if (promotion.prodotti_validi && cartItems.length > 0) {
            const validProducts = cartItems.some(item => 
                promotion.prodotti_validi.includes(item.id)
            );
            if (!validProducts) {
                return { valid: false, message: 'Promozione non valida per i prodotti selezionati' };
            }
        }

        // Verifica validità temporale
        if (!this.isPromotionActive(promotion)) {
            return { valid: false, message: 'Promozione scaduta' };
        }

        return {
            valid: true,
            ...promotion,
            successMessage: this.generateSuccessMessage(promotion)
        };
    }

    // Calcola sconto in base al tipo
    calculateDiscount(amount, promotion) {
        switch (promotion.tipo) {
            case 'percentuale':
                return amount * (promotion.valore / 100);
            
            case 'fisso':
                return Math.min(promotion.valore, amount); // Non più del totale
            
            case 'consegna_gratuita':
                return promotion.valore; // Importo fisso consegna
                
            case 'prodotto_omaggio':
                return this.calculateFreeProductValue(promotion);
                
            default:
                return 0;
        }
    }

    // CONSEGNE E COSTI AGGIUNTIVI

    // Calcola costo consegna
    calculateDeliveryCost(subtotal, deliveryType, distance = null) {
        const settings = window.getConfig ? window.getConfig('settings') : null;
        const baseCost = settings?.consegne?.costo_consegna || 2.50;
        const freeThreshold = settings?.consegne?.soglia_gratuita || 25.00;

        if (deliveryType === 'asporto') {
            return 0;
        }

        if (subtotal >= freeThreshold) {
            return 0;
        }

        // Costo extra per distanza
        let extraCost = 0;
        if (distance && distance > 5) { // Oltre 5km
            extraCost = (distance - 5) * 0.5; // €0.50 per km extra
        }

        return this.roundPrice(baseCost + extraCost);
    }

    // Calcola tempo di consegna stimato
    estimateDeliveryTime(orderSize, distance, isPeakHour) {
        let baseTime = 25; // minuti base
        let sizeMultiplier = orderSize * 2; // 2 minuti per prodotto
        let distanceMultiplier = distance * 3; // 3 minuti per km
        let peakMultiplier = isPeakHour ? 1.5 : 1;

        return Math.round((baseTime + sizeMultiplier + distanceMultiplier) * peakMultiplier);
    }

    // OFFERTE SPECIALI

    // Calcola offerta pizza del giorno
    calculateDailyPizzaOffer(basePrice, originalPrice) {
        const offer = window.getTodaysOffer ? window.getTodaysOffer() : null;
        
        if (!offer || !offer.disponibile) {
            return { discountedPrice: basePrice, discount: 0 };
        }

        const discount = originalPrice * (offer.sconto_percentuale / 100);
        const discountedPrice = originalPrice - discount;

        return {
            discountedPrice: this.roundPrice(discountedPrice),
            discount: this.roundPrice(discount),
            discountPercent: offer.sconto_percentuale,
            badge: offer.badge
        };
    }

    // Calcola combo offer
    calculateComboPrice(comboId, individualPrices) {
        const combos = this.getAvailableCombos();
        const combo = combos.find(c => c.id === comboId);

        if (!combo) {
            return individualPrices.reduce((sum, price) => sum + price, 0);
        }

        const individualTotal = individualPrices.reduce((sum, price) => sum + price, 0);
        const discount = individualTotal * (combo.sconto_percentuale / 100);
        const comboPrice = individualTotal - discount;

        return {
            comboPrice: this.roundPrice(comboPrice),
            discount: this.roundPrice(discount),
            savings: this.roundPrice(discount),
            savingsPercent: combo.sconto_percentuale
        };
    }

    // FIDELITY PROGRAM

    // Calcola punti fedeltà
    calculateLoyaltyPoints(orderTotal) {
        const pointsPerEuro = 1; // 1 punto per ogni euro
        return Math.floor(orderTotal * pointsPerEuro);
    }

    // Verifica premi fedeltà
    checkLoyaltyReward(pointsBalance) {
        const rewards = [
            { points: 100, reward: "Caffè omaggio", value: 1.50 },
            { points: 500, reward: "Bibita omaggio", value: 3.00 },
            { points: 1000, reward: "Pizza margherita omaggio", value: 8.50 }
        ];

        return rewards.filter(reward => pointsBalance >= reward.points)
                     .sort((a, b) => b.points - a.points)[0];
    }

    // UTILITY FUNCTIONS

    // Arrotonda prezzo
    roundPrice(amount) {
        const factor = Math.pow(10, this.rounding);
        return Math.round(amount * factor) / factor;
    }

    // Parsifica prezzo (gestisce stringhe e numeri)
    parsePrice(price) {
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
            // Rimuovi simboli currency e converte in numero
            return parseFloat(price.replace(/[^\d,.-]/g, '').replace(',', '.'));
        }
        return 0;
    }

    // Formatta prezzo per display
    formatPrice(amount, currency = this.currency) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }

    // Genera messaggio successo sconto
    generateSuccessMessage(promotion) {
        const messages = {
            'percentuale': `Sconto del ${promotion.valore}% applicato!`,
            'fisso': `Sconto di €${promotion.valore} applicato!`,
            'consegna_gratuita': 'Consegna gratuita applicata!',
            'prodotto_omaggio': `Prodotto omaggio: ${promotion.prodotto_omaggio}`
        };

        return messages[promotion.tipo] || 'Sconto applicato!';
    }

    // DATA GETTERS (dovrebbero venire dal config)

    getAvailablePromotions() {
        // In produzione, questi dati verrebbero dal config loader
        return [
            {
                id: 'benvenuto10',
                codice: 'BENVENUTO10',
                tipo: 'percentuale',
                valore: 10,
                ordine_minimo: 0,
                disponibile: true,
                solo_primo_ordine: true
            },
            {
                id: 'consegna_gratuita',
                codice: null,
                tipo: 'consegna_gratuita',
                valore: 2.50,
                ordine_minimo: 25.00,
                disponibile: true
            },
            {
                id: 'estate2024',
                codice: 'ESTATE24',
                tipo: 'percentuale',
                valore: 15,
                ordine_minimo: 30.00,
                disponibile: true,
                validita: '2024-06-01/2024-08-31'
            }
        ];
    }

    getAvailableCombos() {
        return [
            {
                id: 'combo_famiglia',
                nome: 'Combo Famiglia',
                sconto_percentuale: 15,
                prodotti: ['pizza_margherita', 'patatine_fritte', 'bibita']
            },
            {
                id: 'combo_coppia',
                nome: 'Combo Coppia',
                sconto_percentuale: 12,
                prodotti: ['pizza_speciale', 'vino']
            }
        ];
    }

    isPromotionActive(promotion) {
        if (!promotion.validita) return true;

        const [start, end] = promotion.validita.split('/');
        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);

        return now >= startDate && now <= endDate;
    }

    calculateFreeProductValue(promotion) {
        // Qui si potrebbe cercare il prezzo del prodotto nel menu
        return promotion.valore || 0;
    }

    // STATISTICHE E ANALISI

    // Calcola risparmio medio per ordine
    calculateAverageSavings(orders) {
        if (!orders || orders.length === 0) return 0;

        const totalSavings = orders.reduce((sum, order) => {
            return sum + (order.discount || 0);
        }, 0);

        return this.roundPrice(totalSavings / orders.length);
    }

    // Analizza efficacia promozioni
    analyzePromotionEffectiveness(orders, promotionCode) {
        const promotionOrders = orders.filter(order => 
            order.promotionCode === promotionCode
        );

        const totalRevenue = promotionOrders.reduce((sum, order) => sum + order.total, 0);
        const totalDiscount = promotionOrders.reduce((sum, order) => sum + (order.discount || 0), 0);
        const averageOrderValue = promotionOrders.length > 0 ? totalRevenue / promotionOrders.length : 0;

        return {
            ordersCount: promotionOrders.length,
            totalRevenue: this.roundPrice(totalRevenue),
            totalDiscount: this.roundPrice(totalDiscount),
            averageOrderValue: this.roundPrice(averageOrderValue),
            redemptionRate: orders.length > 0 ? promotionOrders.length / orders.length : 0
        };
    }
}

// Crea istanza globale
const priceCalculator = new PriceCalculator();

// Shortcut globali
window.calculateTotal = (items, delivery, discount) => 
    priceCalculator.calculateCartTotal(items, delivery, discount);

window.applyPromo = (subtotal, code, items) => 
    priceCalculator.applyPromoCode(subtotal, code, items);

window.formatPrice = (amount) => priceCalculator.formatPrice(amount);

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PriceCalculator;
}

// Esempi di utilizzo:
/*
const cart = [
    { prezzo: 8.50, quantity: 2 },
    { prezzo: 3.00, quantity: 1 }
];

const total = priceCalculator.calculateCartTotal(cart, 2.50, 0);
console.log('Totale:', total);

const promoResult = priceCalculator.applyPromoCode(total.subtotal, 'BENVENUTO10', cart);
console.log('Risultato promozione:', promoResult);
*/
