/**
 * Timer Module
 * Handles countdown timers with second extraction from error messages
 */

class Timer {
    constructor(elementId, onExpire) {
        this.element = document.getElementById(elementId);
        this.countdownElement = document.getElementById('countdown');
        this.intervalId = null;
        this.onExpire = onExpire;
        this.timeLeft = 0;
    }

    /**
     * Extract seconds from error message
     * Supports formats: "try again in 35s", "wait 45 seconds", "35s"
     */
    static extractSeconds(message) {
        if (!message) return null;
        
        const patterns = [
            /(\d+)\s*s(?:ec(?:ond)?s?)?/i,  // "35s", "35 seconds", "35sec"
            /in\s+(\d+)/i,                    // "in 35"
            /wait\s+(\d+)/i                   // "wait 35"
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
        }
        
        return null;
    }

    start(seconds) {
        this.stop();
        this.timeLeft = seconds;
        this.show();
        this.update();
        
        this.intervalId = setInterval(() => {
            this.timeLeft--;
            this.update();
            
            if (this.timeLeft <= 0) {
                this.stop();
                if (this.onExpire) this.onExpire();
            }
        }, 1000);
    }

    update() {
        if (!this.countdownElement) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.countdownElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.hide();
    }

    show() {
        if (this.element) {
            this.element.classList.add('timer--visible');
        }
    }

    hide() {
        if (this.element) {
            this.element.classList.remove('timer--visible');
        }
    }

    getTimeLeft() {
        return this.timeLeft;
    }

    isRunning() {
        return this.intervalId !== null;
    }
}

// Export for use in other modules
window.Timer = Timer;