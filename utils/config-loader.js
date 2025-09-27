// utils/config-loader.js - CARICATORE DINAMICO CONFIGURAZIONI
class ConfigLoader {
    constructor() {
        this.configs = {};
        this.loaded = false;
        this.init();
    }

    async init() {
        await this.loadAllConfigs();
        this.setupAutoRefresh();
        console.log('⚙️ ConfigLoader inizializzato');
    }

    // Carica tutte le configurazioni
    async loadAllConfigs() {
        try {
            const configsToLoad = [
                { key: 'menu', url: '../data/menu.json' },
                { key: 'settings', url: '../data/settings.json' },
                { key: 'offers', url: '../data/daily-offers.json' }
            ];

            const loadPromises = configsToLoad.map(config => 
                this.loadConfig(config.key, config.url)
            );

            await Promise.all(loadPromises);
            this.loaded = true;
            
            // Notifica che le config sono pronte
            this.dispatchConfigReadyEvent();
            
        } catch (error) {
            console.error('Errore caricamento configurazioni:', error);
            this.handleLoadError(error);
        }
    }

    // Carica una singola configurazione
    async loadConfig(key, url) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.configs[key] = data;
            
            console.log(`✅ Config ${key} caricata`);
            return data;
            
        } catch (error) {
            console.error(`❌ Errore caricamento ${key}:`, error);
            
            // Fallback a config di default
            this.configs[key] = this.getDefaultConfig(key);
            console.log(`🔄 Usando config di default per ${key}`);
            
            throw error;
        }
    }

    // Configurazioni di default per fallback
    getDefaultConfig(key) {
        const defaults = {
            menu: {
                ristorante: {
                    nome: "Ciao Calderino",
                    tipo: "Pizzeria d'Asporto",
                    telefono: "+39 051 123 4567"
                },
                categorie: [],
                allergeni: {}
            },
            settings: {
                ristorante: {
                    nome: "Ciao Calderino",
                    indirizzo: "Via Roma, 123 - Calderino"
                },
                orari: {
                    apertura: "18:00",
                    chiusura: "23:00"
                },
                consegne: {
                    costo_consegna: 2.50
                }
            },
            offers: {
                offerte_attive: false,
                offerte_giornaliere: {}
            }
        };
        
        return defaults[key] || {};
    }

    // Ottieni configurazione
    getConfig(key, path = null) {
        if (!this.configs[key]) {
            console.warn(`Configurazione ${key} non trovata`);
            return null;
        }

        if (!path) {
            return this.configs[key];
        }

        // Supporto per path nested (es: 'ristorante.nome')
        return this.getNestedValue(this.configs[key], path);
    }

    // Ottieni valore nested
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    // Aggiorna configurazione
    updateConfig(key, newConfig) {
        if (!this.configs[key]) {
            console.warn(`Configurazione ${key} non esistente`);
            return false;
        }

        this.configs[key] = { ...this.configs[key], ...newConfig };
        this.saveConfigToStorage(key);
        this.dispatchConfigUpdateEvent(key);
        
        return true;
    }

    // Salva config nello storage locale
    saveConfigToStorage(key) {
        try {
            localStorage.setItem(`config_${key}`, JSON.stringify(this.configs[key]));
        } catch (error) {
            console.error('Errore salvataggio config:', error);
        }
    }

    // Carica config dallo storage locale
    loadConfigFromStorage(key) {
        try {
            const stored = localStorage.getItem(`config_${key}`);
            if (stored) {
                this.configs[key] = JSON.parse(stored);
                return true;
            }
        } catch (error) {
            console.error('Errore caricamento config da storage:', error);
        }
        return false;
    }

    // Controlla se una config è valida
    validateConfig(key, schema = null) {
        const config = this.configs[key];
        if (!config) return false;

        if (schema) {
            return this.validateAgainstSchema(config, schema);
        }

        // Validazione base
        return Object.keys(config).length > 0;
    }

    // Validazione contro schema
    validateAgainstSchema(config, schema) {
        // Implementazione base - espandibile con librerie come AJV
        for (const key in schema) {
            if (schema[key].required && !config[key]) {
                console.warn(`Campo obbligatorio mancante: ${key}`);
                return false;
            }
        }
        return true;
    }

    // Setup auto-refresh configurazioni
    setupAutoRefresh() {
        // Aggiorna config ogni ora
        setInterval(() => {
            this.refreshConfigs();
        }, 60 * 60 * 1000);

        // Aggiorna al focus della pagina
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshConfigs();
            }
        });
    }

    // Aggiorna configurazioni
    async refreshConfigs() {
        if (!this.loaded) return;

        console.log('🔄 Aggiornamento configurazioni...');
        
        try {
            await this.loadAllConfigs();
            console.log('✅ Configurazioni aggiornate');
        } catch (error) {
            console.error('❌ Errore aggiornamento config:', error);
        }
    }

    // Eventi personalizzati per le config
    dispatchConfigReadyEvent() {
        const event = new CustomEvent('configReady', {
            detail: { configs: this.configs }
        });
        window.dispatchEvent(event);
    }

    dispatchConfigUpdateEvent(key) {
        const event = new CustomEvent('configUpdated', {
            detail: { 
                key: key,
                config: this.configs[key],
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    // Gestione errori di caricamento
    handleLoadError(error) {
        const errorEvent = new CustomEvent('configError', {
            detail: { error: error.message }
        });
        window.dispatchEvent(errorEvent);

        // Try to load from storage as fallback
        this.loadFromStorageFallback();
    }

    // Fallback da storage locale
    loadFromStorageFallback() {
        const keys = ['menu', 'settings', 'offers'];
        let loadedFromStorage = false;

        keys.forEach(key => {
            if (this.loadConfigFromStorage(key)) {
                loadedFromStorage = true;
                console.log(`📦 Config ${key} caricata da storage locale`);
            }
        });

        if (loadedFromStorage) {
            this.loaded = true;
            this.dispatchConfigReadyEvent();
        }
    }

    // Utility: Ottieni orario di apertura
    isOpenNow() {
        const settings = this.getConfig('settings');
        if (!settings || !settings.orari) return true;

        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const openingTime = this.timeToNumber(settings.orari.apertura);
        const closingTime = this.timeToNumber(settings.orari.chiusura);

        return currentTime >= openingTime && currentTime <= closingTime;
    }

    // Utility: Converti tempo in numero
    timeToNumber(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 100 + minutes;
    }

    // Utility: Ottieni info ristorante
    getRestaurantInfo() {
        return this.getConfig('settings', 'ristorante') || 
               this.getConfig('menu', 'ristorante') || 
               { nome: 'Ciao Calderino', telefono: '' };
    }

    // Utility: Ottieni menù del giorno
    getTodaysOffer() {
        const offers = this.getConfig('offers');
        if (!offers || !offers.offerte_giornaliere) return null;

        const days = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
        const today = days[new Date().getDay()];
        
        return offers.offerte_giornaliere[today] || null;
    }

    // Utility: Verifica se una promo è valida
    isPromotionValid(promoCode) {
        const offers = this.getConfig('offers');
        if (!offers || !offers.promozioni_speciali) return false;

        const promotion = offers.promozioni_speciali[promoCode] || 
                         Object.values(offers.promozioni_specialis).find(p => p.codice === promoCode);

        if (!promotion) return false;

        // Verifica disponibilità
        if (!promotion.disponibile) return false;

        // Verifica validità temporale
        if (promotion.validita && promotion.validita !== 'sempre') {
            // Implementa logica di validità temporale
        }

        return true;
    }

    // Metodo per sviluppatori: Ricarica forzata
    async forceReload() {
        this.loaded = false;
        await this.loadAllConfigs();
    }

    // Metodo per sviluppatori: Reset a default
    resetToDefaults() {
        this.configs = {};
        localStorage.clear();
        this.loaded = false;
        console.log('♻️ Configurazioni resetate ai default');
    }
}

// Crea istanza globale
const configLoader = new ConfigLoader();

// Export per uso in moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
}

// Shortcut globali per uso rapido
window.getConfig = (key, path) => configLoader.getConfig(key, path);
window.isOpenNow = () => configLoader.isOpenNow();
window.getTodaysOffer = () => configLoader.getTodaysOffer();

// Esempio di utilizzo:
// await configLoader.init();
// const menu = configLoader.getConfig('menu');
// const restaurantName = configLoader.getConfig('settings', 'ristorante.nome');
// const isOpen = configLoader.isOpenNow();
