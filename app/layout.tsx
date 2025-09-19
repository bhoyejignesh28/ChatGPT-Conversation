import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "FilingsCenter",
  description: "Template-driven marketing collateral editor"
};

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryClientProvider client={queryClient}>
            <Providers>
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
            </Providers>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
