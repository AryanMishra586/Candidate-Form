import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

export default function ResultsDisplay({ candidateId, onReset }) {
  const [candidate, setCandidateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    verifyCandidateAndFetch();
  }, [candidateId]);

  const verifyCandidateAndFetch = async () => {
    try {
      setIsLoading(true);
      setError("");

      // First, trigger the verification endpoint to extract data
      console.log("🔄 Calling verify endpoint for candidateId:", candidateId);
      const verifyResponse = await fetch(
        `${API_BASE_URL}/api/candidates/${candidateId}/verify`,
        { method: "POST" }
      );

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log("✅ Verify response:", verifyData);
      } else {
        console.warn("⚠️ Verification attempt completed (may have partial results)");
      }

      // Small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Now fetch the candidate data
      console.log("📥 Fetching candidate data...");
      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch candidate data");
      }
      const data = await response.json();
      console.log("✅ Candidate data received");
      setCandidateData(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
      console.error("❌ Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
        <p style={{ fontSize: "18px", color: "#666" }}>Loading candidate details...</p>
        <p style={{ fontSize: "14px", color: "#999" }}>Processing and extracting resume data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{
          backgroundColor: "#fee",
          color: "#c33",
          padding: "20px",
          borderRadius: "8px",
          border: "2px solid #fcc",
          textAlign: "center"
        }}>
          <h2 style={{ marginTop: 0 }}> Error</h2>
          <p style={{ fontSize: "16px" }}>{error}</p>
          <button onClick={onReset} style={{
            padding: "12px 30px",
            backgroundColor: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600"
          }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>No candidate data found</p>
      </div>
    );
  }

  // Helper function to safely get nested data
  const getResumeData = () => candidate.extractedData?.resume || {};
  const resumeData = getResumeData();
  const hasResumeData = Object.keys(resumeData).length > 0;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px", width: "100%" }}>
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", color: "#28a745", margin: "0 0 10px 0" }}>✅ Form Submitted Successfully!</h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Candidate ID: <strong>{candidateId}</strong></p>
      </div>

      <section style={{
        backgroundColor: "white",
        padding: "25px",
        marginBottom: "20px",
        borderRadius: "12px",
        border: "1px solid #e0e0e0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h2 style={{ color: "#333", fontSize: "20px", marginBottom: "20px", borderBottom: "2px solid #667eea", paddingBottom: "10px" }}>
          Personal Information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ fontWeight: "600", color: "#667eea", fontSize: "13px", textTransform: "uppercase" }}>Name</label>
            <p style={{ marginTop: "5px", fontSize: "16px", color: "#333" }}>{candidate.name}</p>
          </div>
          <div>
            <label style={{ fontWeight: "600", color: "#667eea", fontSize: "13px", textTransform: "uppercase" }}>Email</label>
            <p style={{ marginTop: "5px", fontSize: "16px", color: "#333" }}>{candidate.email}</p>
          </div>
          <div>
            <label style={{ fontWeight: "600", color: "#667eea", fontSize: "13px", textTransform: "uppercase" }}>Phone</label>
            <p style={{ marginTop: "5px", fontSize: "16px", color: "#333" }}>{candidate.phone || "Not provided"}</p>
          </div>
          <div>
            <label style={{ fontWeight: "600", color: "#667eea", fontSize: "13px", textTransform: "uppercase" }}>Aadhar</label>
            <p style={{ marginTop: "5px", fontSize: "16px", color: "#333" }}>{candidate.aadhar || "Not provided"}</p>
          </div>
        </div>
      </section>

      <section style={{
        backgroundColor: hasResumeData ? "#d4edda" : "#fff3cd",
        padding: "25px",
        marginBottom: "20px",
        borderRadius: "12px",
        border: hasResumeData ? "2px solid #28a745" : "2px solid #ffc107"
      }}>
        <h2 style={{ fontSize: "20px", margin: "0 0 15px 0", color: hasResumeData ? "#155724" : "#856404" }}>
          Verification & Extraction Status
        </h2>
        <p style={{ fontSize: "16px", fontWeight: "bold", margin: "5px 0", color: hasResumeData ? "#155724" : "#856404" }}>
          {hasResumeData ? "✅ Resume Data Extracted" : "⏳ Processing..."} 
        </p>
        {candidate.verificationDetails && (
          <p style={{ fontSize: "13px", color: hasResumeData ? "#155724" : "#856404", margin: "10px 0 0 0" }}>
            {hasResumeData 
              ? `Skills: ${candidate.verificationDetails.resumeSkills || 0} | Experience: ${candidate.verificationDetails.resumeExperience || 0} | Education: ${candidate.verificationDetails.resumeEducation || 0}`
              : "Attempting to extract resume data..."}
          </p>
        )}
      </section>

      {hasResumeData && (
        <section style={{
          backgroundColor: "white",
          padding: "25px",
          marginBottom: "20px",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h2 style={{ color: "#333", fontSize: "20px", marginBottom: "20px", borderBottom: "2px solid #667eea", paddingBottom: "10px" }}>
            📄 Resume Information
          </h2>

          {resumeData.contact && Object.keys(resumeData.contact).length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#667eea", fontSize: "16px", marginBottom: "12px" }}>📞 Contact Information</h3>
              <div style={{ backgroundColor: "#e3f2fd", padding: "15px", borderRadius: "8px", border: "2px solid #2196f3" }}>
                {resumeData.contact.email && <p style={{ margin: "5px 0", color: "#1565c0" }}><strong>📧 Email:</strong> {resumeData.contact.email}</p>}
                {resumeData.contact.phone && <p style={{ margin: "5px 0", color: "#1565c0" }}><strong>📱 Phone:</strong> {resumeData.contact.phone}</p>}
                {resumeData.contact.linkedin && <p style={{ margin: "5px 0", color: "#1565c0" }}><strong>🔗 LinkedIn:</strong> {resumeData.contact.linkedin}</p>}
              </div>
            </div>
          )}

          {resumeData.skills && resumeData.skills.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#667eea", fontSize: "16px", marginBottom: "12px" }}>💻 Skills ({resumeData.skills.length})</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {resumeData.skills.map((skill, index) => (
                  <span key={index} style={{
                    backgroundColor: "#667eea",
                    color: "white",
                    padding: "8px 15px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "500"
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resumeData.education && resumeData.education.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#667eea", fontSize: "16px", marginBottom: "12px" }}>🎓 Education ({resumeData.education.length})</h3>
              <ul style={{ paddingLeft: "20px", margin: 0 }}>
                {resumeData.education.map((edu, index) => (
                  <li key={index} style={{ marginBottom: "8px", color: "#333" }}>{edu}</li>
                ))}
              </ul>
            </div>
          )}

          {resumeData.experience && resumeData.experience.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#667eea", fontSize: "16px", marginBottom: "12px" }}>💼 Experience ({resumeData.experience.length})</h3>
              {resumeData.experience.map((exp, index) => (
                <div key={index} style={{ marginBottom: "15px", paddingBottom: "15px", borderBottom: index < resumeData.experience.length - 1 ? "1px solid #e0e0e0" : "none" }}>
                  <p style={{ fontWeight: "bold", margin: "0 0 5px 0", color: "#333" }}>{exp.title}</p>
                  {exp.description && (
                    <p style={{ color: "#666", marginTop: 0, fontSize: "14px" }}>
                      {Array.isArray(exp.description) ? exp.description.join(" ").substring(0, 200) : String(exp.description).substring(0, 200)}
                    </p>
                  )}
                  {exp.period && <p style={{ color: "#999", fontSize: "12px", margin: "5px 0 0 0" }}>{exp.period}</p>}
                </div>
              ))}
            </div>
          )}

          {resumeData.summary && (
            <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f0f4ff", borderRadius: "8px", borderLeft: "4px solid #667eea" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#667eea" }}>📋 Professional Summary</h4>
              <p style={{ margin: 0, color: "#333", fontSize: "14px" }}>{resumeData.summary}</p>
            </div>
          )}
        </section>
      )}

      {candidate.atsScore && (
        <section style={{
          backgroundColor: "white",
          padding: "25px",
          marginBottom: "20px",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h2 style={{ color: "#333", fontSize: "20px", marginBottom: "20px", borderBottom: "2px solid #667eea", paddingBottom: "10px" }}>
            🎯 ATS Score Analysis
          </h2>
          
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ fontSize: "56px", fontWeight: "bold", color: "#667eea", marginBottom: "10px" }}>
              {candidate.atsScore}/100
            </div>
            <p style={{ color: "#666", fontSize: "16px", margin: "0 0 5px 0", fontWeight: "600" }}>
              {candidate.atsScore >= 80 && "✅ Excellent - Well optimized for ATS"}
              {candidate.atsScore >= 60 && candidate.atsScore < 80 && "👍 Good - Some improvements needed"}
              {candidate.atsScore >= 40 && candidate.atsScore < 60 && "⚠️ Fair - Consider improvements"}
              {candidate.atsScore < 40 && "❌ Low - Major improvements recommended"}
            </p>
          </div>

          {/* Score Breakdown */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "#667eea" }}>
                💻 Skills Score
              </p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                {candidate.verificationDetails?.resumeSkills || 0} skills
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>40% weight</p>
            </div>

            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "#667eea" }}>
                💼 Experience
              </p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                {candidate.verificationDetails?.resumeExperience || 0} roles
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>30% weight</p>
            </div>

            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "#667eea" }}>
                🎓 Education
              </p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                {candidate.verificationDetails?.resumeEducation || 0} entries
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>20% weight</p>
            </div>

            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #e0e0e0"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "#667eea" }}>
                🔑 Keywords
              </p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                ✓ Matched
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>10% weight</p>
            </div>
          </div>

          {/* Score Bar */}
          <div style={{
            backgroundColor: "#f0f4ff",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "15px"
          }}>
            <div style={{
              height: "24px",
              backgroundColor: "#e0e0e0",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "8px"
            }}>
              <div style={{
                height: "100%",
                width: `${candidate.atsScore}%`,
                backgroundColor: candidate.atsScore >= 80 ? "#28a745" : candidate.atsScore >= 60 ? "#ffc107" : "#dc3545",
                transition: "width 0.3s ease"
              }}></div>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#666", textAlign: "center" }}>
              Score Progress: {candidate.atsScore}% of 100%
            </p>
          </div>

          {/* Gemini ATS Details */}
          {candidate.verificationDetails?.atsDetails && (
            <div style={{
              backgroundColor: "#f0f8ff",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #64b5f6",
              marginTop: "20px"
            }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "600", color: "#1976d2" }}>
                📊 {candidate.verificationDetails.atsDetails.source === "gemini-ai" ? "🤖 AI Analysis (Gemini)" : "⚙️ Hybrid Calculation"}
              </p>
              
              {candidate.verificationDetails.atsDetails.reasoning && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", fontWeight: "600", color: "#333" }}>
                    💡 Analysis:
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#555", lineHeight: "1.5" }}>
                    {candidate.verificationDetails.atsDetails.reasoning}
                  </p>
                </div>
              )}
              
              {candidate.verificationDetails.atsDetails.strengths && candidate.verificationDetails.atsDetails.strengths.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", fontWeight: "600", color: "#333" }}>
                    ✅ Strengths:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#555" }}>
                    {candidate.verificationDetails.atsDetails.strengths.map((strength, idx) => (
                      <li key={idx} style={{ marginBottom: "3px" }}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {candidate.verificationDetails.atsDetails.improvements && candidate.verificationDetails.atsDetails.improvements.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", fontWeight: "600", color: "#333" }}>
                    📈 Areas for Improvement:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#555" }}>
                    {candidate.verificationDetails.atsDetails.improvements.map((improvement, idx) => (
                      <li key={idx} style={{ marginBottom: "3px" }}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {candidate.verificationDetails.atsDetails.keywordMatches && (
                <p style={{ margin: "10px 0 0 0", fontSize: "11px", color: "#666", fontStyle: "italic" }}>
                  🔑 Key Terms Found: {Array.isArray(candidate.verificationDetails.atsDetails.keywordMatches) 
                    ? candidate.verificationDetails.atsDetails.keywordMatches.join(", ") 
                    : candidate.verificationDetails.atsDetails.keywordMatches}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {candidate.documents && candidate.documents.length > 0 && (
        <section style={{
          backgroundColor: "white",
          padding: "25px",
          marginBottom: "20px",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h2 style={{ color: "#333", fontSize: "20px", marginBottom: "20px", borderBottom: "2px solid #667eea", paddingBottom: "10px" }}>
            📋 Document Verification & Extraction
          </h2>
          
          {candidate.documents.map((doc) => {
            const isVerified = doc.status === "verified";
            const parsedData = doc.parsedData || {};
            const hasData = Object.keys(parsedData).length > 0;

            return (
              <div key={doc._id} style={{
                backgroundColor: isVerified ? "#d4edda" : "#fff3cd",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: isVerified ? "2px solid #28a745" : "2px solid #ffc107"
              }}>
                <h4 style={{ marginTop: 0, marginBottom: "15px", textTransform: "capitalize", color: isVerified ? "#155724" : "#856404", fontSize: "16px" }}>
                  {isVerified ? "✅" : "⚠️"} {doc.type.toUpperCase()}
                </h4>
                
                <p style={{ fontSize: "12px", color: "#888", margin: "5px 0" }}>
                  Status: <strong>{isVerified ? "Verified" : "Not Verified"}</strong> | Size: {(doc.fileSize / 1024).toFixed(2)} KB
                </p>

                {/* Show extracted data if available */}
                {hasData && (
                  <div style={{ backgroundColor: "#e8f5e9", padding: "15px", borderRadius: "6px", marginTop: "12px", border: "1px solid #4caf50" }}>
                    <h5 style={{ marginTop: 0, marginBottom: "10px", color: "#2e7d32", fontWeight: "600" }}>📋 Extracted Information:</h5>
                    
                    {/* Aadhar Data */}
                    {doc.type === "aadhar" && (
                      <div>
                        {parsedData.aadharNumber ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>🔢 Aadhar Number:</strong> {parsedData.aadharNumber}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>🔢 Aadhar Number:</strong> Not extracted</p>
                        )}
                        {parsedData.name ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>👤 Name:</strong> {parsedData.name}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>👤 Name:</strong> Not extracted</p>
                        )}
                        {parsedData.dob ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>📅 Date of Birth:</strong> {parsedData.dob}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>📅 Date of Birth:</strong> Not extracted</p>
                        )}
                        {parsedData.address ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>📍 Address:</strong> {parsedData.address}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>📍 Address:</strong> Not extracted</p>
                        )}
                      </div>
                    )}

                    {/* Marksheet Data */}
                    {(doc.type === "marksheet10" || doc.type === "marksheet12") && (
                      <div>
                        {parsedData.rollNumber ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>🎓 Roll Number:</strong> {parsedData.rollNumber}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>🎓 Roll Number:</strong> Not extracted</p>
                        )}
                        {parsedData.name ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>👤 Name:</strong> {parsedData.name}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>👤 Name:</strong> Not extracted</p>
                        )}
                        {parsedData.percentage ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>📊 Percentage:</strong> {parsedData.percentage}%</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>📊 Percentage:</strong> Not extracted</p>
                        )}
                        {parsedData.board ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>🏢 Board:</strong> {parsedData.board}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>🏢 Board:</strong> Not extracted</p>
                        )}
                        {parsedData.totalMarks ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>📈 Total Marks:</strong> {parsedData.totalMarks}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>📈 Total Marks:</strong> Not extracted</p>
                        )}
                        {parsedData.obtainedMarks ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>✅ Obtained Marks:</strong> {parsedData.obtainedMarks}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>✅ Obtained Marks:</strong> Not extracted</p>
                        )}
                        {parsedData.subjects && parsedData.subjects.length > 0 ? (
                          <p style={{ margin: "5px 0", color: "#333" }}><strong>📚 Subjects:</strong> {parsedData.subjects.join(", ")}</p>
                        ) : (
                          <p style={{ margin: "5px 0", color: "#999" }}><strong>📚 Subjects:</strong> Not extracted</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginTop: "40px", marginBottom: "40px" }}>
        <button onClick={onReset} style={{
          padding: "14px 35px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(40, 167, 69, 0.3)",
          transition: "all 0.3s ease"
        }} onMouseOver={(e) => e.target.style.backgroundColor = "#218838"} onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}>
          Submit Another Form
        </button>

        <button onClick={() => window.print()} style={{
          padding: "14px 35px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(108, 117, 125, 0.3)",
          transition: "all 0.3s ease"
        }} onMouseOver={(e) => e.target.style.backgroundColor = "#5a6268"} onMouseOut={(e) => e.target.style.backgroundColor = "#6c757d"}>
          Print Results
        </button>
      </div>
    </div>
  );
}
