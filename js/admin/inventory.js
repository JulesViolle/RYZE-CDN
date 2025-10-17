// Inventory Management
class InventoryManager {
    constructor() {
        this.inventory = new Map();
        this.filters = {
            search: '',
            location: '',
            stockLevel: '',
            sort: 'stock-level-asc'
        };
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.loadInventory();
        this.initializeSearch();
        this.initializeFilters();
        this.initializeModals();
        this.initFilters();
        this.initDateRanges();
        this.initMovementTracking();
        this.initAdjustments();
        this.initAlerts();
    }

    setupEventListeners() {
        // Table actions
        document.addEventListener('click', (e) => {
            const historyBtn = e.target.closest('[data-modal-trigger="stock-history"]');
            if (historyBtn) {
                const productId = this.getProductIdFromElement(historyBtn);
                this.showStockHistory(productId);
            }

            const moveBtn = e.target.closest('[data-modal-trigger="adjust-location"]');
            if (moveBtn) {
                const productId = this.getProductIdFromElement(moveBtn);
                this.showLocationAdjustment(productId);
            }
        });

        // Form submissions
        const adjustmentForm = document.getElementById('stock-adjustment-form');
        if (adjustmentForm) {
            adjustmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStockAdjustment(e.target);
            });
        }

        const locationForm = document.getElementById('location-adjustment-form');
        if (locationForm) {
            locationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLocationAdjustment(e.target);
            });
        }

        // Quantity controls
        document.addEventListener('click', (e) => {
            const decreaseBtn = e.target.closest('[data-quantity-decrease]');
            const increaseBtn = e.target.closest('[data-quantity-increase]');
            
            if (decreaseBtn || increaseBtn) {
                const input = e.target.closest('.input-group').querySelector('input');
                const value = parseInt(input.value, 10);
                const min = parseInt(input.min, 10) || 0;
                const max = parseInt(input.max, 10) || Infinity;

                if (decreaseBtn && value > min) {
                    input.value = value - 1;
                } else if (increaseBtn && value < max) {
                    input.value = value + 1;
                }

                input.dispatchEvent(new Event('change'));
            }
        });
    }

    initFilters() {
        const filters = document.querySelectorAll('.filter-pill__trigger');
        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('filter-pill__trigger--active'));
                filter.classList.add('filter-pill__trigger--active');
                this.filterMovements(filter.dataset.filter);
            });
        });
    }

    initDateRanges() {
        const dateSelect = document.querySelector('.toolbar__date-select');
        if (dateSelect) {
            dateSelect.addEventListener('change', (e) => {
                this.updateDateRange(e.target.value);
            });
        }
    }

    initMovementTracking() {
        // Add Movement Button
        const addMovementBtn = document.querySelector('[data-action="add-movement"]');
        if (addMovementBtn) {
            addMovementBtn.addEventListener('click', () => {
                this.showMovementModal();
            });
        }

        // Movement Type Filters
        document.querySelectorAll('[data-movement-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByMovementType(e.target.dataset.movementType);
            });
        });
    }

    initAdjustments() {
        // Quick Adjustment Buttons
        document.querySelectorAll('.quick-adjust').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-product-id]').dataset.productId;
                const adjustment = e.target.dataset.adjustment;
                this.quickAdjustStock(productId, adjustment);
            });
        });
    }

    initAlerts() {
        // Dismiss Alert Button
        document.querySelectorAll('.stock-alert__dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.stock-alert').remove();
            });
        });
    }

    initializeSearch() {
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.applyFilters();
                }, 300);
            });
        }
    }

    initializeFilters() {
        // Location filter
        const locationSelect = document.querySelector('[name="location"]');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                this.filters.location = e.target.value;
                this.applyFilters();
            });
        }

        // Stock level filter
        const levelSelect = document.querySelector('[name="stock-level"]');
        if (levelSelect) {
            levelSelect.addEventListener('change', (e) => {
                this.filters.stockLevel = e.target.value;
                this.applyFilters();
            });
        }

        // Sort filter
        const sortSelect = document.querySelector('[name="sort"]');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }
    }

    initializeModals() {
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal-trigger]');
            const close = e.target.closest('[data-modal-close]');
            const overlay = e.target.closest('.modal__overlay');

            if (trigger) {
                const modalId = trigger.dataset.modalTrigger;
                this.openModal(modalId);
            }

            if (close || overlay) {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            }
        });
    }

    async loadInventory() {
        try {
            // Simulated API call
            const response = await fetch('/api/v1/inventory');
            const inventory = await response.json();
            
            inventory.forEach(item => {
                this.inventory.set(item.id, item);
            });

            this.renderInventory();
            this.updateMetrics();
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showToast('Error loading inventory', 'error');
        }
    }

    renderInventory() {
        const tbody = document.querySelector('.table tbody');
        if (!tbody) return;

        const filteredItems = this.getFilteredItems();
        
        tbody.innerHTML = filteredItems.map(item => this.renderInventoryRow(item)).join('');
    }

    renderInventoryRow(item) {
        const stockLevel = (item.quantity / item.maxQuantity) * 100;
        const stockStatus = this.getStockStatus(item);

        return `
            <tr data-product-id="${item.id}">
                <td>
                    <div class="product-cell">
                        <img src="${item.image}" alt="" class="product-cell__image">
                        <div class="product-cell__info">
                            <div class="product-cell__name">${item.name}</div>
                            <div class="product-cell__variant">${item.variant}</div>
                        </div>
                    </div>
                </td>
                <td>${item.sku}</td>
                <td>
                    <div class="location-cell">
                        <span class="location-cell__warehouse">${item.location.warehouse}</span>
                        <span class="location-cell__position">${item.location.position}</span>
                    </div>
                </td>
                <td>
                    <div class="stock-cell">
                        <div class="stock-indicator">
                            <div class="stock-indicator__bar" style="width: ${stockLevel}%"></div>
                        </div>
                        <span class="stock-cell__count">${item.quantity} units</span>
                    </div>
                </td>
                <td>$${(item.quantity * item.unitValue).toFixed(2)}</td>
                <td>
                    <div class="movement-cell">
                        <span class="movement-cell__type movement-cell__type--${item.lastMovement.type}">
                            ${item.lastMovement.type === 'in' ? '+' : '-'}${item.lastMovement.quantity}
                        </span>
                        <span class="movement-cell__date">${this.formatDate(item.lastMovement.date)}</span>
                    </div>
                </td>
                <td>
                    <div class="table__actions">
                        <button class="btn btn--ghost btn--sm" data-modal-trigger="stock-history">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            History
                        </button>
                        <button class="btn btn--ghost btn--sm" data-modal-trigger="adjust-location">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                            Move
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    showMovementModal() {
        const modal = this.createModal({
            title: 'Record Stock Movement',
            content: `
                <div class="form-group">
                    <label class="form-label">Movement Type</label>
                    <select class="form-select" required>
                        <option value="in">Stock In</option>
                        <option value="out">Stock Out</option>
                        <option value="adjust">Adjustment</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Product</label>
                    <select class="form-select" required>
                        <option value="">Select a product...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Quantity</label>
                    <input type="number" class="form-input" required min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <select class="form-select">
                        <option value="warehouse-1">Warehouse 1</option>
                        <option value="warehouse-2">Warehouse 2</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" rows="3"></textarea>
                </div>
            `,
            actions: [
                {
                    label: 'Record Movement',
                    primary: true,
                    onClick: async () => {
                        const formData = new FormData(modal.querySelector('form'));
                        try {
                            await this.saveStockMovement({
                                type: formData.get('type'),
                                productId: formData.get('product'),
                                quantity: parseInt(formData.get('quantity'), 10),
                                location: formData.get('location'),
                                notes: formData.get('notes')
                            });
                            
                            this.showToast('Stock movement recorded successfully', 'success');
                            this.loadInventory(); // Refresh data
                            modal.remove();
                        } catch (error) {
                            this.showToast(error.message, 'error');
                        }
                    }
                },
                {
                    label: 'Cancel',
                    onClick: () => modal.remove()
                }
            ]
        });
        
        document.body.appendChild(modal);
    }

    createModal({ title, content, actions }) {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal__header">
                    <h2 class="h4">${title}</h2>
                    <button class="btn btn--ghost btn--sm" data-close>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal__content">
                    ${content}
                </div>
                <div class="modal__footer">
                    ${actions.map(action => `
                        <button class="btn ${action.primary ? 'btn--primary' : 'btn--secondary'}" data-action="${action.label}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        setTimeout(() => {
            modal.classList.add('modal-backdrop--visible');
            modal.querySelector('.modal').classList.add('modal--visible');
        }, 10);

        modal.querySelector('[data-close]').addEventListener('click', () => {
            modal.remove();
        });

        actions.forEach(action => {
            modal.querySelector(`[data-action="${action.label}"]`).addEventListener('click', action.onClick);
        });

        return modal;
    }
    // Instance methods
    filterMovements(filter) {
        this.filters.search = filter || '';
        this.applyFilters();
    }

    updateDateRange(range) {
        // Update date range and refresh filtered items
        this.dateRange = range;
        this.applyFilters();
    }

    filterByMovementType(type) {
        this.filters.movementType = type;
        this.applyFilters();
    }

    quickAdjustStock(productId, adjustment) {
        const item = this.inventory.get(productId);
        if (!item) return;

        const quantity = adjustment === 'increase' ? 1 : -1;
        this.handleStockAdjustment({
            productId,
            quantity,
            type: adjustment === 'increase' ? 'in' : 'out',
            reason: 'Quick adjustment'
        });
    }

    getStockStatus(item) {
        if (item.quantity <= 0) {
            return {
                level: 'out',
                badge: 'badge--danger',
                text: 'Out of Stock'
            };
        } else if (item.quantity <= item.lowStockThreshold) {
            return {
                level: 'low',
                badge: 'badge--warning',
                text: 'Low Stock'
            };
        }
        return {
            level: 'in',
            badge: '',
            text: 'In Stock'
        };
    }

    getFilteredItems() {
        let filtered = Array.from(this.inventory.values());

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm) ||
                item.variant.toLowerCase().includes(searchTerm)
            );
        }

        // Apply location filter
        if (this.filters.location) {
            filtered = filtered.filter(item => 
                item.location.warehouse === this.filters.location
            );
        }

        // Apply stock level filter
        if (this.filters.stockLevel) {
            filtered = filtered.filter(item => 
                this.getStockStatus(item).level === this.filters.stockLevel
            );
        }

        // Apply movement type filter
        if (this.filters.movementType) {
            filtered = filtered.filter(item => 
                item.lastMovement.type === this.filters.movementType
            );
        }

        // Apply date range filter
        if (this.dateRange) {
            const rangeEnd = new Date();
            let rangeStart;

            switch (this.dateRange) {
                case 'today':
                    rangeStart = new Date();
                    rangeStart.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    rangeStart = new Date();
                    rangeStart.setDate(rangeStart.getDate() - 7);
                    break;
                case 'month':
                    rangeStart = new Date();
                    rangeStart.setMonth(rangeStart.getMonth() - 1);
                    break;
                case 'year':
                    rangeStart = new Date();
                    rangeStart.setFullYear(rangeStart.getFullYear() - 1);
                    break;
            }

            if (rangeStart) {
                filtered = filtered.filter(item => {
                    const movementDate = new Date(item.lastMovement.date);
                    return movementDate >= rangeStart && movementDate <= rangeEnd;
                });
            }
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.filters.sort) {
                case 'stock-level-asc':
                    return (a.quantity / a.maxQuantity) - (b.quantity / b.maxQuantity);
                case 'stock-level-desc':
                    return (b.quantity / b.maxQuantity) - (a.quantity / a.maxQuantity);
                case 'value-desc':
                    return (b.quantity * b.unitValue) - (a.quantity * a.unitValue);
                case 'value-asc':
                    return (a.quantity * a.unitValue) - (b.quantity * b.unitValue);
                case 'movement':
                    return new Date(b.lastMovement.date) - new Date(a.lastMovement.date);
                default:
                    return 0;
            }
        });

        return filtered;
    }

    async showStockHistory(productId) {
        const modal = document.querySelector('[data-modal="stock-history"]');
        const item = this.inventory.get(productId);

        if (!item) return;

        try {
            // Simulated API call for history
            const history = await this.fetchStockHistory(productId);
            
            const timeline = modal.querySelector('.timeline');
            timeline.innerHTML = history.map(entry => this.renderHistoryEntry(entry)).join('');

            this.openModal('stock-history');
        } catch (error) {
            console.error('Error loading stock history:', error);
            this.showToast('Error loading history', 'error');
        }
    }

    renderHistoryEntry(entry) {
        return `
            <div class="timeline__item">
                <div class="timeline__marker"></div>
                <div class="timeline__content">
                    <div class="timeline__header">
                        <span class="badge ${entry.type === 'in' ? 'badge--success' : 'badge--danger'}">
                            ${entry.type === 'in' ? 'Stock In' : 'Stock Out'} (${entry.type === 'in' ? '+' : '-'}${entry.quantity})
                        </span>
                        <time class="timeline__time">${this.formatDate(entry.date)}</time>
                    </div>
                    <p class="timeline__description">${entry.description}</p>
                    <div class="timeline__meta">By ${entry.user}</div>
                </div>
            </div>
        `;
    }

    async showLocationAdjustment(productId) {
        const modal = document.querySelector('[data-modal="adjust-location"]');
        const item = this.inventory.get(productId);

        if (!item) return;

        // Populate form with current location
        const fromLocation = modal.querySelector('#from-location');
        fromLocation.value = `${item.location.warehouse} / ${item.location.position}`;

        // Set maximum movable quantity
        const quantityInput = modal.querySelector('#move-quantity');
        quantityInput.max = item.quantity;
        quantityInput.value = 1;

        this.openModal('adjust-location');
    }

    async handleStockAdjustment(form) {
        try {
            const formData = new FormData(form);
            const adjustment = {
                type: formData.get('adjustment-type'),
                productId: formData.get('adjustment-product'),
                quantity: parseInt(formData.get('adjustment-quantity'), 10),
                location: formData.get('adjustment-location'),
                reason: formData.get('adjustment-reason')
            };

            // Validate
            if (!adjustment.type || !adjustment.productId || !adjustment.quantity || !adjustment.location) {
                throw new Error('Please fill in all required fields');
            }

            // Simulated API call
            await this.saveStockAdjustment(adjustment);
            
            this.closeModal(form.closest('.modal'));
            this.loadInventory(); // Refresh the data
            this.showToast('Stock adjusted successfully', 'success');
        } catch (error) {
            console.error('Error adjusting stock:', error);
            this.showToast(error.message, 'error');
        }
    }

    async handleLocationAdjustment(form) {
        try {
            const formData = new FormData(form);
            const move = {
                quantity: parseInt(formData.get('move-quantity'), 10),
                toWarehouse: formData.get('to-warehouse'),
                toPosition: formData.get('to-position'),
                reason: formData.get('move-reason')
            };

            // Validate
            if (!move.quantity || !move.toWarehouse || !move.toPosition) {
                throw new Error('Please fill in all required fields');
            }

            // Simulated API call
            await this.saveLocationAdjustment(move);
            
            this.closeModal(form.closest('.modal'));
            this.loadInventory(); // Refresh the data
            this.showToast('Stock moved successfully', 'success');
        } catch (error) {
            console.error('Error moving stock:', error);
            this.showToast(error.message, 'error');
        }
    }

    updateMetrics() {
        const items = Array.from(this.inventory.values());
        
        // Calculate total value
        const totalValue = items.reduce((sum, item) => 
            sum + (item.quantity * item.unitValue), 0
        );

        // Count low stock items
        const lowStockCount = items.filter(item => 
            item.quantity > 0 && item.quantity <= item.lowStockThreshold
        ).length;

        // Calculate turnover rate
        const totalSold = items.reduce((sum, item) => 
            sum + item.soldLastMonth, 0
        );
        const averageInventory = items.reduce((sum, item) => 
            sum + ((item.startMonthQuantity + item.quantity) / 2), 0
        );
        const turnover = totalSold / (averageInventory || 1);

        // Update UI
        document.querySelector('[data-metric="total-value"]').textContent = 
            `$${totalValue.toFixed(2)}`;
        document.querySelector('[data-metric="low-stock"]').textContent = 
            lowStockCount.toString();
        document.querySelector('[data-metric="turnover"]').textContent = 
            `${turnover.toFixed(1)}x`;
    }

    // Helper methods
    getProductIdFromElement(element) {
        const row = element.closest('[data-product-id]');
        return row ? row.dataset.productId : null;
    }

    openModal(modalId) {
        const modal = document.querySelector(`[data-modal="${modalId}"]`);
        if (modal) {
            modal.classList.add('modal--open');
        }
    }

    applyFilters() {
        this.renderInventory();
        this.updateMetrics();
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('modal--open');
        }
    }

    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 1000 * 60 * 60) { // Less than 1 hour
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes} minutes ago`;
        } else if (diff < 1000 * 60 * 60 * 24) { // Less than 24 hours
            const hours = Math.floor(diff / (1000 * 60 * 60));
            return `${hours} hours ago`;
        } else if (diff < 1000 * 60 * 60 * 24 * 7) { // Less than 7 days
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            return `${days} days ago`;
        } else {
            return d.toLocaleDateString();
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div class="toast__content">
                <span class="toast__message">${message}</span>
                <button class="toast__close" onclick="this.parentElement.parentElement.remove()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // API simulation methods
    async fetchStockHistory(productId) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        type: 'out',
                        quantity: 2,
                        date: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        description: 'Order #1234 fulfilled',
                        user: 'John Smith'
                    },
                    {
                        type: 'in',
                        quantity: 10,
                        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
                        description: 'Stock received from supplier',
                        user: 'Jane Doe'
                    },
                    {
                        type: 'adjustment',
                        quantity: -1,
                        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
                        description: 'Manual stock count adjustment',
                        user: 'System'
                    }
                ]);
            }, 500);
        });
    }

    async saveStockAdjustment(adjustment) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true });
            }, 500);
        });
    }

    async saveLocationAdjustment(move) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true });
            }, 500);
        });
    }

    async saveStockMovement(movement) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true });
            }, 500);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});