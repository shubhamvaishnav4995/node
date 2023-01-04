const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    //TODO: Implement this API

    const limit = req.query.limit ? parseInt(req.query.limit) : 10; //set default limit 10 per page
    const page = req.query.page ? parseInt(req.query.page) : 1; // deafult page set to 1
    const offset = page <= 1 ? 0 : (page - 1) * limit;
    const pagingCounter = ((limit * page) - limit) + 1;

    console.log(typeof page);

    const [data] = await User.aggregate([
      {
        $facet: {
          "users": [
            { $skip: offset || 0 },
            { $limit: limit },
            {
              $lookup: {
                from: "posts",
                localField: "_id",
                foreignField: "userId",
                as: "posts",
              }
            },
            {
              $project: {
                name: 1,
                posts: {
                  $size: '$posts',
                },
              },
            }
          ],
          "pagination": [
            { $count: "totalDocs" },
            { 
              $addFields: {
                limit,
                page,
                totalPages: { $ceil : { $divide: [ "$totalDocs", limit ] }},
                pagingCounter,
                hasPrevPage: { $toBool : page >= 2},
                hasNextPage: { $lt: [ page, { $ceil : { $divide: [ "$totalDocs", limit ] }} ] },
                prevPage: (page - 1) >= 1 ? page - 1 : null,
              }
            }
          ]
        }
      },
      {
        $addFields: {
          "pagination": {
            $arrayElemAt: [ "$pagination", 0 ]
        }
        }
      }
    ])

    data.pagination.nextPage = page < data.pagination.totalPages ? (page + 1) : null
    // we can also add limit, page, totalPages, pagingCounter, etc here like above line but i added
    // those fields in aggregation

    res.status(200).json({data});
  } catch (error) {
    res.send({ error: error.message });
  }
};
