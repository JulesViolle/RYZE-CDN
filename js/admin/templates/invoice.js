export function generateInvoiceTemplate(order) {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="print-document invoice">
            <div class="print-document__header">
                <div class="print-document__branding">
                    <img src="/admin/images/logo.png" alt="RYZE Fashion" class="print-document__logo">
                    <div class="print-document__company">
                        <h1>RYZE Fashion</h1>
                        <p>123 Fashion Street<br>Los Angeles, CA 90012<br>United States</p>
                    </div>
                </div>
                <div class="print-document__meta">
                    <h2 class="print-document__title">Invoice</h2>
                    <div class="print-document__details">
                        <dl>
                            <dt>Invoice Number</dt>
                            <dd>#${order.id}</dd>
                            <dt>Order Date</dt>
                            <dd>${date}</dd>
                            <dt>Payment Method</dt>
                            <dd>${order.paymentMethod}</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <div class="print-document__addresses">
                <div class="print-document__address">
                    <h3>Bill To</h3>
                    <p>
                        ${order.billingAddress.name}<br>
                        ${order.billingAddress.street}<br>
                        ${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zip}<br>
                        ${order.billingAddress.country}
                    </p>
                </div>
                <div class="print-document__address">
                    <h3>Ship To</h3>
                    <p>
                        ${order.shippingAddress.name}<br>
                        ${order.shippingAddress.street}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
                        ${order.shippingAddress.country}
                    </p>
                </div>
            </div>

            <table class="print-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
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
                            <td>${item.quantity}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4">Subtotal</td>
                        <td>$${order.subtotal.toFixed(2)}</td>
                    </tr>
                    ${order.discount ? `
                        <tr>
                            <td colspan="4">Discount (${order.discount.code})</td>
                            <td>-$${order.discount.amount.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr>
                        <td colspan="4">Shipping (${order.shipping.method})</td>
                        <td>$${order.shipping.cost.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="4">Tax</td>
                        <td>$${order.tax.toFixed(2)}</td>
                    </tr>
                    <tr class="print-table__total">
                        <td colspan="4">Total</td>
                        <td>$${order.total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <div class="print-document__footer">
                <div class="print-document__notes">
                    ${order.notes ? `
                        <h3>Notes</h3>
                        <p>${order.notes}</p>
                    ` : ''}
                </div>
                <div class="print-document__terms">
                    <h3>Terms & Conditions</h3>
                    <p>Payment is due within 30 days. Please include the invoice number with your payment.</p>
                </div>
            </div>
        </div>
    `;
}