from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
import io

def generate_invoice_pdf(invoice, customer, business) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = ParagraphStyle('title', fontSize=24, fontName='Helvetica-Bold', spaceAfter=4)
    sub_style = ParagraphStyle('sub', fontSize=10, textColor=colors.grey, spaceAfter=2)
    right_style = ParagraphStyle('right', fontSize=10, alignment=TA_RIGHT)
    bold_style = ParagraphStyle('bold', fontSize=10, fontName='Helvetica-Bold')

    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Paragraph(f"Invoice #{invoice.id}", sub_style))
    elements.append(Spacer(1, 6*mm))

    # Business and customer info side by side
    info_data = [
        [Paragraph(f"<b>From</b>", styles['Normal']), Paragraph(f"<b>Bill To</b>", styles['Normal'])],
        [Paragraph(business.name if business else "Your Business", styles['Normal']),
         Paragraph(customer.name, styles['Normal'])],
        [Paragraph(business.email if business and business.email else "", styles['Normal']),
         Paragraph(customer.email or "", styles['Normal'])],
        [Paragraph("", styles['Normal']),
         Paragraph(customer.phone or "", styles['Normal'])],
    ]
    info_table = Table(info_data, colWidths=[85*mm, 85*mm])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 8*mm))

    # Invoice details
    details_data = [
        ['Issue Date', str(invoice.created_at.date() if invoice.created_at else '')],
        ['Due Date', str(invoice.due_date)],
        ['Status', invoice.status.value.upper()],
    ]
    details_table = Table(details_data, colWidths=[50*mm, 120*mm])
    details_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TEXTCOLOR', (0,0), (0,-1), colors.grey),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 8*mm))

    # Line items table
    items_data = [
        ['Description', 'Amount (KES)'],
        [f'Services / Invoice #{invoice.id}', f"{float(invoice.amount):,.2f}"],
    ]
    items_table = Table(items_data, colWidths=[120*mm, 50*mm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4*mm))

    # Total
    total_data = [['TOTAL', f"KES {float(invoice.amount):,.2f}"]]
    total_table = Table(total_data, colWidths=[120*mm, 50*mm])
    total_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 12),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEABOVE', (0,0), (-1,0), 1, colors.HexColor('#4F46E5')),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 12*mm))

    # Footer
    footer_style = ParagraphStyle('footer', fontSize=9, textColor=colors.grey, alignment=TA_CENTER)
    elements.append(Paragraph("Thank you for your business!", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()