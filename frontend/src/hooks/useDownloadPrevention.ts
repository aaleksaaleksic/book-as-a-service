import { useEffect } from 'react';

/**
 * Hook to implement basic download prevention measures
 */
export const useDownloadPrevention = (isEnabled: boolean = true) => {
  useEffect(() => {
    if (!isEnabled) return;

    let devToolsOpen = false;
    const isProduction = process.env.NODE_ENV === 'production';

    // Disable right-click context menu
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable common keyboard shortcuts for downloading/saving
    const disableKeyboardShortcuts = (e: KeyboardEvent) => {
      // Allow Ctrl+C (Copy) - users need to copy text to AI assistant
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        // Allow copy operation
        return;
      }

      // Allow Ctrl+A (Select All) - users need to select text
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        // Allow select all operation
        return;
      }

      // Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        console.warn('[DownloadPrevention] Save action blocked');
        return false;
      }

      // Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        console.warn('[DownloadPrevention] Print action blocked');
        return false;
      }

      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.warn('[DownloadPrevention] Developer tools access blocked');
        return false;
      }

      // F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        console.warn('[DownloadPrevention] Developer tools access blocked');
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        console.warn('[DownloadPrevention] View source blocked');
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        console.warn('[DownloadPrevention] Console access blocked');
        return false;
      }
    };

    // Detect developer tools opening (basic detection)
    const detectDevTools = () => {
      if (!isProduction) {
        // Skip invasive devtools detection in non-production environments
        return () => undefined;
      }

      const threshold = 160;

      // Check if window is resized to accommodate dev tools
      const checkResize = () => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
          if (!devToolsOpen) {
            devToolsOpen = true;
            console.warn('[DownloadPrevention] Developer tools detected');
            // Could trigger additional security measures here
          }
        } else {
          devToolsOpen = false;
        }
      };

      // Monitor console access attempts
      const consoleLog = console.log;
      console.log = function(...args) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          console.warn('[DownloadPrevention] Console access detected');
        }
        return consoleLog.apply(console, args);
      };

      window.addEventListener('resize', checkResize);

      return () => {
        window.removeEventListener('resize', checkResize);
        console.log = consoleLog;
      };
    };

    // Allow text selection on PDF viewer area for copying to AI assistant
    const disableSelection = () => {
      // Text selection is now allowed - users can select and copy text
      // This is useful for copying text to the AI assistant

      return () => {
        // No cleanup needed since we're not adding any styles
      };
    };

    // Block drag and drop operations
    const blockDragDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.warn('[DownloadPrevention] Drag operation blocked');
      return false;
    };

    // Monitor for suspicious blob URLs (potential download attempts)
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(object: Blob | MediaSource) {
      if (object instanceof Blob && object.type === 'application/pdf') {
        console.warn('[DownloadPrevention] PDF blob creation detected - potential download attempt');
        // Could block or modify the blob here
      }
      return originalCreateObjectURL.call(this, object);
    };

    // Setup all event listeners
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableKeyboardShortcuts);
    document.addEventListener('dragstart', blockDragDrop);
    document.addEventListener('drop', blockDragDrop);

    const cleanupDevTools = detectDevTools();
    const cleanupSelection = disableSelection();

    console.log('[DownloadPrevention] Protection measures activated');

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableKeyboardShortcuts);
      document.removeEventListener('dragstart', blockDragDrop);
      document.removeEventListener('drop', blockDragDrop);

      cleanupDevTools();
      cleanupSelection();

      // Restore original URL.createObjectURL
      URL.createObjectURL = originalCreateObjectURL;

      console.log('[DownloadPrevention] Protection measures deactivated');
    };
  }, [isEnabled]);

  return {
    isProtectionActive: isEnabled
  };
};