/**
 * Print utility for printing HTML content using a hidden iframe
 * This keeps printing within the SPA without opening new tabs
 */

export async function printHtml(html: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-modals');
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up after a delay to ensure print dialog has opened
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 100);
      }, 50);
    };
  });
}
