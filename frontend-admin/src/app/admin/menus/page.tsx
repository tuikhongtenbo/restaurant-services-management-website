"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button, Tabs, Select, Spin, Empty, message, Input, Card, Pagination } from "antd";
import { Plus, RefreshCw, Search, UtensilsCrossed, EyeOff, PackageX } from "lucide-react";
import { menuService } from "@/services/menu.service";
import { MenuItem, MenuItemStatus } from "@/types/menu";
import { MenuItemCard } from "@/components/admin/menus/MenuItemCard";
import { MenuItemFormModal } from "@/components/admin/menus/MenuItemFormModal";
import { MenuItemDetailModal } from "@/components/admin/menus/MenuItemDetailModal";

export default function MenusPage() {
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<MenuItemStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("default");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch all items at once (size 1000) for client-side processing
      const res = await menuService.getItems({ size: 1000 });
      setAllItems(res.data.content);
    } catch (error: any) {
      message.error(error.message || "Lỗi tải danh sách món ăn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived state (calculated instantly)
  const categories = useMemo(() => {
    const cats = [...new Set(allItems.map((i) => i.category))].sort();
    return cats;
  }, [allItems]);

  const stats = useMemo(() => {
    return {
      total: allItems.length,
      available: allItems.filter((i) => i.status === "AVAILABLE").length,
      outOfStock: allItems.filter((i) => i.status === "OUT_OF_STOCK").length,
      hidden: allItems.filter((i) => i.status === "HIDDEN").length,
    };
  }, [allItems]);

  // Filter & Sort
  const filteredItems = useMemo(() => {
    let result = [...allItems];

    if (selectedCategory !== "ALL") {
      result = result.filter((i) => i.category === selectedCategory);
    }
    if (selectedStatus !== "ALL") {
      result = result.filter((i) => i.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // default: by sortOrder then name
      result.sort((a, b) => {
        const orderA = a.sortOrder || 0;
        const orderB = b.sortOrder || 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [allItems, selectedCategory, selectedStatus, searchQuery, sortBy]);

  // Pagination
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Handlers
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
    fetchData(true); // Re-fetch all to get accurate state
  };

  // Tab items for category
  const categoryTabs = [
    { key: "ALL", label: `Tất cả` },
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
          <div className="text-2xl font-bold mt-1 text-zinc-800">{stats.total}</div>
        </Card>
        <Card size="small" className="bg-emerald-50/50 border-emerald-100">
          <div className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <UtensilsCrossed size={14} /> Có sẵn
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{stats.available}</div>
        </Card>
        <Card size="small" className="bg-rose-50/50 border-rose-100">
          <div className="text-rose-600 text-sm font-medium flex items-center gap-1">
            <PackageX size={14} /> Hết hàng
          </div>
          <div className="text-2xl font-bold mt-1 text-rose-700">{stats.outOfStock}</div>
        </Card>
        <Card size="small" className="bg-zinc-100/50 border-zinc-200">
          <div className="text-zinc-500 text-sm font-medium flex items-center gap-1">
            <EyeOff size={14} /> Ẩn
          </div>
          <div className="text-2xl font-bold mt-1 text-zinc-600">{stats.hidden}</div>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-zinc-200">
        <Input
          prefix={<Search size={16} className="text-zinc-400" />}
          placeholder="Tìm kiếm món ăn..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-64"
        />
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
        <Select
          value={sortBy}
          onChange={(v) => { setSortBy(v); setCurrentPage(1); }}
          className="w-48"
          options={[
            { value: "default", label: "Sắp xếp: Mặc định" },
            { value: "price_asc", label: "Giá: Thấp đến Cao" },
            { value: "price_desc", label: "Giá: Cao đến Thấp" },
            { value: "name_asc", label: "Tên: A - Z" },
            { value: "name_desc", label: "Tên: Z - A" },
          ]}
        />
      </div>

      {/* Category Tabs + Grid */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Tabs
          activeKey={selectedCategory}
          onChange={(key) => { setSelectedCategory(key); setCurrentPage(1); }}
          items={categoryTabs}
          className="px-4 pt-4"
        />

        {pagedItems.length > 0 ? (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
              {pagedItems.map((item) => (
                <MenuItemCard key={item.id} item={item} onClick={handleItemClick} />
              ))}
            </div>

            {/* Ant Design Pagination */}
            <div className="flex justify-center mt-8 mb-4">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredItems.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  if (size && size !== pageSize) setPageSize(size);
                }}
                showSizeChanger
                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} món`}
              />
            </div>
          </div>
        ) : (
          <div className="p-12">
            <Empty
              description={
                <span className="text-zinc-500">Không có món ăn nào phù hợp với bộ lọc.</span>
              }
            >
              <Button type="primary" onClick={handleCreateNew}>
                Thêm món ăn mới
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
        onRefresh={() => fetchData(true)}
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
