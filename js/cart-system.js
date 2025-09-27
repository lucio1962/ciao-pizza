// js/cart-system.js - SISTEMA CARRELLO CON ANIMAZIONI "VOLANTI"
class CartSystem {
    constructor() {
        this.cart = this.loadCart();
        this.isCartOpen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartCounter();
        this.renderCartItems();
        console.log('🛒 Sistema carrello inizializzato');
    }

    // Carica carrello dal localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem('ciaoCalderinoCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Errore nel caricamento del carrello:', error);
            return [];
        }
    }

    // Salva carrello nel localStorage
    saveCart() {
        try {
            localStorage.setItem('ciaoCalderinoCart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Errore nel salvataggio del carrello:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Toggle carrello
        document.querySelector('.cart-icon')?.addEventListener('click', () => {
            this.toggleCart();
        });

        // Chiudi carrello
        document.getElementById('close-cart')?.addEventListener('click', () => {
            this.closeCart();
        });

        // Overlay click
        document.getElementById('cart-overlay')?.addEventListener('click', () => {
            this.closeCart();
        });

        // Checkout
        document.getElementById('checkout-btn')?.addEventListener('click', () => {
            this.handleCheckout();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isCartOpen) {
                this.closeCart();
            }
        });
    }

    // Aggiungi prodotto al carrello con animazione
    addToCart(product, quantity = 1) {
        // Crea elemento animato che "vola" verso il carrello
        this.createFlyingProduct(product);

        // Trova se il prodotto è già nel carrello
        const existingItemIndex = this.cart.findIndex(item => 
            item.id === product.id && item.categoria === (product.categoria || 'generale')
        );

        if (existingItemIndex > -1) {
            // Aggiorna quantità
            this.cart[existingItemIndex].quantity += quantity;
            this.cart[existingItemIndex].totalPrice = 
                this.cart[existingItemIndex].quantity * product.prezzo;
        } else {
            // Aggiungi nuovo prodotto
            const cartItem = {
                ...product,
                quantity: quantity,
                totalPrice: product.prezzo * quantity,
                addedAt: new Date().toISOString(),
                categoria: product.categoria || 'generale'
            };
            this.cart.push(cartItem);
        }

        this.saveCart();
        this.updateCartCounter();
        this.renderCartItems();
        
        // Mostra notifica
        this.showAddNotification(product);
    }

    // Crea animazione prodotto che vola verso il carrello
    createFlyingProduct(product) {
        const flyingProduct = document.createElement('div');
        flyingProduct.className = 'flying-product';
        flyingProduct.innerHTML = '🍕';
        flyingProduct.style.cssText = `
            position: fixed;
            z-index: 10000;
            font-size: 2rem;
            pointer-events: none;
            transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;

        // Posizione iniziale (dove è stato cliccato il bottone)
        const button = event?.target || document.querySelector('.add-to-cart-btn');
        const rect = button.getBoundingClientRect();
        flyingProduct.style.left = rect.left + rect.width / 2 + 'px';
        flyingProduct.style.top = rect.top + 'px';

        document.body.appendChild(flyingProduct);

        // Posizione finale (icona carrello)
        const cartIcon = document.querySelector('.cart-icon');
        const cartRect = cartIcon.getBoundingClientRect();
        const finalX = cartRect.left + cartRect.width / 2;
        const finalY = cartRect.top + cartRect.height / 2;

        // Animazione
        setTimeout(() => {
            flyingProduct.style.left = finalX + 'px';
            flyingProduct.style.top = finalY + 'px';
            flyingProduct.style.transform = 'scale(0.5) rotate(360deg)';
            flyingProduct.style.opacity = '0';
        }, 10);

        // Rimuovi elemento dopo l'animazione
        setTimeout(() => {
            flyingProduct.remove();
        }, 800);
    }

    // Rimuovi prodotto dal carrello
    removeFromCart(itemId, categoria) {
        this.cart = this.cart.filter(item => 
            !(item.id === itemId && item.categoria === categoria)
        );
        
        this.saveCart();
        this.updateCartCounter();
        this.renderCartItems();
        this.showRemoveNotification();
    }

    // Aggiorna quantità prodotto
    updateQuantity(itemId, categoria, newQuantity) {
        if (newQuantity <= 0) {
            this.removeFromCart(itemId, categoria);
            return;
        }

        const itemIndex = this.cart.findIndex(item => 
            item.id === itemId && item.categoria === categoria
        );

        if (itemIndex > -1) {
            this.cart[itemIndex].quantity = newQuantity;
            this.cart[itemIndex].totalPrice = 
                this.cart[itemIndex].quantity * this.cart[itemIndex].prezzo;
            
            this.saveCart();
            this.renderCartItems();
        }
    }

    // Svuota carrello
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCounter();
        this.renderCartItems();
        this.showClearNotification();
    }

    // Aggiorna contatore carrello
    updateCartCounter() {
        const counter = document.getElementById('cart-counter');
        const totalItems = this.getTotalItems();
        
        if (counter) {
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'flex' : 'none';
            
            // Animazione contatore
            if (totalItems > 0) {
                counter.classList.add('bounce');
                setTimeout(() => counter.classList.remove('bounce'), 300);
            }
        }
    }

    // Renderizza items nel carrello
    renderCartItems() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const emptyCart = document.querySelector('.empty-cart');
        const cartTotal = document.getElementById('cart-total-price');

        if (!cartItemsContainer) return;

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <p>Il carrello è vuoto</p>
                    <span>🥺</span>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = '€0.00';
            return;
        }

        // Rimuovi empty cart
        if (emptyCart) emptyCart.remove();

        // Renderizza items
        cartItemsContainer.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-id="${item.id}" data-category="${item.categoria}">
                <div class="item-image">
                    <img src="assets/images/${item.immagine || 'pizza-default.jpg'}" 
                         alt="${item.nome}" 
                         onerror="this.src='assets/images/pizza-default.jpg'">
                </div>
                
                <div class="item-info">
                    <h4 class="item-name">${item.nome}</h4>
                    <p class="item-price">€${item.prezzo.toFixed(2)}</p>
                </div>
                
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" 
                                onclick="cartSystem.updateQuantity('${item.id}', '${item.categoria}', ${item.quantity - 1})">−</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" 
                                onclick="cartSystem.updateQuantity('${item.id}', '${item.categoria}', ${item.quantity + 1})">+</button>
                    </div>
                    
                    <div class="item-total">
                        €${item.totalPrice.toFixed(2)}
                    </div>
                    
                    <button class="remove-btn" 
                            onclick="cartSystem.removeFromCart('${item.id}', '${item.categoria}')">🗑️</button>
                </div>
            </div>
        `).join('');

        // Aggiorna totale
        if (cartTotal) {
            cartTotal.textContent = `€${this.getTotalPrice().toFixed(2)}`;
        }
    }

    // Calcola totale carrello
    getTotalPrice() {
        return this.cart.reduce((total, item) => total + item.totalPrice, 0);
    }

    // Calcola totale items
    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Toggle apertura/chiusura carrello
    toggleCart() {
        if (this.isCartOpen) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    // Apri carrello
    openCart() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');

        if (sidebar && overlay) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            this.isCartOpen = true;
            
            // Disabilita scroll body
            document.body.style.overflow = 'hidden';
        }
    }

    // Chiudi carrello
    closeCart() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');

        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            this.isCartOpen = false;
            
            // Riabilita scroll body
            document.body.style.overflow = '';
        }
    }

    // Gestione checkout
    handleCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Il carrello è vuoto!', 'error');
            return;
        }

        // Animazione checkout
        this.animateCheckout();

        // Reindirizza alla pagina ordini
        setTimeout(() => {
            window.location.href = 'ordina-online.html';
        }, 1000);
    }

    // Animazione checkout
    animateCheckout() {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (!checkoutBtn) return;

        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = '🎉 Ordinando...';
        checkoutBtn.disabled = true;

        // Animazione pulsante
        checkoutBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            checkoutBtn.style.transform = 'scale(1)';
        }, 300);

        // Ripristina dopo animazione
        setTimeout(() => {
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }, 2000);
    }

    // Notifiche
    showAddNotification(product) {
        this.showNotification(`🎉 ${product.nome} aggiunta al carrello!`, 'success');
    }

    showRemoveNotification() {
        this.showNotification('🗑️ Prodotto rimosso dal carrello', 'warning');
    }

    showClearNotification() {
        this.showNotification('🧹 Carrello svuotato', 'info');
    }

    showNotification(message, type = 'info') {
        // Usa il sistema notifiche globale se disponibile
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
            return;
        }

        // Fallback locale
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Stili notifica
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Rimuovi automaticamente
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#2ed573',
            error: '#ff4757',
            warning: '#ffa502',
            info: '#3742fa'
        };
        return colors[type] || colors.info;
    }

    // Esporta ordine per stampante/kitchen
    exportOrder() {
        return {
            orderId: 'ORD-' + Date.now(),
            items: this.cart,
            total: this.getTotalPrice(),
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
    }

    // Importa ordine (per continuità sessione)
    importOrder(orderData) {
        this.cart = orderData.items || [];
        this.saveCart();
        this.updateCartCounter();
        this.renderCartItems();
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.cartSystem = new CartSystem();
});

// CSS animations per le notifiche
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .cart-notification {
        font-family: inherit;
    }
    
    .bounce {
        animation: bounce 0.3s ease;
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: scale(1); }
        40% { transform: scale(1.2); }
        60% { transform: scale(1.1); }
    }
    
    .flying-product {
        will-change: transform, opacity;
    }
`;
document.head.appendChild(style);
