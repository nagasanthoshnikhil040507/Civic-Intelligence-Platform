import { Router } from 'express';
import { 
  getSystemStats, 
  getComplaints, 
  getComplaintDetails, 
  assignComplaint, 
  getUsers, 
  getUserDetails, 
  updateUserStatus,
  updateUserDepartment,
  getAiInsights,
  getDepartmentOfficersWorkload,
  getTransferRequests,
  getTransferRequestDetails,
  approveTransferRequest,
  rejectTransferRequest
} from '../controllers/admin.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireRole } from '../../auth/middleware/rbac.middleware';
import { Role } from '../../auth/constants/roles';

import { getAnalytics } from '../controllers/admin.analytics';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireRole([Role.ADMIN]));

router.get('/stats', getSystemStats);
router.get('/analytics', getAnalytics);
router.get('/ai-insights', getAiInsights);

// Complaint Management
router.get('/complaints', getComplaints);
router.get('/complaints/:id', getComplaintDetails);
router.patch('/complaints/:id/assign', assignComplaint);
router.post('/complaints/:id/review-report', require('../controllers/admin.controller').reviewReport);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/department', updateUserDepartment);
// Department Management
router.get('/departments/:department/officers/workload', getDepartmentOfficersWorkload);

// Transfer Requests
router.get('/transfer-requests', getTransferRequests);
router.get('/transfer-requests/:id', getTransferRequestDetails);
router.post('/transfer-requests/:id/approve', approveTransferRequest);
router.post('/transfer-requests/:id/reject', rejectTransferRequest);

export default router;
