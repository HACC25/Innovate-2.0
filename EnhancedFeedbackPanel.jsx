import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp, CheckCircle, XCircle, X } from "lucide-react";
import { motion } from "framer-motion";

export default function EnhancedFeedbackPanel({ application, reviewerDecision }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [agreement, setAgreement] = useState(null);
  const [issueCategory, setIssueCategory] = useState("");
  const [mqFeedback, setMqFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData) => {
      const user = await base44.auth.me();
      return base44.entities.AIFeedback.create({
        ...feedbackData,
        reviewer_email: user.email,
        submitted_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-feedback']);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  });

  const handleSubmit = () => {
    const aiLabel = application.ai_label;
    const humanLabel = reviewerDecision;
    
    let determinedAgreement = agreement;
    if (!determinedAgreement) {
      determinedAgreement = aiLabel === humanLabel ? 'agree' : 'disagree';
    }

    let determinedCategory = issueCategory;
    if (!determinedCategory) {
      if (determinedAgreement === 'agree') {
        determinedCategory = 'correct';
      } else if (aiLabel === 'Likely Qualified' && humanLabel === 'Likely Not Qualified') {
        determinedCategory = 'false_positive';
      } else if (aiLabel === 'Likely Not Qualified' && humanLabel === 'Likely Qualified') {
        determinedCategory = 'false_negative';
      } else {
        determinedCategory = 'other';
      }
    }

    feedbackMutation.mutate({
      application_id: application.id,
      ai_prediction: aiLabel,
      ai_confidence: application.confidence,
      reviewer_decision: humanLabel,
      agreement: determinedAgreement,
      feedback_notes: feedback,
      issue_category: determinedCategory,
      mq_specific_feedback: mqFeedback
    });
  };

  const addMqFeedback = (mq, correctAssessment, notes) => {
    setMqFeedback([...mqFeedback, {
      requirement: mq.requirement,
      ai_assessment: mq.status,
      correct_assessment: correctAssessment,
      notes
    }]);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="clay-card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200"
      >
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-bold text-green-900 mb-2">Feedback Submitted!</h3>
          <p className="text-sm text-green-700">
            Your feedback will help improve the AI model for future screenings.
          </p>
        </div>
      </motion.div>
    );
  }

  const aiLabel = application.ai_label;
  const humanLabel = reviewerDecision;
  const isOverride = aiLabel !== humanLabel;

  return (
    <div className="clay-card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="font-bold text-purple-900">AI Model Feedback</h3>
          <p className="text-xs text-purple-600">Help improve future predictions</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Decision Comparison */}
        <div className="clay-input p-4 bg-white">
          <p className="text-sm font-medium text-slate-700 mb-3">Assessment Comparison:</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">AI Prediction</p>
              <Badge className={`clay-badge ${
                aiLabel === 'Likely Qualified' ? 'bg-green-100 text-green-800' :
                aiLabel === 'Needs Review' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {aiLabel}
              </Badge>
              <p className="text-xs text-slate-500 mt-1">{application.confidence}% confidence</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Your Decision</p>
              <Badge className={`clay-badge ${
                humanLabel === 'Likely Qualified' ? 'bg-green-100 text-green-800' :
                humanLabel === 'Needs Review' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {humanLabel}
              </Badge>
              {isOverride && (
                <p className="text-xs text-orange-600 mt-1 font-semibold">⚠️ Override</p>
              )}
            </div>
          </div>
        </div>

        {/* Agreement Selection */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            {isOverride ? 'Why did you override the AI?' : 'Do you agree with the AI assessment?'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => setAgreement('agree')}
              className={`clay-button ${
                agreement === 'agree' 
                  ? 'bg-gradient-to-r from-green-200 to-green-300 border-2 border-green-400' 
                  : ''
              }`}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Agree
            </Button>
            <Button
              onClick={() => setAgreement('partial')}
              className={`clay-button ${
                agreement === 'partial' 
                  ? 'bg-gradient-to-r from-amber-200 to-amber-300 border-2 border-amber-400' 
                  : ''
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Partial
            </Button>
            <Button
              onClick={() => setAgreement('disagree')}
              className={`clay-button ${
                agreement === 'disagree' 
                  ? 'bg-gradient-to-r from-red-200 to-red-300 border-2 border-red-400' 
                  : ''
              }`}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Disagree
            </Button>
          </div>
        </div>

        {/* Issue Category */}
        {isOverride && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Issue Category:
            </label>
            <select
              value={issueCategory}
              onChange={(e) => setIssueCategory(e.target.value)}
              className="clay-input w-full"
            >
              <option value="">Select a category...</option>
              <option value="false_positive">False Positive (AI said qualified, actually not)</option>
              <option value="false_negative">False Negative (AI said not qualified, actually is)</option>
              <option value="confidence_mismatch">Confidence Score Incorrect</option>
              <option value="missing_context">AI Missed Important Context</option>
              <option value="other">Other Issue</option>
            </select>
          </div>
        )}

        {/* MQ-Specific Feedback */}
        {application.mq_results && application.mq_results.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Were any MQ assessments incorrect?
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {application.mq_results.slice(0, 5).map((mq, idx) => (
                <div key={idx} className="clay-input p-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-700 mb-1">
                        {mq.requirement.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-slate-600">
                        AI: <span className={`font-semibold ${
                          mq.status === 'pass' ? 'text-green-600' :
                          mq.status === 'fail' ? 'text-red-600' : 'text-amber-600'
                        }`}>{mq.status.toUpperCase()}</span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => addMqFeedback(mq, 'pass', 'Should be PASS')}
                        className="p-1 hover:bg-green-100 rounded"
                        title="Should be Pass"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => addMqFeedback(mq, 'fail', 'Should be FAIL')}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Should be Fail"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {mqFeedback.length > 0 && (
              <p className="text-xs text-indigo-600 mt-2">
                ✓ {mqFeedback.length} MQ correction{mqFeedback.length !== 1 ? 's' : ''} recorded
              </p>
            )}
          </div>
        )}

        {/* Detailed Feedback */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Additional Feedback (Optional):
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What did the AI miss? What could improve its assessment?"
            className="clay-input min-h-[80px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={feedbackMutation.isPending}
          className="clay-button w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
        >
          {feedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>

        <p className="text-xs text-center text-slate-500">
          Your feedback trains the AI model to make better decisions
        </p>
      </div>
    </div>
  );
}