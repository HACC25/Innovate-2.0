import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

/**
 * ML Feedback Panel - Allows reviewers to provide feedback on AI decisions
 * This feedback is used to improve the ML model over time
 */
export default function MLFeedbackPanel({ application, onFeedbackSubmit }) {
  const [feedback, setFeedback] = useState("");
  const [agreement, setAgreement] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const feedbackData = {
      application_id: application.id,
      ai_prediction: application.ai_label,
      ai_confidence: application.confidence,
      reviewer_agreement: agreement,
      feedback_notes: feedback,
      timestamp: new Date().toISOString()
    };

    onFeedbackSubmit?.(feedbackData);
    setSubmitted(true);
    
    setTimeout(() => setSubmitted(false), 3000);
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
          <h3 className="font-bold text-green-900 mb-2">Thank You!</h3>
          <p className="text-sm text-green-700">
            Your feedback helps improve our AI screening system for future applications.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="clay-card p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="font-bold text-purple-900">AI Performance Feedback</h3>
          <p className="text-xs text-purple-600">Help improve our screening accuracy</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="clay-input p-4 bg-white">
          <p className="text-sm font-medium text-slate-700 mb-2">AI Assessment:</p>
          <div className="flex items-center gap-3">
            <Badge className={`clay-badge ${
              application.ai_label === 'Likely Qualified' 
                ? 'bg-green-100 text-green-800' 
                : application.ai_label === 'Needs Review'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {application.ai_label}
            </Badge>
            <span className="text-sm text-slate-600">
              {application.confidence}% confidence
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            Do you agree with the AI's assessment?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setAgreement('agree')}
              className={`clay-button flex-1 ${
                agreement === 'agree' 
                  ? 'bg-gradient-to-r from-green-200 to-green-300 border-2 border-green-400' 
                  : ''
              }`}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Agree
            </Button>
            <Button
              onClick={() => setAgreement('disagree')}
              className={`clay-button flex-1 ${
                agreement === 'disagree' 
                  ? 'bg-gradient-to-r from-red-200 to-red-300 border-2 border-red-400' 
                  : ''
              }`}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Disagree
            </Button>
            <Button
              onClick={() => setAgreement('partial')}
              className={`clay-button flex-1 ${
                agreement === 'partial' 
                  ? 'bg-gradient-to-r from-amber-200 to-amber-300 border-2 border-amber-400' 
                  : ''
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Partially
            </Button>
          </div>
        </div>

        {agreement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Additional Notes (Optional):
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did the AI get right or wrong? Any suggestions for improvement?"
              className="clay-input min-h-[100px]"
            />
          </motion.div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!agreement}
          className="clay-button w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white disabled:opacity-50"
        >
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}