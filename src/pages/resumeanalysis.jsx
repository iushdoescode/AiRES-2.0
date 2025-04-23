import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Upload } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { useSupabaseClient } from '../hooks/useSupabaseClient';
import { useUser } from "@clerk/clerk-react";

const ResumeAnalysis = () => {
  const [file, setFile] = useState(null);
  const [jobOffer, setJobOffer] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUser();
  const supabaseClient = useSupabaseClient();

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  const uploadResumeToStorage = async (file) => {
    if (!supabaseClient) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('resumes')
      .upload(filePath, file);

    if (error) throw error;
    return data.path;
  };

  const saveAnalysisToDatabase = async (analysis, resumeUrl) => {
    if (!supabaseClient) return;
    
    try {
      const { error } = await supabaseClient
        .from('resume_analyses')
        .insert({
          user_id: user.id,
          resume_url: resumeUrl,
          resume_name:file.name,
          job_title: jobTitle,
          job_description: jobOffer,
          overall_score: Math.round(analysis.scores.overall),
          skills_score: Math.round(analysis.scores.skills),
          experience_score: Math.round(analysis.scores.experience),
          education_score: Math.round(analysis.details.education.score),
          formatting_score: Math.round(analysis.details.formatting.score),
          keywords_score: Math.round(analysis.details.keywords.score),
          impact_score: Math.round(analysis.details.impact.score),
          matching_skills: JSON.stringify(analysis.matching_skills),
          missing_skills: JSON.stringify(analysis.missing_skills)
        });

      if (error) {
        console.error('Error saving analysis:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error in saveAnalysisToDatabase:', err);
      throw err;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !jobOffer || !jobTitle) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Upload resume to Supabase Storage
      const resumeUrl = await uploadResumeToStorage(file);

      // Analyze resume
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_offer', jobOffer);
      formData.append('job_title', jobTitle);

      const response = await axios.post('http://localhost:8000/analyze-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Save analysis results to Supabase
      await saveAnalysisToDatabase(response.data, resumeUrl);

      setAnalysis(response.data);
    } catch (err) {
      setError('Error analyzing resume. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderScoreCard = (score, label) => (
    <div className="bg-card rounded-lg p-6 shadow-md">
      <div className="text-lg font-semibold mb-2 text-card-foreground">{label}</div>
      <div className="text-3xl font-bold text-primary">{Math.round(score)}</div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-foreground">Resume Analysis</h1>
      
      <div className="bg-card p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-card-foreground">
              Upload Resume (PDF format)
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
                ${file ? 'bg-success/5 border-success' : ''}
                hover:border-primary cursor-pointer`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <Upload 
                  size={24} 
                  className={`${file ? 'text-success' : 'text-gray-400'}`}
                />
                {file ? (
                  <>
                    <p className="text-success font-medium">
                      File selected: {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click or drag to replace
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">
                      {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to select PDF file
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-card-foreground">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full p-2 border rounded-md bg-background text-foreground"
              placeholder="Enter job title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-card-foreground">
              Job Description
            </label>
            <textarea
              value={jobOffer}
              onChange={(e) => setJobOffer(e.target.value)}
              className="w-full p-2 border rounded-md h-32 bg-background text-foreground"
              placeholder="Paste job description here"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium 
                     hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={20} />
                Analyzing...
              </span>
            ) : (
              'Analyze Resume'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="text-muted-foreground">Analyzing your resume...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderScoreCard(analysis.scores.overall, 'Overall Match')}
            {renderScoreCard(analysis.scores.skills, 'Skills Match')}
            {renderScoreCard(analysis.scores.experience, 'Experience Match')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Matching Skills</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.matching_skills.map((skill, index) => (
                  <span key={index} className="bg-success/20 text-success px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Missing Skills</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_skills.map((skill, index) => (
                  <span key={index} className="bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Formatting Analysis */}
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Formatting Analysis</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span>Score:</span>
                  <span className="font-semibold">{Math.round(analysis.details.formatting.score )}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {analysis.details.formatting.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Experience Analysis */}
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Experience Analysis</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Score:</span>
                  <span className="font-semibold">{Math.round(analysis.details.experience.score )}</span>
                </div>
                <p className="text-muted-foreground">{analysis.details.experience.analysis}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Years Match</h3>
                    <p className="text-muted-foreground">{analysis.details.experience.years_match}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Responsibilities Match</h3>
                    <p className="text-muted-foreground">{analysis.details.experience.responsibilities_match}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Education Analysis */}
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Education Analysis</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span>Score:</span>
                  <span className="font-semibold">{Math.round(analysis.details.education.score)}</span>
                </div>
                <p className="text-muted-foreground">{analysis.details.education.details}</p>
              </div>
            </div>

            {/* Keywords Analysis */}
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Keywords Analysis</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span>Score:</span>
                  <span className="font-semibold">{Math.round(analysis.details.keywords.score )}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.details.keywords.matches.map((keyword, index) => (
                    <span key={index} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Impact Statements</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span>Score:</span>
                  <span className="font-semibold">{Math.round(analysis.details.impact.score )}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {analysis.details.impact.statements.map((statement, index) => (
                    <li key={index}>{statement}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
