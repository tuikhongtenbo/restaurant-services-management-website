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

type TimeRange = "TODAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM";
const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [topItemsLoading, setTopItemsLoading] = useState(false);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [invoiceMap, setInvoiceMap] = useState<Map<string, any>>(new Map());
  const [timeRange, setTimeRange] = useState<TimeRange>("WEEK");
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const [topItemsSortBy, setTopItemsSortBy] = useState<"REVENUE" | "QUANTITY">("REVENUE");
  const [topItemsTimeRange, setTopItemsTimeRange] = useState<TimeRange>("WEEK");
  const [topItemsSelectedDate, setTopItemsSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [topItemsCustomDateRange, setTopItemsCustomDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);

  const [chartData, setChartData] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const [invoiceRes, orderRes] = await Promise.all([
        invoiceService.getInvoices({ size: 10000 }),
        orderService.getOrders({ size: 10000, status: "PAID" }),
      ]);

      const invoices = invoiceRes.data.data || [];
      const orders = orderRes.data.data || [];

      const map = new Map();
      invoices.forEach(inv => {
        if (inv.status === "PAID") {
          map.set(inv.orderId, inv);
        }
      });

      setInvoiceMap(map);
      setAllOrders(orders);
    } catch (error: any) {
      message.error("Lỗi khi tải dữ liệu thống kê: " + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  // General Stats Effect
  useEffect(() => {
    if (initialLoading) return;
    
    setGeneralLoading(true);
    const timer = setTimeout(() => {
      const now = selectedDate;
      let startDate = now;
      let endDate = now;
      let dateFormat = "DD/MM";

      const dateMap: Record<string, number> = {};

      if (timeRange === "TODAY") {
        startDate = now.startOf("day");
        endDate = now.endOf("day");
        dateFormat = "HH:00";
        for (let i = 0; i <= now.hour(); i++) {
          dateMap[now.hour(i).format(dateFormat)] = 0;
        }
      } else if (timeRange === "WEEK") {
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
      } else if (timeRange === "CUSTOM" && customDateRange[0] && customDateRange[1]) {
        startDate = customDateRange[0].startOf("day");
        endDate = customDateRange[1].endOf("day");
        
        const diffDays = endDate.diff(startDate, "day");
        if (diffDays > 60) {
          dateFormat = "MM/YYYY";
          let current = startDate.clone().startOf("month");
          while (current.isBefore(endDate) || current.isSame(endDate, "month")) {
            dateMap[current.format(dateFormat)] = 0;
            current = current.add(1, "month");
          }
        } else {
          dateFormat = "DD/MM";
          let current = startDate.clone().startOf("day");
          while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
            dateMap[current.format(dateFormat)] = 0;
            current = current.add(1, "day");
          }
        }
      }

      const validOrders = allOrders.filter((ord) => {
        const d = dayjs(ord.closedAt || ord.openedAt);
        return d.valueOf() >= startDate.valueOf() && d.valueOf() <= endDate.valueOf();
      });

      let itemsSold = 0;
      let revenue = 0;

      validOrders.forEach((ord) => {
        const inv = invoiceMap.get(ord.id);
        const finalTotal = inv ? inv.totalAmount : (ord.subtotal * 1.10);

        revenue += finalTotal;
        const dateKey = dayjs(inv ? inv.createdAt : (ord.closedAt || ord.openedAt)).format(dateFormat);
        
        if (dateMap[dateKey] !== undefined) {
          dateMap[dateKey] += finalTotal;
        } else {
          dateMap[dateKey] = finalTotal;
        }

        if (ord.items && Array.isArray(ord.items)) {
          ord.items.forEach((item: any) => {
            if (item.status !== "CANCELLED") {
              itemsSold += item.quantity;
            }
          });
        }
      });

      const formattedChartData = Object.keys(dateMap).map((key) => ({
        date: key,
        revenue: dateMap[key],
      }));

      setTotalRevenue(revenue);
      setTotalOrders(validOrders.length);
      setTotalItemsSold(itemsSold);
      setChartData(formattedChartData);
      setGeneralLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [timeRange, selectedDate, customDateRange, allOrders, invoiceMap, initialLoading]);

  // Top Items Effect
  useEffect(() => {
    if (initialLoading) return;

    setTopItemsLoading(true);
    const timer = setTimeout(() => {
      const topNow = topItemsSelectedDate;
      let topStartDate = topNow;
      let topEndDate = topNow;

      if (topItemsTimeRange === "TODAY") {
        topStartDate = topNow.startOf("day");
        topEndDate = topNow.endOf("day");
      } else if (topItemsTimeRange === "WEEK") {
        topStartDate = topNow.subtract(6, "day").startOf("day");
        topEndDate = topNow.endOf("day");
      } else if (topItemsTimeRange === "MONTH") {
        topStartDate = topNow.startOf("month");
        topEndDate = topNow.endOf("month");
      } else if (topItemsTimeRange === "YEAR") {
        topStartDate = topNow.startOf("year");
        topEndDate = topNow.endOf("year");
      } else if (topItemsTimeRange === "CUSTOM" && topItemsCustomDateRange[0] && topItemsCustomDateRange[1]) {
        topStartDate = topItemsCustomDateRange[0].startOf("day");
        topEndDate = topItemsCustomDateRange[1].endOf("day");
      }

      const validOrdersForTop = allOrders.filter((ord) => {
        const d = dayjs(ord.closedAt || ord.openedAt);
        return d.valueOf() >= topStartDate.valueOf() && d.valueOf() <= topEndDate.valueOf();
      });

      const itemCounts: Record<string, number> = {};
      const itemRevenues: Record<string, number> = {};

      validOrdersForTop.forEach((ord) => {
        if (ord.items && Array.isArray(ord.items)) {
          ord.items.forEach((item: any) => {
            if (item.status !== "CANCELLED") {
              itemCounts[item.itemName] = (itemCounts[item.itemName] || 0) + item.quantity;
              const itemTotal = item.totalPrice || (item.unitPrice * item.quantity) || 0;
              itemRevenues[item.itemName] = (itemRevenues[item.itemName] || 0) + itemTotal;
            }
          });
        }
      });

      const sortedTopItems = Object.keys(itemRevenues)
        .map((name) => ({ name, quantity: itemCounts[name], revenue: itemRevenues[name] }))
        .sort((a, b) => topItemsSortBy === "REVENUE" ? b.revenue - a.revenue : b.quantity - a.quantity)
        .slice(0, 5)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      setTopItems(sortedTopItems);
      setTopItemsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [topItemsTimeRange, topItemsSelectedDate, topItemsCustomDateRange, topItemsSortBy, allOrders, initialLoading]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const getTimeLabel = () => {
    if (timeRange === "TODAY") return "Hôm nay, " + selectedDate.format("DD/MM/YYYY");
    if (timeRange === "WEEK") return "7 ngày tính từ " + selectedDate.format("DD/MM");
    if (timeRange === "MONTH") return "Tháng " + selectedDate.format("MM/YYYY");
    if (timeRange === "CUSTOM" && customDateRange[0] && customDateRange[1]) {
      return `${customDateRange[0].format("DD/MM/YYYY")} - ${customDateRange[1].format("DD/MM/YYYY")}`;
    }
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

      {initialLoading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <Spin spinning={generalLoading}>
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
          </Spin>

          {/* Charts & Tables */}
          <div className="flex flex-col gap-5">
            {/* Chart Area */}
            <Spin spinning={generalLoading}>
            <Card
              className="rounded-xl border-zinc-200 shadow-sm w-full"
              title={
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-zinc-800">Biểu đồ Doanh thu</span>
                  <div className="flex gap-2">
                    {timeRange === "CUSTOM" ? (
                      <RangePicker
                        value={customDateRange as any}
                        onChange={(dates) => {
                          if (dates) {
                            setCustomDateRange([dates[0], dates[1]]);
                          } else {
                            setCustomDateRange([null, null]);
                          }
                        }}
                        format="DD/MM/YYYY"
                        allowClear={false}
                      />
                    ) : (
                      <DatePicker
                        value={selectedDate}
                        onChange={(date) => date && setSelectedDate(date)}
                        picker={timeRange === "YEAR" ? "year" : timeRange === "MONTH" ? "month" : "date"}
                        format={timeRange === "YEAR" ? "YYYY" : timeRange === "MONTH" ? "MM/YYYY" : "DD/MM/YYYY"}
                        allowClear={false}
                      />
                    )}
                    <Select
                      value={timeRange}
                      onChange={(v) => setTimeRange(v)}
                      className="w-40 font-normal"
                      options={[
                        { value: "TODAY", label: "Hôm nay" },
                        { value: "WEEK", label: "Theo tuần" },
                        { value: "MONTH", label: "Theo tháng" },
                        { value: "YEAR", label: "Theo năm" },
                        { value: "CUSTOM", label: "Tùy chỉnh" },
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
            </Spin>

            {/* Top Items Table */}
            <Card
              className="rounded-xl border-zinc-200 shadow-sm w-full"
              title={
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                  <span className="font-bold text-zinc-800">Top Món Bán Chạy Nhất</span>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={topItemsSortBy}
                      onChange={(v) => setTopItemsSortBy(v)}
                      className="w-[140px] font-normal"
                      options={[
                        { value: "REVENUE", label: "Theo doanh thu" },
                        { value: "QUANTITY", label: "Theo lượt bán" },
                      ]}
                    />
                    {topItemsTimeRange === "CUSTOM" ? (
                      <RangePicker
                        value={topItemsCustomDateRange as any}
                        onChange={(dates) => {
                          if (dates) {
                            setTopItemsCustomDateRange([dates[0], dates[1]]);
                          } else {
                            setTopItemsCustomDateRange([null, null]);
                          }
                        }}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        className="w-[240px]"
                      />
                    ) : (
                      <DatePicker
                        value={topItemsSelectedDate}
                        onChange={(date) => date && setTopItemsSelectedDate(date)}
                        picker={topItemsTimeRange === "YEAR" ? "year" : topItemsTimeRange === "MONTH" ? "month" : "date"}
                        format={topItemsTimeRange === "YEAR" ? "YYYY" : topItemsTimeRange === "MONTH" ? "MM/YYYY" : "DD/MM/YYYY"}
                        allowClear={false}
                        className="w-[120px]"
                      />
                    )}
                    <Select
                      value={topItemsTimeRange}
                      onChange={(v) => setTopItemsTimeRange(v)}
                      className="w-[110px] font-normal"
                      options={[
                        { value: "TODAY", label: "Hôm nay" },
                        { value: "WEEK", label: "Theo tuần" },
                        { value: "MONTH", label: "Theo tháng" },
                        { value: "YEAR", label: "Theo năm" },
                        { value: "CUSTOM", label: "Tùy chỉnh" },
                      ]}
                    />
                  </div>
                </div>
              }
              styles={{ body: { padding: 0 } }}
            >
              <Table
                loading={topItemsLoading}
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mx-auto ${rank === 1 ? 'bg-amber-100 text-amber-600' :
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
                  },
                  {
                    title: 'Doanh thu',
                    dataIndex: 'revenue',
                    key: 'revenue',
                    align: 'right',
                    render: (val) => <span className="font-bold text-emerald-600">{formatPrice(val)}</span>
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
