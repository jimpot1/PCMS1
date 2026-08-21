// Shared helpers for turning on-screen documents into downloadable PDF files.
// Uses html2canvas to rasterize the document and jsPDF to paginate it onto
// an A4 canvas, splitting tall content across multiple pages automatically.

async function loadPdfLibs() {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  return { html2canvas, jsPDF };
}

function canvasToPdf(canvas, jsPDF) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf;
}

/**
 * Renders a DOM element that is already on the page into a downloadable PDF.
 * @param {HTMLElement} element - element to capture
 * @param {string} filename - e.g. "Purchase-Order-PO-0001.pdf"
 */
export async function exportElementToPdf(element, filename) {
  if (!element) throw new Error('Nothing to export.');
  const { html2canvas, jsPDF } = await loadPdfLibs();

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const pdf = canvasToPdf(canvas, jsPDF);
  pdf.save(filename);
}

/**
 * Renders a standalone HTML document (e.g. fetched from the server) into a
 * downloadable PDF by loading it into an off-screen iframe first.
 * @param {string} html - full HTML document markup
 * @param {string} filename - e.g. "Release-Receipt-RR-0001.pdf"
 */
export async function exportHtmlToPdf(html, filename) {
  const { html2canvas, jsPDF } = await loadPdfLibs();

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '800px';
  iframe.style.height = '1131px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve, reject) => {
      iframe.onload = resolve;
      iframe.onerror = reject;
      iframe.srcdoc = html;
    });

    // Let fonts/images settle before capturing.
    await new Promise((resolve) => setTimeout(resolve, 200));

    const doc = iframe.contentDocument;
    const target = doc.body;
    if (!target) throw new Error('Unable to render document for PDF export.');
    target.style.margin = '0';

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });

    const pdf = canvasToPdf(canvas, jsPDF);
    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}