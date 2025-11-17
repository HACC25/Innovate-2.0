import React, { useMemo } from "react";
import { Brain, TrendingUp, AlertTriangle, Target, Zap, CheckCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ModelImprovementDashboard({ applications, feedbackData = [] }) {
  const overrideAnalysis = useMemo(() => {
    const overrides = applications.filter(app => 
      app.reviewed_by && app.ai_label !== (
        app.status === 'qualified' ? 'Likely Qualified' :
        app.status === 'not_qualified' ? 'Likely Not Qualified' :
        'Needs Review'
      )
    );

    const patterns = {
      'Qualified → Not Qualified': overrides.filter(a => 
        a.ai_label === 'Likely Qualified' && a.status === 'not_qualified'
      ).length,
      'Not Qualified → Qualified': overrides.filter(a => 
        a.ai_label === 'Likely Not Qualified' && a.status === 'qualified'
      ).length,
      'Qualified → Review': overrides.filter(a => 
        a.ai_label === 'Likely Qualified' && a.status === 'needs_review'
      ).length,
      'Not Qualified → Review': overrides.filter(a => 
        a.ai_label === 'Likely Not Qualified' && a.status === 'needs_review'
      ).length,
      'Review → Qualified': overrides.filter(a => 
        a.ai_label === 'Needs Review' && a.status === 'qualified'
      ).length,
      'Review → Not Qualified': overrides.filter(a => 
        a.ai_label === 'Needs Review' && a.status === 'not_qualified'
      ).length,
    };

    const chartData = Object.entries(patterns)
      .filter(([_, count]) => count > 0)
      .map(([pattern, count]) => ({ pattern, count }));

    return { overrides, patterns, chartData, total: overrides.length };
  }, [applications]);

  const feedbackAnalysis = useMemo(() => {
    if (feedbackData.length === 0) return null;

    const byCategory = {};
    const byAgreement = { agree: 0, disagree: 0, partial: 0 };

    feedbackData.forEach(fb => {
      const category = fb.issue_category || 'other';
      byCategory[category] = (byCategory[category] || 0) + 1;
      if (fb.agreement) byAgreement[fb.agreement]++;
    });

    const categoryData = Object.entries(byCategory).map(([category, count]) => ({
      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }));

    const agreementData = Object.entries(byAgreement).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: ((count / feedbackData.length) * 100).toFixed(0)
    }));

    return { categoryData, agreementData, total: feedbackData.length };
  }, [feedbackData]);

  const improvementSuggestions = useMemo(() => {
    const suggestions = [];

    // High false positive rate
    if (overrideAnalysis.patterns['Qualified → Not Qualified'] > 5) {
      suggestions.push({
        type: 'critical',
        message: `High false positive rate (${overrideAnalysis.patterns['Qualified → Not Qualified']} cases). Consider tightening qualification criteria or improving MQ detection.`
      });
    }

    // High false negative rate
    if (overrideAnalysis.patterns['Not Qualified → Qualified'] > 3) {
      suggestions.push({
        type: 'warning',
        message: `AI is rejecting qualified candidates (${overrideAnalysis.patterns['Not Qualified → Qualified']} cases). Review for potential bias in experience/education requirements.`
      });
    }

    // Many "needs review" being overridden
    const needsReviewOverrides = 
      overrideAnalysis.patterns['Review → Qualified'] + 
      overrideAnalysis.patterns['Review → Not Qualified'];
    
    if (needsReviewOverrides > 10) {
      suggestions.push({
        type: 'info',
        message: `${needsReviewOverrides} "Needs Review" cases were overridden. AI could be more decisive with additional training data.`
      });
    }

    // Confidence accuracy
    const reviewed = applications.filter(a => a.reviewed_by);
    const highConfCorrect = reviewed.filter(a => {
      const match = a.ai_label === (
        a.status === 'qualified' ? 'Likely Qualified' :
        a.status === 'not_qualified' ? 'Likely Not Qualified' :
        'Needs Review'
      );
      return a.confidence >= 80 && match;
    }).length;

    const highConfTotal = reviewed.filter(a => a.confidence >= 80).length;
    const highConfAccuracy = highConfTotal > 0 ? (highConfCorrect / highConfTotal * 100) : 100;

    if (highConfAccuracy < 85) {
      suggestions.push({
        type: 'warning',
        message: `High confidence predictions only ${highConfAccuracy.toFixed(0)}% accurate. Model may be overconfident—needs recalibration.`
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: 'success',
        message: 'AI performance is excellent! Continue monitoring for edge cases.'
      });
    }

    return suggestions;
  }, [applications, overrideAnalysis]);

  const trainingProgress = useMemo(() => {
    const totalReviewed = applications.filter(a => a.reviewed_by).length;
    const needsTraining = Math.max(0, 100 - totalReviewed);
    const progress = Math.min(100, (totalReviewed / 100) * 100);

    return { totalReviewed, needsTraining, progress };
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="clay-card p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-purple-900">Model Improvement Dashboard</h2>
              <p className="text-sm text-purple-600">Track AI learning from human feedback</p>
            </div>
          </div>
          <Badge className="clay-badge bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 text-sm px-4 py-2">
            {trainingProgress.totalReviewed} Training Samples
          </Badge>
        </div>

        {/* Training Progress */}
        <div className="clay-input p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Training Data Collected</span>
            <span className="text-sm text-slate-600">{trainingProgress.totalReviewed} / 100+</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${trainingProgress.progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {trainingProgress.needsTraining > 0 
              ? `${trainingProgress.needsTraining} more samples needed for optimal retraining`
              : 'Ready for model retraining!'}
          </p>
        </div>
      </div>

      {/* Override Patterns */}
      <div className="clay-card p-6">
        <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Override Patterns ({overrideAnalysis.total} total)
        </h3>
        {overrideAnalysis.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overrideAnalysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="pattern" angle={-20} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} name="Override Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-slate-600 py-8">No overrides detected—AI is performing well!</p>
        )}
      </div>

      {/* Feedback Analysis */}
      {feedbackAnalysis && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="clay-card p-6">
            <h3 className="font-semibold text-purple-900 mb-4">Issue Categories</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={feedbackAnalysis.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.category}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {feedbackAnalysis.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="clay-card p-6">
            <h3 className="font-semibold text-purple-900 mb-4">Reviewer Agreement</h3>
            <div className="space-y-4">
              {feedbackAnalysis.agreementData.map((item, idx) => (
                <div key={idx} className="clay-input p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">{item.type}</span>
                    <span className="text-2xl font-bold text-purple-600">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        item.type === 'Agree' ? 'bg-green-500' :
                        item.type === 'Disagree' ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.count} cases</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      <div className="clay-card p-6">
        <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          AI Improvement Recommendations
        </h3>
        <div className="space-y-3">
          {improvementSuggestions.map((suggestion, idx) => (
            <div key={idx} className={`clay-input p-4 border-l-4 ${
              suggestion.type === 'critical' ? 'border-red-500 bg-red-50/50' :
              suggestion.type === 'warning' ? 'border-amber-500 bg-amber-50/50' :
              suggestion.type === 'success' ? 'border-green-500 bg-green-50/50' :
              'border-blue-500 bg-blue-50/50'
            }`}>
              <div className="flex items-start gap-3">
                {suggestion.type === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" /> :
                 suggestion.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" /> :
                 suggestion.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> :
                 <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                <p className="text-sm text-slate-700 flex-1">{suggestion.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retrain Model CTA */}
      <div className="clay-card p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl mb-2">Ready to Improve the Model?</h3>
            <p className="text-sm text-indigo-100">
              {trainingProgress.totalReviewed >= 100 
                ? 'Sufficient training data collected. Retrain the model with human feedback.'
                : `Collect ${trainingProgress.needsTraining} more reviews before retraining for optimal results.`}
            </p>
          </div>
          <Button 
            className="clay-button bg-white text-indigo-600 hover:bg-indigo-50"
            disabled={trainingProgress.totalReviewed < 50}
          >
            <Zap className="w-4 h-4 mr-2" />
            Retrain Model
          </Button>
        </div>
        <p className="text-xs text-indigo-200 mt-3">
          Note: Model retraining requires admin privileges and will be processed overnight
        </p>
      </div>
    </div>
  );
}