import { generateInvoiceTemplate } from './templates/invoice.js';
import { generateShippingLabelTemplate } from './templates/shipping-label.js';
import { generatePackingSlipTemplate } from './templates/packing-slip.js';

class PrintManager {
    constructor() {
        this.init();
        this.templateCache = new Map();
    }

    init() {
        this.initPrintButtons();
        this.initPrintPreview();
        this.initBarcodes();
        this.initKeyboardShortcuts();
    }

    initPrintButtons() {
        document.addEventListener('click', (e) => {
            const printButton = e.target.closest('[data-print]');
            if (printButton) {
                const type = printButton.dataset.print;
                const id = printButton.dataset.id;
                this.handlePrint(type, id);
            }
        });
    }

    initPrintPreview() {
        // Handle print preview modal
        document.addEventListener('click', (e) => {
            const previewButton = e.target.closest('[data-print-preview]');
            if (previewButton) {
                const type = previewButton.dataset.printPreview;
                const id = previewButton.dataset.id;
                this.showPrintPreview(type, id);
            }
        });
    }

    initBarcodes() {
        // Generate barcodes for shipping labels
        const barcodeElements = document.querySelectorAll('[data-barcode]');
        barcodeElements.forEach(element => {
            const code = element.dataset.barcode;
            this.generateBarcode(element, code);
        });
    }

    handlePrint(type, id) {
        switch (type) {
            case 'invoice':
                this.printInvoice(id);
                break;
            case 'shipping-label':
                this.printShippingLabel(id);
                break;
            case 'packing-slip':
                this.printPackingSlip(id);
                break;
        }
    }

    showPrintPreview(type, id) {
        const modal = this.createModal({
            title: 'Print Preview',
            content: `
                <div class="print-document">
                    ${this.getPrintContent(type, id)}
                </div>
            `,
            actions: [
                {
                    label: 'Print',
                    primary: true,
                    onClick: () => {
                        this.handlePrint(type, id);
                        modal.remove();
                    }
                },
                {
                    label: 'Cancel',
                    onClick: () => modal.remove()
                }
            ],
            wide: true
        });
        
        document.body.appendChild(modal);
    }

    getPrintContent(type, id) {
        // This would fetch the actual content from your data
        switch (type) {
            case 'invoice':
                return this.getInvoiceTemplate(id);
            case 'shipping-label':
                return this.getShippingLabelTemplate(id);
            case 'packing-slip':
                return this.getPackingSlipTemplate(id);
            default:
                return '';
        }
    }

    getInvoiceTemplate(id) {
        return `
            <div class="print-document__header">
                <div>
                    <img src="images/logo.png" alt="RYZE Fashion" class="print-document__logo">
                    <h1 class="print-document__title">Invoice #${id}</h1>
                </div>
                <div class="print-document__info">
                    <div class="print-document__info-label">Date</div>
                    <div>October 14, 2023</div>
                </div>
            </div>

            <div class="print-document__meta">
                <div class="print-document__info">
                    <div class="print-document__info-label">Bill To</div>
                    <div>John Doe<br>123 Main St<br>New York, NY 10001</div>
                </div>
                <div class="print-document__info">
                    <div class="print-document__info-label">Ship To</div>
                    <div>John Doe<br>123 Main St<br>New York, NY 10001</div>
                </div>
            </div>

            <table class="print-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Premium Cotton T-Shirt</td>
                        <td>2</td>
                        <td>$29.99</td>
                        <td>$59.98</td>
                    </tr>
                    <!-- More items would go here -->
                </tbody>
                <tfoot class="print-table__footer">
                    <tr>
                        <td colspan="3">Subtotal</td>
                        <td>$59.98</td>
                    </tr>
                    <tr>
                        <td colspan="3">Tax</td>
                        <td>$5.99</td>
                    </tr>
                    <tr>
                        <td colspan="3">Total</td>
                        <td>$65.97</td>
                    </tr>
                </tfoot>
            </table>

            <div class="print-document__footer">
                Thank you for your business!<br>
                Payment is due within 30 days.
            </div>
        `;
    }

    getShippingLabelTemplate(id) {
        return `
            <div class="print-label">
                <div class="print-label__section">
                    <div class="print-label__heading">Ship To</div>
                    John Doe<br>
                    123 Main St<br>
                    New York, NY 10001
                </div>

                <div class="print-label__section">
                    <div class="print-label__heading">From</div>
                    RYZE Fashion<br>
                    456 Commerce St<br>
                    Los Angeles, CA 90012
                </div>

                <div class="print-label__section">
                    <div class="print-label__barcode" data-barcode="${id}"></div>
                    <div class="print-label__heading">Order #${id}</div>
                </div>
            </div>
        `;
    }

    getPackingSlipTemplate(id) {
        return `
            <div class="print-document__header">
                <div>
                    <img src="images/logo.png" alt="RYZE Fashion" class="print-document__logo">
                    <h1 class="print-document__title">Packing Slip</h1>
                </div>
                <div class="print-document__info">
                    <div class="print-document__info-label">Order #${id}</div>
                    <div>October 14, 2023</div>
                </div>
            </div>

            <table class="print-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Quantity</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Premium Cotton T-Shirt</td>
                        <td>TSH-001-BLK-L</td>
                        <td>2</td>
                        <td>A1-B2</td>
                    </tr>
                    <!-- More items would go here -->
                </tbody>
            </table>

            <div class="print-document__footer">
                Please verify all items before shipping.
            </div>
        `;
    }

    printInvoice(id) {
        this.createPrintFrame(this.getInvoiceTemplate(id));
    }

    printShippingLabel(id) {
        this.createPrintFrame(this.getShippingLabelTemplate(id));
    }

    printPackingSlip(id) {
        this.createPrintFrame(this.getPackingSlipTemplate(id));
    }

    createPrintFrame(content) {
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        document.body.appendChild(frame);

        const doc = frame.contentDocument;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="stylesheet" href="css/tokens.css">
                <link rel="stylesheet" href="css/components/print.css">
            </head>
            <body>
                <div class="print-document">
                    ${content}
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => document.body.removeChild(frame), 100);
                    };
                </script>
            </body>
            </html>
        `);
        doc.close();
    }

    generateBarcode(element, code) {
        // This is a placeholder for barcode generation
        // You would typically use a library like JsBarcode here
        element.innerHTML = `
            <svg width="200" height="100">
                <!-- Placeholder barcode representation -->
                <rect x="10" y="10" width="180" height="80" fill="#fff" stroke="#000"/>
                <text x="100" y="60" text-anchor="middle">${code}</text>
            </svg>
        `;
    }

    createModal({ title, content, actions, wide = false }) {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal ${wide ? 'modal--wide' : ''}">
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
    new PrintManager();
});