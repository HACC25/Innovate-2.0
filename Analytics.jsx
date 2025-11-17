
import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Clock, Target, Users, Briefcase, Award, AlertCircle, CheckCircle2, XCircle, Brain, Download, Calendar, Filter, DollarSign, Percent, Zap } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ComposedChart } from "recharts";
import { differenceInDays, differenceInHours, format, subDays, startOfWeek, endOfWeek, startOfMonth, eachMonthOfInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ModelImprovementDashboard from "@/components/ai/ModelImprovementDashboard";
import { Badge } from "@/components/ui/badge";
import DashboardWidget from "@/components/analytics/DashboardWidget";
import { motion, AnimatePresence } from "framer-motion";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [selectedView, setSelectedView] = useState("overview");

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.Application.list(),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: feedbackData = [] } = useQuery({
    queryKey: ['ai-feedback'],
    queryFn: () => base44.entities.AIFeedback.list(),
    initialData: [],
  });

  const { data: candidateSources = [] } = useQuery({
    queryKey: ['candidate-sources'],
    queryFn: () => base44.entities.CandidateSource.list(),
    initialData: [],
  });

  const filteredApps = useMemo(() => {
    const cutoffDate = subDays(new Date(), parseInt(timeRange));
    return applications.filter(app => new Date(app.submitted_date) >= cutoffDate);
  }, [applications, timeRange]);

  // Core Statistics
  const stats = useMemo(() => {
    const total = filteredApps.length;
    const processed = filteredApps.filter(a => a.status !== 'pending').length;
    const qualified = filteredApps.filter(a => a.ai_label === "Likely Qualified").length;
    const needsReview = filteredApps.filter(a => a.ai_label === "Needs Review").length;
    const notQualified = filteredApps.filter(a => a.ai_label === "Likely Not Qualified").length;

    const processingTimes = filteredApps
      .filter(app => app.reviewed_date && app.submitted_date)
      .map(app => differenceInHours(new Date(app.reviewed_date), new Date(app.submitted_date)));
    
    const avgProcessingTime = processingTimes.length > 0 
      ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(1)
      : 0;

    const reviewedApps = filteredApps.filter(a => a.reviewed_by);
    const aiAgreement = reviewedApps.filter(app => {
      const aiLabel = app.ai_label;
      const humanLabel = app.status === 'qualified' ? 'Likely Qualified' : 
                         app.status === 'not_qualified' ? 'Likely Not Qualified' : 
                         'Needs Review';
      return aiLabel === humanLabel;
    }).length;
    
    const aiAccuracy = reviewedApps.length > 0 ? ((aiAgreement / reviewedApps.length) * 100).toFixed(1) : 0;
    const falsePositives = reviewedApps.filter(a => a.ai_label === 'Likely Qualified' && a.status === 'not_qualified').length;
    const falseNegatives = reviewedApps.filter(a => a.ai_label === 'Likely Not Qualified' && a.status === 'qualified').length;

    // Department stats
    const byDepartment = {};
    filteredApps.forEach(app => {
      const dept = jobs.find(j => j.job_class === app.job_class)?.department || 'Unknown';
      if (!byDepartment[dept]) byDepartment[dept] = { total: 0, qualified: 0, avgTime: [] };
      byDepartment[dept].total++;
      if (app.status === 'qualified') byDepartment[dept].qualified++;
      if (app.reviewed_date && app.submitted_date) {
        byDepartment[dept].avgTime.push(differenceInHours(new Date(app.reviewed_date), new Date(app.submitted_date)));
      }
    });

    return {
      total,
      processed,
      remaining: total - processed,
      qualified,
      needsReview,
      notQualified,
      avgProcessingTime,
      aiAccuracy,
      falsePositives,
      falseNegatives,
      reviewedApps: reviewedApps.length,
      qualificationRate: total > 0 ? ((qualified / total) * 100).toFixed(1) : 0,
      byDepartment
    };
  }, [filteredApps, jobs]);

  // Time-to-Hire Analysis
  const timeToHireData = useMemo(() => {
    const monthlyData = {};
    filteredApps.filter(a => a.status === 'qualified' && a.reviewed_date).forEach(app => {
      const month = format(new Date(app.submitted_date), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, hires: 0, totalTime: 0, avgTime: 0 };
      }
      monthlyData[month].hires++;
      const hours = differenceInHours(new Date(app.reviewed_date), new Date(app.submitted_date));
      monthlyData[month].totalTime += hours;
    });

    return Object.values(monthlyData).map(data => ({
      ...data,
      avgTime: data.hires > 0 ? (data.totalTime / data.hires).toFixed(1) : 0
    })).slice(-12);
  }, [filteredApps]);

  // Department Performance
  const departmentStats = useMemo(() => {
    return Object.entries(stats.byDepartment).map(([dept, data]) => ({
      department: dept.substring(0, 25),
      applications: data.total,
      offerAcceptance: data.total > 0 ? ((data.qualified / data.total) * 100).toFixed(0) : 0,
      avgTimeToHire: data.avgTime.length > 0 ? (data.avgTime.reduce((a,b) => a+b, 0) / data.avgTime.length).toFixed(1) : 0
    })).sort((a, b) => b.applications - a.applications).slice(0, 8);
  }, [stats.byDepartment]);

  // AI Performance Over Time
  const aiPerformanceOverTime = useMemo(() => {
    const weeklyData = {};
    filteredApps.filter(a => a.reviewed_by).forEach(app => {
      const week = format(startOfWeek(new Date(app.reviewed_date || app.submitted_date)), 'MMM dd');
      if (!weeklyData[week]) {
        weeklyData[week] = { week, correct: 0, total: 0, falsePos: 0, falseNeg: 0 };
      }
      weeklyData[week].total++;
      
      const aiLabel = app.ai_label;
      const humanLabel = app.status === 'qualified' ? 'Likely Qualified' : 
                         app.status === 'not_qualified' ? 'Likely Not Qualified' : 'Needs Review';
      
      if (aiLabel === humanLabel) {
        weeklyData[week].correct++;
      } else {
        if (aiLabel === 'Likely Qualified' && humanLabel === 'Likely Not Qualified') {
          weeklyData[week].falsePos++;
        } else if (aiLabel === 'Likely Not Qualified' && humanLabel === 'Likely Qualified') {
          weeklyData[week].falseNeg++;
        }
      }
    });

    return Object.values(weeklyData).map(data => ({
      ...data,
      accuracy: data.total > 0 ? ((data.correct / data.total) * 100).toFixed(1) : 0
    })).slice(-12);
  }, [filteredApps]);

  // Candidate Source Effectiveness
  const sourceEffectiveness = useMemo(() => {
    const sourceData = {};
    candidateSources.forEach(source => {
      if (!sourceData[source.source_channel]) {
        sourceData[source.source_channel] = {
          channel: source.source_channel,
          applications: 0,
          conversions: 0,
          totalCost: 0
        };
      }
      sourceData[source.source_channel].applications++;
      if (source.converted_to_hire) sourceData[source.source_channel].conversions++;
      sourceData[source.source_channel].totalCost += source.cost_per_applicant || 0;
    });

    return Object.values(sourceData).map(data => ({
      ...data,
      conversionRate: data.applications > 0 ? ((data.conversions / data.applications) * 100).toFixed(1) : 0,
      costPerHire: data.conversions > 0 ? (data.totalCost / data.conversions).toFixed(0) : 0
    })).sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate));
  }, [candidateSources]);

  // Bias Detection Analysis
  const biasAnalysis = useMemo(() => {
    const byExperience = {
      '0-2': { total: 0, qualified: 0 },
      '3-5': { total: 0, qualified: 0 },
      '6-10': { total: 0, qualified: 0 },
      '10+': { total: 0, qualified: 0 }
    };

    const byEducation = {};
    const byJob = {};

    filteredApps.forEach(app => {
      const exp = app.total_experience_years || 0;
      let expBucket = '0-2';
      if (exp >= 10) expBucket = '10+';
      else if (exp >= 6) expBucket = '6-10';
      else if (exp >= 3) expBucket = '3-5';
      
      byExperience[expBucket].total++;
      if (app.ai_label === 'Likely Qualified') byExperience[expBucket].qualified++;

      if (app.education && app.education.length > 0) {
        const eduLevel = app.education[0].degree_level || 'Not Specified';
        if (!byEducation[eduLevel]) byEducation[eduLevel] = { total: 0, qualified: 0 };
        byEducation[eduLevel].total++;
        if (app.ai_label === 'Likely Qualified') byEducation[eduLevel].qualified++;
      }

      if (!byJob[app.job_class]) byJob[app.job_class] = { total: 0, qualified: 0 };
      byJob[app.job_class].total++;
      if (app.ai_label === 'Likely Qualified') byJob[app.job_class].qualified++;
    });

    const expData = Object.entries(byExperience).map(([range, data]) => ({
      range,
      rate: data.total > 0 ? ((data.qualified / data.total) * 100).toFixed(1) : 0,
      count: data.total
    }));

    const eduData = Object.entries(byEducation).map(([level, data]) => ({
      level,
      rate: data.total > 0 ? ((data.qualified / data.total) * 100).toFixed(1) : 0,
      count: data.total
    }));

    const jobData = Object.entries(byJob).map(([job, data]) => ({
      job: job.substring(0, 30),
      rate: data.total > 0 ? ((data.qualified / data.total) * 100).toFixed(1) : 0,
      count: data.total
    }));

    const expRates = expData.map(d => parseFloat(d.rate));
    const eduRates = eduData.map(d => parseFloat(d.rate));

    const alerts = [];
    if (Math.max(...expRates) - Math.min(...expRates) > 20) {
      alerts.push({
        type: 'warning',
        message: `Experience bias: ${(Math.max(...expRates) - Math.min(...expRates)).toFixed(0)}% approval difference`
      });
    }
    if (eduRates.length > 1 && Math.max(...eduRates) - Math.min(...eduRates) > 20) {
      alerts.push({
        type: 'warning',
        message: `Education bias: ${(Math.max(...eduRates) - Math.min(...eduRates)).toFixed(0)}% approval difference`
      });
    }

    return { byExperience: expData, byEducation: eduData, byJob: jobData, alerts };
  }, [filteredApps]);

  // Hiring Trends Over Time
  const hiringTrends = useMemo(() => {
    const grouped = {};
    filteredApps.forEach(app => {
      const week = format(startOfWeek(new Date(app.submitted_date)), 'MMM dd');
      if (!grouped[week]) {
        grouped[week] = { week, applications: 0, qualified: 0, rejected: 0 };
      }
      grouped[week].applications++;
      if (app.ai_label === 'Likely Qualified') grouped[week].qualified++;
      if (app.ai_label === 'Likely Not Qualified') grouped[week].rejected++;
    });
    return Object.values(grouped).slice(-12);
  }, [filteredApps]);

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      stats,
      hiringTrends,
      biasAnalysis,
      aiPerformanceOverTime,
      departmentStats,
      sourceEffectiveness
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="clay-card p-4 md:p-6 mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">Analytics & Insights</h1>
            <p className="text-purple-600 mt-1">AI performance, hiring trends & source effectiveness</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="clay-input w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} className="clay-button text-slate-700">
              <Download className="w-4 h-4 mr-2 text-slate-700" />
              Export
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {['overview', 'hiring-trends', 'ai-performance', 'source-analysis', 'bias-detection', 'model-improvement'].map(view => (
            <Button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`clay-button text-sm whitespace-nowrap text-slate-700 ${
                selectedView === view 
                  ? 'bg-gradient-to-r from-indigo-200 to-purple-200 border-2 border-indigo-400' 
                  : ''
              }`}
            >
              {view.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Key Metrics Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { title: "Total Applications", value: stats.total, subtitle: `Processed: ${stats.processed}`, icon: Users, colorScheme: "purple" },
                { title: "AI Accuracy", value: `${stats.aiAccuracy}%`, subtitle: `Based on ${stats.reviewedApps} reviewed`, icon: Target, trend: "up", colorScheme: "green" },
                { title: "Avg Processing Time", value: `${stats.avgProcessingTime}h`, subtitle: "AI-assisted screening", icon: Clock, trend: "down", colorScheme: "blue" },
                { title: "Qualification Rate", value: `${stats.qualificationRate}%`, subtitle: `${stats.qualified} qualified`, icon: Award, trend: "up", colorScheme: "amber" }
              ].map((widget, idx) => (
                <motion.div
                  key={widget.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <DashboardWidget {...widget} />
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="clay-card p-6"
              >
                <h3 className="font-semibold text-purple-900 mb-4">Application Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hiringTrends}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="applications" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorApps)" name="Applications" />
                    <Area type="monotone" dataKey="qualified" stroke="#10b981" fill="#86efac" name="Qualified" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="clay-card p-6"
              >
                <h3 className="font-semibold text-purple-900 mb-4">AI Accuracy Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aiPerformanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Quick Stats */}
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                { content: departmentStats.length > 0 && <><p className="text-2xl font-bold text-green-700">{departmentStats[0].department}</p><p className="text-sm text-green-600 mt-2">{departmentStats[0].applications} applications • {departmentStats[0].offerAcceptance}% acceptance</p></>, title: "Top Performing Department", icon: CheckCircle2, bg: "from-green-50 to-emerald-50", color: "green" },
                { content: <><p className="text-2xl font-bold text-indigo-700">{(100 - parseFloat(stats.aiAccuracy)).toFixed(1)}%</p><p className="text-sm text-indigo-600 mt-2">{stats.falsePositives} false positives • {stats.falseNegatives} false negatives</p></>, title: "AI Error Rate", icon: Brain, bg: "from-indigo-50 to-purple-50", color: "indigo" },
                { content: <><p className="text-2xl font-bold text-amber-700">{(((48 - parseFloat(stats.avgProcessingTime)) / 48) * 100).toFixed(0)}%</p><p className="text-sm text-amber-600 mt-2">Time saved vs manual review</p></>, title: "Efficiency Gain", icon: Zap, bg: "from-amber-50 to-orange-50", color: "amber" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className={`clay-card p-6 bg-gradient-to-br ${stat.bg}`}
                >
                  <h3 className={`font-semibold text-${stat.color}-900 mb-4 flex items-center gap-2`}>
                    <stat.icon className="w-5 h-5" />
                    {stat.title}
                  </h3>
                  {stat.content}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Hiring Trends Tab */}
        {selectedView === 'hiring-trends' && (
          <motion.div
            key="hiring-trends"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="clay-card p-6 mb-6">
              <h3 className="font-semibold text-purple-900 mb-4">Time-to-Hire by Month</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={timeToHireData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" label={{ value: 'Hires', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Hours', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hires" fill="#8b5cf6" name="Number of Hires" radius={[8, 8, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Avg Time (hours)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="clay-card p-6 mb-6">
              <h3 className="font-semibold text-purple-900 mb-4">Department Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-purple-100">
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Department</th>
                      <th className="text-center py-3 px-4 text-purple-700 font-semibold">Applications</th>
                      <th className="text-center py-3 px-4 text-purple-700 font-semibold">Acceptance Rate</th>
                      <th className="text-center py-3 px-4 text-purple-700 font-semibold">Avg Time to Hire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.map((dept, idx) => (
                      <tr key={idx} className="border-b border-purple-50 hover:bg-purple-50/50">
                        <td className="py-3 px-4 font-medium text-purple-900">{dept.department}</td>
                        <td className="py-3 px-4 text-center text-slate-700">{dept.applications}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold ${
                            dept.offerAcceptance >= 70 ? 'text-green-600' : 
                            dept.offerAcceptance >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {dept.offerAcceptance}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700">{dept.avgTimeToHire}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4">Application Volume Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hiringTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} name="Total Applications" />
                    <Line type="monotone" dataKey="qualified" stroke="#10b981" strokeWidth={2} name="Qualified" />
                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Not Qualified" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4">Key Insights</h3>
                <div className="space-y-3">
                  <div className="clay-input p-4 bg-indigo-50">
                    <p className="text-sm text-indigo-900">
                      <strong>Trend:</strong> Applications increased {((stats.total / (stats.total - stats.processed + 1)) * 100 - 100).toFixed(0)}% vs previous period
                    </p>
                  </div>
                  <div className="clay-input p-4 bg-green-50">
                    <p className="text-sm text-green-900">
                      <strong>Quality:</strong> {stats.qualificationRate}% of candidates meet minimum qualifications
                    </p>
                  </div>
                  <div className="clay-input p-4 bg-purple-50">
                    <p className="text-sm text-purple-900">
                      <strong>Efficiency:</strong> AI reduced manual review time by ~{(((48 - parseFloat(stats.avgProcessingTime)) / 48) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Performance Tab */}
        {selectedView === 'ai-performance' && (
          <motion.div
            key="ai-performance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="clay-card p-6 mb-6 bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-indigo-600" />
                <h2 className="font-bold text-indigo-900 text-xl">AI Model Performance</h2>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="clay-input p-4 text-center bg-white">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.aiAccuracy}%</p>
                  <p className="text-xs text-slate-600 mt-1">Overall Accuracy</p>
                </div>
                <div className="clay-input p-4 text-center bg-white">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-600">{stats.falsePositives}</p>
                  <p className="text-xs text-slate-600 mt-1">False Positives</p>
                </div>
                <div className="clay-input p-4 text-center bg-white">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{stats.falseNegatives}</p>
                  <p className="text-xs text-slate-600 mt-1">False Negatives</p>
                </div>
                <div className="clay-input p-4 text-center bg-white">
                  <Target className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-indigo-600">
                    {stats.reviewedApps > 0 ? (((stats.reviewedApps - stats.falsePositives - stats.falseNegatives) / stats.reviewedApps) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Precision</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4">AI Accuracy Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aiPerformanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4">Error Distribution Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={aiPerformanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="falsePos" stackId="1" stroke="#f59e0b" fill="#fbbf24" name="False Positives" />
                    <Area type="monotone" dataKey="falseNeg" stackId="1" stroke="#ef4444" fill="#fca5a5" name="False Negatives" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Source Analysis Tab */}
        {selectedView === 'source-analysis' && (
          <motion.div
            key="source-analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="clay-card p-6 mb-6">
              <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Candidate Source Effectiveness
              </h3>
              {sourceEffectiveness.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-purple-600">No source data available yet.</p>
                  <p className="text-xs text-slate-500 mt-2">Add candidate sources to track recruitment channel effectiveness</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={sourceEffectiveness} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="channel" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conversionRate" fill="#10b981" name="Conversion Rate %" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4">Source Distribution</h3>
                {sourceEffectiveness.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceEffectiveness}
                        dataKey="applications"
                        nameKey="channel"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => entry.channel}
                      >
                        {sourceEffectiveness.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </div>

              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Cost Per Hire by Source
                </h3>
                {sourceEffectiveness.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sourceEffectiveness}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="channel" angle={-20} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="costPerHire" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Cost Per Hire ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bias Detection Tab */}
        {selectedView === 'bias-detection' && (
          <motion.div
            key="bias-detection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {biasAnalysis.alerts.length > 0 && (
              <div className="clay-card p-6 mb-6 bg-gradient-to-r from-amber-50 to-red-50 border-2 border-amber-300">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  <h3 className="font-bold text-amber-900">Bias Alerts Detected</h3>
                </div>
                <div className="space-y-2">
                  {biasAnalysis.alerts.map((alert, idx) => (
                    <div key={idx} className="clay-input p-4 bg-white">
                      <p className="text-sm text-amber-900">⚠️ {alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4">Approval Rate by Experience Level</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={biasAnalysis.byExperience}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="range" label={{ value: 'Years of Experience', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 100]} label={{ value: 'Approval %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Approval Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="clay-card p-6">
                <h3 className="font-semibold text-purple-900 mb-4">Approval Rate by Education Level</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={biasAnalysis.byEducation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="level" angle={-20} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Approval Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="clay-card p-6">
              <h3 className="font-semibold text-purple-900 mb-4">Fairness Metrics Dashboard</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="clay-input p-4 bg-blue-50">
                  <p className="text-xs text-slate-600 mb-2">Experience Disparity</p>
                  <p className={`text-2xl font-bold ${
                    (Math.max(...biasAnalysis.byExperience.map(d => parseFloat(d.rate))) - 
                     Math.min(...biasAnalysis.byExperience.map(d => parseFloat(d.rate)))) > 20 
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {(Math.max(...biasAnalysis.byExperience.map(d => parseFloat(d.rate))) - 
                      Math.min(...biasAnalysis.byExperience.map(d => parseFloat(d.rate)))).toFixed(0)}%
                  </p>
                </div>
                <div className="clay-input p-4 bg-purple-50">
                  <p className="text-xs text-slate-600 mb-2">Education Disparity</p>
                  <p className={`text-2xl font-bold ${
                    biasAnalysis.byEducation.length > 1 && 
                    (Math.max(...biasAnalysis.byEducation.map(d => parseFloat(d.rate))) - 
                     Math.min(...biasAnalysis.byEducation.map(d => parseFloat(d.rate)))) > 20 
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {biasAnalysis.byEducation.length > 1 
                      ? (Math.max(...biasAnalysis.byEducation.map(d => parseFloat(d.rate))) - 
                         Math.min(...biasAnalysis.byEducation.map(d => parseFloat(d.rate)))).toFixed(0)
                      : 0}%
                  </p>
                </div>
                <div className="clay-input p-4 bg-green-50">
                  <p className="text-xs text-slate-600 mb-2">Overall Fairness Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {biasAnalysis.alerts.length === 0 ? 'A+' : biasAnalysis.alerts.length === 1 ? 'B' : 'C'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Model Improvement Tab */}
        {selectedView === 'model-improvement' && (
          <motion.div
            key="model-improvement"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ModelImprovementDashboard applications={filteredApps} feedbackData={feedbackData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
