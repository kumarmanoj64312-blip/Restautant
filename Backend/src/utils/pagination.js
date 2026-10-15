const pagination = ({
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
}) => {

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        sort: {
            [sort]: order === "asc" ? 1 : -1,
        },
    };

};

export const getPagination = async ({
    model,
    query = {},
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
    populate = "",
    select = "",
}) => {

    const options = pagination({
        page,
        limit,
        sort,
        order,
    });

    let queryBuilder = model
        .find(query)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit);

    if (populate) {
        queryBuilder = queryBuilder.populate(populate);
    }

    if (select) {
        queryBuilder = queryBuilder.select(select);
    }

    const [records, totalRecords] = await Promise.all([
        queryBuilder,
        model.countDocuments(query),
    ]);

    return {
        records,
        totalRecords,
        totalPages: Math.ceil(totalRecords / options.limit),
        currentPage: options.page,
        perPage: options.limit,
    };

};

export default pagination;