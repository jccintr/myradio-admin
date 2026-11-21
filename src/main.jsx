import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './lib/theme.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { PlayerProvider } from './lib/player.jsx';
import { HealthProvider } from './lib/health.jsx';
import { ToastProvider } from './components/ui.jsx';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 60_000 } },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <PlayerProvider>
              <HealthProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </HealthProvider>
            </PlayerProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
