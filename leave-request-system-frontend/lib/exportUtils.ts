import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (
  elementId: string, 
  filename: string = 'analytics-report.pdf'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found');
    return;
  }

  try {
    // Hide any interactive elements that might cause issues
    const buttons = element.querySelectorAll('button');
    const originalDisplay: string[] = [];
    buttons.forEach((btn, index) => {
      originalDisplay[index] = btn.style.display;
      btn.style.display = 'none';
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Restore buttons
    buttons.forEach((btn, index) => {
      btn.style.display = originalDisplay[index];
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportChartToPDF = async (
  chartElement: HTMLElement,
  title: string,
  filename: string = 'chart.pdf'
): Promise<void> => {
  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(title, 20, 20);
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pdfWidth - 40; // 20mm margin on each side
    const imgWidth = maxWidth;
    const imgHeight = (canvas.height * maxWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating chart PDF:', error);
    throw error;
  }
};
