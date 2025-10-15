import { NextRequest, NextResponse } from "next/server";

// Demo data for various search queries
const demoResults: Record<string, any> = {
  "nextjs": {
    url: "https://nextjs.org/docs",
    title: "Next.js Documentation - The React Framework",
    content: `Next.js is a React framework that gives you building blocks to create web applications. By framework, we mean Next.js handles the tooling and configuration needed for React, and provides additional structure, features, and optimizations for your application.

You can use React to build your UI, then incrementally adopt Next.js features to solve common application requirements such as routing, data fetching, integrations—all while improving the developer and end-user experience.

Whether you're an individual developer or part of a larger team, Next.js can help you build interactive, dynamic, and fast React applications.

Main Features:
• Server-side rendering and static site generation
• API routes for building backend endpoints
• Built-in CSS and Sass support
• Fast refresh for instant feedback
• Zero config for better developer experience

The framework is built on top of React and extends it with powerful features like server-side rendering, static site generation, and API routes. This makes it an excellent choice for building production-ready applications.`,
    images: [
      "https://nextjs.org/static/blog/next-15/thumbnail.png",
      "https://nextjs.org/static/twitter-cards/home.jpg",
    ],
  },
  "react": {
    url: "https://react.dev",
    title: "React - A JavaScript Library for Building User Interfaces",
    content: `React is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies.

React can be used as a base in the development of single-page or mobile applications. However, React is only concerned with state management and rendering that state to the DOM, so creating React applications usually requires the use of additional libraries for routing and other client-side functionality.

Key Concepts:
• Components: Independent, reusable pieces of UI
• JSX: A syntax extension for JavaScript
• Props: Arguments passed to components
• State: Data that changes over time
• Hooks: Functions that let you use state and other React features

React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.

Build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep state out of the DOM.`,
    images: [
      "https://react.dev/images/home/conf2024/cover.svg",
      "https://react.dev/images/home/react-logo.svg",
    ],
  },
  "default": {
    url: "https://example.com/search-result",
    title: "Search Results for Your Query",
    content: `This is a demonstration of the GridSearch application. In a production environment, this would fetch real search results from a search engine API.

The reader mode feature extracts the main content from web pages, removing ads, navigation, and other distractions. This provides a clean, focused reading experience similar to Safari's Reader View or Firefox's Reader Mode.

Key Features of GridSearch:
• Spreadsheet-like interface for organizing searches
• Integrated search functionality using =SEARCH() formula
• Reader mode content extraction
• Side panel for viewing detailed content
• Responsive design for various screen sizes
• Clean, professional appearance

The application is built with Next.js, React, and TypeScript, providing a modern and efficient user experience. Tailwind CSS is used for styling, ensuring a consistent and responsive design across all devices.

You can perform searches by entering =SEARCH("your query") in any cell. The results will be displayed in the cell and detailed content will appear in the side panel when you select the cell.

This demo shows how spreadsheet functionality can be combined with web search capabilities to create a powerful information gathering and organization tool.`,
    images: [
      "https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=GridSearch+Demo",
      "https://via.placeholder.com/800x400/50C878/FFFFFF?text=Search+Results",
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Simulate network delay for realistic behavior
    await new Promise(resolve => setTimeout(resolve, 500));

    // Normalize query for matching
    const normalizedQuery = query.toLowerCase().trim();
    
    // Find matching demo result or use default
    let result = demoResults["default"];
    
    if (normalizedQuery.includes("next") || normalizedQuery.includes("nextjs")) {
      result = demoResults["nextjs"];
    } else if (normalizedQuery.includes("react")) {
      result = demoResults["react"];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
