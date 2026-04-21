/**
 * ToastManager Module
 * Handles premium UI notifications for feedback.
 */
const ToastManager = {
  activeToast: null,

  /**
   * Shows a premium toast notification.
   * @param {string} message - The message to display.
   * @param {number} duration - Time in milliseconds before auto-removal.
   */
  show(message, duration = 3000) {
    if (this.activeToast) {
      this.activeToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'yt-filter-toast';
    toast.textContent = message;

    // Premium Styling
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      backgroundColor: '#111111',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.2)',
      zIndex: '999999',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
      fontFamily: '"Roboto", Arial, sans-serif'
    });

    document.body.appendChild(toast);
    this.activeToast = toast;

    // Animation: Fade In + Slide Up
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Auto-remove after duration
    setTimeout(() => {
      if (toast && toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
          if (this.activeToast === toast) {
            this.activeToast = null;
          }
        }, 300);
      }
    }, duration);
  }
};
