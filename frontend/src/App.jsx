import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CustomCursor from './components/CustomCursor'

const TypewriterText = ({ text }) => {
  const words = text.split(" ");
  return (
    <p className="text-[#8892b0] text-sm leading-relaxed font-mono">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05, delay: i * 0.03 }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
};

function App() {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGrading, setIsGrading] = useState(false);
  const [healthData, setHealthData] = useState(null);

  // Generate and manage object URLs for image previews to prevent memory leaks
  useEffect(() => {
    if (!frontImage) {
      setFrontPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(frontImage);
    setFrontPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [frontImage]);

  useEffect(() => {
    if (!backImage) {
      setBackPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(backImage);
    setBackPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [backImage]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!frontImage && !backImage) {
      setError("Please upload at least one image.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setHealthData(null);
    setIsGrading(false);

    const formData = new FormData();
    if (frontImage) formData.append("front_image", frontImage);
    if (backImage) formData.append("back_image", backImage);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to scan product. Is the backend running?");
      }

      const data = await response.json();
      setResult(data);

      if (data.ingredients || data.nutrition) {
        setIsGrading(true);
        fetch("http://127.0.0.1:8000/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: data.brand,
            net_weight: data.net_weight,
            ingredients: data.ingredients,
            nutrition: data.nutrition
          })
        })
        .then(res => res.json())
        .then(gradeRes => {
          if (!gradeRes.error) {
            setHealthData(gradeRes);
          }
        })
        .catch(err => console.error("Grading error:", err))
        .finally(() => setIsGrading(false));
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomCursor />
      
      <div className="min-h-screen bg-black text-[#ccd6f6] font-grotesk py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* subtle bg grid */}
        <div className="absolute inset-0 grid-background opacity-20 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 fade-in-up">
          
          <header className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              <span className="text-gradient">Nutrition</span> Extractor
            </h1>
            <p className="text-[#8892b0] text-lg max-w-2xl mx-auto font-mono">
              Upload front and back product images to extract nutritional information and receive an AI health analysis.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-12">
            
            <form onSubmit={handleScan} className="github-card flex flex-col gap-8 relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="flex flex-col gap-3 group">
                  <label className="font-mono text-sm text-[#64ffda] uppercase tracking-wider">
                    Front Image (Brand / Weight)
                  </label>
                  <div className="relative border-2 border-dashed border-[#3a3a3a] rounded-lg p-6 bg-[#111111] hover:border-[#64ffda] transition-colors duration-300">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 z-20"
                      style={{ cursor: 'none' }}
                      onChange={(e) => setFrontImage(e.target.files[0])}
                      data-cursor-hover
                    />
                    {frontPreview && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-50 blur-[2px] transition-all group-hover:opacity-70 group-hover:blur-none z-10 rounded-lg pointer-events-none" 
                        style={{ backgroundImage: `url(${frontPreview})` }}
                      ></div>
                    )}
                    <div className="text-center text-[#8892b0] font-mono text-sm pointer-events-none relative z-30">
                      {frontImage ? <span className="bg-black/70 px-3 py-1 rounded text-[#64ffda] shadow-lg">{frontImage.name}</span> : "Click or drag file here"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 group">
                  <label className="font-mono text-sm text-[#64ffda] uppercase tracking-wider">
                    Back Image (Nutrition)
                  </label>
                  <div className="relative border-2 border-dashed border-[#3a3a3a] rounded-lg p-6 bg-[#111111] hover:border-[#64ffda] transition-colors duration-300">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 z-20"
                      style={{ cursor: 'none' }}
                      onChange={(e) => setBackImage(e.target.files[0])}
                      data-cursor-hover
                    />
                    {backPreview && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-50 blur-[2px] transition-all group-hover:opacity-70 group-hover:blur-none z-10 rounded-lg pointer-events-none" 
                        style={{ backgroundImage: `url(${backPreview})` }}
                      ></div>
                    )}
                    <div className="text-center text-[#8892b0] font-mono text-sm pointer-events-none relative z-30">
                      {backImage ? <span className="bg-black/70 px-3 py-1 rounded text-[#64ffda] shadow-lg">{backImage.name}</span> : "Click or drag file here"}
                    </div>
                  </div>
                </div>

              </div>

              <button 
                type="submit" 
                disabled={loading} 
                data-cursor-hover
                className="w-full bg-[#111111] border border-[#64ffda] text-[#64ffda] font-mono py-4 px-8 rounded-lg hover:bg-[#64ffda]/10 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest mt-4"
                style={{ cursor: loading ? 'not-allowed' : 'none' }}
              >
                {loading ? "Processing..." : "Analyze Product"}
              </button>
            </form>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-6 rounded-lg font-mono text-sm text-center scale-in">
                {error}
              </div>
            )}

            {result && (
              <div className="github-card scale-in relative z-20">
                <h2 className="text-2xl font-bold text-[#ccd6f6] mb-8 border-b border-[#2a2a2a] pb-4 font-mono">
                  <span className="text-[#64ffda] mr-2">~/</span>Results
                </h2>

                {/* AI Health Grade Section */}
                {(isGrading || healthData) && (
                  <div className="mb-10 p-6 rounded-lg border border-[#2a2a2a] bg-[#111111] relative overflow-hidden group" data-cursor-hover>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#64ffda]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                      {isGrading ? (
                        <>
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-[#3a3a3a] border-t-[#64ffda] animate-spin bg-black">
                          </div>
                          <div className="flex flex-col gap-2 mt-2 md:mt-0 justify-center h-24">
                            <h3 className="text-lg font-bold text-[#ccd6f6] flex items-center gap-2 animate-pulse">
                              <span className="text-[#64ffda]">✧</span> Generating health report...
                            </h3>
                          </div>
                        </>
                      ) : healthData?.health_grade ? (
                        <>
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-[#64ffda] shadow-[0_0_15px_rgba(100,255,218,0.2)] bg-black">
                            <span className="text-4xl font-bold text-[#64ffda] font-mono">{healthData.health_grade}</span>
                          </div>
                          <div className="flex flex-col gap-2 mt-2 md:mt-0">
                            <h3 className="text-lg font-bold text-[#ccd6f6] flex items-center gap-2">
                              <span className="text-[#64ffda]">✧</span> AI Health Analysis
                            </h3>
                            <TypewriterText text={healthData.health_explanation} />
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* YOLO Bounding Box Images Section */}
                {(result.front_annotated || result.back_annotated) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8" data-cursor-hover>
                    {result.front_annotated && (
                      <div className="flex flex-col gap-3">
                        <span className="font-mono text-xs text-[#8892b0] uppercase tracking-wider text-center">Front Detection</span>
                        <img 
                          src={result.front_annotated} 
                          alt="Front detection" 
                          className="w-full rounded-lg border border-[#2a2a2a] hover:border-[#64ffda] transition-colors duration-300 object-contain max-h-96"
                        />
                      </div>
                    )}
                    {result.back_annotated && (
                      <div className="flex flex-col gap-3">
                        <span className="font-mono text-xs text-[#8892b0] uppercase tracking-wider text-center">Back Detection</span>
                        <img 
                          src={result.back_annotated} 
                          alt="Back detection" 
                          className="w-full rounded-lg border border-[#2a2a2a] hover:border-[#64ffda] transition-colors duration-300 object-contain max-h-96"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                  <div className="flex flex-col gap-2" data-cursor-hover>
                    <span className="font-mono text-xs text-[#8892b0] uppercase tracking-wider">Brand</span>
                    <span className="text-xl text-[#ccd6f6]">{result.brand || "Not identified"}</span>
                  </div>
                  <div className="flex flex-col gap-2" data-cursor-hover>
                    <span className="font-mono text-xs text-[#8892b0] uppercase tracking-wider">Net Weight</span>
                    <span className="text-xl text-[#ccd6f6]">{result.net_weight || "Not identified"}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex flex-col gap-3" data-cursor-hover>
                    <span className="font-mono text-xs text-[#8892b0] uppercase tracking-wider">Ingredients</span>
                    <div className="bg-[#111111] border border-[#2a2a2a] p-5 rounded-lg text-sm text-[#ccd6f6] leading-relaxed">
                      {result.ingredients || "Not identified"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3" data-cursor-hover>
                    <span className="font-mono text-xs text-[#8892b0] uppercase tracking-wider">Nutrition</span>
                    <div className="bg-[#111111] border border-[#2a2a2a] p-5 rounded-lg text-sm text-[#ccd6f6] leading-relaxed">
                      {result.nutrition || "Not identified"}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  )
}

export default App
