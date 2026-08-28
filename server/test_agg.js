const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const periodMatch = {}; // test all time

  const pipeline = [
    { $match: { isDeleted: false, ...periodMatch } },
    {
      $addFields: {
        lat: { $arrayElemAt: ["$location.coordinates", 1] },
        lng: { $arrayElemAt: ["$location.coordinates", 0] }
      }
    },
    {
      $addFields: {
        derivedRegion: {
          $cond: {
            if: { $or: [{ $eq: ["$lat", 0] }, { $not: ["$lat"] }] },
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
        _id: { region: { $ifNull: ["$address", "$derivedRegion"] }, category: "$category" },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.region",
        total: { $sum: "$count" },
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
        categories: { $arrayToObject: "$categories" }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 15 }
  ];

  const result = await mongoose.connection.collection('complaints').aggregate(pipeline).toArray();
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
});
