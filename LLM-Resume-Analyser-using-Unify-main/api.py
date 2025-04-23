from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile

from resume_analyzer import analyze_resume, extract_text_from_file

app = FastAPI(title="Resume Analyzer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your React app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-resume")
async def analyze_resume_api(
    resume: UploadFile = File(...),
    job_offer: str = Form(...),
    job_title: str = Form(...)
):
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume.filename)[1]) as temp_file:
            content = await resume.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Extract text from resume
        resume_text = extract_text_from_file(temp_file_path)

        # Analyze resume
        analysis_results = analyze_resume(resume_text, job_offer, job_title)

        # Clean up temporary file
        os.unlink(temp_file_path)

        # Prepare response
        response = {
            "matching_skills": analysis_results['matching_skills'],
            "missing_skills": analysis_results['missing_skills'],
            "scores": {
                "skills": analysis_results['scores']['skills'],
                "formatting": analysis_results['scores']['formatting'],
                "experience": analysis_results['scores']['experience'],
                "education": analysis_results['scores']['education'],
                "keywords": analysis_results['scores']['keywords'],
                "impact": analysis_results['scores']['impact'],
                "overall": analysis_results['overall_score']
            },
            "details": {
                "formatting": {
                    "score": analysis_results['formatting_analysis']['score'],
                    "issues": analysis_results['formatting_analysis']['issues']
                },
                "experience": {
                    "score": analysis_results['experience_analysis']['score'],
                    "analysis": analysis_results['experience_analysis']['analysis'],
                    "years_match": analysis_results['experience_analysis']['years_match'],
                    "responsibilities_match": analysis_results['experience_analysis']['responsibilities_match']
                },
                "education": {
                    "score": analysis_results['education_analysis']['score'],
                    "details": analysis_results['education_analysis']['details']
                },
                "keywords": {
                    "score": analysis_results['keywords_analysis']['score'],
                    "matches": analysis_results['keywords_analysis']['matches']
                },
                "impact": {
                    "score": analysis_results['impact_analysis']['score'],
                    "statements": analysis_results['impact_analysis']['statements']
                }
            }
        }

        return JSONResponse(content=response)

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True) 