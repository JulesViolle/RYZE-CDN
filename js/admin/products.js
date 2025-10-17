// Products List Management
class ProductsList {
    constructor() {
        this.init();
    }

    init() {
        this.initViewToggle();
        this.initFilters();
        this.initSearch();
        this.initActions();
        this.loadProducts(); // Load products when page initializes
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/v1/admin/products');
            const data = await response.json();
            this.renderProducts(data.products);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    renderProducts(products) {
        const productsList = document.querySelector('.products-list');
        const productsListContent = products.map(product => this.createProductListItem(product)).join('');
        
        // Insert after the header
        const header = productsList.querySelector('.products-list__header');
        header.insertAdjacentHTML('afterend', productsListContent);
    }

    createProductListItem(product) {
        const statusClass = {
            'available': 'processing',
            'sold_out': 'pending',
            'unavailable': 'cancelled'
        }[product.status] || 'processing';

        return `
            <div class="products-list__item">
                <div class="col-image">
                    <div class="products-list__image">
                        <img src="${product.images[0] || 'https://via.placeholder.com/80'}" alt="${product.title}">
                    </div>
                </div>
                <div class="col-product">
                    <div class="products-list__details">
                        <div class="products-list__title">${product.title}</div>
                        <div class="products-list__id">${product.product_id}</div>
                    </div>
                </div>
                <div class="col-price">${product.price.toLocaleString('en-US')}T</div>
                <div class="col-currency">${product.currency}</div>
                <div class="col-stock">${product.stock}</div>
                <div class="col-status">
                    <span class="status-pill status-pill--${statusClass}">${product.status}</span>
                </div>
                <div class="col-actions">
                    <button class="btn btn--secondary btn--sm">Edit</button>
                    <button class="btn btn--ghost " type="button" data-close aria-label="Close">
                        <svg  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    initViewToggle() {
        const viewToggles = document.querySelectorAll('.view-toggle__button');
        const productsGrid = document.querySelector('.products-grid');
        const productsList = document.querySelector('.products-list');
        
        if (!viewToggles.length || !productsGrid || !productsList) return;

        viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const view = toggle.dataset.view;
                
                // Update toggle buttons
                viewToggles.forEach(btn => btn.classList.remove('view-toggle__button--active'));
                toggle.classList.add('view-toggle__button--active');
                
                // Show/hide views
                if (view === 'grid') {
                    productsGrid.style.display = 'grid';
                    productsList.style.display = 'none';
                } else {
                    productsGrid.style.display = 'none';
                    productsList.style.display = 'block';
                }
                
                // Store preference
                localStorage.setItem('productsView', view);
            });
        });
        
        // Restore preference
        const savedView = localStorage.getItem('productsView');
        if (savedView) {
            const toggle = document.querySelector(`[data-view="${savedView}"]`);
            if (toggle) toggle.click();
        }
    }

    initFilters() {
        const filters = document.querySelectorAll('.filter-pill__trigger');
        
        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('filter-pill__trigger--active'));
                filter.classList.add('filter-pill__trigger--active');
                // TODO: Implement filter functionality
                this.filterProducts(filter.textContent.trim());
            });
        });
    }

    initSearch() {
        const searchInput = document.querySelector('.toolbar__search input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value;
                // TODO: Implement search functionality
                this.searchProducts(searchTerm);
            }, 300);
        });
    }

    initActions() {
        // Add Product Button
        const addProductBtn = document.querySelector('.toolbar__group .btn--primary');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                // TODO: Implement add product functionality
                this.showAddProductModal();
            });
        }

        // Edit Buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn--secondary:not(.view-toggle__button)')) {
                const productId = this.getProductIdFromButton(e.target);
                if (productId) {
                    this.editProduct(productId);
                }
            }
        });

        // Action Menus
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn--ghost')) {
                const productId = this.getProductIdFromButton(e.target);
                if (productId) {
                    this.showActionMenu(e.target, productId);
                }
            }
        });
    }

    getProductIdFromButton(button) {
        const listItem = button.closest('.products-list__item, .product-card');
        if (!listItem) return null;

        const idElement = listItem.querySelector('.products-list__id, .product-card__id');
        return idElement ? idElement.textContent : null;
    }

    showAddProductModal() {
        const modal = this.createModal({
            title: 'Add New Product',
            content: `
                <form id="addProductForm">
                    <div class="form-group">
                        <label class="form-label" for="product_id">Product ID</label>
                        <input type="text" id="product_id" name="product_id" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="title">Title</label>
                        <input type="text" id="title" name="title" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="description">Description</label>
                        <textarea id="description" name="description" class="form-textarea" rows="4" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group form-group--half">
                            <label class="form-label" for="price">Price</label>
                            <input type="number" id="price" name="price" class="form-input" step="0.01" min="0" required>
                        </div>
                        <div class="form-group form-group--half">
                            <label class="form-label" for="currency">Currency</label>
                            <select id="currency" name="currency" class="form-select" required>
                                <option value="Toman">Toman</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group form-group--half">
                            <label class="form-label" for="stock">Stock</label>
                            <input type="number" id="stock" name="stock" class="form-input" min="0" required>
                        </div>
                        <div class="form-group form-group--half">
                            <label class="form-label" for="status">Status</label>
                            <select id="status" name="status" class="form-select" required>
                                <option value="available">Available</option>
                                <option value="sold_out">Sold Out</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Product Images</label>
                        <div class="image-upload-container">
                            <div class="image-preview-area" id="imagePreviewArea"></div>
                            <div class="upload-controls">
                                <input type="file" id="productImages" name="images" multiple accept="image/*" style="display: none;">
                                <button type="button" class="btn btn--secondary" onclick="document.getElementById('productImages').click()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
                                        <path d="M16 5V3"/>
                                        <path d="M16 13v-2"/>
                                        <path d="M12 7H3"/>
                                        <path d="M9 11v2"/>
                                    </svg>
                                    Add Images
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Size Chart</label>
                        <div class="image-upload-container">
                            <div class="image-preview-area" id="sizeChartPreviewArea"></div>
                            <div class="upload-controls">
                                <input type="file" id="sizeChartImage" name="size_chart" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn--secondary" onclick="document.getElementById('sizeChartImage').click()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
                                        <path d="M16 5V3"/>
                                        <path d="M16 13v-2"/>
                                        <path d="M12 7H3"/>
                                        <path d="M9 11v2"/>
                                    </svg>
                                    Add Size Chart
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            `,
            actions: [
                {
                    label: 'Add Product',
                    primary: true,
                    onClick: async () => {
                        const form = document.getElementById('addProductForm');
                        if (!form.checkValidity()) {
                            form.reportValidity();
                            return;
                        }

                        // Create new FormData with just the form fields (not the file inputs)
                        const formData = new FormData();
                        formData.append('product_id', form.product_id.value);
                        formData.append('title', form.title.value);
                        formData.append('description', form.description.value);
                        formData.append('price', form.price.toLocaleString('en-US'));
                        formData.append('currency', form.currency.value);
                        formData.append('stock', form.stock.value);
                        formData.append('status', form.status.value);
                        
                        // Get all the product image files
                        const imageFiles = document.getElementById('productImages').files;
                        // Append each product image file to formData
                        for (let i = 0; i < imageFiles.length; i++) {
                            formData.append('images', imageFiles[i]);
                        }

                        // Get and append the size chart image if selected
                        const sizeChartFile = document.getElementById('sizeChartImage').files[0];
                        if (sizeChartFile) {
                            formData.append('size_chart', sizeChartFile);
                        }
                        
                        try {
                            const response = await fetch('/api/v1/product/add', {
                                method: 'POST',
                                body: formData  // Send as FormData to handle files
                            });

                            if (response.ok) {
                                // Show success message
                                alert('Product added successfully!');
                                // Refresh the page to show the new product
                                location.reload();
                            } else {
                                const error = await response.json();
                                alert('Error adding product: ' + error.message);
                            }
                        } catch (error) {
                            alert('Error adding product: ' + error.message);
                        }
                        
                        modal.remove();
                    }
                },
                {
                    label: 'Cancel',
                    onClick: () => modal.remove()
                }
            ]
        });
        
        document.body.appendChild(modal);

        // Function to handle image preview
        const setupImagePreview = (inputId, previewAreaId, multiple = false) => {
            const input = document.getElementById(inputId);
            const previewArea = document.getElementById(previewAreaId);

            input.addEventListener('change', () => {
                const files = input.files;
                if (!multiple) {
                    // For single file input, clear previous preview
                    previewArea.innerHTML = '';
                }

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (!file.type.startsWith('image/')) continue;

                    const reader = new FileReader();
                    const preview = document.createElement('div');
                    preview.className = 'image-preview';
                    
                    reader.onload = (e) => {
                        preview.innerHTML = `
                            <img src="${e.target.result}" alt="Image preview">
                            <button type="button" class="remove-image" data-index="${i}">&times;</button>
                        `;
                        previewArea.appendChild(preview);

                        // Add remove button functionality
                        preview.querySelector('.remove-image').addEventListener('click', function() {
                            const index = this.dataset.index;
                            const newFileList = new DataTransfer();
                            const files = input.files;

                            for (let i = 0; i < files.length; i++) {
                                if (i !== parseInt(index)) {
                                    newFileList.items.add(files[i]);
                                }
                            }

                            input.files = newFileList.files;
                            preview.remove();

                            // For single file input, clear the input when removing the image
                            if (!multiple && newFileList.files.length === 0) {
                                input.value = '';
                            }
                        });
                    };

                    reader.readAsDataURL(file);

                    // For single file input, break after first file
                    if (!multiple) break;
                }
            });
        };

        // Set up product images preview (multiple)
        setupImagePreview('productImages', 'imagePreviewArea', true);
        
        // Set up size chart preview (single)
        setupImagePreview('sizeChartImage', 'sizeChartPreviewArea', false);
    }

    async editProduct(productId) {
        try {
            // Fetch product data
            const response = await fetch(`/api/v1/admin/products/${productId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch product data');
            }
            let data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch product data');
            }
            
            // Ensure all required fields exist with default values
            console.log(data["products"])
            const product = {
                product_id: data["products"].product_id,
                title: data["products"].title,
                description: data["products"].description,
                price: data["products"].price,
                currency: data["products"].currency,
                stock: data["products"].stock,
                status: data["products"].status,
                images: data["products"].images,
                size_chart: data["products"].size_chart,
                
            };

            const modal = this.createModal({
                title: 'Edit Product',
                content: `
                    <form id="editProductForm">
                        <div class="form-group">
                            <label class="form-label" for="product_id">Product ID</label>
                            <input type="text" id="product_id" name="product_id" class="form-input" value="${product.product_id}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="title">Title</label>
                            <input type="text" id="title" name="title" class="form-input" value="${product.title}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="description">Description</label>
                            <textarea id="description" name="description" class="form-textarea" rows="4" required>${product.description}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group form-group--half">
                                <label class="form-label" for="price">Price</label>
                                <input type="number" id="price" name="price" class="form-input" step="1000" min="0" value="${product.price}" required>
                            </div>
                            <div class="form-group form-group--half">
                                <label class="form-label" for="currency">Currency</label>
                                <select id="currency" name="currency" class="form-select" required>
                                    <option value="Toman" ${product.currency === 'Toman' ? 'selected' : ''}>Toman</option>
                                    <option value="USD" ${product.currency === 'USD' ? 'selected' : ''}>USD</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group form-group--half">
                                <label class="form-label" for="stock">Stock</label>
                                <input type="number" id="stock" name="stock" class="form-input" min="0" value="" >
                            </div>
                            <div class="form-group form-group--half">
                                <label class="form-label" for="size">Size</label>
                                <select id="status" name="status" class="form-select" >
                                    <option value=""></option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                </select>
                            </div>
                            <div class="form-group form-group--half">
                                <label class="form-label" for="status">Status</label>
                                <select id="status" name="status" class="form-select" required>
                                    <option value="available" ${product.status === 'available' ? 'selected' : ''}>Available</option>
                                    <option value="sold_out" ${product.status === 'sold_out' ? 'selected' : ''}>Sold Out</option>
                                    <option value="unavailable" ${product.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Product Images</label>
                            <div class="image-upload-container">
                                <div class="image-preview-area" id="editImagePreviewArea">
                                </div>
                                <div class="upload-controls">
                                    <input type="file" id="editProductImages" name="new_images" multiple accept="image/*" style="display: none;">
                                    <button type="button" class="btn btn--secondary" onclick="document.getElementById('editProductImages').click()">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
                                            <path d="M16 5V3"/>
                                            <path d="M16 13v-2"/>
                                            <path d="M12 7H3"/>
                                            <path d="M9 11v2"/>
                                        </svg>
                                        Add Images
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Size Chart</label>
                            <div class="image-upload-container">
                                <div class="image-preview-area" id="editSizeChartPreviewArea">
                                </div>
                                <div class="upload-controls">
                                    <input type="file" id="editSizeChartImage" name="new_size_chart" accept="image/*" style="display: none;">
                                    <button type="button" class="btn btn--secondary" onclick="document.getElementById('editSizeChartImage').click()">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
                                            <path d="M16 5V3"/>
                                            <path d="M16 13v-2"/>
                                            <path d="M12 7H3"/>
                                            <path d="M9 11v2"/>
                                        </svg>
                                        ${product.size_chart ? 'Update' : 'Add'} Size Chart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                `,
                actions: [
                    {
                        label: 'Save Changes',
                        primary: true,
                        onClick: async () => {
                            const form = document.getElementById('editProductForm');
                            if (!form.checkValidity()) {
                                form.reportValidity();
                                return;
                            }

                            // Create new FormData with just the form fields (not the file inputs)
                        const formData = new FormData();
                        formData.append('product_id', form.product_id.value);
                        formData.append('title', form.title.value);
                        formData.append('description', form.description.value);
                        formData.append('price', form.price.toLocaleString('en-US'));
                        formData.append('currency', form.currency.value);
                        formData.append('stock', form.stock.value);
                        formData.append('status', form.status.value);
                            
                        // Handle product images (only new selections)
                        const selectedImages = document.getElementById('editProductImages').files;
                        for (let i = 0; i < selectedImages.length; i++) {
                            formData.append('images', selectedImages[i]);
                        }

                        // Handle size chart (only new selection)
                        const selectedSizeChart = document.getElementById('editSizeChartImage').files[0];
                        if (selectedSizeChart) {
                            formData.append('size_chart', selectedSizeChart);
                        }

                            try {
                                const response = await fetch(`/api/v1/admin/products/${productId}/update`, {
                                    method: 'POST',
                                    body: formData
                                });

                                if (response.ok) {
                                    alert('Product updated successfully!');
                                    location.reload(); // Refresh to show updates
                                } else {
                                    const error = await response.json();
                                    alert('Error updating product: ' + error.message);
                                }
                            } catch (error) {
                                alert('Error updating product: ' + error.message);
                            }

                            modal.remove();
                        }
                    },
                    {
                        label: 'Cancel',
                        onClick: () => modal.remove()
                    }
                ]
            });

            document.body.appendChild(modal);

            // Function to handle image preview for new images
            const setupImagePreview = (inputId, previewAreaId, multiple = false) => {
                const input = document.getElementById(inputId);
                const previewArea = document.getElementById(previewAreaId);

                input.addEventListener('change', () => {
                    const files = input.files;
                    if (!multiple) {
                        // For single file input (size chart), remove old preview
                        const existingPreview = previewArea.querySelector('.image-preview[data-new="true"]');
                        if (existingPreview) existingPreview.remove();
                    }

                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        if (!file.type.startsWith('image/')) continue;

                        const reader = new FileReader();
                        const preview = document.createElement('div');
                        preview.className = 'image-preview';
                        preview.setAttribute('data-new', 'true');
                        
                        reader.onload = (e) => {
                            preview.innerHTML = `
                                <img src="${e.target.result}" alt="New image preview">
                                <button type="button" class="remove-image" data-new="true">&times;</button>
                            `;
                            previewArea.appendChild(preview);

                            // Add remove button functionality
                            preview.querySelector('.remove-image').addEventListener('click', function() {
                                preview.remove();
                            });
                        };

                        reader.readAsDataURL(file);

                        // For single file input, break after first file
                        if (!multiple) break;
                    }
                });
            };

            // Set up new image previews
            setupImagePreview('editProductImages', 'editImagePreviewArea', true);
            setupImagePreview('editSizeChartImage', 'editSizeChartPreviewArea', false);

            // Handle removal of existing images
            document.querySelectorAll('#editImagePreviewArea .remove-image, #editSizeChartPreviewArea .remove-image').forEach(button => {
                if (!button.hasAttribute('data-new')) {
                    button.addEventListener('click', function() {
                        const preview = this.closest('.image-preview');
                        preview.remove();
                    });
                }
            });

        } catch (error) {
            console.error('Error loading product data:', error);
            alert('Error loading product data. Please try again.');
        }
    }

    showActionMenu(trigger, productId) {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            
            
            
            <div class="context-menu__item" data-action="delete">
                <button><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
                </button>
            </div>
        `;

        // Position menu
        const rect = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;

        // Add event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu__item')?.dataset.action;
            if (action) {
                this.handleAction(action, productId);
                menu.remove();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !trigger.contains(e.target)) {
                menu.remove();
            }
        });

        document.body.appendChild(menu);
    }

    handleAction(action, productId) {
        switch (action) {
            case 'duplicate':
                console.log('Duplicate product:', productId);
                break;
            case 'archive':
                console.log('Archive product:', productId);
                break;
            case 'delete':
                this.showDeleteConfirmation(productId);
                break;
        }
    }

    showDeleteConfirmation(productId) {
        const modal = this.createModal({
            title: 'Delete Product',
            content: `
                <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            `,
            actions: [
                {
                    label: 'Delete',
                    primary: true,
                    onClick: async () => {
                        try {
                            const response = await fetch(`/api/v1/admin/products/${productId}/delete`, {
                                method: 'POST'
                            });

                            if (response.ok) {
                                alert('Product deleted successfully!');
                                location.reload(); // Refresh the page to update the product list
                            } else {
                                const error = await response.json();
                                alert('Error deleting product: ' + (error.message || 'Unknown error occurred'));
                            }
                        } catch (error) {
                            alert('Error deleting product: ' + error.message);
                        }
                        modal.remove();
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
        
        // Add styles for image upload
        const style = document.createElement('style');
        style.textContent = `
            .image-upload-container {
                border: 2px dashed #ddd;
                padding: 20px;
                border-radius: 8px;
                background: #f9f9f9;
            }
            .image-preview-area {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
            }
            .image-preview {
                position: relative;
                aspect-ratio: 1;
                border-radius: 4px;
                overflow: hidden;
            }
            .image-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .image-preview .remove-image {
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: #666;
            }
            .upload-controls {
                display: flex;
                justify-content: center;
            }
        `;
        document.head.appendChild(style);
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal__header">
                    <h2 class="h4">${title}</h2>
                    <button class="btn btn--ghost" type="button" data-close aria-label="Close"> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"> <path d="M18 6L6 18M6 6l12 12"/> </svg> </button>
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

    filterProducts(filter) {
        console.log('Filtering products by:', filter);
        // TODO: Implement filter logic
    }

    searchProducts(term) {
        console.log('Searching products:', term);
        // TODO: Implement search logic
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ProductsList();
});