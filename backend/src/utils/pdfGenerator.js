// backend/src/utils/pdfGenerator.js - GENERADOR DE PDF PARA FACTURAS
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

/**
 * Genera un PDF para una factura
 * @param {Object} factura - Datos completos de la factura
 * @returns {Buffer} - Buffer del PDF generado
 */
async function generateFacturaPDF(factura) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ===== ENCABEZADO =====
      generateHeader(doc, factura);

      // ===== INFORMACIÓN DE LA FACTURA =====
      generateFacturaInfo(doc, factura);

      // ===== INFORMACIÓN DEL CLIENTE =====
      generateClienteInfo(doc, factura);

      // ===== TABLA DE PRODUCTOS =====
      generateProductTable(doc, factura);

      // ===== TOTALES =====
      generateTotales(doc, factura);

      // ===== MEDIOS DE PAGO =====
      generateMediosPago(doc, factura);

      // ===== PIE DE PÁGINA =====
      generateFooter(doc, factura);

      // Finalizar el documento
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Genera el encabezado de la factura
 */
function generateHeader(doc, factura) {
  const logoPath = path.join(__dirname, '../../assets/logo.png');
  
  // Logo (si existe)
  try {
    doc.image(logoPath, 50, 50, { width: 80 });
  } catch (error) {
    // Si no hay logo, omitir
  }

  // Información de la empresa
  doc.fontSize(20)
     .fillColor('#1a365d')
     .text('SISTEMA PAINTS', 150, 60, { align: 'left' });

  doc.fontSize(10)
     .fillColor('#4a5568')
     .text('Cadena de Pinturas y Accesorios', 150, 85)
     .text('NIT: 123456789', 150, 100)
     .text('Tel: (502) 2234-5678', 150, 115)
     .text('Guatemala, Guatemala', 150, 130);

  // Título FACTURA
  doc.fontSize(24)
     .fillColor('#e53e3e')
     .text('FACTURA', 400, 60);

  // Número de factura
  doc.fontSize(12)
     .fillColor('#2d3748')
     .text(`No. ${factura.numero_factura}`, 400, 90);

  // Estado
  const estadoColor = factura.estado === 'Activa' ? '#38a169' : '#e53e3e';
  doc.fillColor(estadoColor)
     .text(`Estado: ${factura.estado}`, 400, 110);

  // Línea separadora
  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .moveTo(50, 160)
     .lineTo(550, 160)
     .stroke();
}

/**
 * Genera información básica de la factura
 */
function generateFacturaInfo(doc, factura) {
  const startY = 180;

  doc.fontSize(10)
     .fillColor('#4a5568');

  // Fecha de emisión
  const fechaEmision = new Date(factura.fecha_emision).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.text(`Fecha de Emisión: ${fechaEmision}`, 400, startY);
  doc.text(`Serie: ${factura.serie}`, 400, startY + 15);
  doc.text(`Cajero: ${factura.empleado_nombre || 'N/A'}`, 400, startY + 30);
  
  if (factura.observaciones) {
    doc.text(`Observaciones: ${factura.observaciones}`, 400, startY + 45);
  }
}

/**
 * Genera información del cliente
 */
function generateClienteInfo(doc, factura) {
  const startY = 180;

  doc.fontSize(12)
     .fillColor('#2d3748')
     .text('CLIENTE:', 50, startY);

  doc.fontSize(10)
     .fillColor('#4a5568');

  const nombreCompleto = `${factura.cliente_nombres} ${factura.cliente_apellidos}`.trim();
  doc.text(`Nombre: ${nombreCompleto}`, 50, startY + 20);
  
  if (factura.cliente_nit) {
    doc.text(`NIT: ${factura.cliente_nit}`, 50, startY + 35);
  }
  
  if (factura.cliente_telefono) {
    doc.text(`Teléfono: ${factura.cliente_telefono}`, 50, startY + 50);
  }
  
  if (factura.cliente_direccion) {
    doc.text(`Dirección: ${factura.cliente_direccion}`, 50, startY + 65, { width: 300 });
  }
}

/**
 * Genera la tabla de productos
 */
function generateProductTable(doc, factura) {
  const startY = 280;
  const tableTop = startY;
  const itemCodeX = 50;
  const itemNameX = 120;
  const itemUnitX = 320;
  const itemQtyX = 380;
  const itemPriceX = 430;
  const itemTotalX = 490;

  // Encabezados de la tabla
  doc.fontSize(10)
     .fillColor('#2d3748')
     .text('Código', itemCodeX, tableTop, { width: 60 })
     .text('Producto', itemNameX, tableTop, { width: 190 })
     .text('Unidad', itemUnitX, tableTop, { width: 50 })
     .text('Cant.', itemQtyX, tableTop, { width: 40 })
     .text('Precio', itemPriceX, tableTop, { width: 50 })
     .text('Total', itemTotalX, tableTop, { width: 60 });

  // Línea debajo del encabezado
  doc.strokeColor('#cbd5e0')
     .lineWidth(1)
     .moveTo(itemCodeX, tableTop + 15)
     .lineTo(itemTotalX + 60, tableTop + 15)
     .stroke();

  // Productos
  let currentY = tableTop + 30;
  doc.fontSize(9).fillColor('#4a5568');

  if (factura.productos && Array.isArray(factura.productos)) {
    factura.productos.forEach((producto) => {
      const precioUnitario = parseFloat(producto.precio_unitario || 0);
      const cantidad = parseFloat(producto.cantidad || 0);
      const total = precioUnitario * cantidad;

      doc.text(producto.codigo || '', itemCodeX, currentY, { width: 60 })
         .text(producto.nombre || '', itemNameX, currentY, { width: 190 })
         .text(producto.unidad_medida || '', itemUnitX, currentY, { width: 50 })
         .text(cantidad.toFixed(2), itemQtyX, currentY, { width: 40, align: 'center' })
         .text(`Q ${precioUnitario.toFixed(2)}`, itemPriceX, currentY, { width: 50, align: 'right' })
         .text(`Q ${total.toFixed(2)}`, itemTotalX, currentY, { width: 60, align: 'right' });

      currentY += 20;

      // Nueva página si es necesario
      if (currentY > 650) {
        doc.addPage();
        currentY = 50;
      }
    });
  }

  // Línea final de la tabla
  doc.strokeColor('#cbd5e0')
     .lineWidth(1)
     .moveTo(itemCodeX, currentY + 5)
     .lineTo(itemTotalX + 60, currentY + 5)
     .stroke();

  return currentY + 20;
}

/**
 * Genera la sección de totales
 */
function generateTotales(doc, factura) {
  const startY = 500; // Posición fija para totales
  const labelX = 400;
  const valueX = 490;

  doc.fontSize(10)
     .fillColor('#4a5568');

  const subtotal = parseFloat(factura.subtotal || 0);
  const descuentos = parseFloat(factura.descuentos || 0);
  const impuestos = parseFloat(factura.impuestos || 0);
  const total = parseFloat(factura.total || 0);

  // Subtotal
  doc.text('Subtotal:', labelX, startY)
     .text(`Q ${subtotal.toFixed(2)}`, valueX, startY, { align: 'right' });

  // Descuentos (si aplica)
  if (descuentos > 0) {
    doc.text('Descuentos:', labelX, startY + 15)
       .text(`-Q ${descuentos.toFixed(2)}`, valueX, startY + 15, { align: 'right' });
  }

  // Impuestos (si aplica)
  if (impuestos > 0) {
    doc.text('Impuestos:', labelX, startY + 30)
       .text(`Q ${impuestos.toFixed(2)}`, valueX, startY + 30, { align: 'right' });
  }

  // Línea separadora
  doc.strokeColor('#cbd5e0')
     .lineWidth(1)
     .moveTo(labelX, startY + 45)
     .lineTo(valueX + 60, startY + 45)
     .stroke();

  // Total
  doc.fontSize(14)
     .fillColor('#2d3748')
     .text('TOTAL:', labelX, startY + 55)
     .text(`Q ${total.toFixed(2)}`, valueX, startY + 55, { align: 'right' });

  return startY + 80;
}

/**
 * Genera la sección de medios de pago
 */
function generateMediosPago(doc, factura) {
  const startY = 600;

  doc.fontSize(12)
     .fillColor('#2d3748')
     .text('MEDIOS DE PAGO:', 50, startY);

  doc.fontSize(10)
     .fillColor('#4a5568');

  let currentY = startY + 20;

  if (factura.medios_pago && Array.isArray(factura.medios_pago)) {
    factura.medios_pago.forEach((medio) => {
      const monto = parseFloat(medio.monto || 0);
      doc.text(`• ${medio.tipo_pago}: Q ${monto.toFixed(2)}`, 70, currentY);
      
      if (medio.referencia) {
        doc.text(`  Ref: ${medio.referencia}`, 90, currentY + 12);
        currentY += 12;
      }
      
      currentY += 20;
    });
  }

  return currentY;
}

/**
 * Genera el pie de página
 */
function generateFooter(doc, factura) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 100;

  doc.fontSize(8)
     .fillColor('#718096')
     .text('¡Gracias por su compra!', 50, footerY, { align: 'center', width: 500 })
     .text('Esta factura fue generada electrónicamente', 50, footerY + 15, { align: 'center', width: 500 })
     .text(`Generado el: ${new Date().toLocaleString('es-GT')}`, 50, footerY + 30, { align: 'center', width: 500 });

  // Código QR o información adicional
  if (factura.numero_factura) {
    doc.text(`Consulte esta factura en línea con el código: ${factura.numero_factura}`, 50, footerY + 50, { align: 'center', width: 500 });
  }
}

/**
 * Función auxiliar para formatear moneda
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(amount);
}

/**
 * Función auxiliar para formatear fecha
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

module.exports = {
  generateFacturaPDF,
  formatCurrency,
  formatDate
};