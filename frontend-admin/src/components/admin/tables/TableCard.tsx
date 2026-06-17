import React from "react";
import { Table, TableStatus } from "@/types/table";
import { Reservation } from "@/types/reservation";
import { Users, Clock, CheckCircle2, UtensilsCrossed, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tag } from "antd";

interface TableCardProps {
  table: Table;
  reservation?: Reservation;
  onClick: (table: Table) => void;
}

const getStatusConfig = (status: TableStatus) => {
  switch (status) {
    case "EMPTY":
      return {
        label: "Bàn trống",
        color: "success",
        icon: <CheckCircle2 size={14} className="mr-1" />,
      };
    case "SERVING":
      return {
        label: "Đang phục vụ",
        color: "error",
        icon: <UtensilsCrossed size={14} className="mr-1" />,
      };
    case "RESERVED":
      return {
        label: "Đã đặt trước",
        color: "warning",
        icon: <Clock size={14} className="mr-1" />,
      };
    case "CLEANING":
      return {
        label: "Chờ dọn dẹp",
        color: "default",
        icon: <Trash2 size={14} className="mr-1" />,
      };
    default:
      return {
        label: "Không xác định",
        color: "default",
        icon: <CheckCircle2 size={14} className="mr-1" />,
      };
  }
};

export const TableCard: React.FC<TableCardProps> = ({ table, reservation, onClick }) => {
  const config = getStatusConfig(table.status);

  // Extract merged table note from reservation
  let mergedNote = "";
  if (reservation?.note && reservation.note.includes("[Ghep ban]")) {
    const parts = reservation.note.split("[Ghep ban]");
    if (parts.length > 1) {
      const match = parts[1].split(". [GHEP_BAN:")[0];
      if (match) {
        mergedNote = match.trim();
      }
    }
  }

  return (
    <div
      onClick={() => onClick(table)}
      className={cn(
        "relative flex flex-col p-4 rounded-xl border border-zinc-200 bg-white transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-zinc-300",
        !table.isActive && "opacity-75 bg-zinc-50"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-zinc-800">Bàn {table.number}</h3>
        <Tag color={config.color} className="flex items-center m-0 px-2 py-0.5 rounded-md text-sm font-medium border-0">
          {config.icon}
          {config.label}
        </Tag>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-600">
          <Users size={16} />
          <span>Sức chứa: {table.capacity} người</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <div className={cn("w-2 h-2 rounded-full", table.isActive ? "bg-emerald-500" : "bg-rose-500")} />
          <span className={table.isActive ? "text-emerald-700" : "text-rose-700"}>
            {table.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
          </span>
        </div>

        {mergedNote && (
          <div className="mt-2 pt-2 border-t border-zinc-100 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span className="font-medium">{mergedNote}</span>
          </div>
        )}
      </div>
    </div>
  );
};
