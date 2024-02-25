const paginate = ({ page = 1, size = 2 } = {}) => {
  if (page <= 0) {
    page = 1;
  }
  if (size <= 0) {
    size = 2;
  }
  const skip = (parseInt(page) - 1) * parseInt(size)
  return { limit: parseInt(size), skip };
};
export default paginate;
