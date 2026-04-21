import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import { VaultProvider } from './providers';

export const metadata: Metadata = {
  title: 'Family Archive Vault | Secure Historical Records',
  description: 'A premium, secure vault for organizing and searching family history documents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Non-blocking font loading — preconnect establishes the connection early */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* font-display=swap ensures text renders immediately with fallback font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <VaultProvider>
          <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
              {children}
            </main>
          </div>
        </VaultProvider>
      </body>
    </html>
  );
}
