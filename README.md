# GridSearch

A Google Sheets/Excel clone with integrated search functionality and reader mode content display. Built with Next.js, React, and TypeScript.

![GridSearch Screenshot](https://github.com/user-attachments/assets/a7eb0a83-6dc7-4eb8-b276-6e85873f7dfc)

## Features

- **Spreadsheet Interface**: Clean, professional Google Sheets-like UI with 20 rows and 10 columns
- **Search Integration**: Use `=SEARCH("query")` formula in any cell to perform web searches
- **Reader Mode**: Automatically extracts and displays clean, readable content from search results
- **Side Panel Viewer**: View detailed content, images, and article text in a dedicated panel
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Professional Styling**: Modern UI with Tailwind CSS for a polished look

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ObtuseAglet/gridsearch.git
cd gridsearch
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. **Select a Cell**: Click on any cell in the grid
2. **Enter Search Query**: Double-click to edit and type `=SEARCH("your search query")`
3. **View Results**: Press Enter to execute the search
   - The cell will display the result URL with a search icon 🔍
   - Adjacent cell (to the right) will show the page title
   - Click on the cell to view full content in the reader mode panel
4. **Reader Mode Panel**: The side panel displays:
   - Page title and URL
   - Extracted images
   - Clean, formatted article content

### Example Queries

- `=SEARCH("Next.js framework")` - Learn about Next.js
- `=SEARCH("React library")` - Get information about React
- `=SEARCH("any topic")` - Search for any topic

## Technology Stack

- **Framework**: Next.js 15.5.5 with App Router
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS with @tailwindcss/postcss
- **Content Extraction**: Demo mode with mock data (production would use real APIs)

## Project Structure

```
gridsearch/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # Search API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── Cell.tsx                  # Individual cell component
│   ├── ContentViewer.tsx         # Reader mode panel
│   └── Grid.tsx                  # Main spreadsheet grid
├── public/                       # Static assets
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts

```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

#### Grid Component
The main spreadsheet interface that manages cell state and coordinates search operations.

#### Cell Component
Individual editable cells with support for formulas, displaying search results, and visual indicators.

#### ContentViewer Component
Side panel that displays reader mode content including title, URL, images, and article text.

#### Search API
API route that processes search queries and returns formatted results with content extraction.

## Future Enhancements

- Real search engine API integration (Google Custom Search, Bing API, etc.)
- Save/load spreadsheet functionality
- More formula types (SUM, AVERAGE, etc.)
- Export to CSV/Excel
- Collaborative editing
- Cell formatting options
- Data visualization features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Inspired by Google Sheets and Excel