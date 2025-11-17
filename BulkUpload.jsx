
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle, XCircle, Loader2, ArrowLeft, Brain, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadApplications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState("");
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 20) {
      alert("Maximum 20 files at once");
      return;
    }
    setFiles(newFiles);
    setResults([]);
  };

  const processApplications = async () => {
    if (!selectedJob || files.length === 0) {
      alert("Please select a job and upload at least one resume");
      return;
    }

    setProcessing(true);
    setResults([]);
    setCurrentProgress(0);
    const job = jobs.find(j => j.id === selectedJob);

    console.log('Starting AI analysis...', { jobId: selectedJob, fileCount: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setCurrentProgress(((i / files.length) * 100));
        console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);

        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        console.log('File uploaded:', uploadResult);
        const { file_url } = uploadResult;

        const trainingPrompt = `You are an expert HR examiner for Hawaii State Government with advanced resume analysis capabilities.

JOB POSITION: ${job.job_class} (${job.job_code})
Department: ${job.department || 'State of Hawaii'}

MINIMUM QUALIFICATIONS:
${job.minimum_qualifications?.map((mq, idx) => 
  `${idx + 1}. [${mq.type.toUpperCase()}${mq.required ? ' - REQUIRED' : ''}] ${mq.requirement}`
).join('\n')}

ANALYSIS INSTRUCTIONS:

Analyze this resume thoroughly and provide a detailed assessment. Extract ALL information from the resume and evaluate against the job requirements.

1. EXTRACT STRUCTURED DATA:
   - Full contact information (name, email, phone)
   - Education: ALL degrees with institution, major, GPA (if available), graduation date
   - Work Experience: Job titles, companies, dates (calculate duration in months), detailed responsibilities, quantifiable achievements
   - Skills: Technical skills with proficiency levels, soft skills, industry-specific expertise
   - Certifications: Name, issuing org, dates, status (active/expired)

2. SCORE AGAINST JOB REQUIREMENTS:
   - For EACH minimum qualification listed above, assess pass/fail/unclear with specific evidence from the resume
   - Calculate overall match percentage (0-100%) based on:
     * Required qualifications met: 50% weight
     * Preferred qualifications: 20% weight
     * Relevant experience depth: 20% weight
     * Skills alignment: 10% weight

3. IDENTIFY RED FLAGS:
   - Employment gaps (>6 months unexplained)
   - Job hopping (3+ jobs in 2 years)
   - Inconsistent dates or information
   - Overqualification concerns
   - Missing critical information
   - Credential verification issues

4. GENERATE EXECUTIVE SUMMARY:
   - 2-3 sentence summary highlighting key strengths and weaknesses
   - Explicit recommendation: Likely Qualified / Needs Review / Likely Not Qualified
   - Confidence score (0-100%) with reasoning

Be thorough, accurate, and fair in your assessment. Provide specific evidence from the resume for all assessments.`;

        console.log('Calling AI with prompt...');
        const aiResult = await base44.integrations.Core.InvokeLLM({
          prompt: trainingPrompt,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              applicant_name: { type: "string", description: "Full name of applicant" },
              email: { type: "string", description: "Email address" },
              phone: { type: "string", description: "Phone number" },
              education: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    degree_level: { type: "string" },
                    degree_name: { type: "string" },
                    major: { type: "string" },
                    institution: { type: "string" },
                    graduation_date: { type: "string" },
                    gpa: { type: "string" }
                  }
                }
              },
              experience: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    job_title: { type: "string" },
                    company: { type: "string" },
                    start_date: { type: "string" },
                    end_date: { type: "string" },
                    duration_months: { type: "number" },
                    responsibilities: { type: "array", items: { type: "string" } },
                    achievements: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          metric: { type: "string" },
                          category: { type: "string", enum: ["financial", "performance", "efficiency", "growth", "quality"] }
                        }
                      }
                    },
                    relevant_to_position: { type: "boolean" }
                  }
                }
              },
              certifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    issuing_organization: { type: "string" },
                    issue_date: { type: "string" },
                    expiry_date: { type: "string" },
                    status: { type: "string", enum: ["active", "expired", "pending_renewal"] }
                  }
                }
              },
              skills: {
                type: "object",
                properties: {
                  technical: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        proficiency: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
                        years_experience: { type: "number" }
                      }
                    }
                  },
                  soft_skills: { type: "array", items: { type: "string" } },
                  industry_specific: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        domain: { type: "string" }
                      }
                    }
                  }
                }
              },
              mq_results: {
                type: "array",
                description: "Assessment for each minimum qualification",
                items: {
                  type: "object",
                  properties: {
                    requirement: { type: "string", description: "The requirement being assessed" },
                    status: { type: "string", enum: ["pass", "fail", "unclear"], description: "Assessment result" },
                    evidence: { type: "string", description: "Specific evidence from resume" },
                    confidence: { type: "number", minimum: 0, maximum: 100 }
                  },
                  required: ["requirement", "status", "evidence", "confidence"]
                }
              },
              match_percentage: { type: "number", minimum: 0, maximum: 100, description: "Overall match score against job requirements" },
              relevant_experience_years: { type: "number", description: "Years of directly relevant experience" },
              total_experience_years: { type: "number", description: "Total years of professional experience" },
              red_flags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    flag_type: { type: "string", enum: ["employment_gap", "job_hopping", "inconsistency", "overqualified", "missing_info", "credential_issue"] },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] }
                  }
                }
              },
              executive_summary: { type: "string", description: "2-3 sentence summary of candidate strengths and weaknesses" },
              ai_label: { type: "string", enum: ["Likely Qualified", "Needs Review", "Likely Not Qualified"], description: "Final recommendation" },
              confidence: { type: "number", minimum: 0, maximum: 100, description: "AI confidence in assessment" },
              ai_reasoning: { type: "string", description: "Explanation for the classification decision" }
            },
            required: ["applicant_name", "ai_label", "confidence", "ai_reasoning", "match_percentage", "executive_summary", "mq_results"]
          }
        });

        console.log('AI analysis complete:', aiResult);

        const applicationData = {
          ...aiResult,
          job_id: job.id,
          job_class: job.job_class,
          submitted_date: new Date().toISOString().split('T')[0],
          status: "pending"
        };

        console.log('Creating application record...');
        await base44.entities.Application.create(applicationData);

        setResults(prev => [...prev, { 
          fileName: file.name, 
          status: 'success', 
          name: aiResult.applicant_name,
          label: aiResult.ai_label,
          confidence: aiResult.confidence,
          matchScore: aiResult.match_percentage
        }]);
        console.log(`Successfully processed: ${file.name}`);
      } catch (error) {
        console.error(`ERROR processing ${file.name}:`, error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        setResults(prev => [...prev, { 
          fileName: file.name, 
          status: 'error', 
          error: error.message || "Processing failed - check console for details"
        }]);
      }
    }

    setCurrentProgress(100);
    queryClient.invalidateQueries(['applications']);
    setProcessing(false);
    console.log('All files processed');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="clay-card p-4 md:p-6 mb-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={() => navigate(createPageUrl("Applications"))} className="clay-button">
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Upload Applications</h1>
            <p className="text-sm text-slate-700 mt-1">Advanced AI resume analysis & scoring</p>
          </div>
        </div>

        <div className="clay-input p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
          <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Enhanced Analysis Features
          </h3>
          <ul className="space-y-1 text-sm text-indigo-800">
            <li>✓ Structured data extraction (education, skills, GPA)</li>
            <li>✓ Job requirement match scoring (0-100%)</li>
            <li>✓ Red flag & inconsistency detection</li>
            <li>✓ Executive summary generation</li>
          </ul>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="clay-card p-4 md:p-6"
      >
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-900 mb-2 block">
              Select Job Position *
            </label>
            <Select value={selectedJob} onValueChange={setSelectedJob} disabled={processing || jobsLoading}>
              <SelectTrigger className="clay-input">
                <SelectValue placeholder={jobsLoading ? "Loading jobs..." : "Choose a job position..."} />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_class} ({job.job_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 mb-2 block">
              Upload Resumes * <span className="text-xs text-slate-500">(Max 20 files)</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 md:p-8 text-center hover:border-indigo-400 transition-colors bg-white">
              <Upload className="w-10 h-10 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={processing}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className={`${processing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <span className="text-indigo-600 font-semibold">Click to upload</span>
                <span className="text-slate-700"> or drag and drop</span>
              </label>
              <p className="text-xs text-slate-600 mt-2">PDF, DOC, DOCX accepted</p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    Selected: {files.length} file{files.length !== 1 ? 's' : ''}
                  </p>
                  {!processing && (
                    <Button onClick={() => setFiles([])} className="clay-button text-xs">
                      <X className="w-3 h-3 mr-1 text-slate-700" />
                      Clear
                    </Button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="clay-input p-3 flex items-center gap-3 bg-white">
                      <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-sm text-slate-900 truncate">{file.name}</span>
                      <span className="text-xs text-slate-500 ml-auto">{(file.size / 1024).toFixed(0)}KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {processing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="clay-input p-4 bg-indigo-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-900">
                    Processing {results.length + 1} of {files.length}
                  </span>
                  <motion.span 
                    key={currentProgress}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="text-sm text-indigo-700"
                  >
                    {Math.round(currentProgress)}%
                  </motion.span>
                </div>
                <Progress value={currentProgress} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={processApplications}
              disabled={processing || !selectedJob || files.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center text-white">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center text-white">
                  <Brain className="w-5 h-5 mr-2" />
                  Analyze with AI
                </span>
              )}
            </Button>
          </motion.div>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Results</h3>
                  <span className="text-sm text-slate-600">
                    {results.filter(r => r.status === 'success').length} succeeded, 
                    {results.filter(r => r.status === 'error').length} failed
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  <AnimatePresence>
                    {results.map((result, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        whileHover={{ x: 4 }}
                        className={`p-4 rounded-lg border-2 ${
                          result.status === 'success' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {result.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{result.fileName}</p>
                            {result.status === 'success' && (
                              <div className="mt-1">
                                <p className="text-sm text-slate-700">
                                  {result.name} - <span className={
                                    result.label === 'Likely Qualified' ? 'text-green-700 font-bold' :
                                    result.label === 'Needs Review' ? 'text-amber-700 font-bold' :
                                    'text-red-700 font-bold'
                                  }>{result.label}</span>
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                  Match Score: <span className="font-semibold">{result.matchScore}%</span> • 
                                  Confidence: <span className="font-semibold">{result.confidence}%</span>
                                </p>
                              </div>
                            )}
                            {result.status === 'error' && (
                              <p className="text-sm text-red-700">{result.error}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {!processing && results.length === files.length && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={() => navigate(createPageUrl("Applications"))}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg"
                    >
                      View All Applications
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
