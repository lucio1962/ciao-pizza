// js/qr-menu-system.js - SISTEMA MENÙ DIGITALE QR CODE
class QRMenuSystem {
    constructor() {
        this.menuData = null;
        this.currentCategory = 'all';
        this.orderItems = [];
        this.tableNumber = this.getTableNumber();
        this.isConnected = false;
        this.init();
    }

    init() {
        this.detectWiFi();
        this.loadMenuData();
        this.setupEventListeners();
        this.updateTableInfo();
        this.setupConnectionMonitoring();
        console.log('📱 Sistema QR Menu inizializzato - Tavolo:', this.tableNumber);
    }

    // Rileva numero tavolo dall'URL
    getTableNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('table') || '1';
    }

    // Rilevamento WiFi automatico
    detectWiFi() {
        if (navigator.connection) {
            this.updateConnectionStatus(navigator.onLine);
            
            navigator.connection.addEventListener('change', () => {
                this.updateConnectionStatus(navigator.onLine);
            });
        } else {
            // Fallback per browser senza supporto connection API
            this.updateConnectionStatus(navigator.onLine);
            window.addEventListener('online', () => this.updateConnectionStatus(true));
            window.addEventListener('offline', () => this.updateConnectionStatus(false));
        }
    }

    // Aggiorna stato connessione
    updateConnectionStatus(isConnected) {
        this.isConnected = isConnected;
        const statusElement = document.getElementById('wifi-status');
        const iconElement = document.getElementById('wifi-icon');
        const textElement = document.getElementById('wifi-text');

        if (isConnected) {
            statusElement.className = 'wifi-status wifi-connected';
            iconElement.textContent = '📡';
            textElement.textContent = 'Connesso al WiFi';
            this.sendPendingOrders(); // Invia ordini in sospeso
        } else {
            statusElement.className = 'wifi-status wifi-disconnected';
            iconElement.textContent = '📵';
            textElement.textContent = 'WiFi non disponibile';
        }
    }

    // Monitoraggio connessione continua
    setupConnectionMonitoring() {
        setInterval(() => {
            this.updateConnectionStatus(navigator.onLine);
        }, 5000);
    }

    // Carica dati menù
    async loadMenuData() {
        try {
            const response = await fetch('../data/menu.json');
            this.menuData = await response.json();
            this.renderCategories();
            this.renderProducts();
        } catch (error) {
            console.error('Errore caricamento menù:', error);
            this.showError('Impossibile caricare il menù');
        }
    }

    // Renderizza categorie
    renderCategories() {
        const categoriesNav = document.getElementById('categories-nav');
        if (!this.menuData) return;

        const categoriesHtml = this.menuData.categorie.map(category => `
            <div class="category-tab ${category.id === 'pizze-rosse' ? 'active' : ''}" 
                 data-category="${category.id}">
                ${category.nome}
            </div>
        `).join('');

        categoriesNav.innerHTML = categoriesHtml;

        // Aggiungi event listeners
        categoriesNav.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleCategoryChange(e.target.dataset.category);
            });
        });
    }

    // Gestione cambio categoria
    handleCategoryChange(categoryId) {
        this.currentCategory = categoryId;
        
        // Aggiorna tab attiva
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${categoryId}"]`).classList.add('active');

        this.renderProducts();
    }

    // Renderizza prodotti
    renderProducts() {
        const productsContainer = document.getElementById('products-container');
        if (!this.menuData) return;

        let products = [];
        
        if (this.currentCategory === 'all') {
            // Tutti i prodotti
            this.menuData.categorie.forEach(category => {
                products = products.concat(category.prodotti);
            });
        } else {
            // Prodotti categoria specifica
            const category = this.menuData.categorie.find(cat => cat.id === this.currentCategory);
            products = category ? category.prodotti : [];
        }

        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="loading">Nessun prodotto trovato</div>';
            return;
        }

        const productsHtml = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-header">
                    <h3 class="product-name">${product.nome}</h3>
                    <div class="product-price">€${product.prezzo.toFixed(2)}</div>
                </div>
                <p class="product-description">${product.descrizione}</p>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" onclick="qrMenu.decreaseQuantity('${product.id}')">-</button>
                        <span class="quantity" id="quantity-${product.id}">0</span>
                        <button class="quantity-btn plus" onclick="qrMenu.increaseQuantity('${product.id}')">+</button>
                    </div>
                    <button class="add-to-order" onclick="qrMenu.addToOrder('${product.id}')">
                        Aggiungi
                    </button>
                </div>
            </div>
        `).join('');

        productsContainer.innerHTML = productsHtml;
    }

    // Aumenta quantità prodotto
    increaseQuantity(productId) {
        const quantityElement = document.getElementById(`quantity-${productId}`);
        let quantity = parseInt(quantityElement.textContent) || 0;
        quantity++;
        quantityElement.textContent = quantity;
    }

    // Diminuisci quantità prodotto
    decreaseQuantity(productId) {
        const quantityElement = document.getElementById(`quantity-${productId}`);
        let quantity = parseInt(quantityElement.textContent) || 0;
        if (quantity > 0) {
            quantity--;
            quantityElement.textContent = quantity;
        }
    }

    // Aggiungi al ordine
    addToOrder(productId) {
        const quantityElement = document.getElementById(`quantity-${productId}`);
        const quantity = parseInt(quantityElement.textContent) || 0;

        if (quantity === 0) {
            this.showNotification('Seleziona una quantità', 'warning');
            return;
        }

        // Trova prodotto
        const product = this.findProductById(productId);
        if (!product) return;

        // Rimuovi se già presente
        this.orderItems = this.orderItems.filter(item => item.id !== productId);

        // Aggiungi con quantità
        this.orderItems.push({
            ...product,
            quantity: quantity,
            totalPrice: product.prezzo * quantity
        });

        // Reset quantità
        quantityElement.textContent = '0';

        this.updateCart();
        this.showNotification(`✅ ${quantity}x ${product.nome} aggiunta all'ordine`, 'success');
    }

    // Trova prodotto per ID
    findProductById(productId) {
        for (const category of this.menuData.categorie) {
            const product = category.prodotti.find(prod => prod.id === productId);
            if (product) return product;
        }
        return null;
    }

    // Aggiorna carrello
    updateCart() {
        const totalElement = document.getElementById('cart-total');
        const countElement = document.getElementById('cart-count');
        const sendButton = document.getElementById('send-order-btn');

        const total = this.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const itemCount = this.orderItems.reduce((sum, item) => sum + item.quantity, 0);

        totalElement.textContent = `Totale: €${total.toFixed(2)}`;
        countElement.textContent = itemCount;

        // Abilita/disabilita pulsante invio
        sendButton.disabled = itemCount === 0;
    }

    // Invia ordine alla cucina
    async sendOrder() {
        if (this.orderItems.length === 0) {
            this.showNotification('Aggiungi almeno un prodotto', 'warning');
            return;
        }

        if (!this.isConnected) {
            this.showNotification('Connessione WiFi necessaria', 'error');
            return;
        }

        const orderData = {
            tableNumber: this.tableNumber,
            items: this.orderItems,
            total: this.orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        try {
            // Simula invio all'API cucina
            await this.sendToKitchen(orderData);
            
            // Mostra conferma
            this.showOrderConfirmation(orderData);
            
            // Svuota ordine corrente
            this.orderItems = [];
            this.updateCart();
            
            // Salva storico
            this.saveOrderToHistory(orderData);

        } catch (error) {
            this.showNotification('Errore nell\'invio ordine', 'error');
            // Salva in pending per ritentare
            this.savePendingOrder(orderData);
        }
    }

    // Invia ordine alla cucina (simulazione)
    async sendToKitchen(orderData) {
        return new Promise((resolve, reject) => {
            // Simula ritardo di rete
            setTimeout(() => {
                // Simula stampante cucina
                this.printToKitchen(orderData);
                
                // 95% success rate
                if (Math.random() > 0.05) {
                    resolve({ success: true, orderId: 'KIT-' + Date.now() });
                } else {
                    reject(new Error('Kitchen printer error'));
                }
            }, 1000);
        });
    }

    // Simula stampa in cucina
    printToKitchen(orderData) {
        const receipt = this.generateKitchenReceipt(orderData);
        console.log('🖨️ STAMPA CUCINA:', receipt);
        
        // Qui andrebbe l'integrazione con la stampante termica reale
        // Esempio: WebSocket o API call alla stampante
    }

    // Genera ricevuta cucina
    generateKitchenReceipt(orderData) {
        return `
=== CIAO CALDERINO ===
Tavolo: ${orderData.tableNumber}
Data: ${new Date().toLocaleString()}
----------------------
${orderData.items.map(item => `
${item.quantity}x ${item.nome}
   €${item.totalPrice.toFixed(2)}
`).join('')}
----------------------
TOTALE: €${orderData.total.toFixed(2)}
======================
        `.trim();
    }

    // Mostra conferma ordine
    showOrderConfirmation(orderData) {
        const modal = document.getElementById('order-modal');
        const message = document.getElementById('order-message');
        const details = document.getElementById('order-details');

        message.textContent = `Ordine tavolo ${orderData.tableNumber} inviato in cucina`;
        
        details.innerHTML = `
            <div class="order-summary">
                ${orderData.items.map(item => `
                    <div class="order-item">
                        <span>${item.quantity}x ${item.nome}</span>
                        <span>€${item.totalPrice.toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="order-total">
                    <strong>Totale: €${orderData.total.toFixed(2)}</strong>
                </div>
            </div>
            <p><strong>Tempo stimato:</strong> 20-30 minuti</p>
        `;

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // Chiama cameriere
    callWaiter() {
        const modal = document.getElementById('waiter-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);

        // Invia notifica al personale
        this.sendWaiterNotification();
    }

    // Invia notifica cameriere
    sendWaiterNotification() {
        const notification = {
            type: 'waiter_call',
            tableNumber: this.tableNumber,
            timestamp: new Date().toISOString()
        };

        console.log('🧑‍💼 CHIAMATA CAMERIERE:', notification);
        
        // Qui andrebbe l'integrazione con il sistema notifiche del personale
        // Esempio: WebSocket, app interna, display in cucina
    }

    // Chiudi modal
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    // Salva ordine in pending (per riconnessione)
    savePendingOrder(orderData) {
        const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
        pendingOrders.push(orderData);
        localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
    }

    // Invia ordini in sospeso quando si ricollega
    sendPendingOrders() {
        const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
        
        if (pendingOrders.length > 0) {
            pendingOrders.forEach(async (order, index) => {
                try {
                    await this.sendToKitchen(order);
                    // Rimuovi dall'array pending
                    pendingOrders.splice(index, 1);
                    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
                } catch (error) {
                    console.error('Errore invio ordine pending:', error);
                }
            });
        }
    }

    // Salva storico ordini
    saveOrderToHistory(orderData) {
        const orderHistory = JSON.parse(localStorage.getItem('qrOrderHistory')) || [];
        orderHistory.unshift({
            ...orderData,
            orderId: 'QR-' + Date.now()
        });
        localStorage.setItem('qrOrderHistory', JSON.stringify(orderHistory.slice(0, 50))); // Ultimi 50 ordini
    }

    // Aggiorna info tavolo
    updateTableInfo() {
        const tableInfo = document.getElementById('table-info');
        tableInfo.textContent = `Tavolo #${this.tableNumber} - Menù Digitale`;
    }

    // Notifiche
    showNotification(message, type = 'info') {
        // Crea notifica temporanea
        const notification = document.createElement('div');
        notification.className = `qr-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 10000;
            animation: slideInDown 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease';
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

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Aggiungi animazioni CSS
const qrMenuStyles = document.createElement('style');
qrMenuStyles.textContent = `
    @keyframes slideInDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideOutUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .modal.show {
        opacity: 1;
    }
    
    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        max-width: 90%;
        max-height: 80%;
        overflow-y: auto;
    }
    
    .order-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }
    
    .order-total {
        border-top: 1px solid #ccc;
        padding-top: 0.5rem;
        margin-top: 0.5rem;
    }
`;
document.head.appendChild(qrMenuStyles);

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.qrMenu = new QRMenuSystem();
});
