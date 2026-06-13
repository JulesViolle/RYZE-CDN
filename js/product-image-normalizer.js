/**
 * Product Image Normalization System
 *
 * Ensures all product images display at the same visual size and aspect ratio
 * without stretching or cropping. Images maintain their original aspect ratio
 * and are centered within a fixed-size container with white padding.
 */

(function () {
  'use strict';

  const ImageNormalizer = {
    /**
     * Configuration
     */
    config: {
      containerSelector: '.card__inner.ratio',
      cardSelector: '.card--media',
      imageSelector: 'img',
      defaultAspectRatio: 1, // Default to square
      backgroundColor: '#ffffff',
      observeNewImages: true,
      debounceDelay: 100
    },

    /**
     * State tracking
     */
    state: {
      processedImages: new WeakSet(),
      pendingImages: new Set(),
      observer: null,
      debounceTimer: null
    },

    /**
     * Initialize the normalizer
     */
    init: function () {
      console.log('[ImageNormalizer] Initializing...');

      // Set CSS custom properties for all containers
      this.setupContainers();

      // Wait for DOM to be fully interactive
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.processAllImages());
      } else {
        this.processAllImages();
      }

      // Observe for dynamically added images
      if (this.config.observeNewImages) {
        this.setupMutationObserver();
      }

      // Listen for image load events
      document.addEventListener('load', (e) => {
        if (e.target.tagName === 'IMG') {
          this.processImage(e.target);
        }
      }, true);
    },

    /**
     * Setup initial containers with CSS custom properties
     */
    setupContainers: function () {
      const containers = document.querySelectorAll(this.config.containerSelector);

      containers.forEach((container) => {
        // Set background color
        container.style.backgroundColor = this.config.backgroundColor;

        // Ensure flexbox for centering
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';
      });
    },

    /**
     * Process all existing images
     */
    processAllImages: function () {
      console.log('[ImageNormalizer] Processing all images...');

      const containers = document.querySelectorAll(this.config.containerSelector);

      containers.forEach((container) => {
        const img = container.querySelector(this.config.imageSelector);
        if (img) {
          this.processImage(img, container);
        }
      });
    },

    /**
     * Process a single image element
     */
    processImage: function (img, container = null) {
      // Skip if already processed
      if (this.state.processedImages.has(img)) {
        return;
      }

      // Get or find the container
      if (!container) {
        container = img.closest(this.config.containerSelector);
        if (!container) {
          return;
        }
      }

      // Mark as processed
      this.state.processedImages.add(img);

      /**
       * Calculate and apply aspect ratio
       */
      const applyAspectRatio = () => {
        try {
          // Get natural dimensions
          const naturalWidth = img.naturalWidth;
          const naturalHeight = img.naturalHeight;

          if (naturalWidth > 0 && naturalHeight > 0) {
            // Calculate aspect ratio
            const aspectRatio = naturalHeight / naturalWidth;

            // Apply to container
            container.style.setProperty('--product-image-aspect-ratio', aspectRatio);
            container.style.aspectRatio = `1 / ${1 / aspectRatio}`;

            // Also apply to parent card if it has CSS var support
            const card = container.closest(this.config.cardSelector);
            if (card) {
              card.style.setProperty('--product-image-aspect-ratio', aspectRatio);
            }

            // Ensure image uses object-fit: contain
            img.style.objectFit = 'contain';
            img.style.objectPosition = 'center center';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.backgroundColor = this.config.backgroundColor;

            console.log(`[ImageNormalizer] Image processed - Aspect Ratio: ${aspectRatio.toFixed(3)}`);

            // Remove from pending
            this.state.pendingImages.delete(img);

            return true;
          }
        } catch (error) {
          console.warn('[ImageNormalizer] Error processing image:', error);
        }

        return false;
      };

      /**
       * If image is already loaded, apply immediately
       */
      if (img.complete && img.naturalWidth > 0) {
        applyAspectRatio();
      } else {
        /**
         * Otherwise, wait for load event
         */
        this.state.pendingImages.add(img);

        const onImageLoad = () => {
          applyAspectRatio();
          img.removeEventListener('load', onImageLoad);
          img.removeEventListener('error', onImageError);
        };

        const onImageError = () => {
          // If image fails to load, use default aspect ratio
          container.style.setProperty('--product-image-aspect-ratio', this.config.defaultAspectRatio);
          container.style.aspectRatio = '1 / 1';
          console.warn('[ImageNormalizer] Image failed to load, using default aspect ratio');
          img.removeEventListener('load', onImageLoad);
          img.removeEventListener('error', onImageError);
          this.state.pendingImages.delete(img);
        };

        img.addEventListener('load', onImageLoad, { once: true });
        img.addEventListener('error', onImageError, { once: true });

        // Timeout fallback (10 seconds)
        setTimeout(() => {
          if (this.state.pendingImages.has(img)) {
            img.removeEventListener('load', onImageLoad);
            img.removeEventListener('error', onImageError);
            onImageError();
          }
        }, 10000);
      }
    },

    /**
     * Setup Mutation Observer for dynamically added images
     */
    setupMutationObserver: function () {
      const config = {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      };

      const callback = (mutations) => {
        clearTimeout(this.state.debounceTimer);

        this.state.debounceTimer = setTimeout(() => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  if (node.tagName === 'IMG') {
                    this.processImage(node);
                  } else {
                    // Check for images within added elements
                    const images = node.querySelectorAll(this.config.imageSelector);
                    images.forEach((img) => this.processImage(img));
                  }
                }
              });
            }
          });
        }, this.config.debounceDelay);
      };

      this.state.observer = new MutationObserver(callback);
      this.state.observer.observe(document.body, config);
    },

    /**
     * Handle window resize for responsive adjustments
     */
    handleResize: function () {
      // Reprocess containers on resize if needed
      this.setupContainers();
    },

    /**
     * Destroy the normalizer
     */
    destroy: function () {
      if (this.state.observer) {
        this.state.observer.disconnect();
      }
      clearTimeout(this.state.debounceTimer);
      console.log('[ImageNormalizer] Destroyed');
    }
  };

  /**
   * Auto-initialize when script loads
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ImageNormalizer.init());
  } else {
    ImageNormalizer.init();
  }

  // Expose to global scope for debugging and manual control
  window.ImageNormalizer = ImageNormalizer;

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ImageNormalizer.handleResize(), 250);
  });

  console.log('[ImageNormalizer] Script loaded. Access via window.ImageNormalizer');
})();
