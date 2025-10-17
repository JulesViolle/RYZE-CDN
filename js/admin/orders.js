// Orders List Management
class OrdersList {
    constructor() {
        this.init();
    }

    init() {
        this.initBulkSelection();
        this.initBulkActions();
        this.initFilters();
        this.initSearch();
    }

    initBulkSelection() {
        const table = document.querySelector('.orders-table');
        if (!table) return;

        const headerCheckbox = table.querySelector('thead input[type="checkbox"]');
        const rowCheckboxes = table.querySelectorAll('tbody input[type="checkbox"]');
        const bulkActions = document.querySelector('.bulk-actions');
        const selectedCount = document.querySelector('.bulk-actions__selected');

        if (headerCheckbox) {
            headerCheckbox.addEventListener('change', () => {
                rowCheckboxes.forEach(checkbox => {
                    checkbox.checked = headerCheckbox.checked;
                });
                this.updateBulkActionsVisibility();
            });
        }

        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
                const anyChecked = Array.from(rowCheckboxes).some(cb => cb.checked);
                
                if (headerCheckbox) {
                    headerCheckbox.checked = allChecked;
                    headerCheckbox.indeterminate = anyChecked && !allChecked;
                }
                
                this.updateBulkActionsVisibility();
            });
        });

        // Update bulk actions visibility
        this.updateBulkActionsVisibility = () => {
            if (!bulkActions || !selectedCount) return;

            const checkedCount = Array.from(rowCheckboxes).filter(cb => cb.checked).length;
            
            if (checkedCount > 0) {
                bulkActions.classList.add('bulk-actions--visible');
                selectedCount.textContent = `${checkedCount} order${checkedCount === 1 ? '' : 's'} selected`;
            } else {
                bulkActions.classList.remove('bulk-actions--visible');
            }
        };
    }

    initBulkActions() {
        const bulkActions = document.querySelector('.bulk-actions');
        if (!bulkActions) return;

        const cancelBtn = bulkActions.querySelector('.btn--ghost');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.orders-table input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                this.updateBulkActionsVisibility();
            });
        }
    }

    initFilters() {
        const filters = document.querySelectorAll('.filter-pill__trigger');
        
        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('filter-pill__trigger--active'));
                filter.classList.add('filter-pill__trigger--active');
                // TODO: Implement filter functionality
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
                console.log('Searching for:', searchTerm);
            }, 300);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new OrdersList();
});