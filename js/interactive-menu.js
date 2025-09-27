// js/interactive-menu.js - MENÙ INTERATTIVO 3D
class InteractiveMenu {
    constructor() {
        this.menuData = null;
        this.filteredItems = [];
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        await this.loadMenuData();
        this.setupEventListeners();
        this.renderMenu();
        this.setupAnimations();
    }

    // Carica i dati del menù dal file JSON
    async loadMenuData() {
        try {
            const response = await fetch('data/menu.json');
            this.menuData = await response.json();
            console.log('🍕 Menù caricato con successo!', this.menuData);
        } catch (error) {
            console.error('Errore nel caricamento del menù:', error);
            this.showError('Impossibile caricare il menù. Riprova più tardi.');
        }
    }

    // Setup degli event listeners
    setupEventListeners() {
        // Filtri categorie
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCategoryFilter(e);
            });
        });

        // Barra di ricerca
        const searchInput = document.getElementById('menu-search');
        const searchBtn = document.getElementById('search-btn');

        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e);
            }
        });

        searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });

        // Click sulle card pizza
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pizza-card')) {
                this.handlePizzaClick(e);
            }
        });

        // Aggiungi al carrello
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                e.stopPropagation();
                this.handleAddToCart(e);
            }
        });
    }

    // Gestione filtri categorie
    handleCategoryFilter(e) {
        // Rimuovi active da tutti i bottoni
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Aggiungi active al bottone cliccato
        const button = e.target;
        button.classList.add('active');

        this.currentCategory = button.dataset.category;
        this.applyFilters();
    }

    // Gestione ricerca
    handleSearch(e) {
        if (e) {
            this.searchTerm = e.target.value.toLowerCase().trim();
        }
        this.applyFilters();
    }

    // Applica filtri e ricerca
    applyFilters() {
        if (!this.menuData) return;

        this.filteredItems = [];

        // Filtra per categoria e ricerca
        this.menuData.categorie.forEach(categoria => {
            if (this.currentCategory === 'all' || categoria.id === this.currentCategory) {
                const prodottiFiltrati = categoria.prodotti.filter(prodotto => {
                    const matchesSearch = this.searchTerm === '' || 
                        prodotto.nome.toLowerCase().includes(this.searchTerm) ||
                        prodotto.descrizione.toLowerCase().includes(this.searchTerm) ||
                        prodotto.ingredienti.some(ingrediente => 
                            ingrediente.toLowerCase().includes(this.searchTerm)
                        );
                    return matchesSearch;
                });

                this.filteredItems.push({
                    ...categoria,
                    prodotti: prodottiFiltrati
                });
            }
        });

        this.renderMenu();
    }

    // Renderizza il menù
    renderMenu() {
        const container = document.getElementById('menu-container');
        
        if (!this.menuData) {
            container.innerHTML = `
                <div class="error-message">
                    <p>❌ Errore nel caricamento del menù</p>
                    <button onclick="location.reload()">Ricarica</button>
                </div>
            `;
            return;
        }

        if (this.filteredItems.length === 0 || this.filteredItems.every(cat => cat.prodotti.length === 0)) {
            container.innerHTML = `
                <div class="no-results">
                    <p>🍕 Nessun risultato trovato</p>
                    <p>Prova a modificare i filtri o la ricerca</p>
                    <button onclick="interactiveMenu.clearFilters()">Mostra tutto</button>
                </div>
            `;
            return;
        }

        let html = '';

        this.filteredItems.forEach(categoria => {
            if (categoria.prodotti.length > 0) {
                html += this.renderCategorySection(categoria);
            }
        });

        container.innerHTML = html;
        this.setupCardAnimations();
    }

    // Renderizza una sezione categoria
    renderCategorySection(categoria) {
        return `
            <div class="category-section" data-category="${categoria.id}">
                <div class="category-header">
                    <h2>${categoria.nome}</h2>
                    <p>${categoria.descrizione}</p>
                </div>
                <div class="category-grid">
                    ${categoria.prodotti.map(prodotto => this.renderPizzaCard(prodotto, categoria.id)).join('')}
                </div>
            </div>
        `;
    }

    // Renderizza una card pizza
    renderPizzaCard(prodotto, categoriaId) {
        const classList = ['pizza-card'];
        if (prodotto.popolare) classList.push('popular');
        if (prodotto.novita) classList.push('new');
        if (prodotto.vegana) classList.push('vegan');

        const badges = this.generateBadges(prodotto);

        return `
            <div class="${classList.join(' ')}" data-id="${prodotto.id}" data-category="${categoriaId}">
                <div class="pizza-card-inner">
                    <div class="pizza-card-image">
                        <img src="assets/images/${prodotto.immagine || 'pizza-default.jpg'}" 
                             alt="${prodotto.nome}" 
                             onerror="this.src='assets/images/pizza-default.jpg'">
                        ${badges}
                    </div>
                    
                    <div class="pizza-card-content">
                        <h3 class="pizza-card-title">${prodotto.nome}</h3>
                        <p class="pizza-card-description">${prodotto.descrizione}</p>
                        
                        <div class="pizza-card-price">
                            €${prodotto.prezzo.toFixed(2)}
                        </div>
                        
                        <button class="add-to-cart-btn" data-product='${JSON.stringify(prodotto).replace(/'/g, "&#39;")}'>
                            🛒 Aggiungi al Carrello
                        </button>
                    </div>
                    
                    <div class="pizza-ingredients">
                        <ul class="ingredients-list">
                            ${prodotto.ingredienti.map(ingrediente => `
                                <li class="ingredient-tag">${ingrediente}</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    // Genera i badge per la pizza
    generateBadges(prodotto) {
        const badges = [];
        if (prodotto.popolare) badges.push('🔥 POPOLARE');
        if (prodotto.novita) badges.push('🆕 NUOVO');
        if (prodotto.vegana) badges.push('🌱 VEGAN');

        if (badges.length > 0) {
            return `<div class="pizza-badge">${badges[0]}</div>`;
        }
        return '';
    }

    // Setup animazioni delle card
    setupCardAnimations() {
        const cards = document.querySelectorAll('.pizza-card');
        
        cards.forEach((card, index) => {
            // Animazione di entrata
            card.style.animationDelay = `${index * 0.1}s`;
            
            // Effetto hover 3D
            card.addEventListener('mousemove', (e) => {
                this.handleCardHover(e, card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.resetCardHover(card);
            });
        });
    }

    // Gestione hover card 3D
    handleCardHover(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateY = (x - centerX) / 25;
        const rotateX = (centerY - y) / 25;
        
        card.style.transform = `
            perspective(1000px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            translateZ(20px)
        `;
        
        // Effetto parallax interno
        const image = card.querySelector('.pizza-card-image img');
        if (image) {
            const moveX = (x - centerX) / 20;
            const moveY = (y - centerY) / 20;
            image.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
        }
    }

    // Reset hover card
    resetCardHover(card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        
        const image = card.querySelector('.pizza-card-image img');
        if (image) {
            image.style.transform = 'scale(1) translate(0, 0)';
        }
    }

    // Click sulla pizza (apre modal dettagli)
    handlePizzaClick(e) {
        const card = e.target.closest('.pizza-card');
        if (!card || e.target.closest('.add-to-cart-btn')) return;

        const productId = card.dataset.id;
        const categoriaId = card.dataset.category;
        
        const prodotto = this.findProductById(productId, categoriaId);
        if (prodotto) {
            this.openPizzaModal(prodotto);
        }
    }

    // Trova prodotto per ID
    findProductById(productId, categoriaId) {
        const categoria = this.menuData.categorie.find(cat => cat.id === categoriaId);
        return categoria ? categoria.prodotti.find(prod => prod.id === productId) : null;
    }

    // Apri modal dettagli pizza
    openPizzaModal(prodotto) {
        const modal = document.getElementById('pizza-modal');
        const modalImg = document.getElementById('modal-pizza-img');
        const modalName = document.getElementById('modal-pizza-name');
        const modalDesc = document.getElementById('modal-pizza-desc');
        const modalIngredients = document.getElementById('modal-ingredients-list');
        const modalAllergeni = document.getElementById('modal-allergeni');
        const modalPrice = document.getElementById('modal-price');
        const modalBadge = document.getElementById('modal-badge');

        // Popola modal
        modalImg.src = `assets/images/${prodotto.immagine || 'pizza-default.jpg'}`;
        modalImg.alt = prodotto.nome;
        modalName.textContent = prodotto.nome;
        modalDesc.textContent = prodotto.descrizione;
        modalPrice.textContent = `€${prodotto.prezzo.toFixed(2)}`;

        // Ingredienti
        modalIngredients.innerHTML = prodotto.ingredienti
            .map(ingrediente => `<li>${ingrediente}</li>`)
            .join('');

        // Allergeni
        const allergeni = prodotto.allergeni.map(allergene => 
            this.menuData.allergeni[allergene] || allergene
        ).join(', ');
        
        modalAllergeni.textContent = allergeni || 'Nessun allergene segnalato';

        // Badge
        modalBadge.textContent = prodotto.popolare ? 'POPOLARE' : 
                               prodotto.novita ? 'NUOVO' : 
                               prodotto.vegana ? 'VEGAN' : 'SPECIALITÀ';

        // Setup pulsante aggiungi al carrello nel modal
        const addButton = modal.querySelector('.add-to-cart-modal');
        addButton.onclick = () => {
            this.addProductToCart(prodotto);
            this.closePizzaModal();
        };

        // Mostra modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);

        // Setup chiusura modal
        this.setupModalClose();
    }

    // Setup chiusura modal
    setupModalClose() {
        const modal = document.getElementById('pizza-modal');
        const closeBtn = document.getElementById('close-modal');

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // Chiusura con ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    // Chiudi modal pizza
    closePizzaModal() {
        const modal = document.getElementById('pizza-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Aggiungi al carrello
    handleAddToCart(e) {
        const button = e.target.closest('.add-to-cart-btn');
        const productData = JSON.parse(button.dataset.product.replace(/&#39;/g, "'"));
        
        this.addProductToCart(productData);
    }

    addProductToCart(product) {
        // Usa il sistema carrello globale se disponibile
        if (window.cartSystem) {
            window.cartSystem.addToCart(product);
        } else {
            // Fallback locale
            this.showAddedToCartFeedback(product);
        }
    }

    // Feedback visivo aggiunta al carrello
    showAddedToCartFeedback(product) {
        const button = event.target.closest('.add-to-cart-btn');
        if (!button) return;

        const originalText = button.innerHTML;
        
        button.innerHTML = '✅ Aggiunto!';
        button.classList.add('added');
        
        // Notifica
        if (window.app && window.app.showNotification) {
            window.app.showNotification(`🎉 ${product.nome} aggiunta al carrello!`);
        }

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('added');
        }, 2000);
    }

    // Pulisci filtri
    clearFilters() {
        this.searchTerm = '';
        this.currentCategory = 'all';
        
        document.getElementById('menu-search').value = '';
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
        
        this.applyFilters();
    }

    // Mostra errore
    showError(message) {
        const container = document.getElementById('menu-container');
        container.innerHTML = `
            <div class="error-message">
                <p>❌ ${message}</p>
                <button onclick="interactiveMenu.loadMenuData()">Riprova</button>
            </div>
        `;
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.interactiveMenu = new InteractiveMenu();
});
