// Order Detail Management
class OrderDetail {
    constructor() {
        this.init();
    }

    init() {
        this.initStatusUpdate();
        this.initPaymentActions();
        this.initNotes();
        this.initPrint();
    }

    initStatusUpdate() {
        const updateBtn = document.querySelector('.toolbar__group .btn--primary');
        if (!updateBtn) return;

        updateBtn.addEventListener('click', () => {
            // Show status update modal
            const modal = this.createModal({
                title: 'Update Order Status',
                content: `
                    <div class="form-group">
                        <label class="form-label">New Status</label>
                        <select class="form-select">
                            <option>Processing</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reason (optional)</label>
                        <textarea class="form-textarea" rows="3"></textarea>
                    </div>
                `,
                actions: [
                    {
                        label: 'Update',
                        primary: true,
                        onClick: () => {
                            // TODO: Implement status update
                            console.log('Status updated');
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
        });
    }

    
    initNotes() {
        const addNoteBtn = document.querySelector('.order-section__header .btn--ghost');
        if (!addNoteBtn) return;

        addNoteBtn.addEventListener('click', () => {
            const modal = this.createModal({
                title: 'Add Note',
                content: `
                    <div class="form-group">
                        <label class="form-label">Note</label>
                        <textarea class="form-textarea" rows="4"></textarea>
                    </div>
                `,
                actions: [
                    {
                        label: 'Add',
                        primary: true,
                        onClick: () => {
                            // TODO: Implement note addition
                            console.log('Note added');
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
        });
    }

    initPrint() {
        const printBtn = document.querySelector('.toolbar__group .btn--secondary');
        if (!printBtn) return;

        printBtn.addEventListener('click', () => {
            // TODO: Implement print functionality
            window.print();
        });
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
    new OrderDetail();
});