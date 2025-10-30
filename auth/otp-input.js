/**
 * OTP Input Handler
 * Manages auto-advance, paste, and keyboard navigation
 */

class OTPInput {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.inputs = this.container ? Array.from(this.container.querySelectorAll('.otp-input')) : [];
        this.init();
    }

    init() {
        if (this.inputs.length === 0) return;

        this.inputs.forEach((input, index) => {
            // Input event - auto advance
            input.addEventListener('input', (e) => this.handleInput(e, index));
            
            // Keydown - backspace navigation
            input.addEventListener('keydown', (e) => this.handleKeydown(e, index));
            
            // Paste event
            input.addEventListener('paste', (e) => this.handlePaste(e));
            
            // Select all on focus
            input.addEventListener('focus', (e) => e.target.select());
        });
    }

    handleInput(e, index) {
        const value = e.target.value;
        
        // Only allow digits
        if (!/^\d*$/.test(value)) {
            e.target.value = value.slice(0, -1);
            return;
        }

        // Auto-advance to next input
        if (value.length === 1 && index < this.inputs.length - 1) {
            this.inputs[index + 1].focus();
        }

        // Clear error state on input
        this.clearError();
    }

    handleKeydown(e, index) {
        // Backspace on empty input - go to previous
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            this.inputs[index - 1].focus();
        }
        
        // Arrow key navigation
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            this.inputs[index - 1].focus();
        }
        
        if (e.key === 'ArrowRight' && index < this.inputs.length - 1) {
            e.preventDefault();
            this.inputs[index + 1].focus();
        }
    }

    handlePaste(e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Only accept digits
        const digits = pastedData.replace(/\D/g, '').slice(0, this.inputs.length);
        
        // Fill inputs
        digits.split('').forEach((digit, index) => {
            if (this.inputs[index]) {
                this.inputs[index].value = digit;
            }
        });

        // Focus next empty or last input
        const nextEmpty = this.inputs.findIndex(input => !input.value);
        const focusIndex = nextEmpty === -1 ? this.inputs.length - 1 : nextEmpty;
        this.inputs[focusIndex].focus();
    }

    getValue() {
        return this.inputs.map(input => input.value).join('');
    }

    clear() {
        this.inputs.forEach(input => {
            input.value = '';
        });
        this.inputs[0].focus();
    }

    setError() {
        this.inputs.forEach(input => {
            input.classList.add('otp-input--error');
        });
    }

    clearError() {
        this.inputs.forEach(input => {
            input.classList.remove('otp-input--error');
        });
    }

    focus() {
        if (this.inputs[0]) {
            this.inputs[0].focus();
        }
    }
}

// Export
window.OTPInput = OTPInput;