import { Request, Response } from 'express';
import { Complaint } from '../../../database/models/Complaint';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '30d';
    const matchQuery: any = { isDeleted: false };
    const prevMatchQuery: any = { isDeleted: false };
    
    let days = 30;
    if (period && period !== 'all') {
      if (period.endsWith('d')) {
        days = parseInt(period.replace('d', ''));
      } else if (period.endsWith('m')) {
        days = parseInt(period.replace('m', '')) * 30;
      } else if (period.endsWith('y')) {
        days = parseInt(period.replace('y', '')) * 365;
      }
      
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        matchQuery.createdAt = { $gte: date };

        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - days);
        prevMatchQuery.createdAt = { $gte: prevDate, $lt: date };
      }
    } else {
      days = 0; // all time
    }

    // OVERVIEW KPIs
    const totalComplaints = await Complaint.countDocuments(matchQuery);
    const prevTotalComplaints = days > 0 ? await Complaint.countDocuments(prevMatchQuery) : null;

    const openStatuses = ['pending', 'assigned', 'in_progress'];
    const resolvedStatuses = ['resolved', 'closed'];

    const openComplaints = await Complaint.countDocuments({ ...matchQuery, status: { $in: openStatuses } });
    const resolvedComplaints = await Complaint.countDocuments({ ...matchQuery, status: { $in: resolvedStatuses } });
    
    const highPriority = await Complaint.countDocuments({
      ...matchQuery,
      $or: [ { priority: { $gte: 75 } }, { 'aiAnalysis.priority': { $gte: 75 } } ]
    });

    // 1. Category Trends
    const categories = await Complaint.aggregate([
      { $match: matchQuery },
      { $group: { _id: { $ifNull: ['$category', 'Uncategorized'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 2. Region Trends (Horizontal/Stacked Bar Chart)
    const regionsAgg = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { 
            region: { $ifNull: ["$region", "Unknown Area"] }, 
            category: { $ifNull: ["$category", "Uncategorized"] }
          },
          count: { $sum: 1 },
          openCount: {
            $sum: {
              $cond: [{ $in: ["$status", openStatuses] }, 1, 0]
            }
          },
          resolvedCount: {
            $sum: {
              $cond: [{ $in: ["$status", resolvedStatuses] }, 1, 0]
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id.region",
          total: { $sum: "$count" },
          open: { $sum: "$openCount" },
          resolved: { $sum: "$resolvedCount" },
          categories: {
            $push: {
              k: "$_id.category",
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
          open: 1,
          resolved: 1,
          categories: { $arrayToObject: "$categories" }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 15 }
    ]);

    const regionsAffected = regionsAgg.length;

    // 3. Complaint Trend (Line Chart)
    let dateFormat = "%Y-%m-%d";
    if (days === 0 || days > 90) dateFormat = "%Y-%m"; // group by month for long periods
    
    const complaintTrend = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Category Trend Over Time
    const categoryTrend = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            category: { $ifNull: ["$category", "Uncategorized"] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          categories: {
            $push: {
              k: "$_id.category",
              v: "$count"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          categories: { $arrayToObject: "$categories" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // 5. Statuses
    const statuses = await Complaint.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 6. Priorities
    const priorities = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          numericPriority: {
            $cond: {
              if: { $isNumber: "$priority" },
              then: "$priority",
              else: {
                $cond: {
                  if: { $isNumber: "$aiAnalysis.priority" },
                  then: "$aiAnalysis.priority",
                  else: 50
                }
              }
            }
          }
        }
      },
      {
        $project: {
          level: {
            $switch: {
              branches: [
                { case: { $gte: ["$numericPriority", 75] }, then: "High" },
                { case: { $gte: ["$numericPriority", 40] }, then: "Medium" }
              ],
              default: "Low"
            }
          }
        }
      },
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalComplaints,
          prevTotalComplaints,
          openComplaints,
          resolvedComplaints,
          highPriority,
          regionsAffected,
          resolutionRate: totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0
        },
        categories,
        regions: regionsAgg,
        complaintTrend,
        categoryTrend,
        statuses,
        priorities
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving analytics', error: error.message });
  }
};
