"use client";

import React, { useState, useEffect } from "react";
import { Card, Select, Spin, message, Table, DatePicker } from "antd";
import { DollarSign, ShoppingBag, Utensils } from "lucide-react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { invoiceService } from "@/services/invoice.service";
import { orderService } from "@/services/order.service";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

dayjs.extend(isSameOrAfter);

type TimeRange = "WEEK" | "MONTH" | "YEAR";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("WEEK");
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);

  const [chartData, setChartData] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [timeRange, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch maximum 10,000 records to calculate stats
      const [invoiceRes, orderRes] = await Promise.all([
        invoiceService.getInvoices({ size: 10000 }),
        orderService.getOrders({ size: 10000, status: "PAID" }),
      ]);

      const allInvoices = invoiceRes.data.data || [];
      const allOrders = orderRes.data.data || [];

      const now = selectedDate;
      let startDate = now;
      let endDate = now;
      let dateFormat = "DD/MM";
      
      // Khởi tạo các mốc thời gian trống để biểu đồ không bị đứt đoạn
      const dateMap: Record<string, number> = {};

      if (timeRange === "WEEK") {
        startDate = now.subtract(6, "day").startOf("day");
        endDate = now.endOf("day");
        dateFormat = "DD/MM";
        for (let i = 6; i >= 0; i--) {
          dateMap[now.subtract(i, "day").format(dateFormat)] = 0;
        }
      } else if (timeRange === "MONTH") {
        startDate = now.startOf("month");
        endDate = now.endOf("month");
        dateFormat = "DD/MM";
        const daysInMonth = now.daysInMonth();
        for (let i = 1; i <= daysInMonth; i++) {
          dateMap[now.date(i).format(dateFormat)] = 0;
        }
      } else if (timeRange === "YEAR") {
        startDate = now.startOf("year");
        endDate = now.endOf("year");
        dateFormat = "MM/YYYY";
        for (let i = 0; i < 12; i++) {
          dateMap[now.month(i).format(dateFormat)] = 0;
        }
      }

      // Filter Invoices for Revenue
      const validInvoices = allInvoices.filter((inv) => {
        const d = dayjs(inv.createdAt);
        return inv.status === "PAID" && d.valueOf() >= startDate.valueOf() && d.valueOf() <= endDate.valueOf();
      });

      let revenue = 0;
      validInvoices.forEach((inv) => {
        revenue += inv.totalAmount;
        const dateKey = dayjs(inv.createdAt).format(dateFormat);
        if (dateMap[dateKey] !== undefined) {
          dateMap[dateKey] += inv.totalAmount;
        } else {
          dateMap[dateKey] = inv.totalAmount;
        }
      });
      
      // Filter Orders & Items for Counts
      const validOrders = allOrders.filter((ord) => {
        const d = dayjs(ord.closedAt || ord.openedAt);
        return d.valueOf() >= startDate.valueOf() && d.valueOf() <= endDate.valueOf();
      });

      let itemsSold = 0;
      const itemCounts: Record<string, number> = {};

      validOrders.forEach((ord) => {
        if (ord.items && Array.isArray(ord.items)) {
          ord.items.forEach((item) => {
            if (item.status !== "CANCELLED") {
              itemsSold += item.quantity;
              itemCounts[item.itemName] = (itemCounts[item.itemName] || 0) + item.quantity;
            }
          });
        }
      });

      // Format Chart Data
      const formattedChartData = Object.keys(dateMap).map((key) => ({
        date: key,
        revenue: dateMap[key],
      }));

      // Format Top Items
      const sortedTopItems = Object.keys(itemCounts)
        .map((name) => ({ name, quantity: itemCounts[name] }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5) // Lấy Top 5
        .map((item, index) => ({ ...item, rank: index + 1 }));

      setTotalRevenue(revenue);
      setTotalOrders(validOrders.length);
      setTotalItemsSold(itemsSold);
      setChartData(formattedChartData);
      setTopItems(sortedTopItems);

    } catch (error: any) {
      message.error("Lỗi khi tải dữ liệu thống kê: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const getTimeLabel = () => {
    if (timeRange === "WEEK") return "7 ngày tính từ " + selectedDate.format("DD/MM");
    if (timeRange === "MONTH") return "Tháng " + selectedDate.format("MM/YYYY");
    return "Năm " + selectedDate.format("YYYY");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Thống kê Doanh thu</h1>
          <p className="text-zinc-500 mt-1">Báo cáo tình hình kinh doanh của nhà hàng</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="rounded-xl border-zinc-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg mt-1">
                  <DollarSign size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-zinc-500 font-medium">Tổng doanh thu</p>
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full">{getTimeLabel()}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                    {formatPrice(totalRevenue)}
                  </h3>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-zinc-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mt-1">
                  <ShoppingBag size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-zinc-500 font-medium">Tổng số đơn hàng</p>
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full">{getTimeLabel()}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                    {totalOrders.toLocaleString()} <span className="text-sm font-normal text-zinc-500">đơn</span>
                  </h3>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border-zinc-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mt-1">
                  <Utensils size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-zinc-500 font-medium">Món ăn đã bán</p>
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full">{getTimeLabel()}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                    {totalItemsSold.toLocaleString()} <span className="text-sm font-normal text-zinc-500">phần</span>
                  </h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts & Tables */}
          <div className="flex flex-col gap-5">
            {/* Chart Area */}
            <Card 
              className="rounded-xl border-zinc-200 shadow-sm w-full" 
              title={
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-zinc-800">Biểu đồ Doanh thu</span>
                  <div className="flex gap-2">
                    <DatePicker 
                      value={selectedDate}
                      onChange={(date) => date && setSelectedDate(date)}
                      picker={timeRange === "YEAR" ? "year" : timeRange === "MONTH" ? "month" : "date"}
                      format={timeRange === "YEAR" ? "YYYY" : timeRange === "MONTH" ? "MM/YYYY" : "DD/MM/YYYY"}
                      allowClear={false}
                    />
                    <Select
                      value={timeRange}
                      onChange={(v) => setTimeRange(v)}
                      className="w-40 font-normal"
                      options={[
                        { value: "WEEK", label: "Theo tuần" },
                        { value: "MONTH", label: "Theo tháng" },
                        { value: "YEAR", label: "Theo năm" },
                      ]}
                    />
                  </div>
                </div>
              }
            >
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#71717a", fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      width={65}
                      tick={{ fill: "#71717a", fontSize: 12 }}
                      tickFormatter={(value) => `${value >= 1000000 ? value / 1000000 + 'tr' : value >= 1000 ? value / 1000 + 'k' : value}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatPrice(Number(value)), "Doanh thu"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Top Items Table */}
            <Card 
              className="rounded-xl border-zinc-200 shadow-sm w-full" 
              title={
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-800">Top Món Bán Chạy Nhất</span>
                  <span className="text-sm font-normal text-zinc-500">Dữ liệu: {getTimeLabel()}</span>
                </div>
              } 
              bodyStyle={{ padding: 0 }}
            >
              <Table
                dataSource={topItems}
                rowKey="name"
                pagination={false}
                columns={[
                  {
                    title: 'Hạng',
                    dataIndex: 'rank',
                    key: 'rank',
                    width: 60,
                    align: 'center',
                    render: (rank) => (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mx-auto ${
                        rank === 1 ? 'bg-amber-100 text-amber-600' : 
                        rank === 2 ? 'bg-zinc-200 text-zinc-600' : 
                        rank === 3 ? 'bg-orange-100 text-orange-800' : 
                        'bg-zinc-50 text-zinc-400'
                      }`}>
                        {rank}
                      </div>
                    )
                  },
                  {
                    title: 'Tên món',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => <span className="font-medium text-zinc-700">{text}</span>
                  },
                  {
                    title: 'Đã bán',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    align: 'right',
                    render: (val) => <span className="font-bold text-zinc-900">{val}</span>
                  }
                ]}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
