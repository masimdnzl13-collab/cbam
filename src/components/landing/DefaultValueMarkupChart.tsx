"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DEFAULT_VALUE_MARKUP_BY_YEAR } from "@/lib/config/cbam-config";

const data = [2026, 2027, 2028, 2029, 2030].map((year) => ({
  year: String(year),
  artirim: Math.round(DEFAULT_VALUE_MARKUP_BY_YEAR[year] * 100),
}));

export function DefaultValueMarkupChart() {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333a46" vertical={false} />
          <XAxis dataKey="year" stroke="#9aa3b2" fontSize={12} tickLine={false} axisLine={{ stroke: "#333a46" }} />
          <YAxis
            stroke="#9aa3b2"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `%${v}`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "#1f232b",
              border: "1px solid #333a46",
              borderRadius: 4,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e8eaed" }}
            formatter={(value) => [`%${value}`, "Varsayılan değer artırımı"]}
          />
          <Bar dataKey="artirim" fill="#ff6b35" radius={[2, 2, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
