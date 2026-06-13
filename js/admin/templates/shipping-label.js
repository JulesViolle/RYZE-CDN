export function generateShippingLabelTemplate(order) {
    // Create QR code for tracking (placeholder)
    const qrCode = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="200" height="200" viewBox="0 0 200 200">
            <rect x="0" y="0" width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle">${order.id}</text>
        </svg>
    `)}`;

    return `
        <div class="print-document shipping-label">
            <div class="shipping-label__section shipping-label__header">
                <div class="shipping-label__carrier">
                    <img src="/admin/images/carriers/${order.shipping.carrier.toLowerCase()}.png" 
                         alt="${order.shipping.carrier}"
                         class="shipping-label__carrier-logo">
                    <div class="shipping-label__service">
                        ${order.shipping.method}
                    </div>
                </div>
                <div class="shipping-label__tracking">
                    <div class="shipping-label__barcode" data-barcode="${order.tracking}"></div>
                    <div class="shipping-label__tracking-number">${order.tracking}</div>
                </div>
            </div>

            <div class="shipping-label__section shipping-label__addresses">
                <div class="shipping-label__address shipping-label__from">
                    <h3>From:</h3>
                    <p>
                        RYZE Fashion<br>
                        123 Fashion Street<br>
                        Los Angeles, CA 90012<br>
                        United States<br>
                        Phone: (555) 123-4567
                    </p>
                </div>

                <div class="shipping-label__address shipping-label__to">
                    <h3>To:</h3>
                    <p>
                        ${order.shippingAddress.name}<br>
                        ${order.shippingAddress.street}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
                        ${order.shippingAddress.country}<br>
                        ${order.shippingAddress.phone ? `Phone: ${order.shippingAddress.phone}` : ''}
                    </p>
                </div>
            </div>

            <div class="shipping-label__section shipping-label__details">
                <dl>
                    <dt>Weight:</dt>
                    <dd>${order.shipping.weight} lbs</dd>

                    <dt>Dimensions:</dt>
                    <dd>${order.shipping.dimensions.join(" × ")} in</dd>

                    <dt>Ship Date:</dt>
                    <dd>${new Date().toLocaleDateString()}</dd>

                    <dt>Order #:</dt>
                    <dd>${order.id}</dd>
                </dl>
            </div>

            <div class="shipping-label__section shipping-label__qr">
                <img src="${qrCode}" alt="Tracking QR Code" class="shipping-label__qr-code">
            </div>

            ${order.shipping.hazmat ? `
                <div class="shipping-label__section shipping-label__warning">
                    <svg class="shipping-label__warning-icon" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5z"/>
                        <path d="M12 10v4m0 2v2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>HAZARDOUS MATERIALS</span>
                </div>
            ` : ''}

            ${order.shipping.fragile ? `
                <div class="shipping-label__section shipping-label__warning">
                    <svg class="shipping-label__warning-icon" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M4 21h16M12 3L3 19h18L12 3z"/>
                    </svg>
                    <span>FRAGILE - HANDLE WITH CARE</span>
                </div>
            ` : ''}
        </div>
    `;
}