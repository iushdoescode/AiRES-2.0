import React from 'react';
import { Copy, Check } from 'lucide-react';

const AnalysisDetail = ({ analysis, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyDescription = async () => {
    try {
      await navigator.clipboard.writeText(analysis.job_description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{analysis.job_title}</h2>
              <p className="text-muted-foreground">
                Resume: {analysis.resume_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">Job Description</h3>
              <button
                onClick={handleCopyDescription}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {analysis.job_description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold mb-2">Overall Match</div>
              <div className="text-3xl font-bold text-primary">{analysis.overall_score}%</div>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold mb-2">Skills Match</div>
              <div className="text-3xl font-bold text-primary">{analysis.skills_score}%</div>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold mb-2">Experience Match</div>
              <div className="text-3xl font-bold text-primary">{analysis.experience_score}%</div>
            </div>
          </div>

          <div className="space-y-4">
            {analysis.matching_skills?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Matching Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.matching_skills.map((skill, index) => (
                    <span key={index} className="bg-success/20 text-success px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.missing_skills?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_skills.map((skill, index) => (
                    <span key={index} className="bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetail; 