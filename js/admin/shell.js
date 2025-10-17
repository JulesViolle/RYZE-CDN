// Shell Interactions
class Shell {
    constructor() {
        this.init();
    }

    init() {
        this.initSidebar();
        this.initCommandPalette();
        this.initKeyboardShortcuts();
    }

    initSidebar() {
        const layout = document.querySelector('.admin-layout');
        const toggle = document.querySelector('[data-sidebar-toggle]');
        
        if (toggle && layout) {
            toggle.addEventListener('click', () => {
                layout.classList.toggle('admin-layout--collapsed');
                // Store preference
                localStorage.setItem('sidebarCollapsed', layout.classList.contains('admin-layout--collapsed'));
            });
            
            // Restore preference
            if (localStorage.getItem('sidebarCollapsed') === 'true') {
                layout.classList.add('admin-layout--collapsed');
            }
        }
        
        // Handle mobile menu
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    if (e.target.closest('[data-sidebar-toggle]')) {
                        sidebar.classList.toggle('sidebar--visible');
                    } else if (!e.target.closest('.sidebar')) {
                        sidebar.classList.remove('sidebar--visible');
                    }
                }
            });
        }
    }

    initCommandPalette() {
        const trigger = document.querySelector('[data-command-palette-trigger]');
        const palette = document.querySelector('.command-palette');
        
        if (trigger && palette) {
            const showPalette = () => {
                palette.classList.add('command-palette--visible');
                const input = palette.querySelector('input');
                if (input) input.focus();
            };
            
            const hidePalette = () => {
                palette.classList.remove('command-palette--visible');
            };
            
            trigger.addEventListener('click', showPalette);
            
            // Close on escape or click outside
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && palette.classList.contains('command-palette--visible')) {
                    hidePalette();
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.command-palette') && !e.target.closest('[data-command-palette-trigger]')) {
                    hidePalette();
                }
            });
        }
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Command palette - Ctrl/Cmd + K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const trigger = document.querySelector('[data-command-palette-trigger]');
                if (trigger) trigger.click();
            }
            
            // Toggle sidebar - Ctrl/Cmd + B
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                const toggle = document.querySelector('[data-sidebar-toggle]');
                if (toggle) toggle.click();
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new Shell();
});