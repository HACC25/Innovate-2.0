import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Filter, Download, RefreshCw, TrendingUp, X, CheckCircle, XCircle, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Applications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confidenceRange, setConfidenceRange] = useState([0, 100]);
  const [sortBy, setSortBy] = useState("submitted_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedApps, setSelectedApps] = useState(new Set());

  const { data: applications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.Application.list('-submitted_date'),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      const user = await base44.auth.me();
      await Promise.all(ids.map(id => 
        base44.entities.Application.update(id, {
          ...data,
          reviewed_by: user.email,
          reviewed_date: new Date().toISOString(),
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      setSelectedApps(new Set());
    },
    onError: (error) => {
      alert(`Error updating applications: ${error.message}`);
    }
  });

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = app.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLabel = labelFilter === "all" || app.ai_label === labelFilter;
      const matchesJob = jobFilter === "all" || app.job_class === jobFilter;
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesConfidence = app.confidence >= confidenceRange[0] && app.confidence <= confidenceRange[1];
      return matchesSearch && matchesLabel && matchesJob && matchesStatus && matchesConfidence;
    }).sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'submitted_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [applications, searchTerm, labelFilter, jobFilter, statusFilter, confidenceRange, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: applications.length,
    qualified: applications.filter(a => a.ai_label === "Likely Qualified").length,
    needsReview: applications.filter(a => a.ai_label === "Needs Review").length,
    notQualified: applications.filter(a => a.ai_label === "Likely Not Qualified").length,
  }), [applications]);

  const hasActiveFilters = searchTerm || labelFilter !== "all" || jobFilter !== "all" || 
                          statusFilter !== "all" || confidenceRange[0] !== 0 || confidenceRange[1] !== 100;

  const clearFilters = () => {
    setSearchTerm("");
    setLabelFilter("all");
    setJobFilter("all");
    setStatusFilter("all");
    setConfidenceRange([0, 100]);
    setSortBy("submitted_date");
    setSortOrder("desc");
  };

  const toggleSelectAll = () => {
    if (selectedApps.size === filteredApplications.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const toggleSelect = (appId) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const handleBulkAction = (status, label) => {
    if (selectedApps.size === 0) return;
    if (!confirm(`Confirm ${status === 'qualified' ? 'approve' : 'reject'} ${selectedApps.size} application(s)?`)) return;
    bulkUpdateMutation.mutate({ ids: Array.from(selectedApps), data: { status, ai_label: label } });
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Job', 'AI Label', 'Confidence', 'Date', 'Status'];
    const rows = filteredApplications.map(app => [
      app.applicant_name,
      app.job_class,
      app.ai_label,
      app.confidence,
      format(new Date(app.submitted_date), 'yyyy-MM-dd'),
      app.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getLabelColor = (label) => {
    switch (label) {
      case "Likely Qualified": return "bg-gradient-to-r from-green-200 to-green-300 text-green-800";
      case "Needs Review": return "bg-gradient-to-r from-yellow-200 to-amber-300 text-amber-800";
      case "Likely Not Qualified": return "bg-gradient-to-r from-red-200 to-pink-300 text-red-800";
      default: return "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="clay-card p-12 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Applications</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="clay-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          { 
            title: "Total Applications", 
            value: stats.total, 
            subtitle: "In queue for review", 
            emoji: "📊", 
            iconComponent: <TrendingUp className="w-5 h-5 text-purple-400" />,
            titleClass: "text-purple-600",
            valueClass: "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent",
            subtitleClass: "text-purple-500",
            bgClass: "from-purple-200 to-blue-200"
          },
          { 
            title: "Likely Qualified", 
            value: stats.qualified, 
            subtitle: stats.total > 0 ? `${((stats.qualified / stats.total) * 100).toFixed(0)}% of total` : 'No applications',
            emoji: "✅", 
            iconComponent: <TrendingUp className="w-5 h-5 text-green-500" />,
            titleClass: "text-green-600",
            valueClass: "text-green-600",
            subtitleClass: "text-green-500",
            bgClass: "from-green-200 to-emerald-200"
          },
          { 
            title: "Needs Review", 
            value: stats.needsReview, 
            subtitle: "Requires attention", 
            emoji: "⚠️", 
            iconComponent: <div className="w-5 h-5 text-amber-500 flex items-center justify-center">━</div>,
            titleClass: "text-amber-600",
            valueClass: "text-amber-600",
            subtitleClass: "text-amber-500",
            bgClass: "from-amber-200 to-yellow-200"
          },
          { 
            title: "Likely Not Qualified", 
            value: stats.notQualified, 
            subtitle: "Below threshold", 
            emoji: "❌", 
            iconComponent: <div className="w-5 h-5 text-red-400">↘️</div>,
            titleClass: "text-red-600",
            valueClass: "text-red-600",
            subtitleClass: "text-red-500",
            bgClass: "from-red-200 to-pink-200"
          }
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="clay-card p-6 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.bgClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{stat.emoji}</span>
              </div>
              {stat.iconComponent}
            </div>
            <p className={`${stat.titleClass} text-sm font-medium mb-2`}>{stat.title}</p>
            <motion.p 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: idx * 0.1 + 0.3 }}
              className={`text-4xl lg:text-5xl font-bold ${stat.valueClass}`}
            >
              {stat.value}
            </motion.p>
            <p className={`text-xs ${stat.subtitleClass} mt-2`}>{stat.subtitle}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="clay-card p-6 mb-6 bg-gradient-to-br from-purple-50/50 to-blue-50/50"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-purple-900">Filters & Sorting</h2>
            {hasActiveFilters && (
              <Badge className="clay-badge bg-purple-200 text-purple-800">
                Active
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="clay-button text-sm">
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            <Button onClick={() => refetch()} className="clay-button text-sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="clay-button text-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="clay-input pl-10"
            />
          </div>

          <Select value={labelFilter} onValueChange={setLabelFilter}>
            <SelectTrigger className="clay-input">
              <SelectValue placeholder="All AI Labels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AI Labels</SelectItem>
              <SelectItem value="Likely Qualified">Likely Qualified</SelectItem>
              <SelectItem value="Needs Review">Needs Review</SelectItem>
              <SelectItem value="Likely Not Qualified">Likely Not Qualified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="clay-input">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="not_qualified">Not Qualified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="clay-input">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.job_class}>{job.job_class}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="clay-input">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted_date">Date Submitted</SelectItem>
              <SelectItem value="confidence">AI Confidence</SelectItem>
              <SelectItem value="applicant_name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-purple-700 mb-2 block">
              Confidence Range: {confidenceRange[0]}% - {confidenceRange[1]}%
            </label>
            <Slider
              value={confidenceRange}
              onValueChange={setConfidenceRange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="flex items-end">
            <Button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="clay-button w-full">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-100 text-sm text-purple-600">
          <p>
            Showing <span className="font-bold">{filteredApplications.length}</span> of {applications.length}
            {selectedApps.size > 0 && (
              <span className="ml-2 text-indigo-600">
                • <span className="font-bold">{selectedApps.size}</span> selected
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedApps.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="clay-card p-4 mb-6 bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-200"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-indigo-900 font-semibold">
                {selectedApps.size} selected
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={() => handleBulkAction('qualified', 'Likely Qualified')}
                  className="clay-button bg-gradient-to-r from-green-200 to-green-300 text-green-800"
                  disabled={bulkUpdateMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleBulkAction('not_qualified', 'Likely Not Qualified')}
                  className="clay-button bg-gradient-to-r from-red-200 to-pink-300 text-red-800"
                  disabled={bulkUpdateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => setSelectedApps(new Set())} className="clay-button">
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="clay-card p-4 md:p-6"
      >
        <h2 className="text-xl font-bold text-purple-900 mb-4">Applications</h2>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            <p className="text-purple-600 mt-4">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-purple-600">
              {hasActiveFilters 
                ? "No applications match your filters."
                : "No applications yet."}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="clay-button mt-4">
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-purple-100">
                  <th className="text-left py-3 px-4">
                    <Checkbox
                      checked={selectedApps.size === filteredApplications.length && filteredApplications.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-purple-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-purple-700 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-purple-700 font-semibold hidden lg:table-cell">Job</th>
                  <th className="text-left py-3 px-4 text-purple-700 font-semibold">AI Label</th>
                  <th className="text-left py-3 px-4 text-purple-700 font-semibold">Confidence</th>
                  <th className="text-left py-3 px-4 text-purple-700 font-semibold hidden md:table-cell">Date</th>
                  <th className="text-left py-3 px-4 text-purple-700 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredApplications.map((app, idx) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }}
                      className={`border-b border-purple-50 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50 transition-all cursor-pointer group ${
                        selectedApps.has(app.id) ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={selectedApps.has(app.id)}
                          onCheckedChange={() => toggleSelect(app.id)}
                          className="border-purple-300"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-purple-900 group-hover:text-purple-700">
                          {app.applicant_name}
                        </p>
                        {app.email && (
                          <p className="text-xs text-purple-500 mt-1 hidden sm:block">{app.email}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-purple-700 hidden lg:table-cell">
                        {app.job_class}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`clay-badge text-xs ${getLabelColor(app.ai_label)}`}>
                          {app.ai_label}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${getConfidenceColor(app.confidence)}`}>
                            {app.confidence}%
                          </span>
                          <div className="w-12 h-2 bg-purple-100 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full ${
                                app.confidence >= 80 ? 'bg-green-500' : 
                                app.confidence >= 60 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}
                              style={{ width: `${app.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-purple-700 hidden md:table-cell">
                        {format(new Date(app.submitted_date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          onClick={() => navigate(createPageUrl("ApplicationDetail") + `?id=${app.id}`)}
                          className="clay-button bg-gradient-to-r from-purple-200 to-blue-200 text-purple-700 text-sm"
                        >
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}