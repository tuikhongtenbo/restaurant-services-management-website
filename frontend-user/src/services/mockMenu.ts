import type { MenuItem } from "../types/menu";

export const MOCK_MENU_DATA: MenuItem[] = [
  // NHÓM: ĐỒ ĂN KHÔ (KHO)
  {
    id: "k1",
    name: "Phở Thăn Bò Áp Chảo",
    price: 85000,
    description:
      "Bánh phở tươi xào giòn mặt, bò thăn thái mỏng áp chảo cùng rau cải ngồng.",
    category: "kho",
  },
  {
    id: "k2",
    name: "Cơm Gói Lá Sen",
    price: 120000,
    description:
      "Cơm hạt sen, tôm băm, thịt xá xíu quyện hương lá sen thơm nồng nàn.",
    category: "kho",
  },
  {
    id: "k3",
    name: "Bún Chả Kẹp Tre",
    price: 65000,
    description:
      "Thịt ba chỉ nướng sém cạnh bằng kẹp tre trên than củi, ăn kèm nước mắm đu đủ.",
    category: "kho",
  },
  {
    id: "k4",
    name: "Bánh Cuốn Thanh Trì",
    price: 55000,
    description:
      "Lớp bánh mỏng tang như tờ giấy, điểm xuyết hành phi vàng rộm, chấm cùng nước mắm cà cuống.",
    category: "kho",
  },
  {
    id: "k5",
    name: "Mỳ Quảng Tôm Thịt",
    price: 70000,
    description:
      "Sợi mỳ vàng dai, tôm rim đậm đà, thịt xá xíu, ăn kèm bánh tráng nướng và rau sống trà quế.",
    category: "kho",
  },

  // NHÓM: ĐỒ ĂN NƯỚC (NUOC)
  {
    id: "n1",
    name: "Phở Bò Lõi Rùa",
    price: 95000,
    description:
      "Phần thịt bắp bò giòn sần sật, nước dùng ninh từ xương ống bò trong 24 giờ.",
    category: "nuoc",
  },
  {
    id: "n2",
    name: "Bún Thang Phố Cổ",
    price: 75000,
    description:
      "Sự kết hợp tinh tế giữa gà xé, trứng tráng mỏng, giò lụa và tinh dầu cà cuống.",
    category: "nuoc",
  },
  {
    id: "n3",
    name: "Phở Bát Đá Đặc Biệt",
    price: 155000,
    description:
      "Nước dùng sôi sùng sục trong bát đá nóng hổi, thực khách tự tay chần thịt bò và bánh phở tươi tại bàn.",
    category: "nuoc",
  },

  // NHÓM: ĐỒ ĂN THEO SET (SET)
  {
    id: "s1",
    name: "Mâm Cơm Đồng Quê",
    price: 320000,
    description:
      "Cá kho tộ, canh cua mồng tơi, cà pháo muối chua và thịt luộc chấm mắm tôm.",
    category: "set",
  },
  {
    id: "s2",
    name: "Set Đặc Sản Tây Bắc",
    price: 450000,
    description:
      "Thịt trâu gác bếp, lợn mán nướng mắc khén, xôi ngũ sắc và măng rừng.",
    category: "set",
  },

  // NHÓM: NƯỚC UỐNG (UONG)
  {
    id: "u1",
    name: "Trà Nhài Ướp Lạnh",
    price: 35000,
    description:
      "Trà xanh Thái Nguyên ướp hoa nhài tươi, vị thanh mát, hậu ngọt.",
    category: "uong",
  },
  {
    id: "u2",
    name: "Nước Mơ Ngâm Lâu Năm",
    price: 40000,
    description:
      "Mơ chùa Hương ngâm đường phèn trên 2 năm, giải nhiệt và tốt cho tiêu hóa.",
    category: "uong",
  },
];
