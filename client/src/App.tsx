import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { AppProvider } from '@/providers/AppProvider';
import { useEffect } from 'react';
import { AuthService } from '@/services/auth.service';

function App() {
  useEffect(() => {
    AuthService.initializeAuth();
  }, []);

  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;
