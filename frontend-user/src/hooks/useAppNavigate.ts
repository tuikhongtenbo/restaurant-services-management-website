import { useNavigate } from "react-router-dom";

export const useAppNavigate = () => {
  const navigate = useNavigate();

  const goTo = (path: string) => {
    // Bạn có thể thêm logic kiểm tra quyền (auth) tại đây trước khi chuyển trang
    navigate(path);
  };

  return { goTo };
};
