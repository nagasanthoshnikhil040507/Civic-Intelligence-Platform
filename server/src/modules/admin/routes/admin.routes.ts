import { Router } from 'express';
import { 
  getSystemStats, 
  getComplaints, 
  getComplaintDetails, 
  assignComplaint, 
  getUsers, 
  getUserDetails, 
  updateUserStatus 
} from '../controllers/admin.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireRole } from '../../auth/middleware/rbac.middleware';
import { Role } from '../../auth/constants/roles';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireRole([Role.ADMIN]));

router.get('/stats', getSystemStats);

// Complaint Management
router.get('/complaints', getComplaints);
router.get('/complaints/:id', getComplaintDetails);
router.patch('/complaints/:id/assign', assignComplaint);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/status', updateUserStatus);

export default router;
