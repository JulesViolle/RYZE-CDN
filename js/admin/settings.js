class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        this.initNavigation();
        this.initForms();
        this.initTemplateEditor();
        this.initImageUpload();
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.settings-nav__item');
        const sections = document.querySelectorAll('.settings-section');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetId = item.dataset.target;
                
                // Update navigation
                navItems.forEach(nav => nav.classList.remove('settings-nav__item--active'));
                item.classList.add('settings-nav__item--active');
                
                // Show target section
                sections.forEach(section => {
                    section.style.display = section.id === targetId ? 'block' : 'none';
                });

                // Update URL hash
                history.pushState(null, '', `#${targetId}`);
            });
        });

        // Handle initial load
        const hash = window.location.hash.slice(1);
        if (hash) {
            const activeNav = document.querySelector(`[data-target="${hash}"]`);
            if (activeNav) activeNav.click();
        } else {
            navItems[0]?.click();
        }
    }

    initForms() {
        document.querySelectorAll('.settings-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings(form);
            });

            // Auto-save on change for toggles
            form.querySelectorAll('.toggle-switch__input').forEach(toggle => {
                toggle.addEventListener('change', () => {
                    this.saveSettings(form);
                });
            });
        });
    }

    initTemplateEditor() {
        const editors = document.querySelectorAll('.template-editor');
        editors.forEach(editor => {
            const codeArea = editor.querySelector('.template-editor__code');
            const preview = editor.querySelector('.template-editor__preview');
            
            if (codeArea && preview) {
                let updateTimeout;
                codeArea.addEventListener('input', () => {
                    clearTimeout(updateTimeout);
                    updateTimeout = setTimeout(() => {
                        this.updateTemplatePreview(codeArea.value, preview);
                    }, 500);
                });

                // Initial preview
                this.updateTemplatePreview(codeArea.value, preview);
            }
        });
    }

    initImageUpload() {
        const uploadButtons = document.querySelectorAll('[data-upload]');
        uploadButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.handleImageUpload(file, button.dataset.upload);
                    }
                };
                input.click();
            });
        });
    }

    saveSettings(form) {
        const formData = new FormData(form);
        const settings = Object.fromEntries(formData);

        // Add toggle states
        form.querySelectorAll('.toggle-switch__input').forEach(toggle => {
            settings[toggle.name] = toggle.checked;
        });

        console.log('Saving settings:', settings);
        // TODO: Implement settings save

        this.showToast('Settings saved successfully');
    }

    updateTemplatePreview(template, preview) {
        try {
            // Replace variables with sample data
            let html = template
                .replace(/\{\{order\.number\}\}/g, '#12345')
                .replace(/\{\{order\.date\}\}/g, new Date().toLocaleDateString())
                .replace(/\{\{customer\.name\}\}/g, 'John Doe')
                .replace(/\{\{customer\.email\}\}/g, 'john@example.com');

            preview.innerHTML = html;
        } catch (error) {
            console.error('Template preview error:', error);
            preview.innerHTML = '<div class="error">Error rendering preview</div>';
        }
    }

    async handleImageUpload(file, target) {
        const preview = document.querySelector(`#${target}Preview`);
        if (preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        console.log('Uploading image for:', target);
        // TODO: Implement image upload
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div class="toast__content">${message}</div>
            <button class="toast__close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);

        toast.querySelector('.toast__close').addEventListener('click', () => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});