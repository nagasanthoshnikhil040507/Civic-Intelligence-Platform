import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireRole as enforceRole } from '../../auth/middleware/rbac.middleware';
import { Role } from '../../auth/constants/roles';

const router = Router();

// All complaint routes require authentication
router.use(authenticate);

// List/Search complaints (RBAC handled in service query builder)
router.get('/', ComplaintController.getMyComplaints);
router.get('/nearby', ComplaintController.getNearbyComplaints);
router.get('/search-area', ComplaintController.getComplaintsInArea);

// Specific ID
router.get('/:id', ComplaintController.getById);

// Citizen Actions
router.post('/', enforceRole([Role.CITIZEN, Role.ADMIN]), ComplaintController.create);
router.patch('/:id', enforceRole([Role.CITIZEN, Role.ADMIN]), ComplaintController.update);
router.delete('/:id', enforceRole([Role.CITIZEN, Role.ADMIN]), ComplaintController.delete);

import { upload } from '../../../middlewares/upload';
router.post('/:id/images', enforceRole([Role.CITIZEN, Role.ADMIN]), upload.array('images', 5), ComplaintController.uploadImages);
router.delete('/:id/images/:publicId(*)', enforceRole([Role.CITIZEN, Role.ADMIN]), ComplaintController.removeImage);

export default router;
