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
