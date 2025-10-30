/**
 * Resend Code Handler
 * Manages resend functionality with rate limiting
 */

class ResendHandler {
    constructor(config = {}) {
        this.apiEndpoint = config.apiEndpoint || '/api/login/otp';
        this.button = document.getElementById(config.buttonId || 'resendBtn');
        this.phoneInput = document.getElementById(config.phoneInputId || 'phoneInput');
        this.errorElement = document.getElementById(config.errorElementId || 'otpError');
        this.errorTextElement = document.getElementById(config.errorTextElementId || 'otpErrorText');
        this.onSuccess = config.onSuccess || null;
        this.onError = config.onError || null;
        
        this.init();
    }

    init() {
        if (!this.button) return;
        
        this.button.addEventListener('click', () => this.handleResend());
    }

    async handleResend() {
        if (!this.phoneInput || !this.phoneInput.value) {
            this.showError('Phone number is missing');
            return;
        }

        const phone = this.phoneInput.value;
        this.setLoading(true);
        this.hideError();

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (response.ok && data.ok === true) {
                this.hideButton();
                if (this.onSuccess) this.onSuccess(data);
            } else {
                // Check for rate limit error
                const errorMessage = data.error || 'Failed to resend code';
                const seconds = window.Timer ? window.Timer.extractSeconds(errorMessage) : null;
                
                if (seconds) {
                    // Start countdown timer for rate limit
                    if (this.onError) this.onError(errorMessage, seconds);
                } else {
                    this.showError(errorMessage);
                }
            }
        } catch (error) {
            console.error('Resend error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (!this.button) return;
        
        if (isLoading) {
            this.button.classList.add('btn--loading');
            this.button.disabled = true;
            
            const spinner = document.createElement('span');
            spinner.className = 'btn__spinner';
            this.button.appendChild(spinner);
        } else {
            this.button.classList.remove('btn--loading');
            this.button.disabled = false;
            
            const spinner = this.button.querySelector('.btn__spinner');
            if (spinner) spinner.remove();
        }
    }

    showError(message) {
        if (this.errorElement && this.errorTextElement) {
            this.errorTextElement.textContent = message;
            this.errorElement.classList.add('message--visible');
        }
    }

    hideError() {
        if (this.errorElement) {
            this.errorElement.classList.remove('message--visible');
        }
    }

    showButton() {
        if (this.button) {
            this.button.classList.add('resend-btn--visible');
        }
    }

    hideButton() {
        if (this.button) {
            this.button.classList.remove('resend-btn--visible');
        }
    }
}

// Export
window.ResendHandler = ResendHandler;