class CustomerManager {
    constructor() {
        this.init();
    }

    init() {
        this.initSearch();
        this.initFilters();
        this.initSort();
        this.initActions();
    }

    initSearch() {
        const searchInput = document.querySelector('.toolbar__search input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchCustomers(e.target.value);
            }, 300);
        });
    }

    initFilters() {
        const filters = document.querySelectorAll('.filter-pill__trigger');
        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('filter-pill__trigger--active'));
                filter.classList.add('filter-pill__trigger--active');
                this.filterCustomers(filter.dataset.filter);
            });
        });
    }

    initSort() {
        const sortButtons = document.querySelectorAll('[data-sort]');
        sortButtons.forEach(button => {
            button.addEventListener('click', () => {
                const field = button.dataset.sort;
                const direction = button.classList.toggle('sort--desc') ? 'desc' : 'asc';
                this.sortCustomers(field, direction);
            });
        });
    }

    initActions() {
        // Bulk Actions
        const bulkActionSelect = document.querySelector('.toolbar__bulk-actions select');
        if (bulkActionSelect) {
            bulkActionSelect.addEventListener('change', (e) => {
                const action = e.target.value;
                if (action) {
                    this.handleBulkAction(action);
                    e.target.value = ''; // Reset select
                }
            });
        }

        // Single Customer Actions
        document.addEventListener('click', (e) => {
            const actionButton = e.target.closest('[data-customer-action]');
            if (actionButton) {
                const action = actionButton.dataset.customerAction;
                const customerId = actionButton.closest('[data-customer-id]')?.dataset.customerId;
                if (customerId) {
                    this.handleCustomerAction(action, customerId);
                }
            }
        });
    }

    searchCustomers(term) {
        console.log('Searching customers:', term);
        // TODO: Implement customer search
    }

    filterCustomers(filter) {
        console.log('Filtering customers:', filter);
        // TODO: Implement customer filtering
    }

    sortCustomers(field, direction) {
        console.log('Sorting customers:', field, direction);
        // TODO: Implement customer sorting
    }

    handleBulkAction(action) {
        const selectedIds = Array.from(document.querySelectorAll('.customer-checkbox:checked'))
            .map(checkbox => checkbox.closest('[data-customer-id]').dataset.customerId);

        if (!selectedIds.length) {
            this.showToast('No customers selected', 'error');
            return;
        }

        console.log('Bulk action:', action, 'for customers:', selectedIds);
        // TODO: Implement bulk actions
    }

    handleCustomerAction(action, customerId) {
        switch (action) {
            case 'view':
                window.location.href = `customer-detail.html?id=${customerId}`;
                break;
            case 'edit':
                this.showEditModal(customerId);
                break;
            case 'delete':
                this.showDeleteConfirmation(customerId);
                break;
            // Add more actions as needed
        }
    }

    showEditModal(customerId) {
        const modal = this.createModal({
            title: 'Edit Customer',
            content: `
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" value="John Doe">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" value="john@example.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" value="+1 234 567 890">
                </div>
                <div class="form-group">
                    <label class="form-label">Customer Group</label>
                    <select class="form-select">
                        <option>Regular</option>
                        <option selected>VIP</option>
                        <option>Wholesale</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" rows="3"></textarea>
                </div>
            `,
            actions: [
                {
                    label: 'Save Changes',
                    primary: true,
                    onClick: () => {
                        // TODO: Implement save changes
                        console.log('Saving customer:', customerId);
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

    showDeleteConfirmation(customerId) {
        const modal = this.createModal({
            title: 'Delete Customer',
            content: `
                <p>Are you sure you want to delete this customer? This action cannot be undone.</p>
                <p class="text-sm color-danger mt-4">Note: All associated orders and data will be permanently deleted.</p>
            `,
            actions: [
                {
                    label: 'Delete',
                    primary: true,
                    onClick: () => {
                        // TODO: Implement customer deletion
                        console.log('Deleting customer:', customerId);
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

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div class="toast__content">${message}</div>
            <button class="toast__close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);

        toast.querySelector('.toast__close').addEventListener('click', () => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
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
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new CustomerManager();
});