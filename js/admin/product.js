// Products Page Management - MAISON Design System
class ProductsPage {
    constructor() {
        this.state = {
            filter: 'all',
            page: 1,
            perPage: 20,
            searchQuery: '',
            totalProducts: 0,
            totalPages: 1,
            currentProduct: null
        };

        this.elements = {
            productsGrid: document.getElementById('productsGrid'),
            paginationInfo: document.getElementById('paginationInfo'),
            prevPageBtn: document.getElementById('prevPage'),
            nextPageBtn: document.getElementById('nextPage'),
            searchInput: document.getElementById('searchInput'),
            filterButtons: document.querySelectorAll('.filter-pill__btn'),
            addProductBtn: document.getElementById('addProductBtn'),
            stockModal: document.getElementById('stockModal'),
            closeModal: document.getElementById('closeModal'),
            stockGrid: document.getElementById('stockGrid'),
            modalProductName: document.getElementById('modalProductName')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
    }

    setupEventListeners() {
        // Filter buttons
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Search with debounce
        let searchTimeout;
        this.elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.state.searchQuery = e.target.value;
                this.state.page = 1;
                this.loadProducts();
            }, 300);
        });

        // Pagination
        this.elements.prevPageBtn.addEventListener('click', () => {
            if (this.state.page > 1) {
                this.state.page--;
                this.loadProducts();
            }
        });

        this.elements.nextPageBtn.addEventListener('click', () => {
            if (this.state.page < this.state.totalPages) {
                this.state.page++;
                this.loadProducts();
            }
        });

        // Add product
        this.elements.addProductBtn.addEventListener('click', () => this.showAddProductModal());

        // Modal
        this.elements.closeModal.addEventListener('click', () => this.closeStockModal());
        this.elements.stockModal.addEventListener('click', (e) => {
            if (e.target === this.elements.stockModal) this.closeStockModal();
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.stockModal.classList.contains('modal--open')) {
                this.closeStockModal();
            }
        });
    }

    handleFilterChange(e) {
        const filter = e.target.dataset.filter;
        
        // Update UI
        this.elements.filterButtons.forEach(btn => {
            btn.classList.remove('filter-pill__btn--active');
        });
        e.target.classList.add('filter-pill__btn--active');

        // Map filter values
        const filterMap = {
            'all': null,
            'available': 'available',
            'low': 'low',
            'out': 'sold_out',
            'unavailable': 'unavailable'
        };

        // Update state and reload
        this.state.filter = filterMap[filter] || null;
        this.state.page = 1;
        this.loadProducts();
    }

    async loadProducts() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/v1/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filter: this.state.filter,
                    search: this.state.searchQuery || null,
                    page: this.state.page,
                    per_page: this.state.perPage
                })
            });

            const data = await response.json();

            this.state.totalProducts = data.total_products || 0;
            this.state.totalPages = data.total_pages || 1;
            this.state.page = data.current_page || 1;

            this.renderProducts(data.products || []);
            this.updatePagination();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError();
        }
    }

    renderProducts(products) {
        if (products.length === 0) {
            this.showEmptyState();
            return;
        }

        const cards = products.map(product => {
            const totalStock = product.stock || (product.sizes ? 
                Object.values(product.sizes).reduce((sum, val) => sum + val, 0) : 0);
            
            let statusClass = 'available';
            let statusText = 'Available';
            
            if (totalStock === 0) {
                statusClass = 'out';
                statusText = 'Sold Out';
            } else if (totalStock < 10) {
                statusClass = 'low';
                statusText = 'Low Stock';
            }

            if (product.status === 'unavailable' || !product.is_available) {
                statusClass = 'unavailable';
                statusText = 'Unavailable';
            }

            const imageUrl = product.images && product.images[0] ? 
                `/static${product.images[0]}` : '/images/placeholder.png';

            return `
                <div class="product-card" data-product-id="${product.product_id}">
                    <div class="product-card__image">
                        <img src="${imageUrl}" alt="${product.title}">
                        <span class="product-card__badge">${statusText}</span>
                    </div>
                    <div class="product-card__body">
                        <h3 class="product-card__title">${product.title}</h3>
                        <div class="product-card__meta">
                            <div>
                                <span class="product-card__price">${this.formatCurrency(product.price)}</span>
                                <span class="product-card__currency">${product.currency}</span>
                            </div>
                        </div>
                        <div class="product-card__stock">
                            <span class="product-card__stock-label">Total Stock</span>
                            <span class="product-card__stock-value">${totalStock}</span>
                        </div>
                        <div class="product-card__actions">
                            <button 
                                class="btn btn--ghost btn--sm" 
                                data-action="view-stock"
                                data-product-id="${product.product_id}"
                            >
                                View Stock
                            </button>
                            <button 
                                class="btn btn--secondary btn--sm"
                                data-action="edit"
                                data-product-id="${product.product_id}"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.productsGrid.innerHTML = cards;

        // Attach event listeners
        this.attachProductEventListeners();
    }

    attachProductEventListeners() {
        this.elements.productsGrid.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const productId = button.dataset.productId;

            if (action === 'view-stock') {
                this.viewStock(productId);
            } else if (action === 'edit') {
                this.editProduct(productId);
            }
        });
    }

    showLoading() {
        this.elements.productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="loading-spinner" style="width: 40px; height: 40px;"></div>
                <div class="empty-state__title">Loading products...</div>
            </div>
        `;
    }

    showEmptyState() {
        this.elements.productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <div class="empty-state__title">No products found</div>
                <div class="empty-state__description">
                    ${this.state.searchQuery ? 'Try adjusting your search or filters' : 'No products match the selected filter'}
                </div>
            </div>
        `;
    }

    showError() {
        this.elements.productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state__title">Error loading products</div>
                <div class="empty-state__description">Please try again later</div>
            </div>
        `;
    }

    updatePagination() {
        const start = ((this.state.page - 1) * this.state.perPage) + 1;
        const end = Math.min(this.state.page * this.state.perPage, this.state.totalProducts);
        
        this.elements.paginationInfo.textContent = 
            `Showing ${start}-${end} of ${this.state.totalProducts} products`;

        this.elements.prevPageBtn.disabled = this.state.page <= 1;
        this.elements.nextPageBtn.disabled = this.state.page >= this.state.totalPages;
    }

    async viewStock(productId) {
        try {
            const response = await fetch(`/api/v1/admin/products/${productId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch product');
            }

            const product = data.products[0];
            this.state.currentProduct = product;
            
            this.elements.modalProductName.textContent = `${product.title} - Stock Details`;
            
            const stockData = product.sizes || { S: 0, M: 0, L: 0 };
            
            this.elements.stockGrid.innerHTML = Object.entries(stockData).map(([size, quantity]) => `
                <div class="stock-cell">
                    <div class="stock-cell__size">${size}</div>
                    <div class="stock-cell__value">${quantity}</div>
                    <div class="stock-cell__label">${this.getSizeLabel(size)}</div>
                </div>
            `).join('');
            
            this.elements.stockModal.classList.add('modal--open');
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('Error loading product stock:', error);
            alert('Error loading stock details');
        }
    }

    closeStockModal() {
        this.elements.stockModal.classList.remove('modal--open');
        document.body.style.overflow = '';
        this.state.currentProduct = null;
    }

    async editProduct(productId) {
        try {
            const response = await fetch(`/api/v1/admin/products/${productId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch product');
            }

            const product = data.products[0];
            const featuresText = Array.isArray(product.features) ? 
                product.features.join('\n') : (product.features || '');

            const modal = this.createEditModal(product, featuresText, productId);
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('Error loading product:', error);
            alert('Error loading product data');
        }
    }

    createEditModal(product, featuresText, productId) {
        const modal = document.createElement('div');
        modal.className = 'modal modal--open';
        
        modal.innerHTML = `
            <div class="modal__content" style="max-width: 700px;">
                <div class="modal__header">
                    <h3 class="modal__title">Edit Product</h3>
                    <button class="modal__close" id="closeEditModal">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal__body">
                    <form id="editProductForm" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Product ID</label>
                            <input type="text" value="${product.product_id}" readonly style="width: 100%; padding: 0.75rem; background: var(--bg-muted); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Title</label>
                            <input type="text" name="title" value="${product.title}" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Description</label>
                            <textarea name="description" rows="4" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans); resize: vertical;">${product.description}</textarea>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Features (one per line)</label>
                            <textarea name="features" rows="4" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans); resize: vertical;">${featuresText}</textarea>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Price</label>
                                <input type="number" name="price" value="${product.price}" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Currency</label>
                                <select name="currency" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                                    <option value="Toman" ${product.currency === 'Toman' ? 'selected' : ''}>Toman</option>
                                    <option value="USD" ${product.currency === 'USD' ? 'selected' : ''}>USD</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Stock</label>
                                <input type="number" name="stock" min="0" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Size</label>
                                <select name="size" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                                    <option value="">Select size</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Status</label>
                            <select name="status" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                                <option value="available" ${product.status === 'available' ? 'selected' : ''}>Available</option>
                                <option value="sold_out" ${product.status === 'sold_out' ? 'selected' : ''}>Sold Out</option>
                                <option value="unavailable" ${product.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
                                <option value="drop-wait" ${product.status === 'drop-wait' ? 'selected' : ''}>Drop Wait</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Image Type</label>
                            <select name="image_type" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                                <option value="main">Main</option>
                                <option value="gallery">Gallery</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Product Images</label>
                            <input type="file" name="images" multiple accept="image/*" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Size Chart</label>
                            <input type="file" name="size_chart" accept="image/*" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                            <button type="submit" class="btn btn--primary" style="flex: 1;">Save Changes</button>
                            <button type="button" class="btn btn--secondary" id="cancelEdit">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Close handlers
        modal.querySelector('#closeEditModal').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });

        modal.querySelector('#cancelEdit').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });

        // Form submit
        modal.querySelector('#editProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEditSubmit(e.target, productId, modal);
        });

        document.body.style.overflow = 'hidden';
        return modal;
    }

    async handleEditSubmit(form, productId, modal) {
        const formData = new FormData(form);
        
        // Process features
        const featuresValue = formData.get('features') || '';
        const features = featuresValue.split('\n')
            .map(line => line.trim())
            .filter(line => line);
        
        formData.delete('features');
        features.forEach(f => formData.append('features[]', f));
        
        try {
            const response = await fetch(`/api/v1/admin/products/${productId}/update`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Product updated successfully!');
                this.loadProducts();
                modal.remove();
                document.body.style.overflow = '';
            } else {
                const error = await response.json();
                alert('Error: ' + (error.message || 'Failed to update product'));
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Error updating product');
        }
    }

    showAddProductModal() {
        const modal = document.createElement('div');
        modal.className = 'modal modal--open';
        
        modal.innerHTML = `
            <div class="modal__content" style="max-width: 700px;">
                <div class="modal__header">
                    <h3 class="modal__title">Add New Product</h3>
                    <button class="modal__close" id="closeAddModal">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal__body">
                    <form id="addProductForm" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Product ID</label>
                            <input type="text" name="product_id" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Title</label>
                            <input type="text" name="title" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Description</label>
                            <textarea name="description" rows="4" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans); resize: vertical;"></textarea>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Features (one per line)</label>
                            <textarea name="features" rows="4" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans); resize: vertical;"></textarea>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Price</label>
                                <input type="number" name="price" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Currency</label>
                                <select name="currency" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                                    <option value="Toman">Toman</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Status</label>
                            <select name="status" required style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                                <option value="unavailable">Unavailable</option>
                                <option value="available">Available</option>
                                <option value="sold_out">Sold Out</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Product Images</label>
                            <input type="file" name="images" multiple accept="image/*" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem;">Size Chart</label>
                            <input type="file" name="size_chart" accept="image/*" style="width: 100%; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem; font-family: var(--font-sans);">
                        </div>
                        <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                            <button type="submit" class="btn btn--primary" style="flex: 1;">Add Product</button>
                            <button type="button" class="btn btn--secondary" id="cancelAdd">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Close handlers
        modal.querySelector('#closeAddModal').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });

        modal.querySelector('#cancelAdd').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });

        // Form submit
        modal.querySelector('#addProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddSubmit(e.target, modal);
        });

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    async handleAddSubmit(form, modal) {
        const formData = new FormData(form);
        
        // Process features
        const featuresValue = formData.get('features') || '';
        const features = featuresValue.split('\n')
            .map(line => line.trim())
            .filter(line => line);
        
        formData.delete('features');
        features.forEach(f => formData.append('features[]', f));
        
        try {
            const response = await fetch('/api/v1/product/add', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Product added successfully!');
                this.loadProducts();
                modal.remove();
                document.body.style.overflow = '';
            } else {
                const error = await response.json();
                alert('Error: ' + (error.message || 'Failed to add product'));
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Error adding product');
        }
    }

    formatCurrency(amount) {
        return `€${amount.toLocaleString('en-US')}`;
    }

    getSizeLabel(size) {
        const labels = {
            'S': 'Small',
            'M': 'Medium',
            'L': 'Large',
            'XL': 'X-Large',
            'XXL': '2X-Large'
        };
        return labels[size] || size;
    }
}

// Navigation Module (Shared)
const NavigationModule = (() => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('mobileNavToggle');
    const overlay = document.createElement('div');
    
    let isOpen = false;

    const init = () => {
        if (!sidebar || !toggle) return;

        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 99;
            display: none;
            opacity: 0;
            transition: opacity 200ms;
        `;
        document.body.appendChild(overlay);

        toggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) closeSidebar();
        });
    };

    const toggleSidebar = () => {
        isOpen ? closeSidebar() : openSidebar();
    };

    const openSidebar = () => {
        sidebar.classList.add('sidebar--open');
        overlay.style.display = 'block';
        setTimeout(() => overlay.style.opacity = '1', 10);
        document.body.style.overflow = 'hidden';
        isOpen = true;
    };

    const closeSidebar = () => {
        sidebar.classList.remove('sidebar--open');
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 200);
        document.body.style.overflow = '';
        isOpen = false;
    };

    return { init };
})();

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    NavigationModule.init();
    const productsPage = new ProductsPage();
    
    // Remove unresolved attribute
    setTimeout(() => {
        document.body.removeAttribute('unresolved');
    }, 100);

    console.log('✨ Products page initialized');

    // Expose globally if needed
    window.ProductsPage = productsPage;
});