import React from "react";
import { Tag, Tooltip } from "antd";
import { ImageOff, TrendingDown } from "lucide-react";
import { MenuItem, MenuItemStatus } from "@/types/menu";
import dayjs from "dayjs";

interface MenuItemCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
}

const statusConfig: Record<MenuItemStatus, { label: string; color: string }> = {
  AVAILABLE: { label: "Có sẵn", color: "success" },
  OUT_OF_STOCK: { label: "Hết hàng", color: "error" },
  HIDDEN: { label: "Ẩn", color: "default" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onClick }) => {
  const status = statusConfig[item.status];
  const hasPromo = item.promoPrice != null && item.promoPrice > 0;

  return (
    <div
      onClick={() => onClick(item)}
      className="group flex flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-zinc-300 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-zinc-100 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <ImageOff size={40} />
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <Tag color={status.color} className="m-0 text-xs font-semibold border-0 shadow-sm">
            {status.label}
          </Tag>
        </div>

        {/* Promo badge */}
        {hasPromo && (
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
            <TrendingDown size={12} />
            KM
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col p-3 gap-1.5 flex-1">
        <Tooltip title={item.name}>
          <h3 className="text-sm font-bold text-zinc-800 truncate">{item.name}</h3>
        </Tooltip>
        <p className="text-xs text-zinc-400 truncate">{item.category}</p>

        {/* Price */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            {hasPromo ? (
              <>
                <span className="text-base font-bold text-rose-600">
                  {formatPrice(item.promoPrice!)}
                </span>
                <span className="text-xs text-zinc-400 line-through">
                  {formatPrice(item.price)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-zinc-800">
                {formatPrice(item.price)}
              </span>
            )}
          </div>
          {/* Show promo date time if available */}
          {hasPromo && item.promoStart && item.promoEnd && (
            <div className="text-[10px] mt-0.5">
              <span className="text-black font-bold">Áp dụng: </span>
              <span className="text-green-600">{dayjs(item.promoStart).format("DD/MM HH:mm")}</span>
              <span> - </span>
              <span className="text-red-600">{dayjs(item.promoEnd).format("DD/MM HH:mm")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
