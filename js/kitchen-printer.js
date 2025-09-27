// js/kitchen-printer.js - SISTEMA INTEGRAZIONE STAMPANTE CUCINA
class KitchenPrinter {
    constructor() {
        this.printerConnected = false;
        this.printQueue = [];
        this.isPrinting = false;
        this.init();
    }

    init() {
        this.detectPrinter();
        this.setupEventListeners();
        this.startQueueProcessor();
        console.log('🖨️ Sistema stampante cucina inizializzato');
    }

    // Rilevamento automatico stampante
    async detectPrinter() {
        try {
            // Verifica se siamo nella pagina cucina
            if (window.location.pathname.includes('kitchen.html')) {
                this.printerConnected = await this.checkPrinterAvailability();
                this.updatePrinterStatus();
            }
        } catch (error) {
            console.error('Errore rilevamento stampante:', error);
            this.printerConnected = false;
        }
    }

    // Verifica disponibilità stampante
    async checkPrinterAvailability() {
        // Simula verifica connessione stampante
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simula 80% di successo nel rilevamento
                const available = Math.random() > 0.2;
                resolve(available);
            }, 1000);
        });
    }

    // Aggiorna stato stampante nell'UI
    updatePrinterStatus() {
        const statusElement = document.getElementById('printer-status');
        if (!statusElement) return;

        if (this.printerConnected) {
            statusElement.innerHTML = '🖨️ Stampante connessa';
            statusElement.className = 'printer-status connected';
        } else {
            statusElement.innerHTML = '📵 Stampante offline';
            statusElement.className = 'printer-status disconnected';
        }
    }

    // Setup event listeners per ordini
    setupEventListeners() {
        // Ascolta eventi ordini dalla pagina QR Menu
        window.addEventListener('kitchenOrder', (event) => {
            this.handleNewOrder(event.detail);
        });

        // Ascolta eventi da altre parti del sistema
        window.addEventListener('newOrder', (event) => {
            if (event.detail.kitchenPrint) {
                this.handleNewOrder(event.detail);
            }
        });
    }

    // Gestione nuovo ordine
    handleNewOrder(orderData) {
        console.log('📦 Nuovo ordine ricevuto per la stampa:', orderData);
        
        // Aggiungi alla coda di stampa
        this.addToPrintQueue(orderData);
        
        // Notifica visiva
        this.showOrderNotification(orderData);
    }

    // Aggiungi ordine alla coda stampa
    addToPrintQueue(orderData) {
        const printJob = {
            id: 'print-' + Date.now() + Math.random().toString(36).substr(2, 9),
            order: orderData,
            timestamp: new Date().toISOString(),
            status: 'pending',
            attempts: 0
        };

        this.printQueue.push(printJob);
        this.updateQueueDisplay();

        // Avvia elaborazione se non è in corso
        if (!this.isPrinting) {
            this.processPrintQueue();
        }
    }

    // Elabora coda stampa
    async processPrintQueue() {
        if (this.isPrinting || this.printQueue.length === 0) return;

        this.isPrinting = true;

        while (this.printQueue.length > 0) {
            const printJob = this.printQueue[0];
            
            try {
                await this.printOrder(printJob);
                
                // Rimuovi dalla coda dopo stampa riuscita
                this.printQueue.shift();
                this.updateQueueDisplay();
                
            } catch (error) {
                console.error('Errore stampa ordine:', error);
                
                // Gestione errori e ritentativi
                if (printJob.attempts < 3) {
                    printJob.attempts++;
                    printJob.status = 'retrying';
                    console.log(`Tentativo ${printJob.attempts} per ordine ${printJob.id}`);
                    
                    // Ritenta dopo 5 secondi
                    await this.delay(5000);
                } else {
                    // Troppi tentativi falliti, segna come errore
                    printJob.status = 'failed';
                    this.printQueue.shift();
                    this.updateQueueDisplay();
                    this.showPrintError(printJob);
                }
            }
        }

        this.isPrinting = false;
    }

    // Stampa ordine
    async printOrder(printJob) {
        printJob.status = 'printing';
        this.updateQueueDisplay();

        // Genera contenuto stampa
        const printContent = this.generatePrintContent(printJob.order);
        
        // Simula stampa (sostituire con API stampante reale)
        await this.simulatePrint(printContent);
        
        printJob.status = 'completed';
        this.showPrintSuccess(printJob.order);
    }

    // Genera contenuto per stampa
    generatePrintContent(orderData) {
        const now = new Date();
        const orderTime = now.toLocaleTimeString('it-IT');
        const orderDate = now.toLocaleDateString('it-IT');
        
        let content = `
=== CIAO CALDERINO ===
    ORDINE CUCINA
----------------------
Data: ${orderDate} ${orderTime}
Tavolo: ${orderData.tableNumber || 'Online'}
Status: ${orderData.status || 'Nuovo'}
----------------------

`;

        // Prodotti ordinati
        orderData.items.forEach((item, index) => {
            content += `${index + 1}. ${item.quantity}x ${item.nome}\n`;
            content += `   €${item.totalPrice.toFixed(2)}\n`;
            
            // Note speciali se presenti
            if (item.notes) {
                content += `   NOTE: ${item.notes}\n`;
            }
            
            // Allergeni
            if (item.allergeni && item.allergeni.length > 0) {
                content += `   ⚠️ ALLERGENI: ${item.allergeni.join(', ')}\n`;
            }
            
            content += '\n';
        });

        content += `
----------------------
TOTALE: €${orderData.total.toFixed(2)}
======================

** ORDINE COMPLETATO **
        `;

        return content;
    }

    // Simula stampa (da sostituire con API reale)
    async simulatePrint(content) {
        return new Promise((resolve, reject) => {
            // Simula ritardo stampa
            const printTime = content.length * 10 + 2000; // Basato su lunghezza contenuto
            
            setTimeout(() => {
                // Simula 90% success rate
                if (Math.random() > 0.1) {
                    console.log('✅ Stampa simulata completata:\n', content);
                    resolve();
                } else {
                    reject(new Error('Errore stampante simulato'));
                }
            }, printTime);
        });
    }

    // INTEGRAZIONI STAMPANTI REALI

    // Integrazione con stampanti termiche via WebSocket
    async connectToThermalPrinter(printerConfig) {
        try {
            // Esempio integrazione con stampante termica
            const socket = new WebSocket(printerConfig.url);
            
            socket.onopen = () => {
                console.log('🔌 Connesso alla stampante termica');
                this.printerConnected = true;
                this.updatePrinterStatus();
            };
            
            socket.onmessage = (event) => {
                console.log('📨 Messaggio stampante:', event.data);
            };
            
            socket.onerror = (error) => {
                console.error('❌ Errore connessione stampante:', error);
                this.printerConnected = false;
                this.updatePrinterStatus();
            };
            
            return socket;
        } catch (error) {
            console.error('Errore connessione stampante:', error);
            throw error;
        }
    }

    // Integrazione con API REST stampanti
    async printViaAPI(printContent, apiConfig) {
        try {
            const response = await fetch(apiConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    content: printContent,
                    printer: apiConfig.printerId,
                    copies: 1
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Errore stampa via API:', error);
            throw error;
        }
    }

    // Integrazione con protocollo ESC/POS (stampanti termiche)
    generateESCPOSCommands(printContent) {
        // Comandi ESC/POS per stampanti termiche
        const commands = [];
        
        // Inizializzazione stampante
        commands.push('\x1B\x40'); // Initialize printer
        
        // Testo centrato
        commands.push('\x1B\x61\x01'); // Center alignment
        commands.push('CIAO CALDERINO\n');
        commands.push('ORDINE CUCINA\n\n');
        commands.push('\x1B\x61\x00'); // Left alignment
        
        // Contenuto ordine
        commands.push(printContent);
        
        // Taglio carta
        commands.push('\n\n\n\n\n');
        commands.push('\x1D\x56\x41\x10'); // Full cut
        
        return commands.join('');
    }

    // GESTIONE CODA E INTERFACCIA

    // Aggiorna display coda stampa
    updateQueueDisplay() {
        const queueElement = document.getElementById('print-queue');
        if (!queueElement) return;

        queueElement.innerHTML = this.printQueue.map(job => `
            <div class="print-job ${job.status}">
                <div class="job-info">
                    <strong>Ordine ${job.order.tableNumber || 'Online'}</strong>
                    <span class="job-status">${this.getStatusLabel(job.status)}</span>
                </div>
                <div class="job-details">
                    ${job.order.items.length} prodotti - €${job.order.total.toFixed(2)}
                    ${job.attempts > 0 ? ` (Tentativo ${job.attempts})` : ''}
                </div>
                <div class="job-time">${new Date(job.timestamp).toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    // Etichetta stato stampa
    getStatusLabel(status) {
        const labels = {
            'pending': '⏳ In attesa',
            'printing': '🖨️ Stampando',
            'completed': '✅ Completato',
            'failed': '❌ Errore',
            'retrying': '🔄 Ritentando'
        };
        return labels[status] || status;
    }

    // Notifica nuovo ordine
    showOrderNotification(orderData) {
        if (!Notification || Notification.permission !== 'granted') return;

        new Notification('🍕 Nuovo Ordine Cucina', {
            body: `Tavolo ${orderData.tableNumber} - ${orderData.items.length} prodotti - €${orderData.total.toFixed(2)}`,
            icon: '../assets/images/logo.png',
            tag: 'kitchen-order'
        });
    }

    // Notifica stampa riuscita
    showPrintSuccess(orderData) {
        console.log(`✅ Ordine stampato: Tavolo ${orderData.tableNumber}`);
        
        // Evento per aggiornare UI
        window.dispatchEvent(new CustomEvent('orderPrinted', {
            detail: orderData
        }));
    }

    // Notifica errore stampa
    showPrintError(printJob) {
        console.error(`❌ Errore stampa ordine ${printJob.id}`);
        
        // Notifica amministratore
        this.sendAdminAlert(printJob);
    }

    // Alert amministratore per errori stampa
    sendAdminAlert(printJob) {
        // Qui si potrebbe integrare con:
        // - Email di notifica
        // - SMS al gestore
        // - Messaggio su app interna
        console.warn('🚨 ALERT AMMINISTRATORE: Errore stampa ordine', printJob);
    }

    // Utility functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Metodo pubblico per stampa diretta
    async printDirect(orderData) {
        return this.handleNewOrder(orderData);
    }

    // Reset coda stampa
    clearPrintQueue() {
        this.printQueue = [];
        this.updateQueueDisplay();
    }

    // Riconnessione stampante
    async reconnectPrinter() {
        this.printerConnected = await this.checkPrinterAvailability();
        this.updatePrinterStatus();
        
        if (this.printerConnected) {
            this.processPrintQueue(); // Riprendi elaborazione
        }
    }
}

// Stili per interfaccia cucina
const printerStyles = document.createElement('style');
printerStyles.textContent = `
    .printer-status {
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        font-weight: bold;
    }
    
    .printer-status.connected {
        background: #2ed573;
        color: white;
    }
    
    .printer-status.disconnected {
        background: #ff4757;
        color: white;
    }
    
    .print-queue {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 10px;
    }
    
    .print-job {
        padding: 10px;
        margin: 5px 0;
        border-left: 4px solid #ccc;
        background: #f9f9f9;
    }
    
    .print-job.pending { border-left-color: #ffa502; }
    .print-job.printing { border-left-color: #3742fa; }
    .print-job.completed { border-left-color: #2ed573; }
    .print-job.failed { border-left-color: #ff4757; }
    .print-job.retrying { border-left-color: #ffa502; }
    
    .job-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .job-status {
        font-size: 0.8rem;
        padding: 2px 8px;
        border-radius: 10px;
        background: #eee;
    }
    
    .job-details {
        font-size: 0.9rem;
        color: #666;
        margin: 5px 0;
    }
    
    .job-time {
        font-size: 0.8rem;
        color: #999;
        text-align: right;
    }
    
    @keyframes printing {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
    }
    
    .print-job.printing {
        animation: printing 1.5s infinite;
    }
`;
document.head.appendChild(printerStyles);

// Inizializzazione globale
document.addEventListener('DOMContentLoaded', () => {
    window.kitchenPrinter = new KitchenPrinter();
});

// Esporta per uso in moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KitchenPrinter;
}
