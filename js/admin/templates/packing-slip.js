export function generatePackingSlipTemplate(order) {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="print-document packing-slip">
            <div class="print-document__header">
                <div class="print-document__branding">
                    <img src="/admin/images/logo.png" alt="RYZE Fashion" class="print-document__logo">
                    <h1>Packing Slip</h1>
                </div>
                <div class="print-document__meta">
                    <dl>
                        <dt>Order #</dt>
                        <dd>${order.id}</dd>
                        <dt>Date</dt>
                        <dd>${date}</dd>
                    </dl>
                </div>
            </div>

            <div class="print-document__addresses">
                <div class="print-document__address">
                    <h3>Ship To</h3>
                    <p>
                        ${order.shippingAddress.name}<br>
                        ${order.shippingAddress.street}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
                        ${order.shippingAddress.country}
                    </p>
                </div>
                <div class="print-document__shipping">
                    <h3>Shipping Method</h3>
                    <p>${order.shipping.carrier} - ${order.shipping.method}</p>
                    ${order.tracking ? `
                        <p class="print-document__tracking">
                            Tracking #: ${order.tracking}
                        </p>
                    ` : ''}
                </div>
            </div>

            <table class="print-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Location</th>
                        <th>Quantity</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>
                                <div class="print-table__product">
                                    <div class="print-table__product-name">${item.name}</div>
                                    <div class="print-table__product-variant">${item.variant}</div>
                                </div>
                            </td>
                            <td>${item.sku}</td>
                            <td>${item.location || 'N/A'}</td>
                            <td>${item.quantity}</td>
                            <td>
                                <span class="print-table__status print-table__status--${item.status.toLowerCase()}">
                                    ${item.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="print-document__footer">
                <div class="print-document__checklist">
                    <h3>Packing Checklist</h3>
                    <ul class="print-document__checks">
                        <li>
                            <input type="checkbox" id="check_items">
                            <label for="check_items">Verify all items are present and undamaged</label>
                        </li>
                        <li>
                            <input type="checkbox" id="check_quantity">
                            <label for="check_quantity">Confirm quantities match order details</label>
                        </li>
                        <li>
                            <input type="checkbox" id="check_package">
                            <label for="check_package">Package items securely with appropriate materials</label>
                        </li>
                        ${order.shipping.fragile ? `
                            <li>
                                <input type="checkbox" id="check_fragile">
                                <label for="check_fragile">Add "FRAGILE" markings to package</label>
                            </li>
                        ` : ''}
                        <li>
                            <input type="checkbox" id="check_label">
                            <label for="check_label">Attach shipping label securely</label>
                        </li>
                    </ul>
                </div>

                ${order.notes ? `
                    <div class="print-document__notes">
                        <h3>Special Instructions</h3>
                        <p>${order.notes}</p>
                    </div>
                ` : ''}

                <div class="print-document__signature">
                    <div class="print-document__sign-section">
                        <div class="print-document__sign-line">
                            <span>Packed By</span>
                        </div>
                        <div class="print-document__sign-line">
                            <span>Date</span>
                        </div>
                    </div>
                    <div class="print-document__sign-section">
                        <div class="print-document__sign-line">
                            <span>Checked By</span>
                        </div>
                        <div class="print-document__sign-line">
                            <span>Date</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}