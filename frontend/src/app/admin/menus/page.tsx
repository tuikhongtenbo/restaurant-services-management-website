"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Tabs, Select, Spin, Empty, message, Input, Card } from "antd";
import { Plus, RefreshCw, Search, UtensilsCrossed, EyeOff, PackageX } from "lucide-react";
import { menuService } from "@/services/menu.service";
import { MenuItem, MenuItemStatus } from "@/types/menu";
import { MenuItemCard } from "@/components/admin/menus/MenuItemCard";
import { MenuItemFormModal } from "@/components/admin/menus/MenuItemFormModal";
import { MenuItemDetailModal } from "@/components/admin/menus/MenuItemDetailModal";

export default function MenusPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<MenuItemStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Categories extracted from data
  const [categories, setCategories] = useState<string[]>([]);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const statusParam = selectedStatus === "ALL" ? undefined : selectedStatus;
      const categoryParam = selectedCategory === "ALL" ? undefined : selectedCategory;

      const res = await menuService.getItems({
        category: categoryParam,
        status: statusParam,
        page: currentPage - 1,
        size: pageSize,
      });

      const data = res.data;
      setItems(data.content);
      setTotalItems(data.totalElements);

      // Extract unique categories from ALL items
      if (categories.length === 0) {
        const allRes = await menuService.getItems({ size: 200 });
        const allCategories = [...new Set(allRes.data.content.map((i: MenuItem) => i.category))].sort();
        setCategories(allCategories);
      }
    } catch (error: any) {
      message.error(error.message || "Lỗi tải danh sách món ăn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => fetchData(true);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setDetailOpen(false);
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingItem(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setCategories([]); // Reset to re-fetch categories
    fetchData(true);
  };

  // Stats
  const available = items.filter((i) => i.status === "AVAILABLE").length;
  const outOfStock = items.filter((i) => i.status === "OUT_OF_STOCK").length;
  const hidden = items.filter((i) => i.status === "HIDDEN").length;

  // Tab items for category
  const categoryTabs = [
    { key: "ALL", label: `Tất cả (${totalItems})` },
    ...categories.map((cat) => ({ key: cat, label: cat })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý Thực đơn</h1>
          <p className="text-zinc-500 mt-1">Quản lý danh sách món ăn, giá cả và trạng thái</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
            className="w-36"
            options={[
              { value: "ALL", label: "Tất cả TT" },
              { value: "AVAILABLE", label: "Có sẵn" },
              { value: "OUT_OF_STOCK", label: "Hết hàng" },
              { value: "HIDDEN", label: "Ẩn" },
            ]}
          />
          <Button
            icon={<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleCreateNew}>
            Thêm món
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card size="small" className="bg-zinc-50 border-zinc-200">
          <div className="text-zinc-500 text-sm font-medium">Tổng món</div>
          <div className="text-2xl font-bold mt-1 text-zinc-800">{totalItems}</div>
        </Card>
        <Card size="small" className="bg-emerald-50/50 border-emerald-100">
          <div className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <UtensilsCrossed size={14} /> Có sẵn
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{available}</div>
        </Card>
        <Card size="small" className="bg-rose-50/50 border-rose-100">
          <div className="text-rose-600 text-sm font-medium flex items-center gap-1">
            <PackageX size={14} /> Hết hàng
          </div>
          <div className="text-2xl font-bold mt-1 text-rose-700">{outOfStock}</div>
        </Card>
        <Card size="small" className="bg-zinc-100/50 border-zinc-200">
          <div className="text-zinc-500 text-sm font-medium flex items-center gap-1">
            <EyeOff size={14} /> Ẩn
          </div>
          <div className="text-2xl font-bold mt-1 text-zinc-600">{hidden}</div>
        </Card>
      </div>

      {/* Category Tabs + Grid */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Tabs
          activeKey={selectedCategory}
          onChange={(key) => { setSelectedCategory(key); setCurrentPage(1); }}
          items={categoryTabs}
          className="px-4 pt-4"
        />

        {items.length > 0 ? (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
              {items.map((item) => (
                <MenuItemCard key={item.id} item={item} onClick={handleItemClick} />
              ))}
            </div>

            {/* Simple pagination info */}
            {totalItems > pageSize && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <Button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Trang trước
                  </Button>
                  <span className="text-sm text-zinc-600 px-3">
                    Trang {currentPage} / {Math.ceil(totalItems / pageSize)}
                  </span>
                  <Button
                    disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12">
            <Empty
              description={
                <span className="text-zinc-500">Không có món ăn nào phù hợp.</span>
              }
            >
              <Button type="primary" onClick={handleCreateNew}>
                Thêm món ăn đầu tiên
              </Button>
            </Empty>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <MenuItemDetailModal
        open={detailOpen}
        item={selectedItem}
        onClose={() => setDetailOpen(false)}
        onRefresh={() => { setCategories([]); fetchData(true); }}
        onEdit={handleEdit}
      />

      {/* Form Modal */}
      <MenuItemFormModal
        open={formOpen}
        initialData={editingItem}
        existingCategories={categories}
        onCancel={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}