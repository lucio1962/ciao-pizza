// js/kitchen-dashboard.js - DASHBOARD GESTIONE ORDINI CUCINA
class KitchenDashboard {
    constructor() {
        this.orders = {
            pending: [],
            preparing: [],
            ready: [],
            completed: []
        };
        this.stats = {
            today: 0,
            revenue: 0,
            avgTime: 0
        };
        this.init();
    }

    init() {
        this.loadOrders();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
        this.updateDashboard();
        this.startAutoRefresh();
        console.log('👨‍🍳 Dashboard cucina inizializzata');
    }

    // Carica ordini dal localStorage
    loadOrders() {
        try {
            const savedOrders = localStorage.getItem('kitchenOrders');
            if (savedOrders) {
                this.orders = JSON.parse(savedOrders);
            }
            
            const savedStats = localStorage.getItem('kitchenStats');
            if (savedStats) {
                this.stats = JSON.parse(savedStats);
            }
        } catch (error) {
            console.error('Errore caricamento ordini:', error);
        }
    }

    // Salva ordini nel localStorage
    saveOrders() {
        try {
            localStorage.setItem('kitchenOrders', JSON.stringify(this.orders));
            localStorage.setItem('kitchenStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Errore salvataggio ordini:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Ascolta nuovi ordini dal sistema
        window.addEventListener('kitchenOrder', (event) => {
            this.handleNewOrder(event.detail);
        });

        // Ascolta ordini dal QR menu
        window.addEventListener('newOrder', (event) => {
            if (event.detail.source === 'qr-menu') {
                this.handleNewOrder(event.detail);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // Setup aggiornamenti real-time
    setupRealTimeUpdates() {
        // Simula aggiornamenti in tempo reale (WebSocket in produzione)
        setInterval(() => {
            this.checkForNewOrders();
        }, 3000);
    }

    // Controlla nuovi ordini
    checkForNewOrders() {
        // Qui andrebbe una chiamata API reale o WebSocket
        // Per ora simuliamo con un random check
        if (Math.random() < 0.1) { // 10% di probabilità
            this.simulateIncomingOrder();
        }
    }

    // Gestione nuovo ordine
    handleNewOrder(orderData) {
        const kitchenOrder = {
            id: 'KIT-' + Date.now() + Math.random().toString(36).substr(2, 5),
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            startedAt: null,
            readyAt: null,
            completedAt: null,
            preparationTime: null
        };

        this.orders.pending.push(kitchenOrder);
        this.updateStats('new', kitchenOrder);
        this.updateDashboard();
        this.saveOrders();
        
        // Notifica visiva
        this.showNewOrderNotification(kitchenOrder);
        
        // Stampa automatica
        if (window.kitchenPrinter) {
            window.kitchenPrinter.printDirect(kitchenOrder);
        }

        console.log('📦 Nuovo ordine cucina:', kitchenOrder);
    }

    // Inizia preparazione ordine
    startOrder(orderId) {
        const order = this.findOrder(orderId);
        if (!order) return;

        order.status = 'preparing';
        order.startedAt = new Date().toISOString();
        
        this.moveOrder(orderId, 'pending', 'preparing');
        this.updateDashboard();
        this.saveOrders();

        this.showNotification(`👨‍🍳 Iniziata preparazione ordine ${orderId}`);
    }

    // Segna ordine come pronto
    markOrderReady(orderId) {
        const order = this.findOrder(orderId);
        if (!order) return;

        order.status = 'ready';
        order.readyAt = new Date().toISOString();
        
        // Calcola tempo preparazione
        const startTime = new Date(order.startedAt);
        const readyTime = new Date();
        order.preparationTime = Math.round((readyTime - startTime) / 60000); // minuti
        
        this.moveOrder(orderId, 'preparing', 'ready');
        this.updateStats('ready', order);
        this.updateDashboard();
        this.saveOrders();

        this.showNotification(`✅ Ordine ${orderId} pronto per la consegna`);
    }

    // Completa ordine (consegnato)
    completeOrder(orderId) {
        const order = this.findOrder(orderId);
        if (!order) return;

        order.status = 'completed';
        order.completedAt = new Date().toISOString();
        
        this.moveOrder(orderId, 'ready', 'completed');
        this.updateDashboard();
        this.saveOrders();

        this.showNotification(`🎉 Ordine ${orderId} completato`);
    }

    // Sposta ordine tra categorie
    moveOrder(orderId, fromStatus, toStatus) {
        this.orders[fromStatus] = this.orders[fromStatus].filter(order => order.id !== orderId);
        
        const order = this.findOrder(orderId);
        if (order) {
            this.orders[toStatus].push(order);
        }
    }

    // Trova ordine per ID
    findOrder(orderId) {
        for (const status of ['pending', 'preparing', 'ready', 'completed']) {
            const order = this.orders[status].find(o => o.id === orderId);
            if (order) return order;
        }
        return null;
    }

    // Aggiorna dashboard
    updateDashboard() {
        this.updateOrderCounts();
        this.updateOrderLists();
        this.updateStatistics();
        this.updatePrinterStatus();
    }

    // Aggiorna contatori
    updateOrderCounts() {
        document.getElementById('count-pending').textContent = this.orders.pending.length;
        document.getElementById('count-preparing').textContent = this.orders.preparing.length;
        document.getElementById('count-ready').textContent = this.orders.ready.length;

        document.getElementById('stats-pending').textContent = this.orders.pending.length;
        document.getElementById('stats-preparing').textContent = this.orders.preparing.length;
        document.getElementById('stats-ready').textContent = this.orders.ready.length;
        document.getElementById('stats-today').textContent = this.stats.today;
    }

    // Aggiorna liste ordini
    updateOrderLists() {
        this.renderOrderList('pending', this.orders.pending);
        this.renderOrderList('preparing', this.orders.preparing);
        this.renderOrderList('ready', this.orders.ready);
    }

    // Renderizza lista ordini
    renderOrderList(status, orders) {
        const container = document.getElementById(`orders-${status}`);
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-orders"><p>Nessun ordine ' + this.getStatusLabel(status) + '</p></div>';
            return;
        }

        container.innerHTML = orders.map(order => this.createOrderCard(order)).join('');
    }

    // Crea card ordine
    createOrderCard(order) {
        const timeAgo = this.getTimeAgo(order.createdAt);
        const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return `
            <div class="order-card ${order.status}" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>${order.id}</h3>
                        <div class="order-time">${timeAgo}</div>
                        <div class="order-source">${order.tableNumber ? 'Tavolo ' + order.tableNumber : 'Online'}</div>
                    </div>
                    <div class="order-total">€${order.total.toFixed(2)}</div>
                </div>
                
                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="order-item">
                            <div class="item-info">
                                <span class="item-quantity">${item.quantity}</span>
                                <span class="item-name">${item.nome}</span>
                            </div>
                            <span class="item-price">€${item.totalPrice.toFixed(2)}</span>
                        </div>
                    `).join('')}
                    
                    ${order.items.length > 3 ? 
                        `<div class="order-more">+${order.items.length - 3} altri prodotti</div>` : ''
                    }
                </div>
                
                <div class="order-actions">
                    ${order.status === 'pending' ? 
                        `<button class="btn-kitchen btn-start" onclick="kitchenDashboard.startOrder('${order.id}')">
                            Inizia Preparazione
                        </button>` : ''
                    }
                    
                    ${order.status === 'preparing' ? 
                        `<button class="btn-kitchen btn-ready" onclick="kitchenDashboard.markOrderReady('${order.id}')">
                            Segna Pronto
                        </button>` : ''
                    }
                    
                    ${order.status === 'ready' ? 
                        `<button class="btn-kitchen btn-complete" onclick="kitchenDashboard.completeOrder('${order.id}')">
                            Completa Ordine
                        </button>` : ''
                    }
                    
                    <button class="btn-kitchen btn-print" onclick="kitchenDashboard.reprintOrder('${order.id}')">
                        Ristampa
                    </button>
                </div>
                
                ${order.preparationTime ? 
                    `<div class="preparation-time">
                        ⏱️ Preparato in ${order.preparationTime} minuti
                    </div>` : ''
                }
            </div>
        `;
    }

    // Aggiorna statistiche
    updateStatistics() {
        // Calcola statistiche giornaliere
        const today = new Date().toDateString();
        const todayOrders = [...this.orders.completed].filter(order => 
            new Date(order.completedAt).toDateString() === today
        );

        const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const avgTime = todayOrders.length > 0 ? 
            todayOrders.reduce((sum, order) => sum + (order.preparationTime || 0), 0) / todayOrders.length : 0;

        this.stats.today = todayOrders.length;
        this.stats.revenue = totalRevenue;
        this.stats.avgTime = Math.round(avgTime);

        // Aggiorna UI
        document.getElementById('history-total').textContent = this.stats.today;
        document.getElementById('history-revenue').textContent = `€${totalRevenue.toFixed(2)}`;
        document.getElementById('history-avg-time').textContent = `${this.stats.avgTime}min`;
    }

    // Aggiorna stats
    updateStats(action, order) {
        if (action === 'new') {
            // Nuovo ordine - nessuna modifica alle stats completate
        } else if (action === 'ready') {
            // Ordine pronto - aggiorna stats preparazione
        }
    }

    // Utility functions
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Ora';
        if (diffMins < 60) return `${diffMins} min fa`;
        
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours} ore fa`;
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'in attesa',
            'preparing': 'in preparazione',
            'ready': 'pronto',
            'completed': 'completato'
        };
        return labels[status] || status;
    }

    // Notifiche
    showNewOrderNotification(order) {
        this.showNotification(`📦 Nuovo ordine da ${order.tableNumber ? 'Tavolo ' + order.tableNumber : 'online'}`, 'info');
        
        // Notifica browser
        if (Notification.permission === 'granted') {
            new Notification('🍕 Nuovo Ordine Cucina', {
                body: `${order.items.length} prodotti - €${order.total.toFixed(2)}`,
                icon: '../assets/images/logo.png'
            });
        }
    }

    showNotification(message, type = 'info') {
        // Crea notifica temporanea
        const notification = document.createElement('div');
        notification.className = `kitchen-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#2ed573',
            'error': '#ff4757',
            'warning': '#ffa502',
            'info': '#3742fa'
        };
        return colors[type] || colors.info;
    }

    // Controlli avanzati
    markAllReady() {
        this.orders.preparing.forEach(order => {
            this.markOrderReady(order.id);
        });
        this.showNotification('⚡ Tutti gli ordini segnati come pronti');
    }

    clearCompleted() {
        // Mantieni solo gli ordini delle ultime 24 ore
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.orders.completed = this.orders.completed.filter(order => 
            new Date(order.completedAt) > cutoffTime
        );
        this.saveOrders();
        this.updateDashboard();
        this.showNotification('🧹 Ordini completati puliti');
    }

    reprintAll() {
        [...this.orders.pending, ...this.orders.preparing, ...this.orders.ready].forEach(order => {
            if (window.kitchenPrinter) {
                window.kitchenPrinter.printDirect(order);
            }
        });
        this.showNotification('🖨️ Ristampa di tutti gli ordini attivi');
    }

    reprintOrder(orderId) {
        const order = this.findOrder(orderId);
        if (order && window.kitchenPrinter) {
            window.kitchenPrinter.printDirect(order);
            this.showNotification(`🖨️ Ristampa ordine ${orderId}`);
        }
    }

    // Simula ordine per testing
    simulateOrder() {
        const simulatedOrder = {
            tableNumber: Math.floor(Math.random() * 10) + 1,
            items: [
                {
                    id: 'margherita',
                    nome: 'Margherita',
                    quantity: 1,
                    prezzo: 8.50,
                    totalPrice: 8.50
                },
                {
                    id: 'coca-cola',
                    nome: 'Coca-Cola',
                    quantity: 2,
                    prezzo: 3.00,
                    totalPrice: 6.00
                }
            ],
            total: 14.50,
            source: 'simulation'
        };

        this.handleNewOrder(simulatedOrder);
    }

    // Aggiorna stato stampante
    updatePrinterStatus() {
        const statusElement = document.getElementById('printer-status');
        const statusText = document.getElementById('printer-status-text');
        
        if (window.kitchenPrinter && window.kitchenPrinter.printerConnected) {
            statusElement.className = 'printer-status connected';
            statusText.textContent = 'Connessa';
        } else {
            statusElement.className = 'printer-status disconnected';
            statusText.textContent = 'Offline';
        }
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    this.markAllReady();
                    break;
                case '2':
                    e.preventDefault();
                    this.clearCompleted();
                    break;
                case '3':
                    e.preventDefault();
                    this.simulateOrder();
                    break;
            }
        }
    }

    // Auto-refresh
    startAutoRefresh() {
        setInterval(() => {
            this.updateDashboard();
        }, 30000); // Aggiorna ogni 30 secondi
    }

    // Modal functions
    openOrderModal(orderId) {
        const order = this.findOrder(orderId);
        if (!order) return;

        const modal = document.getElementById('order-modal');
        const details = document.getElementById('modal-order-details');
        
        details.innerHTML = this.createOrderDetails(order);
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('order-modal').style.display = 'none';
    }

    createOrderDetails(order) {
        return `
            <h4>Ordine ${order.id}</h4>
            <p><strong>Tavolo:</strong> ${order.tableNumber || 'Online'}</p>
            <p><strong>Orario:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Totale:</strong> €${order.total.toFixed(2)}</p>
            
            <h5>Prodotti:</h5>
            ${order.items.map(item => `
                <div class="order-detail-item">
                    <span>${item.quantity}x ${item.nome}</span>
                    <span>€${item.totalPrice.toFixed(2)}</span>
                </div>
            `).join('')}
            
            ${order.notes ? `<p><strong>Note:</strong> ${order.notes}</p>` : ''}
        `;
    }
}

// Aggiungi stili per le notifiche
const kitchenStyles = document.createElement('style');
kitchenStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .kitchen-notification {
        font-family: inherit;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .order-more {
        text-align: center;
        font-size: 0.9rem;
        opacity: 0.7;
        margin-top: 0.5rem;
    }
    
    .preparation-time {
        background: rgba(46, 213, 115, 0.2);
        padding: 0.5rem;
        border-radius: 5px;
        text-align: center;
        margin-top: 1rem;
        font-size: 0.9rem;
    }
    
    .order-source {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-top: 0.2rem;
    }
    
    .order-detail-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
    }
    
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
    }
    
    .modal-content {
        background: white;
        margin: 10% auto;
        padding: 2rem;
        border-radius: 10px;
        max-width: 500px;
        color: #333;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
    }
`;

document.head.appendChild(kitchenStyles);

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.kitchenDashboard = new KitchenDashboard();
});
