class ApiFeatures {
  constructor(queryData, mongooseQuery) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }
  paginate = () => {
    if (!this.queryData.page || this.queryData.page <= 0) {
      this.queryData.page = 1;
    }
    if (!this.queryData.size || this.queryData.size <= 0) {
      this.queryData.size = 40;
    }
    this.mongooseQuery
      .skip((parseInt(this.queryData.page) - 1) * parseInt(this.queryData.size))
      .limit(parseInt(this.queryData.size));
    return this;
  };
  filter = () => {
    const excludeQueryParams = ["page", "size", "sort", "search", "fields", "colorCode", "productSize"];
    const felterQuery = { ...this.queryData };

    excludeQueryParams.forEach((param) => {
      delete felterQuery[param];
    });
    this.mongooseQuery.find(
      JSON.parse(
        JSON.stringify(felterQuery).replace(
          /(gt|gte|lt|lte|in|nin|eq|neq)/g,
          (match) => `$${match}`
        )
      )
    );
    return this;
  };
  sort = () => {
    this.mongooseQuery.sort(this.queryData.sort?.replaceAll(",", " "));
    return this;
  };
  search = () => {
    if (this.queryData.search) {
      this.mongooseQuery.find({
        $or: [
          { name: { $regex: this.queryData.search, $options: "i" } },
          { description: { $regex: this.queryData.search, $options: "i" } },
        ],
      });
    }
    return this;
  };
  select = () => {
    this.mongooseQuery.select(this.queryData.fields?.replaceAll(",", " "));
    return this;
  };
}
export default ApiFeatures;
