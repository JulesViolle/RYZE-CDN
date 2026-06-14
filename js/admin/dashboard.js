// Dashboard Charts
class DashboardCharts {
    constructor() {
        this.init();
    }

    init() {
        this.renderSparklines();
        this.renderTrendCharts();
    }

    renderSparklines() {
        // Simple sparkline implementation using Canvas
        const sparklineData = {
            'revenueChart': [12, 19, 15, 25, 32, 28, 35],
            'ordersChart': [45, 52, 49, 58, 55, 62, 68],
            'aovChart': [82, 85, 83, 87, 86, 89, 92],
            'refundChart': [2.1, 1.9, 2.3, 2.5, 2.4, 2.6, 2.4]
        };

        Object.entries(sparklineData).forEach(([id, data]) => {
            const canvas = document.createElement('canvas');
            const container = document.getElementById(id);
            if (!container) return;

            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const max = Math.max(...data);
            const min = Math.min(...data);
            const range = max - min;

            // Draw sparkline
            ctx.strokeStyle = '#D1D5DB';
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            data.forEach((value, index) => {
                const x = (index / (data.length - 1)) * width;
                const y = height - ((value - min) / range) * height;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Add dot at the end
            const lastX = width;
            const lastY = height - ((data[data.length - 1] - min) / range) * height;
            ctx.fillStyle = '#FAFAFA';
            ctx.beginPath();
            ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderTrendCharts() {
        // Larger trend chart implementation
        const trendData = {
            'revenueTrendChart': {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: [12500, 19200, 15600, 25100, 32400, 28900, 35200]
            },
            'ordersTrendChart': {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: [145, 152, 149, 158, 155, 162, 168]
            }
        };

        Object.entries(trendData).forEach(([id, data]) => {
            const canvas = document.createElement('canvas');
            const container = document.getElementById(id);
            if (!container) return;

            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            const max = Math.max(...data.values);
            const min = Math.min(...data.values);
            const range = max - min;
            const padding = 40;

            // Draw axes
            ctx.strokeStyle = '#2C3137';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();

            // Draw labels
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            
            data.labels.forEach((label, index) => {
                const x = padding + (index * ((width - padding * 2) / (data.labels.length - 1)));
                ctx.fillText(label, x, height - padding + 20);
            });

            // Draw grid lines
            ctx.strokeStyle = '#2C3137';
            ctx.setLineDash([4, 4]);
            
            for (let i = 0; i < 5; i++) {
                const y = padding + (i * ((height - padding * 2) / 4));
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();
            }
            
            ctx.setLineDash([]);

            // Draw trend line
            ctx.strokeStyle = '#D1D5DB';
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.values.forEach((value, index) => {
                const x = padding + (index * ((width - padding * 2) / (data.values.length - 1)));
                const y = height - padding - ((value - min) / range) * (height - padding * 2);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // Add dots
                ctx.fillStyle = '#1B1F24';
                ctx.strokeStyle = '#FAFAFA';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });

            ctx.strokeStyle = '#D1D5DB';
            ctx.stroke();
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new DashboardCharts();
});