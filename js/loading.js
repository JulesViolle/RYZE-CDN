// loading.js

function simulateAction(button, duration = 2000) {
  if (!button.classList.contains("loading")) {
    // Save original text
    button.dataset.originalText = button.innerHTML;
    // Replace text with spinner
    button.innerHTML = `<span class="loading-spinner"></span>`;
    button.classList.add("loading");

    // Auto remove after given duration
    setTimeout(() => {
      button.innerHTML = button.dataset.originalText || "Button";
      button.classList.remove("loading");
    }, duration);
  }
}
