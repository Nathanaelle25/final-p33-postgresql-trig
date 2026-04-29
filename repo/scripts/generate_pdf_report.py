import psycopg
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime

def generate_report():
    # Database connection details
    # REPLACE 'YOUR_PASSWORD_HERE' WITH YOUR ACTUAL POSTGRES PASSWORD
    DB_CONFIG = {
        "dbname": "inventory_db",
        "user": "postgres",
        "password": "Nathy.140406",
        "host": "localhost",
        "port": "5432"
    }

    try:
        # Connect to PostgreSQL
        conn = psycopg.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Query all products to get inventory status
        query = """
            SELECT name, sku, category, price, stock 
            FROM products 
            ORDER BY category, name;
        """
        cur.execute(query)
        rows = cur.fetchall()

        # Create PDF document
        pdf_file = "PROJE-RAPORU-Nathanaelle-Bopti-Ngah-Bong.pdf"
        doc = SimpleDocTemplate(pdf_file, pagesize=letter)
        elements = []

        # Styles
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        normal_style = styles['Normal']

        # Header: Title, Author, and Date
        elements.append(Paragraph("BMU1208 Web Tabanlı Programlama Final Projesi - PostgreSQL Trigger/View/SP", title_style))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Author: Nathanaelle Bopti Ngah Bong (Bilgisayar Mühendisliği)", normal_style))
        elements.append(Spacer(1, 12))
        elements.append(Spacer(1, 12))
        
        current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elements.append(Paragraph(f"Generated on: {current_date}", normal_style))
        elements.append(Spacer(1, 24))

        # Table Data
        data = [['Product Name', 'SKU', 'Category', 'Price ($)', 'Stock Qty']]
        for row in rows:
            # Format price to 2 decimal places
            formatted_row = list(row)
            formatted_row[3] = f"{float(row[3]):.2f}"
            data.append(formatted_row)

        # Create Table
        table = Table(data, hAlign='LEFT')
        
        # Add Style to Table
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ])
        table.setStyle(style)

        elements.append(table)

        # Build PDF
        doc.build(elements)
        print(f"Successfully generated {pdf_file}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    generate_report()
