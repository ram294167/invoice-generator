# Invoice Generator

A modern, React-powered invoice builder application that allows users to create, edit, and export professional invoices as PDFs. This project was migrated from a static HTML page to a dynamic React app for better usability and maintainability.

## Features

- **Dynamic Invoice Editing**: Edit company details, invoice number, date, event name, and more.
- **Item Management**: Add, edit, and manage invoice line items with quantity, rate, discount, GST calculations.
- **Automatic Calculations**: Real-time computation of taxable amounts, GST, and grand totals.
- **File Uploads**: Upload and preview logos, QR codes, and signatures.
- **PDF Export**: Generate and download invoices as PDF files using html2canvas and jsPDF.
- **Responsive Design**: Works on desktop and mobile devices.
- **Local Storage**: Saves invoice data locally in the browser for persistence.

## Technologies Used

- **React**: For building the user interface.
- **Vite**: For fast development and building.
- **html2canvas**: For capturing the invoice as an image.
- **jsPDF**: For generating PDF files.
- **CSS**: For styling the application.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/invoice-generator.git
   cd invoice-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

## Usage

1. Open the app in your browser.
2. Fill in the invoice details in the form on the left.
3. Add or edit items in the table.
4. Upload logos, QR codes, or signatures if needed.
5. Preview the invoice on the right.
6. Click "Download PDF" to export the invoice.

## Building for Production

To build the app for production:

```bash
npm run build
```

The built files will be in the `dist` folder.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.