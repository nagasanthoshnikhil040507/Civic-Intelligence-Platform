import { Request, Response } from 'express';
import { User } from '../../../database/models/User';
import { Complaint } from '../../../database/models/Complaint';

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const totalOfficers = await User.countDocuments({ role: 'officer' });
    const totalComplaints = await Complaint.countDocuments();
    
    // Status breakdown
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const assignedComplaints = await Complaint.countDocuments({ status: 'assigned' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in_progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const rejectedComplaints = await Complaint.countDocuments({ status: 'rejected' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCitizens,
        totalOfficers,
        totalComplaints,
        statusOverview: {
          pending: pendingComplaints,
          assigned: assignedComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          rejected: rejectedComplaints
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving stats', error: error.message });
  }
};

export const getComplaints = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('citizenId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Complaint.countDocuments(query);

    res.json({
      success: true,
      data: {
        complaints,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getComplaintDetails = async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizenId', 'firstName lastName email phone avatar')
      .populate('assignmentHistory.officerId', 'firstName lastName email phone avatar department')
      .populate('timeline.updatedBy', 'firstName lastName role')
      .populate('resolutionDetails.resolvedBy', 'firstName lastName email role');

    if (!complaint || complaint.isDeleted) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, data: complaint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const assignComplaint = async (req: Request, res: Response) => {
  try {
    const { officerId } = req.body;
    const adminId = (req as any).user.userId;

    const officer = await User.findById(officerId);
    if (!officer || officer.role !== 'officer' || officer.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Invalid, inactive, or non-officer user selected' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint || complaint.isDeleted) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = 'assigned';
    complaint.assignmentHistory.push({ officerId: officer._id, assignedAt: new Date() });
    complaint.timeline.push({
      status: 'assigned',
      updatedBy: adminId,
      timestamp: new Date(),
      note: `Assigned to officer ${officer.firstName} ${officer.lastName} by Admin.`
    });

    await complaint.save();

    res.json({ success: true, data: complaint, message: 'Complaint assigned successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };
    if (req.query.role) query.role = req.query.role;
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash -loginHistory')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Aggregate some stats based on role
    let stats: any = {};
    if (user.role === 'citizen') {
      stats.totalComplaints = await Complaint.countDocuments({ citizenId: user._id, isDeleted: false });
    } else if (user.role === 'officer') {
      stats.assignedComplaints = await Complaint.countDocuments({ 'assignmentHistory.officerId': user._id, isDeleted: false });
    }

    res.json({ success: true, data: { user, stats } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const adminId = (req as any).user.userId;
    const targetUserId = req.params.id;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    if (adminId.toString() === targetUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot change your own account status' });
    }

    const user = await User.findById(targetUserId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, data: user, message: `User status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
