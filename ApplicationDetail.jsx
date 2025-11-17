
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Check, X, AlertTriangle, Download, Save, Award, Calendar, TrendingUp, Briefcase, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AutomatedEmailSender from "@/components/communication/AutomatedEmailSender";
import MessagingPanel from "@/components/communication/MessagingPanel";
import EnhancedFeedbackPanel from "@/components/ai/EnhancedFeedbackPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function ApplicationDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const appId = urlParams.get('id');

  // New: Immediately check for appId and navigate if missing before any data fetching attempts
  useEffect(() => {
    if (!appId) {
      navigate(createPageUrl("Applications"));
    }
  }, [appId, navigate]);

  const [notes, setNotes] = useState("");
  const [currentDecision, setCurrentDecision] = useState(null);

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', appId],
    queryFn: async () => {
      // If appId is null, useEffect should have already navigated, and 'enabled: !!appId' prevents this from running.
      // This check is mainly for when appId exists but refers to a non-existent application.
      const apps = await base44.entities.Application.list();
      const app = apps.find(a => a.id === appId);
      if (!app) { // Check if the application exists
        navigate(createPageUrl("Applications"));
        return null; // Return null if app is not found
      }
      if (app.reviewer_notes) setNotes(app.reviewer_notes);
      if (app.status) {
        const statusToLabel = {
          'qualified': 'Likely Qualified',
          'not_qualified': 'Likely Not Qualified',
          'needs_review': 'Needs Review'
        };
        setCurrentDecision(statusToLabel[app.status] || app.ai_label);
      }
      return app;
    },
    enabled: !!appId, // Only enable query if appId is present
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Application.update(appId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['application', appId]);
      queryClient.invalidateQueries(['applications']);
      navigate(createPageUrl("Applications"));
    },
  });

  const mqStats = useMemo(() => {
    if (!application?.mq_results) return null;
    const passed = application.mq_results.filter(r => r.status === 'pass').length;
    const failed = application.mq_results.filter(r => r.status === 'fail').length;
    const unclear = application.mq_results.filter(r => r.status === 'unclear').length;
    const total = application.mq_results.length;
    return { passed, failed, unclear, total, passRate: total > 0 ? (passed / total * 100).toFixed(0) : 0 };
  }, [application]);

  // Handle loading state
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto clay-card p-12 text-center"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-purple-600 mt-4">Loading application...</p>
      </motion.div>
    );
  }

  // Handle application not found after loading finishes
  if (!application) {
    // This case is reached if appId was provided, query ran, but no application was found (queryFn returned null)
    // or if the useEffect navigation hasn't completed its redirect yet.
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-7xl mx-auto clay-card p-12 text-center"
      >
        <p className="text-red-600">Application not found.</p>
        <Button onClick={() => navigate(createPageUrl("Applications"))} className="clay-button mt-4">
          Return to Applications
        </Button>
      </motion.div>
    );
  }

  const handleAction = async (newStatus, newLabel) => {
    const user = await base44.auth.me();
    setCurrentDecision(newLabel);
    updateMutation.mutate({
      status: newStatus,
      ai_label: newLabel || application.ai_label,
      reviewer_notes: notes,
      reviewed_by: user.email,
      reviewed_date: new Date().toISOString(),
    });
  };

  const getLabelColor = (label) => {
    switch (label) {
      case "Likely Qualified": return "from-green-200 to-green-300 text-green-800";
      case "Needs Review": return "from-yellow-200 to-amber-300 text-amber-800";
      case "Likely Not Qualified": return "from-red-200 to-pink-300 text-red-800";
      default: return "from-gray-200 to-gray-300 text-gray-800";
    }
  };

  const getProficiencyColor = (proficiency) => {
    switch (proficiency) {
      case "expert": return "from-purple-200 to-purple-300 text-purple-800";
      case "advanced": return "from-blue-200 to-blue-300 text-blue-800";
      case "intermediate": return "from-green-200 to-green-300 text-green-800";
      default: return "from-gray-200 to-gray-300 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="clay-card p-4 md:p-6 mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(createPageUrl("Applications"))} className="clay-button">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-purple-900">{application.applicant_name}</h1>
              <p className="text-purple-600">{application.job_class}</p>
              {application.email && <p className="text-sm text-purple-500 mt-1">{application.email}</p>}
            </div>
          </div>
          <Button onClick={() => window.print()} className="clay-button">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <Badge className={`clay-badge bg-gradient-to-r ${getLabelColor(application.ai_label)} text-lg px-4 py-2`}>
            {application.ai_label}
          </Badge>
          <span className="text-purple-600 text-sm">
            Submitted: {format(new Date(application.submitted_date), 'MMMM d, yyyy')}
          </span>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* AI Analysis Overview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.01 }}
            className="clay-card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-indigo-900">AI Analysis Summary</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center clay-input p-4 bg-white">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {application.confidence}%
                </div>
                <p className="text-xs text-slate-600 mt-1">AI Confidence</p>
              </div>
              {mqStats && (
                <div className="text-center clay-input p-4 bg-white">
                  <div className={`text-3xl font-bold ${
                    mqStats.passRate >= 80 ? 'text-green-600' : 
                    mqStats.passRate >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {mqStats.passRate}%
                  </div>
                  <p className="text-xs text-slate-600 mt-1">MQ Pass Rate</p>
                </div>
              )}
            </div>

            {mqStats && (
              <div className="clay-input p-3 bg-white">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700">{mqStats.passed} Passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-600" />
                    <span className="text-slate-700">{mqStats.failed} Failed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-slate-700">{mqStats.unclear} Unclear</span>
                  </div>
                </div>
              </div>
            )}

            {application.ai_reasoning && (
              <div className="mt-4 clay-input p-4 bg-white">
                <p className="text-sm font-semibold text-indigo-900 mb-2">AI Reasoning:</p>
                <p className="text-sm text-slate-700 leading-relaxed">{application.ai_reasoning}</p>
              </div>
            )}
          </motion.div>

          {/* MQ Detailed Checklist */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="clay-card p-6"
          >
            <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Minimum Qualifications Check
            </h2>
            {application.mq_results && application.mq_results.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {application.mq_results.map((mq, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      whileHover={{ x: 4 }}
                      className={`clay-input p-4 border-l-4 ${
                        mq.status === 'pass' ? 'border-green-500 bg-green-50/50' :
                        mq.status === 'fail' ? 'border-red-500 bg-red-50/50' :
                        'border-amber-500 bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {mq.status === 'pass' ? (
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : mq.status === 'fail' ? (
                          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-semibold text-purple-900">{mq.requirement}</p>
                            <Badge className={`clay-badge text-xs ${
                              mq.status === 'pass' ? 'bg-green-200 text-green-800' :
                              mq.status === 'fail' ? 'bg-red-200 text-red-800' :
                              'bg-amber-200 text-amber-800'
                            }`}>
                              {mq.status.toUpperCase()}
                            </Badge>
                          </div>
                          {mq.evidence && (
                            <div className="bg-white/70 p-3 rounded-lg border border-slate-200">
                              <p className="text-xs font-semibold text-slate-600 mb-1">Evidence:</p>
                              <p className="text-sm text-slate-700 italic">"{mq.evidence}"</p>
                            </div>
                          )}
                          {mq.confidence !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    mq.confidence >= 80 ? 'bg-green-500' :
                                    mq.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${mq.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{mq.confidence}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-purple-600 text-center py-4">No MQ analysis available</p>
            )}
          </motion.div>

          {/* Education, Experience, Skills with stagger */}
          {application.education && application.education.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="clay-card p-6"
            >
              <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Education
              </h2>
              <div className="space-y-3">
                {application.education.map((edu, idx) => (
                  <div key={idx} className="clay-input p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-900">
                          {edu.degree_name || edu.degree_level} {edu.major && `in ${edu.major}`}
                        </h3>
                        <p className="text-purple-700 mt-1">{edu.institution}</p>
                        {edu.graduation_date && (
                          <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {edu.graduation_date}
                          </p>
                        )}
                      </div>
                      <Badge className="clay-badge bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                        {edu.degree_level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {application.experience && application.experience.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="clay-card p-6"
            >
              <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Work Experience
              </h2>
              <div className="space-y-3">
                {application.experience.map((exp, idx) => (
                  <div key={idx} className={`clay-input p-4 ${exp.relevant_to_position ? 'border-2 border-indigo-400 bg-indigo-50/30' : ''}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-900">{exp.job_title}</h3>
                        <p className="text-purple-700">{exp.company}</p>
                        <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {exp.start_date} - {exp.end_date}
                          {exp.duration_months && ` (${(exp.duration_months / 12).toFixed(1)} yrs)`}
                        </p>
                      </div>
                      {exp.relevant_to_position && (
                        <Badge className="clay-badge bg-gradient-to-r from-green-200 to-green-300 text-green-800">
                          ⭐ Relevant
                        </Badge>
                      )}
                    </div>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="space-y-1 text-sm text-purple-700 mt-2">
                        {exp.responsibilities.slice(0, 4).map((resp, ridx) => (
                          <li key={ridx} className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {(application.relevant_experience_years || application.total_experience_years) && (
                <div className="mt-4 clay-input p-4 bg-gradient-to-r from-purple-50 to-blue-50 text-center">
                  {application.relevant_experience_years && (
                    <p className="text-purple-900">
                      <span className="font-bold text-2xl">{application.relevant_experience_years}</span> years relevant
                    </p>
                  )}
                  {application.total_experience_years && (
                    <p className="text-purple-600 text-sm mt-1">
                      {application.total_experience_years} years total
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {application.skills && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="clay-card p-6"
            >
              <h2 className="text-xl font-bold text-purple-900 mb-4">Skills Analysis</h2>
              
              {application.skills.technical && application.skills.technical.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-purple-700 mb-3">Technical Skills</h3>
                  <div className="space-y-2">
                    {application.skills.technical.map((skill, idx) => (
                      <div key={idx} className="clay-input p-3 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-purple-900">{skill.skill}</span>
                          {skill.years_experience && (
                            <span className="text-sm text-purple-600 ml-2">({skill.years_experience} yrs)</span>
                          )}
                        </div>
                        {skill.proficiency && (
                          <Badge className={`clay-badge bg-gradient-to-r ${getProficiencyColor(skill.proficiency)} text-xs`}>
                            {skill.proficiency}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {application.skills.soft_skills && application.skills.soft_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-purple-700 mb-3">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {application.skills.soft_skills.map((skill, idx) => (
                      <Badge key={idx} className="clay-badge bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <AnimatePresence>
            {currentDecision && (
              <motion.div
                key="enhanced-feedback" // Added key for AnimatePresence to track
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <EnhancedFeedbackPanel 
                  application={application}
                  reviewerDecision={currentDecision}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AutomatedEmailSender application={application} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <MessagingPanel applicationId={application.id} applicantEmail={application.email} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="clay-card p-6"
          >
            <h2 className="text-xl font-bold text-purple-900 mb-4">Reviewer Actions</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-purple-700 mb-2 block">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your review notes..."
                  className="clay-input min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => handleAction('qualified', 'Likely Qualified')}
                  className="clay-button bg-gradient-to-r from-green-200 to-green-300 text-green-800 hover:from-green-300 hover:to-green-400"
                  disabled={updateMutation.isPending}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirm Qualified
                </Button>

                <Button
                  onClick={() => handleAction('needs_review', 'Needs Review')}
                  className="clay-button bg-gradient-to-r from-yellow-200 to-amber-300 text-amber-800 hover:from-yellow-300 hover:to-amber-400"
                  disabled={updateMutation.isPending}
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Mark for Review
                </Button>

                <Button
                  onClick={() => handleAction('not_qualified', 'Likely Not Qualified')}
                  className="clay-button bg-gradient-to-r from-red-200 to-pink-300 text-red-800 hover:from-red-300 hover:to-pink-400"
                  disabled={updateMutation.isPending}
                >
                  <X className="w-5 h-5 mr-2" />
                  Mark Not Qualified
                </Button>
              </div>

              <Button
                onClick={() => updateMutation.mutate({ reviewer_notes: notes })}
                className="clay-button w-full"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Notes Only
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
