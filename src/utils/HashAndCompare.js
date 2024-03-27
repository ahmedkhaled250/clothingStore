import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";

export const hash = ({ plaintext, salt = process.env.SALTROUND } = {}) => {
  const hashResult = bcrypt.hashSync(plaintext, parseInt(salt));
  return hashResult;
};

export const compare = ({ plaintext, hashValue } = {}) => {
  const match = bcrypt.compareSync(plaintext, hashValue);
  return match;
};