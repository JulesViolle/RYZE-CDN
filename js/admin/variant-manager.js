class VariantManager {
    constructor() {
        this.init();
        this.variants = new Map();
        this.options = [];
    }

    init() {
        this.container = document.querySelector('[data-variant-manager]');
        if (!this.container) return;

        this.optionsContainer = this.container.querySelector('.variant-options');
        this.variantList = this.container.querySelector('[data-variant-list]');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add option
        this.container.querySelector('[data-add-option]').addEventListener('click', () => {
            this.addOption();
        });

        // Remove option
        this.optionsContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-option]');
            if (removeBtn) {
                const option = removeBtn.closest('.variant-option');
                const index = Array.from(this.optionsContainer.children).indexOf(option);
                this.removeOption(index);
            }
        });

        // Option changes
        this.optionsContainer.addEventListener('input', (e) => {
            const input = e.target;
            if (input.matches('[data-option-name], [data-option-values]')) {
                this.updateOptions();
            }
        });
    }

    addOption() {
        const option = document.createElement('div');
        option.className = 'variant-option';
        option.innerHTML = `
            <div class="form-row">
                <div class="form-group form-group--grow">
                    <label class="label">Option Name</label>
                    <input type="text" class="input" placeholder="Size, Color, etc." data-option-name>
                </div>
                <div class="form-group form-group--grow">
                    <label class="label">Values</label>
                    <input type="text" class="input" placeholder="Separate values with commas" data-option-values>
                </div>
                <button type="button" class="btn btn--ghost btn--icon" data-remove-option>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        this.optionsContainer.appendChild(option);
    }

    removeOption(index) {
        const option = this.optionsContainer.children[index];
        option.remove();
        this.updateOptions();
    }

    updateOptions() {
        this.options = Array.from(this.optionsContainer.children).map(option => {
            const name = option.querySelector('[data-option-name]').value;
            const values = option.querySelector('[data-option-values]').value
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);
            return { name, values };
        }).filter(option => option.name && option.values.length);

        this.generateVariants();
    }

    generateVariants() {
        if (!this.options.length) {
            this.variants.clear();
            this.renderVariants();
            return;
        }

        // Generate all possible combinations
        const combinations = this.cartesianProduct(this.options.map(option => option.values));
        
        // Create variant map
        const newVariants = new Map();
        combinations.forEach(combination => {
            const key = combination.join(' / ');
            const existingVariant = this.variants.get(key) || {};
            
            newVariants.set(key, {
                ...existingVariant,
                options: combination,
                price: existingVariant.price || 0,
                quantity: existingVariant.quantity || 0,
                sku: existingVariant.sku || ''
            });
        });

        this.variants = newVariants;
        this.renderVariants();
    }

    cartesianProduct(arrays) {
        return arrays.reduce((acc, arr) => 
            acc.flatMap(x => arr.map(y => [...x, y])),
            [[]]
        );
    }

    renderVariants() {
        if (!this.variants.size) {
            this.variantList.innerHTML = '';
            return;
        }

        this.variantList.innerHTML = `
            <table class="variant-table">
                <thead>
                    <tr>
                        ${this.options.map(option => 
                            `<th>${option.name}</th>`
                        ).join('')}
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>SKU</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(this.variants.entries()).map(([key, variant]) => `
                        <tr data-variant="${key}">
                            ${variant.options.map(value => 
                                `<td>${value}</td>`
                            ).join('')}
                            <td>
                                <div class="input-group input-group--sm">
                                    <span class="input-group__addon">$</span>
                                    <input type="number" class="input" value="${variant.price}"
                                           min="0" step="0.01" data-variant-price>
                                </div>
                            </td>
                            <td>
                                <input type="number" class="input input--sm" value="${variant.quantity}"
                                       min="0" data-variant-quantity>
                            </td>
                            <td>
                                <input type="text" class="input input--sm" value="${variant.sku}"
                                       placeholder="SKU" data-variant-sku>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Add event listeners for variant fields
        this.variantList.addEventListener('input', (e) => {
            const input = e.target;
            const row = input.closest('[data-variant]');
            if (!row) return;

            const key = row.dataset.variant;
            const variant = this.variants.get(key);
            if (!variant) return;

            if (input.matches('[data-variant-price]')) {
                variant.price = parseFloat(input.value) || 0;
            } else if (input.matches('[data-variant-quantity]')) {
                variant.quantity = parseInt(input.value, 10) || 0;
            } else if (input.matches('[data-variant-sku]')) {
                variant.sku = input.value;
            }

            this.variants.set(key, variant);
        });
    }

    getVariants() {
        return {
            options: this.options,
            variants: Array.from(this.variants.values())
        };
    }

    setVariants({ options, variants }) {
        // Clear existing options
        this.optionsContainer.innerHTML = '';

        // Add and populate options
        options.forEach(option => {
            this.addOption();
            const optionEl = this.optionsContainer.lastElementChild;
            optionEl.querySelector('[data-option-name]').value = option.name;
            optionEl.querySelector('[data-option-values]').value = option.values.join(', ');
        });

        // Update variants
        this.updateOptions();
        variants.forEach(variant => {
            const key = variant.options.join(' / ');
            this.variants.set(key, variant);
        });

        this.renderVariants();
    }

    clear() {
        this.optionsContainer.innerHTML = '';
        this.variants.clear();
        this.options = [];
        this.renderVariants();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.variantManager = new VariantManager();
});