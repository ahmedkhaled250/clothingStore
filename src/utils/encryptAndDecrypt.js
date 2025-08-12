import CryptoJS from "crypto-js";
export const encrypt = ({ plainText, key = process.env.ENCRYPTION_KEY } = {}) => {
  const encryptedPhone = CryptoJS.AES.encrypt(plainText, key).toString();
  return encryptedPhone
};

export const decrypt = ({
  encryptedText,
  key = process.env.ENCRYPTION_KEY,
} = {}) => {
  let decrypted = CryptoJS.AES.decrypt(encryptedText, key);
  return decrypted.toString(CryptoJS.enc.Utf8);
};
