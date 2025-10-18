"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplet, Users, Heart, TrendingUp } from "lucide-react"
import { JSX } from "react"

const donationData = [
  { month: "Jan", donations: 240, donors: 120 },
  { month: "Feb", donations: 320, donors: 150 },
  { month: "Mar", donations: 280, donors: 140 },
  { month: "Apr", donations: 390, donors: 180 },
  { month: "May", donations: 450, donors: 210 },
  { month: "Jun", donations: 520, donors: 240 },
]

const bloodTypeData = [
  { name: "O+", value: 35, color: "var(--color-chart-1)" },
  { name: "A+", value: 28, color: "var(--color-chart-2)" },
  { name: "B+", value: 22, color: "var(--color-chart-3)" },
  { name: "AB+", value: 15, color: "var(--color-chart-4)" },
]

const stats = [
  {
    title: "Total Donations",
    value: "2,210",
    change: "+12.5%",
    icon: Droplet,
    color: "text-primary",
  },
  {
    title: "Active Donors",
    value: "1,240",
    change: "+8.2%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Blood Units",
    value: "3,850",
    change: "+15.3%",
    icon: Heart,
    color: "text-red-600",
  },
  {
    title: "Growth Rate",
    value: "23.5%",
    change: "+4.1%",
    icon: TrendingUp,
    color: "text-green-600",
  },
]

const Dashboard =():JSX.Element => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome back! Here's your blood donation overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-green-600">{stat.change} from last month</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donations Chart */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Donation Trends</CardTitle>
            <CardDescription>Monthly donations and donor count over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={donationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: `1px solid var(--color-border)`,
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="donations"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-primary)" }}
                />
                <Line
                  type="monotone"
                  dataKey="donors"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-chart-2)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Blood Type Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Blood Type Distribution</CardTitle>
            <CardDescription>Current inventory by blood type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bloodTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bloodTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Donations</CardTitle>
          <CardDescription>Latest donation records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { donor: "John Smith", type: "O+", date: "2 hours ago", status: "Completed" },
              { donor: "Sarah Johnson", type: "A+", date: "4 hours ago", status: "Completed" },
              { donor: "Michael Brown", type: "B+", date: "6 hours ago", status: "Pending" },
              { donor: "Emily Davis", type: "AB+", date: "1 day ago", status: "Completed" },
            ].map((record, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{record.donor}</p>
                  <p className="text-sm text-muted-foreground">Blood Type: {record.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{record.date}</p>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      record.status === "Completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default Dashboard