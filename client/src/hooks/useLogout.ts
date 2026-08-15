import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export const useLogout = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const logout = async () => {
    // Capture the role before clearing the auth state
    const role = user?.role;
    
    // Clear the auth state and call backend
    await AuthService.logout();
    
    // Redirect based on the captured role
    if (role === 'admin') {
      navigate('/admin/login', { replace: true });
    } else if (role === 'officer') {
      navigate('/officer/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return logout;
};
