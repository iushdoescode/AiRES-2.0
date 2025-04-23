import { useEffect, useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from '../hooks/useSupabaseClient';
import { FileText } from 'lucide-react';
import AnalysisDetail from '../components/AnalysisDetail';

const AnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const { user } = useUser();
  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!supabaseClient || !user) return;
      
      try {
        const { data, error } = await supabaseClient
          .from('resume_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching analyses:', error);
        } else {
          const parsedData = data.map(analysis => ({
            ...analysis,
            matching_skills: Array.isArray(analysis.matching_skills) 
              ? analysis.matching_skills 
              : JSON.parse(analysis.matching_skills || '[]'),
            missing_skills: Array.isArray(analysis.missing_skills)
              ? analysis.missing_skills
              : JSON.parse(analysis.missing_skills || '[]')
          }));
          setAnalyses(parsedData);
        }
      } catch (err) {
        console.error('Error in fetchAnalyses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [user, supabaseClient]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analysis History</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => setSelectedAnalysis(analysis)}
              className="bg-card p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <FileText className="text-primary" size={24} />
                <div className="flex-1">
                  <h2 className="font-semibold">{analysis.resume_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleDateString()} - {analysis.job_title}
                  </p>
                </div>
                <div className="text-lg font-bold text-primary">
                  {analysis.overall_score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAnalysis && (
        <AnalysisDetail
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
};

export default AnalysisHistory; 