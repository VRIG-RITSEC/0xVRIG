import './globals.css';

export const metadata = { title: '0xVRIG' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="crt">{children}</body>
    </html>
  );
}
