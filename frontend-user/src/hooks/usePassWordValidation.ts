import { useState } from "react";
import { isValidPassword } from "../utils/validation";
export const usePasswordValidation = () => {
  const [error, setError] = useState<string | null>(null);

  const validate = (password: string) => {
    if (!isValidPassword(password)) {
      setError("Mật khẩu không hợp lệ");
      return false;
    }
    setError(null);
    return true;
  };
  return { error, validate };
};
