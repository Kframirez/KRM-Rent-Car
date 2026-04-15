import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatUSD = (value) => `US$ ${Number(value || 0).toFixed(2)}`;

export const generarComprobanteAlquiler = (datos) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();


  const colorDorado = [198, 162, 67]; 
  const colorOscuro = [47, 41, 35];


  doc.setFillColor(...colorOscuro);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("KRM RENT CAR", 15, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("GESTIÓN DE RENTA OPERATIVA", 15, 28);
  doc.setFillColor(...colorDorado);
  doc.rect(pageWidth - 60, 10, 45, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`CONTRATO: KR-${datos.reserva_id}`, pageWidth - 57, 18);
  doc.setTextColor(...colorOscuro);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL TITULAR:", 15, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${datos.cliente.nombre} ${datos.cliente.apellido}`, 15, 62);
  doc.text(`Cédula: ${datos.cliente.cedula}`, 15, 68);
  doc.setFont("helvetica", "bold");
  doc.text("PERIODO DE RENTA:", pageWidth / 2, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Desde: ${datos.vehiculos[0].fecha_salida}`, pageWidth / 2, 62);
  doc.text(`Hasta: ${datos.vehiculos[0].fecha_regreso}`, pageWidth / 2, 68);


  const tableColumn = ["Vehículo", "Placa", "Días", "Precio/Día", "Subtotal"];
  const tableRows = datos.vehiculos.map(v => [
    v.nombre,
    v.placa,
    v.dias,
    formatUSD(parseFloat(v.subtotal) / v.dias),
    formatUSD(v.subtotal)
  ]);

  doc.autoTable({
    startY: 80,
    head: [tableColumn],
    body: tableRows,
    headStyles: { fillColor: colorDorado, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 240, 230] },
    styles: { fontSize: 10, cellPadding: 5 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL A PAGAR: ${formatUSD(datos.monto_total)}`, pageWidth - 80, finalY);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Este documento es un comprobante de reserva operativa. Sujeto a términos y condiciones de KRM.", pageWidth / 2, 285, { align: "center" });
  doc.save(`Contrato_KR_${datos.reserva_id}.pdf`);
};
