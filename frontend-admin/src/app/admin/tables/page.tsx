"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Tabs, Spin, Empty, message } from "antd";
import { RefreshCw, Plus } from "lucide-react";
import { TableCard } from "@/components/admin/tables/TableCard";
import { TableActionModal } from "@/components/admin/tables/TableActionModal";
import { TableFormModal } from "@/components/admin/tables/TableFormModal";
import { tableService } from "@/services/table.service";
import { Table, TableLayoutResponse } from "@/types/table";

export default function TablesPage() {
  const [layoutData, setLayoutData] = useState<TableLayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for Drawer
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // States for Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>(undefined);

  const fetchLayout = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      const res = await tableService.getTableLayout();
      setLayoutData(res.data);
    } catch (error: any) {
      message.error(error.message || "Lỗi khi lấy dữ liệu sơ đồ bàn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  const handleRefresh = () => {
    fetchLayout(true);
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setDrawerOpen(true);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTable(undefined);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    fetchLayout(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  // Group tables by area
  const groupedAreas: Record<string, Table[]> = {};
  const existingAreas: string[] = [];

  if (layoutData?.tables) {
    layoutData.tables.forEach((table) => {
      const area = table.area || "Chưa phân khu vực";
      if (!groupedAreas[area]) {
        groupedAreas[area] = [];
        existingAreas.push(area);
      }
      groupedAreas[area].push(table);
    });
  }

  // Sort existing areas logically (e.g., Tầng 1 before Tầng 2)
  existingAreas.sort((a, b) => {
    if (a === "Chưa phân khu vực") return 1;
    if (b === "Chưa phân khu vực") return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });

  const tabItems = existingAreas.map((area) => {
    const tables = groupedAreas[area];
    return {
      key: area,
      label: `${area} (${tables.length})`,
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 pt-4">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onClick={handleTableClick}
            />
          ))}
        </div>
      ),
    };
  });

  const total = layoutData?.total || 0;
  const empty = layoutData?.available || 0;
  const serving = layoutData?.occupied || 0;
  const cleaning = layoutData?.cleaning || 0;
  // Calculate reserved manually since backend doesn't explicitly return it in the DTO stats
  const reserved = layoutData?.tables?.filter((t) => t.status === "RESERVED").length || 0;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Quản lý Sơ đồ bàn</h1>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Trống: {empty}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div>Đang phục vụ: {serving}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Đã đặt: {reserved}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-500"></div>Dọn dẹp: {cleaning}</div>
            <div className="flex items-center gap-1.5 ml-4 font-semibold">Tổng: {total}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleCreateNew}
          >
            Thêm bàn
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      {existingAreas.length > 0 ? (
        <Tabs
          defaultActiveKey={existingAreas[0]}
          items={tabItems}
          className="mt-6"
          size="large"
          type="card"
        />
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 mt-6">
          <Empty
            description={
              <span className="text-zinc-500">Chưa có bàn nào trong hệ thống.</span>
            }
          >
            <Button type="primary" onClick={handleCreateNew}>Thêm bàn đầu tiên</Button>
          </Empty>
        </div>
      )}

      {/* Action Modal */}
      <TableActionModal
        table={selectedTable}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRefresh={handleRefresh}
        onEdit={handleEditTable}
      />

      {/* Form Modal */}
      <TableFormModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialData={editingTable}
        existingAreas={existingAreas}
      />
    </div>
  );
}