/**
 * Login Main Controller
 * Orchestrates phone/OTP flow with Turnstile integration
 */

(function() {
    'use strict';

    // ══════════════════════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════════════════════
    
    let turnstileToken = null;
    let otpTimer = null;
    let resendHandler = null;
    let otpInputHandler = null;

    // ══════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ══════════════════════════════════════════════════════════════
    
    const elements = {
        phoneForm: document.getElementById('phoneForm'),
        otpForm: document.getElementById('otpForm'),
        phoneInput: document.getElementById('phoneInput'),
        sendCodeBtn: document.getElementById('sendCodeBtn'),
        verifyBtn: document.getElementById('verifyBtn'),
        backBtn: document.getElementById('backBtn'),
        phoneError: document.getElementById('phoneError'),
        phoneErrorText: document.getElementById('phoneErrorText'),
        otpError: document.getElementById('otpError'),
        otpErrorText: document.getElementById('otpErrorText'),
        headerSubtitle: document.getElementById('headerSubtitle'),
        accountLink: document.getElementById('accountLink'),
    };

    // ══════════════════════════════════════════════════════════════
    // TURNSTILE CALLBACKS
    // ══════════════════════════════════════════════════════════════
    
    window.onTurnstileSuccess = function(token) {
        turnstileToken = token;
        elements.sendCodeBtn.disabled = false;
    };

    window.onTurnstileError = function() {
        turnstileToken = null;
        elements.sendCodeBtn.disabled = true;
        showError('phoneError', 'Verification failed. Please refresh the page.');
    };

    window.onTurnstileExpired = function() {
        turnstileToken = null;
        elements.sendCodeBtn.disabled = true;
    };

    // ══════════════════════════════════════════════════════════════
    // PHONE FORM SUBMISSION
    // ══════════════════════════════════════════════════════════════
    
    async function handlePhoneSubmit(event) {
        event.preventDefault();
        
        const phone = elements.phoneInput.value.trim();
        
        if (!validatePhone(phone)) {
            showError('phoneError', 'Please enter a valid phone number starting with 09');
            return;
        }

        if (!turnstileToken) {
            showError('phoneError', 'Please complete the verification');
            return;
        }

        setButtonLoading(elements.sendCodeBtn, true);
        hideError('phoneError');

        try {
            const response = await fetch('/api/login/otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: phone,
                    'cf-turnstile-response': turnstileToken,
                }),
            });

            const data = await response.json();

            if (response.ok && data.ok === true) {
                switchToOTPForm();
            } else {
                // Check for rate limit
                const errorMessage = data.error || 'Failed to send code. Please try again.';
                const seconds = Timer.extractSeconds(errorMessage);
                
                if (seconds) {
                    // Show error with countdown
                    showError('phoneError', `Too many requests. Try again in ${seconds}s`);
                    startRateLimitTimer(seconds, 'phoneError', 'phoneErrorText');
                } else {
                    showError('phoneError', errorMessage);
                }
            }
        } catch (error) {
            console.error('Phone submit error:', error);
            showError('phoneError', 'Network error. Please try again.');
        } finally {
            setButtonLoading(elements.sendCodeBtn, false);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // OTP FORM SUBMISSION
    // ══════════════════════════════════════════════════════════════
    
    async function handleOTPSubmit(event) {
        event.preventDefault();
        
        const otp = otpInputHandler.getValue();
        const phone = elements.phoneInput.value.trim();

        if (otp.length !== 5) {
            showError('otpError', 'Please enter the complete 5-digit code');
            otpInputHandler.setError();
            return;
        }

        setButtonLoading(elements.verifyBtn, true);
        hideError('otpError');

        try {
            const response = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    'otp-code': otp,
                    phone: phone,
                }),
            });

            const data = await response.json();

            if (response.ok && data.ok === true) {
                // Success - redirect
                window.location.href = data.redirect_url || '/account';
            } else {
                const errorMessage = data.error || 'Invalid code. Please try again.';
                showError('otpError', errorMessage);
                otpInputHandler.setError();
                otpInputHandler.clear();
            }
        } catch (error) {
            console.error('OTP verify error:', error);
            showError('otpError', 'Network error. Please try again.');
            otpInputHandler.setError();
        } finally {
            setButtonLoading(elements.verifyBtn, false);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // VIEW SWITCHING
    // ══════════════════════════════════════════════════════════════
    
    function switchToOTPForm() {
        elements.phoneForm.classList.add('form--hidden');
        elements.otpForm.classList.remove('form--hidden');
        elements.headerSubtitle.textContent = `Code sent to ${elements.phoneInput.value}`;
        
        // Initialize OTP inputs
        otpInputHandler.clear();
        otpInputHandler.focus();
        
        // Start timer
        otpTimer.start(120);
    }

    function switchToPhoneForm() {
        elements.otpForm.classList.add('form--hidden');
        elements.phoneForm.classList.remove('form--hidden');
        elements.headerSubtitle.textContent = 'Enter your phone number to continue';
        
        // Stop timer
        if (otpTimer) otpTimer.stop();
        
        // Clear errors
        hideError('otpError');
        hideError('phoneError');
        
        // Reset turnstile
        if (window.turnstile) {
            window.turnstile.reset();
        }
    }

    // ══════════════════════════════════════════════════════════════
    // TIMER HANDLERS
    // ══════════════════════════════════════════════════════════════
    
    function onOTPTimerExpire() {
        resendHandler.showButton();
    }

    function onResendSuccess(data) {
        // Restart OTP timer
        otpTimer.start(120);
        otpInputHandler.clear();
        otpInputHandler.focus();
    }

    function onResendError(message, seconds) {
        if (seconds) {
            showError('otpError', `Too many requests. Try again in ${seconds}s`);
            startRateLimitTimer(seconds, 'otpError', 'otpErrorText');
        } else {
            showError('otpError', message);
        }
    }

    function startRateLimitTimer(seconds, errorId, errorTextId) {
        let timeLeft = seconds;
        const errorElement = document.getElementById(errorId);
        const errorTextElement = document.getElementById(errorTextId);
        
        const interval = setInterval(() => {
            timeLeft--;
            if (errorTextElement) {
                errorTextElement.textContent = `Too many requests. Try again in ${timeLeft}s`;
            }
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                hideError(errorId);
            }
        }, 1000);
    }

    // ══════════════════════════════════════════════════════════════
    // VALIDATION
    // ══════════════════════════════════════════════════════════════
    
    function validatePhone(phone) {
        return /^09[0-9]{9}$/.test(phone);
    }

    // ══════════════════════════════════════════════════════════════
    // UI HELPERS
    // ══════════════════════════════════════════════════════════════
    
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        const errorTextElement = document.getElementById(elementId + 'Text');
        
        if (errorElement && errorTextElement) {
            errorTextElement.textContent = message;
            errorElement.classList.add('message--visible');
        }
    }

    function hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.remove('message--visible');
        }
    }

    function setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.classList.add('btn--loading');
            button.disabled = true;
            
            const spinner = document.createElement('span');
            spinner.className = 'btn__spinner';
            button.appendChild(spinner);
        } else {
            button.classList.remove('btn--loading');
            button.disabled = !turnstileToken; // Re-enable only if turnstile is valid
            
            const spinner = button.querySelector('.btn__spinner');
            if (spinner) spinner.remove();
        }
    }

    // ══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════
    
    function init() {
        // Initialize OTP input handler
        otpInputHandler = new OTPInput('#otpContainer');
        
        // Initialize timer
        otpTimer = new Timer('timer', onOTPTimerExpire);
        
        // Initialize resend handler
        resendHandler = new ResendHandler({
            buttonId: 'resendBtn',
            phoneInputId: 'phoneInput',
            errorElementId: 'otpError',
            errorTextElementId: 'otpErrorText',
            onSuccess: onResendSuccess,
            onError: onResendError,
        });

        // Event listeners
        elements.phoneForm.addEventListener('submit', handlePhoneSubmit);
        elements.otpForm.addEventListener('submit', handleOTPSubmit);
        elements.backBtn.addEventListener('click', switchToPhoneForm);

        // Phone input formatting
        elements.phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();