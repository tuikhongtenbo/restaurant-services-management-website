export const isValidPassword = (password: string): boolean => {
  // Ít nhất một chữ hoa, một chữ thường, một số, một kí tự đặc biệt, tối thiểu 10 kí tự
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
  return passwordRegex.test(password);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const passwordsMatch = (password: string, confirm: string): boolean => {
  return password === confirm;
};

export const getPasswordError = (password: string): string | null => {
  if (!password) return "Mật khẩu không được để trống";
  if (password.length < 10) return "Mật khẩu phải có ít nhất 10 kí tự";
  if (!/[A-Z]/.test(password)) return "Mật khẩu phải có chữ hoa";
  if (!/[a-z]/.test(password)) return "Mật khẩu phải có chữ thường";
  if (!/\d/.test(password)) return "Mật khẩu phải có ít nhất một chữ số";
  if (!/[@$!%*?&]/.test(password)) return "Mật khẩu phải có kí tự đặc biệt";
  return null;
};

export const getEmailError = (email: string): string | null => {
  if (!email) return "Email không được để trống";
  if (!isValidEmail(email)) return "Email không hợp lệ";
  return null;
};
