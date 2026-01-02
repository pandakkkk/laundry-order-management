const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Order = require('../models/Order');
const businessConfig = require('../config/business');

// Generate PDF Receipt
exports.generateReceipt = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Receipt-${order.ticketNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate QR Code
    const qrCodeData = JSON.stringify({
      ticketNumber: order.ticketNumber,
      orderId: order._id.toString(),
      customerId: order.customerId,
      status: order.status
    });

    let qrCodeImage;
    try {
      qrCodeImage = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 150
      });
    } catch (qrError) {
      console.error('QR Code generation error:', qrError);
    }

    // Header Section
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(businessConfig.name, { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .text(businessConfig.address, { align: 'center' });
    
    if (businessConfig.city) {
      doc.text(`${businessConfig.city}, ${businessConfig.state} ${businessConfig.pincode}`, { align: 'center' });
    }
    
    if (businessConfig.phone) {
      doc.text(`Phone: ${businessConfig.phone}`, { align: 'center' });
    }
    
    if (businessConfig.email) {
      doc.text(`Email: ${businessConfig.email}`, { align: 'center' });
    }

    if (businessConfig.gstin) {
      doc.text(`GSTIN: ${businessConfig.gstin}`, { align: 'center' });
    }

    // Divider
    doc.moveDown(1);
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();

    // Receipt Title
    doc.moveDown(1);
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('RECEIPT', { align: 'center' });

    doc.moveDown(1);

    // Order Information Section
    const leftColumn = 50;
    const rightColumn = 300;
    let currentY = doc.y;

    // Left Column
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Ticket Number:', leftColumn, currentY);
    doc.font('Helvetica')
       .text(order.ticketNumber, leftColumn + 100, currentY);

    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Order Number:', leftColumn, currentY);
    doc.font('Helvetica')
       .text(order.orderNumber, leftColumn + 100, currentY);

    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Order Date:', leftColumn, currentY);
    doc.font('Helvetica')
       .text(formatDate(order.orderDate), leftColumn + 100, currentY);

    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Expected Delivery:', leftColumn, currentY);
    doc.font('Helvetica')
       .text(formatDate(order.expectedDelivery), leftColumn + 100, currentY);

    // Right Column
    currentY = doc.y - 60;
    doc.font('Helvetica-Bold')
       .text('Customer Name:', rightColumn, currentY);
    doc.font('Helvetica')
       .text(order.customerName, rightColumn + 100, currentY);

    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Customer ID:', rightColumn, currentY);
    doc.font('Helvetica')
       .text(order.customerId, rightColumn + 100, currentY);

    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Phone:', rightColumn, currentY);
    doc.font('Helvetica')
       .text(order.phoneNumber, rightColumn + 100, currentY);

    currentY += 20;
    doc.font('Helvetica-Bold')
       .text('Served By:', rightColumn, currentY);
    doc.font('Helvetica')
       .text(order.servedBy, rightColumn + 100, currentY);

    // Items Section
    doc.moveDown(2);
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();

    doc.moveDown(1);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Items:', 50, doc.y);

    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Description', 50, tableTop)
       .text('Qty', 350, tableTop)
       .text('Price', 400, tableTop)
       .text('Amount', 500, tableTop);

    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    // Items
    let itemsY = tableTop + 25;
    order.items.forEach((item, index) => {
      const itemAmount = item.quantity * item.price;
      
      doc.font('Helvetica')
         .fontSize(9)
         .text(item.description, 50, itemsY, { width: 280 })
         .text(item.quantity.toString(), 350, itemsY)
         .text(`₹${item.price.toFixed(2)}`, 400, itemsY)
         .text(`₹${itemAmount.toFixed(2)}`, 500, itemsY);

      itemsY += 20;

      // Add line break if too many items
      if (itemsY > 700) {
        doc.addPage();
        itemsY = 50;
      }
    });

    // Total Section
    doc.moveDown(1);
    const totalY = doc.y;
    doc.moveTo(50, totalY)
       .lineTo(550, totalY)
       .stroke();

    doc.moveDown(1);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Total Amount:', 350, doc.y)
       .text(`₹${order.totalAmount.toFixed(2)}`, 500, doc.y);

    // Payment Information
    doc.moveDown(1.5);
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Payment Information:', 50, doc.y);

    doc.moveDown(0.5);
    doc.font('Helvetica')
       .text(`Payment Method: ${order.paymentMethod}`, 50, doc.y)
       .text(`Payment Status: ${order.paymentStatus}`, 50, doc.y + 15);

    // Notes
    if (order.notes) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold')
         .text('Notes:', 50, doc.y);
      doc.font('Helvetica')
         .fontSize(9)
         .text(order.notes, 50, doc.y + 15, { width: 500 });
    }

    // Location
    if (order.location) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold')
         .text('Location:', 50, doc.y);
      doc.font('Helvetica')
         .fontSize(9)
         .text(order.location, 50, doc.y + 15, { width: 500 });
    }

    // QR Code
    if (qrCodeImage) {
      doc.moveDown(1);
      doc.image(qrCodeImage, 400, doc.y - 50, { width: 100, height: 100 });
      doc.fontSize(8)
         .font('Helvetica')
         .text('Scan to track order', 400, doc.y + 55, { width: 100, align: 'center' });
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();

    doc.moveDown(1);
    doc.fontSize(8)
       .font('Helvetica')
       .text(businessConfig.terms, 50, doc.y, { width: 500, align: 'center' });

    doc.moveDown(1);
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(businessConfig.footer, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt',
      message: error.message
    });
  }
};

// Helper function to format date
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

