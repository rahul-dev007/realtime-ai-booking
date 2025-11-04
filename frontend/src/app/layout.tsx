import './styles.css';
import Providers  from '../providers';
import { Toaster } from '../ui/Toaster';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';

export const metadata = { title: 'AI Booking MVP' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-neutral-50 text-neutral-900 antialiased"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <Providers>
          <div className="min-h-dvh flex flex-col">
            <NavBar />
            <main className="max-w-4xl mx-auto w-full p-6 flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
