import { Request, Response } from 'express';
import { User } from '../../../database/models/User';
import { Complaint } from '../../../database/models/Complaint';
import { NotificationService } from '../../../services/NotificationService';

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
    
    // Status and Category
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.region) query.region = req.query.region;
    
    // Period filter
    const period = req.query.period as string;
    if (period && period !== 'all') {
      const days = parseInt(period.replace('d', ''));
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.createdAt = { $gte: date };
      } else if (period.endsWith('m')) {
        const m = parseInt(period.replace('m', ''));
        if (!isNaN(m)) {
          const date = new Date();
          date.setDate(date.getDate() - (m * 30));
          query.createdAt = { $gte: date };
        }
      } else if (period.endsWith('y')) {
        const y = parseInt(period.replace('y', ''));
        if (!isNaN(y)) {
          const date = new Date();
          date.setDate(date.getDate() - (y * 365));
          query.createdAt = { $gte: date };
        }
      }
    }

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { region: { $regex: req.query.search, $options: 'i' } }
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

    // Assignment Lock Rule:
    // Do not allow direct reassignment if there is a current active assignee or status is not pending.
    const hasCurrentAssignee = complaint.assignmentHistory && complaint.assignmentHistory.length > 0;
    if (hasCurrentAssignee || complaint.status === 'assigned' || complaint.status === 'in_progress') {
      return res.status(409).json({ 
        success: false, 
        message: 'Complaint is already assigned to an officer. Direct reassignment is not allowed.' 
      });
    }

    const { getDepartmentForCategory } = require('../../../utils/departmentMapping');
    const requiredDepartment = getDepartmentForCategory(complaint.category);

    if (officer.department === 'UNASSIGNED') {
      return res.status(400).json({ success: false, message: 'Cannot assign complaints to unassigned or pending officers' });
    }

    if (officer.departmentStatus && officer.departmentStatus !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot assign complaints to pending officers' });
    }

    if (requiredDepartment === 'UNASSIGNED') {
      return res.status(400).json({ success: false, message: 'Complaint category requires department mapping before assignment.' });
    }

    if (officer.department !== requiredDepartment) {
      return res.status(400).json({ 
        success: false, 
        message: `Department mismatch. Complaint belongs to ${requiredDepartment} but officer belongs to ${officer.department || 'UNASSIGNED'}.`
      });
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

    await NotificationService.notifyOfficer(officer._id, {
      type: 'COMPLAINT_ASSIGNED',
      title: 'New Complaint Assigned',
      message: `You have been assigned to handle complaint "${complaint.title}".`,
      priority: 'HIGH',
      complaintId: complaint._id,
      senderId: adminId,
      senderRole: 'admin'
    });

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
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserDepartment = async (req: Request, res: Response) => {
  try {
    const { department } = req.body;
    const targetUserId = req.params.id;
    
    if (!['SANITATION', 'ROADS', 'UNASSIGNED'].includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }

    const user = await User.findById(targetUserId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role !== 'officer') {
      return res.status(400).json({ success: false, message: 'Department can only be assigned to officers' });
    }

    if (user.department === department) {
      return res.status(400).json({ success: false, message: `Officer is already assigned to ${department}` });
    }

    if (department === 'UNASSIGNED') {
      user.department = 'UNASSIGNED';
      user.requestedDepartment = null;
      user.departmentStatus = 'PENDING';
    } else {
      user.department = department;
      user.requestedDepartment = null;
      user.departmentStatus = 'APPROVED';
    }
    
    await user.save();
    
    if (department !== 'UNASSIGNED') {
      await NotificationService.notifyOfficer(user._id, {
        type: 'OFFICER_DEPARTMENT_APPROVED',
        title: 'Department Assignment Approved',
        message: `Your department request has been approved. You are now assigned to the ${department} department.`,
        priority: 'NORMAL',
        senderRole: 'admin'
      });
    }

    res.json({ success: true, data: user, message: `Officer department updated to ${department}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAiInsights = async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string;
    const matchQuery: any = { isDeleted: false };
    
    if (period && period !== 'all') {
      const days = parseInt(period.replace('d', ''));
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        matchQuery.createdAt = { $gte: date };
      }
    }

    // 1. Category Trends (Pie Chart)
    const categoryTrends = await Complaint.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 2. Region Trends (Stacked Bar Chart)
    const regionTrends = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          coords: { $ifNull: ["$location.coordinates", [0, 0]] }
        }
      },
      {
        $addFields: {
          lat: { $arrayElemAt: ["$coords", 1] },
          lng: { $arrayElemAt: ["$coords", 0] }
        }
      },
      {
        $addFields: {
          derivedRegion: {
            $cond: {
              if: { $or: [{ $eq: ["$lat", 0] }, { $eq: ["$lat", null] }] },
              then: "Unspecified Area",
              else: {
                $concat: [
                  "Geo-Sector ",
                  { $toString: { $round: ["$lat", 2] } },
                  "N, ",
                  { $toString: { $round: ["$lng", 2] } },
                  "E"
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: { 
            region: { $ifNull: ["$address", "$derivedRegion"] }, 
            category: "$category" 
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.region",
          total: { $sum: "$count" },
          categories: {
            $push: {
              k: { $ifNull: ["$_id.category", "Unknown"] },
              v: "$count"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          region: "$_id",
          total: 1,
          categories: { $arrayToObject: "$categories" }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 15 }
    ]);

    // 3. High Priority Unresolved
    const highPriorityUnresolved = await Complaint.find({
      ...matchQuery,
      status: { $nin: ['resolved', 'closed', 'rejected'] },
      $or: [
        { priority: { $gte: 75 } },
        { 'aiAnalysis.priority': { $gte: 75 } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('citizenId', 'firstName lastName');

    // 4. Duplicate Intelligence
    const duplicateCount = await Complaint.countDocuments({
      ...matchQuery,
      'aiAnalysis.duplicateDetected': true
    });

    // 5. AI Processed Overview
    const totalComplaints = await Complaint.countDocuments(matchQuery);
    const aiProcessedCount = await Complaint.countDocuments({
      ...matchQuery,
      'aiAnalysis.analyzedAt': { $exists: true, $ne: null }
    });

    res.json({
      success: true,
      data: {
        categoryTrends,
        regionTrends,
        highPriorityUnresolved,
        duplicateIntelligence: {
          totalDuplicates: duplicateCount
        },
        aiOverview: {
          totalComplaints,
          aiProcessedCount,
          processingRate: totalComplaints > 0 ? (aiProcessedCount / totalComplaints) * 100 : 0
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving AI insights', error: error.message });
  }
};

export const getDepartmentOfficersWorkload = async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    
    // Find all APPROVED, ACTIVE officers in the given department
    const query: any = { 
      role: 'officer', 
      isDeleted: false,
      status: 'active',
      departmentStatus: 'APPROVED'
    };
    
    if (department && department !== 'ALL' && department !== 'UNASSIGNED') {
      query.department = department.toUpperCase();
    } else if (department === 'UNASSIGNED') {
      query.department = 'UNASSIGNED';
    }
    
    const officers = await User.find(query).select('firstName lastName email phone status department departmentStatus');
    
    // Extract officer IDs for filtering in aggregation
    const officerIds = officers.map(o => o._id);

    // Compute workload stats using a single aggregation pipeline
    // This accurately handles reassignment by separating current workload from historical workload
    const workloadAggregation = await Complaint.aggregate([
      { 
        $match: { 
          isDeleted: false, 
          'assignmentHistory.0': { $exists: true } 
        } 
      },
      {
        $addFields: {
          // The current responsible officer is the last one in the assignment history array
          currentAssignment: { $arrayElemAt: ['$assignmentHistory', -1] },
        }
      },
      {
        $facet: {
          currentWorkload: [
            {
              $group: {
                _id: '$currentAssignment.officerId',
                assigned: {
                  $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] }
                },
                inProgress: {
                  $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
                },
                resolved: {
                  $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
                }
              }
            }
          ],
          totalHistoricalAssigned: [
            // Unwind to get every officer who was EVER assigned this complaint
            { $unwind: '$assignmentHistory' },
            {
              $group: {
                _id: '$assignmentHistory.officerId',
                total: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const { currentWorkload, totalHistoricalAssigned } = workloadAggregation[0];

    // Create lookup maps for fast access
    const currentMap = new Map(currentWorkload.map((w: any) => [w._id.toString(), w]));
    const totalMap = new Map(totalHistoricalAssigned.map((w: any) => [w._id.toString(), w]));

    // Map stats back to the original officers array
    const officerWorkloads = officers.map((officer) => {
      const currentStats: any = currentMap.get(officer._id.toString()) || { assigned: 0, inProgress: 0, resolved: 0 };
      const totalStats: any = totalMap.get(officer._id.toString()) || { total: 0 };
      
      const assigned = currentStats.assigned || 0;
      const inProgress = currentStats.inProgress || 0;
      const resolved = currentStats.resolved || 0;
      const totalAssigned = totalStats.total || 0;
      
      return {
        ...officer.toObject(),
        workload: {
          assigned,
          inProgress,
          activeWorkload: assigned + inProgress,
          resolved,
          totalAssigned
        }
      };
    });
    
    res.json({ success: true, data: officerWorkloads });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// --- Transfer Requests ---

export const getTransferRequests = async (req: Request, res: Response) => {
  try {
    const { TransferRequest } = require('../../../database/models/TransferRequest');
    const { status, department } = req.query;
    
    const query: any = {};
    if (status && status !== 'ALL') query.status = status;
    if (department && department !== 'ALL') query.department = department;

    const requests = await TransferRequest.find(query)
      .populate('complaintId', 'title category status location priority')
      .populate('requestedByOfficerId', 'firstName lastName email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getTransferRequestDetails = async (req: Request, res: Response) => {
  try {
    const { TransferRequest } = require('../../../database/models/TransferRequest');
    const request = await TransferRequest.findById(req.params.id)
      .populate('complaintId')
      .populate('requestedByOfficerId', 'firstName lastName email department workload');
      
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const approveTransferRequest = async (req: Request, res: Response) => {
  try {
    const { targetOfficerId } = req.body;
    if (!targetOfficerId) return res.status(400).json({ success: false, message: 'Target officer is required' });

    const adminId = (req as any).user.userId;
    const { TransferRequest } = require('../../../database/models/TransferRequest');
    const transferRequest = await TransferRequest.findById(req.params.id);
    
    if (!transferRequest || transferRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Invalid or already processed transfer request' });
    }

    const complaint = await Complaint.findById(transferRequest.complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const targetOfficer = await User.findById(targetOfficerId);
    if (!targetOfficer || targetOfficer.role !== 'officer' || targetOfficer.status !== 'active' || targetOfficer.departmentStatus !== 'APPROVED' || targetOfficer.isDeleted) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive target officer' });
    }

    const { getDepartmentForCategory } = require('../../../utils/departmentMapping');
    const requiredDepartment = getDepartmentForCategory(complaint.category);
    if (targetOfficer.department !== requiredDepartment) {
      return res.status(400).json({ success: false, message: 'Target officer is in the wrong department' });
    }

    if (String(targetOfficerId) === String(transferRequest.requestedByOfficerId)) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same officer' });
    }

    // Atomic update for complaint
    complaint.assignmentHistory.push({ officerId: targetOfficer._id, assignedAt: new Date() });
    complaint.activeTransferRequest = null as any;
    complaint.timeline.push({
      status: complaint.status,
      updatedBy: adminId,
      timestamp: new Date(),
      note: `Transfer request approved. Complaint assigned to ${targetOfficer.firstName} ${targetOfficer.lastName}.`
    });
    await complaint.save();

    transferRequest.status = 'APPROVED';
    transferRequest.targetOfficerId = targetOfficer._id;
    transferRequest.reviewedByAdminId = adminId;
    transferRequest.reviewedAt = new Date();
    transferRequest.transferredAt = new Date();
    await transferRequest.save();

    res.json({ success: true, message: 'Transfer request approved and complaint reassigned successfully.' });

    // Send notifications
    await NotificationService.notifyOfficer(transferRequest.requestedByOfficerId, {
      type: 'TRANSFER_REQUEST_APPROVED',
      title: 'Transfer Request Approved',
      message: `Your request to transfer complaint "${complaint.title}" has been approved.`,
      priority: 'NORMAL',
      complaintId: complaint._id,
      transferRequestId: transferRequest._id,
      senderId: adminId,
      senderRole: 'admin'
    });

    await NotificationService.notifyOfficer(targetOfficer._id, {
      type: 'COMPLAINT_ASSIGNED',
      title: 'New Complaint Assigned',
      message: `You have been assigned complaint "${complaint.title}" through an approved transfer.`,
      priority: 'HIGH',
      complaintId: complaint._id,
      transferRequestId: transferRequest._id,
      senderId: adminId,
      senderRole: 'admin'
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const rejectTransferRequest = async (req: Request, res: Response) => {
  try {
    const { adminDecisionNote } = req.body;
    const adminId = (req as any).user.userId;
    const { TransferRequest } = require('../../../database/models/TransferRequest');
    
    const transferRequest = await TransferRequest.findById(req.params.id);
    if (!transferRequest || transferRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Invalid or already processed transfer request' });
    }

    const complaint = await Complaint.findById(transferRequest.complaintId);
    if (complaint) {
      complaint.activeTransferRequest = null as any;
      complaint.timeline.push({
        status: complaint.status,
        updatedBy: adminId,
        timestamp: new Date(),
        note: `Transfer request rejected. Reason: ${adminDecisionNote || 'None provided'}`
      });
      await complaint.save();
    }

    transferRequest.status = 'REJECTED';
    transferRequest.adminDecisionNote = adminDecisionNote;
    transferRequest.reviewedByAdminId = adminId;
    transferRequest.reviewedAt = new Date();
    await transferRequest.save();

    res.json({ success: true, message: 'Transfer request rejected successfully.' });
    
    await NotificationService.notifyOfficer(transferRequest.requestedByOfficerId, {
      type: 'TRANSFER_REQUEST_REJECTED',
      title: 'Transfer Request Rejected',
      message: `Your request to transfer complaint "${complaint?.title || ''}" was rejected.\nAdmin Note: ${adminDecisionNote || 'None provided'}`,
      priority: 'HIGH',
      complaintId: transferRequest.complaintId,
      transferRequestId: transferRequest._id,
      senderId: adminId,
      senderRole: 'admin'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const reviewReport = async (req: Request, res: Response) => {
  try {
    const { decision, note, signatureImage } = req.body;
    const adminId = (req as any).user.userId;
    const complaintId = req.params.id;

    if (!['COMPLETED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }

    if (decision === 'COMPLETED' && !signatureImage) {
      return res.status(400).json({ success: false, message: 'Digital signature is required to complete the report.' });
    }

    if (decision === 'REJECTED' && (!note || note.trim().length < 5)) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (complaint.status !== 'resolved' || !complaint.resolutionReport || complaint.resolutionReport.status !== 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Complaint report is not pending admin review.' });
    }

    const officerId = complaint.resolutionReport.submittedByOfficerId;
    const reviewedAt = new Date();
    const verificationId = decision === 'COMPLETED' ? `VERIFY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : undefined;

    complaint.resolutionReport.status = decision;
    complaint.resolutionReport.adminReview = {
      decision,
      note,
      reviewedAt,
      reviewedBy: adminId,
      signatureImage,
      verificationId
    };

    if (decision === 'COMPLETED') {
      complaint.status = 'closed';
      complaint.timeline.push({
        status: 'closed',
        updatedBy: adminId,
        timestamp: reviewedAt,
        note: `Admin verified and completed report. ID: ${verificationId}`
      });

      await NotificationService.notifyOfficer(officerId, {
        type: 'COMPLAINT_COMPLETED',
        title: 'Report Verified Successfully',
        message: `Your resolution report for Complaint #${complaintId.slice(-8).toUpperCase()} was reviewed and marked COMPLETED.`,
        priority: 'NORMAL',
        complaintId: complaint._id,
        senderId: adminId,
        senderRole: 'admin'
      });
    } else {
      // REJECTED
      complaint.status = 'in_progress';
      complaint.timeline.push({
        status: 'in_progress',
        updatedBy: adminId,
        timestamp: reviewedAt,
        note: `Admin rejected resolution report. Reason: ${note}`
      });

      await NotificationService.notifyOfficer(officerId, {
        type: 'COMPLAINT_REJECTED',
        title: 'Report Rejected — Corrections Required',
        message: `Your resolution report for Complaint #${complaintId.slice(-8).toUpperCase()} was rejected.\nReason: ${note}`,
        priority: 'HIGH',
        complaintId: complaint._id,
        senderId: adminId,
        senderRole: 'admin'
      });
    }

    await complaint.save();
    res.json({ success: true, data: complaint, message: `Report marked as ${decision}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

