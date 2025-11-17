
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Save, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function JobManagement() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [extractingMQs, setExtractingMQs] = useState(false);
  const [formData, setFormData] = useState({
    job_class: "",
    job_code: "",
    department: "",
    description: "",
    salary_range: "",
    minimum_qualifications: [],
    desired_qualifications: [],
    status: "open",
  });
  const [newMQ, setNewMQ] = useState({ requirement: "", type: "experience", required: true });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
    },
  });

  const resetForm = () => {
    setFormData({
      job_class: "",
      job_code: "",
      department: "",
      description: "",
      salary_range: "",
      minimum_qualifications: [],
      desired_qualifications: [],
      status: "open",
    });
    setEditingJob(null);
    setNewMQ({ requirement: "", type: "experience", required: true });
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData(job);
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addMQ = () => {
    if (newMQ.requirement.trim()) {
      setFormData({
        ...formData,
        minimum_qualifications: [...formData.minimum_qualifications, { ...newMQ }],
      });
      setNewMQ({ requirement: "", type: "experience", required: true });
    }
  };

  const removeMQ = (index) => {
    setFormData({
      ...formData,
      minimum_qualifications: formData.minimum_qualifications.filter((_, i) => i !== index),
    });
  };

  const extractMQsWithAI = async () => {
    if (!formData.description || !formData.job_class) {
      alert("Please enter both job class and description first.");
      return;
    }

    setExtractingMQs(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an HR expert analyzing job descriptions for Hawaii state government positions. 

Job Title: ${formData.job_class}
Job Description: ${formData.description}

Extract all minimum qualifications (MQs) from this job description. These are typically educational requirements, experience requirements, licenses, certifications, and specific skills needed.

For each qualification:
1. Identify the exact requirement text
2. Categorize it as: education, experience, license, certification, or skill
3. Determine if it's required or preferred

Return a structured list of minimum qualifications.`,
        response_json_schema: {
          type: "object",
          properties: {
            minimum_qualifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  requirement: { type: "string" },
                  type: { 
                    type: "string",
                    enum: ["education", "experience", "license", "certification", "skill"]
                  },
                  required: { type: "boolean" }
                }
              }
            },
            desired_qualifications: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      if (result.minimum_qualifications) {
        setFormData({
          ...formData,
          minimum_qualifications: result.minimum_qualifications,
          desired_qualifications: result.desired_qualifications || formData.desired_qualifications
        });
      }
    } catch (error) {
      console.error("Error extracting MQs:", error);
      alert("Failed to extract qualifications. Please try again.");
    } finally {
      setExtractingMQs(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="clay-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">Job Management</h1>
            <p className="text-purple-600 mt-1">Manage job postings and minimum qualifications</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="clay-button bg-gradient-to-r from-purple-200 to-blue-200 text-purple-700">
            <Plus className="w-5 h-5 mr-2 text-purple-700" />
            New Job Posting
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="clay-card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-purple-600 mt-4">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="clay-card p-12 text-center">
          <p className="text-purple-600">No job postings yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="clay-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-purple-900">{job.job_class}</h3>
                    <Badge className={`clay-badge ${
                      job.status === 'open' 
                        ? 'bg-gradient-to-r from-green-200 to-green-300 text-green-800'
                        : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800'
                    }`}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-purple-600">
                    {job.job_code} • {job.department || 'No department'}
                  </p>
                  {job.salary_range && (
                    <p className="text-purple-600 mt-1">Salary: {job.salary_range}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(job)} className="clay-button">
                    <Edit className="w-4 h-4 text-slate-700" />
                  </Button>
                  <Button
                    onClick={() => deleteMutation.mutate(job.id)}
                    className="clay-button bg-gradient-to-r from-red-200 to-pink-200"
                  >
                    <Trash2 className="w-4 h-4 text-red-700" />
                  </Button>
                </div>
              </div>

              {job.description && (
                <p className="text-purple-700 mb-4">{job.description}</p>
              )}

              {job.minimum_qualifications && job.minimum_qualifications.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-purple-700 mb-2">Minimum Qualifications:</h4>
                  <ul className="space-y-2">
                    {job.minimum_qualifications.map((mq, idx) => (
                      <li key={idx} className="clay-input p-3 flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                        <div className="flex-1">
                          <p className="text-purple-900">{mq.requirement}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className="clay-badge bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 text-xs">
                              {mq.type}
                            </Badge>
                            {mq.required && (
                              <Badge className="clay-badge bg-gradient-to-r from-red-100 to-pink-100 text-red-700 text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.applications_count > 0 && (
                <p className="text-purple-600 mt-4">
                  {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Job Form Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto clay-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-900">
              {editingJob ? 'Edit Job Posting' : 'New Job Posting'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-purple-700 mb-2 block">Job Class *</label>
                <Input
                  value={formData.job_class}
                  onChange={(e) => setFormData({ ...formData, job_class: e.target.value })}
                  placeholder="e.g., Agricultural Loan Officer IV"
                  className="clay-input"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-purple-700 mb-2 block">Job Code *</label>
                <Input
                  value={formData.job_code}
                  onChange={(e) => setFormData({ ...formData, job_code: e.target.value })}
                  placeholder="e.g., 2.479"
                  className="clay-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-purple-700 mb-2 block">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Department of Agriculture"
                className="clay-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-purple-700 mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Job description..."
                className="clay-input min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-purple-700 mb-2 block">Salary Range</label>
              <Input
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                placeholder="e.g., $50,000 - $70,000"
                className="clay-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-purple-700">
                  Minimum Qualifications *
                </label>
                <Button
                  type="button"
                  onClick={extractMQsWithAI}
                  disabled={extractingMQs || !formData.description}
                  className="clay-button bg-gradient-to-r from-purple-200 to-pink-200 text-purple-700"
                >
                  {extractingMQs ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-purple-700" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 text-purple-700" />
                      AI Extract MQs
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.minimum_qualifications.map((mq, idx) => (
                  <div key={idx} className="clay-input p-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-purple-900">{mq.requirement}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className="clay-badge text-xs">{mq.type}</Badge>
                        {mq.required && <Badge className="clay-badge text-xs">Required</Badge>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeMQ(idx)}
                      className="clay-button p-2"
                    >
                      <X className="w-4 h-4 text-slate-700" />
                    </Button>
                  </div>
                ))}

                <div className="clay-input p-4 space-y-3">
                  <Input
                    value={newMQ.requirement}
                    onChange={(e) => setNewMQ({ ...newMQ, requirement: e.target.value })}
                    placeholder="Add a minimum qualification..."
                    className="clay-input"
                  />
                  <div className="flex gap-3">
                    <select
                      value={newMQ.type}
                      onChange={(e) => setNewMQ({ ...newMQ, type: e.target.value })}
                      className="clay-input px-3 py-2 flex-1"
                    >
                      <option value="education">Education</option>
                      <option value="experience">Experience</option>
                      <option value="license">License</option>
                      <option value="certification">Certification</option>
                      <option value="skill">Skill</option>
                    </select>
                    <Button type="button" onClick={addMQ} className="clay-button text-slate-700">
                      <Plus className="w-4 h-4 mr-2 text-slate-700" />
                      Add MQ
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-purple-100">
              <Button
                type="button"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="clay-button text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="clay-button bg-gradient-to-r from-purple-200 to-blue-200 text-purple-700"
              >
                <Save className="w-4 h-4 mr-2 text-purple-700" />
                {editingJob ? 'Update Job' : 'Create Job'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
