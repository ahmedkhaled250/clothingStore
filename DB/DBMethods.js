export const find = async ({
  model,
  condition = {},
  select = "",
  populate = [],
  skip = 0,
  sort,
  limit = 10,
} = {}) => {
  const result = await model
    .find(condition)
    .skip(skip)
    .limit(limit)
    .select(select)
    .sort(sort)
    .populate(populate);
  return result;
};
export const findById = async ({
  model,
  condition = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .findById(condition)
    .select(select)
    .populate(populate);
  return result;
};
export const findOne = async ({
  model,
  condition = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .findOne(condition)
    .select(select)
    .populate(populate);
  return result;
};
// create
export const createAndSave = async ({ model, data = {} } = {}) => {
  const newUser = new model(data);
  const savedUser = await newUser.save();
  return savedUser;
};
export const create = async ({ model, data = {} } = {}) => {
  const result = await model.create(data);
  return result;
};
export const insertMany = async ({ model, data = [{}] } = {}) => {
  const result = await model.insertMany(data);
  return result;
};
// update
export const findByIdAndUpdate = async ({
  model,
  condition = {},
  data = {},
  option = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .findByIdAndUpdate(condition, data, option)
    .select(select)
    .populate(populate);
  return result;
};
export const findOneAndUpdate = async ({
  model,
  condition = {},
  data = {},
  option = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .findOneAndUpdate(condition, data, option)
    .select(select)
    .populate(populate);
  return result;
};
export const updateOne = async ({
  model,
  condition = {},
  data = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .updateOne(condition, data)
    .select(select)
    .populate(populate);
  return result;
};
export const updateMany = async ({
  model,
  condition = {},
  data = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .updateMany(condition, data)
    .select(select)
    .populate(populate);
  return result;
};
// delete
export const findByIdAndDelete = async ({
  model,
  condition = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .findByIdAndDelete(condition)
    .select(select)
    .populate(populate);
  return result;
};
export const findOneAndDelete = async ({
  model,
  condition = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .findOneAndDelete(condition)
    .select(select)
    .populate(populate);
  return result;
};
export const deleteOne = async ({
  model,
  condition = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .deleteOne(condition)
    .select(select)
    .populate(populate);
  return result;
};
export const deleteMany = async ({
  model,
  condition = {},
  select = "",
  populate = [],
} = {}) => {
  const result = await model
    .deleteMany(condition)
    .select(select)
    .populate(populate);
  return result;
};

export const countDocuments = async ({ model, condition = {} } = {}) => {
  const result = await model.countDocuments(condition);
  return result;
};