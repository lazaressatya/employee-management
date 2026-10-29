
import "./globals.css";

export const metadata = {
  title: "ElevateHR | Employee Management",
  description:
    "A modern employee management dashboard powered by Next.js and MongoDB Atlas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
