class ImageUploader {
    constructor() {
        this.init();
        this.images = [];
    }

    init() {
        this.dropzone = document.querySelector('[data-image-uploader]');
        if (!this.dropzone) return;

        this.input = this.dropzone.querySelector('[data-image-input]');
        this.preview = this.dropzone.querySelector('[data-image-preview]');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // File input change
        this.input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropzone.classList.add('is-dragover');
        });

        this.dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropzone.classList.remove('is-dragover');
        });

        this.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropzone.classList.remove('is-dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Remove image
        this.preview.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-image]');
            if (removeBtn) {
                const image = removeBtn.closest('.image-preview');
                const index = Array.from(this.preview.children).indexOf(image);
                this.removeImage(index);
            }
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            if (file.size > 5 * 1024 * 1024) return; // 5MB limit

            const reader = new FileReader();
            reader.onload = (e) => {
                this.addImage(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    addImage(src) {
        this.images.push(src);
        this.renderPreview();
    }

    removeImage(index) {
        this.images.splice(index, 1);
        this.renderPreview();
    }

    renderPreview() {
        this.preview.innerHTML = this.images.map(src => `
            <div class="image-preview">
                <img src="${src}" alt="" class="image-preview__img">
                <button type="button" class="btn btn--ghost btn--sm btn--icon image-preview__remove" data-remove-image>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Dispatch event for form handling
        this.dropzone.dispatchEvent(new CustomEvent('imagesUpdated', {
            detail: { images: this.images }
        }));
    }

    getImages() {
        return this.images;
    }

    setImages(images) {
        this.images = images;
        this.renderPreview();
    }

    clear() {
        this.images = [];
        this.renderPreview();
        this.input.value = '';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.imageUploader = new ImageUploader();
});