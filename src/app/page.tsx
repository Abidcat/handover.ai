'use client';

import React, { useState, useCallback } from 'react';

type GenerationType = 'summary' | 'cursor' | 'readme';

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<GenerationType | null>(null);
  const [results, setResults] = useState<{
    readme?: string;
    cursorLog?: string;
    summary?: string;
  }>({});
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptedFileTypes = ['.md', '.txt', '.js', '.ts'];
  const acceptedMimeTypes = ['text/markdown', 'text/plain', 'text/javascript', 'application/javascript'];

  const getLoadingText = (type: GenerationType) => {
    switch (type) {
      case 'summary': return 'Generating summary...';
      case 'cursor': return 'Generating cursor context...';
      case 'readme': return 'Generating README...';
      default: return 'Generating...';
    }
  };

  const isValidFile = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedFileTypes.includes(extension) || acceptedMimeTypes.includes(file.type);
  };

  const hasRequiredFiles = () => {
    const hasMarkdown = uploadedFiles.some(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return ['.md', '.txt'].includes(ext);
    });
    const hasCode = uploadedFiles.some(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return ['.js', '.ts'].includes(ext);
    });
    return hasMarkdown && hasCode;
  };

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(isValidFile);
    
    if (validFiles.length !== fileArray.length) {
      setError('Some files were rejected. Please upload only .md, .txt, .js, or .ts files.');
      setTimeout(() => setError(''), 3000);
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const generateContent = async (type: GenerationType) => {
    if (!hasRequiredFiles()) {
      setError('Please upload at least one chat file (.md or .txt) and one code file (.js or .ts).');
      return;
    }

    setIsLoading(true);
    setLoadingType(type);
    setError('');

    try {
      // Find the first markdown/txt file
      const markdownFile = uploadedFiles.find(f => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        return ['.md', '.txt'].includes(ext);
      });

      // Find the first js/ts file
      const codeFile = uploadedFiles.find(f => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        return ['.js', '.ts'].includes(ext);
      });

      if (!markdownFile || !codeFile) {
        throw new Error('Required file types not found');
      }

      // Read file contents
      const [markdownContent, codeContent] = await Promise.all([
        readFileContent(markdownFile),
        readFileContent(codeFile)
      ]);

      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: markdownContent.trim(),
          code: codeContent.trim(),
          type: type // Pass the type to the backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update results based on type
      setResults(prev => ({
        ...prev,
        ...(type === 'summary' && { summary: data.summary }),
        ...(type === 'readme' && { readme: data.readme }),
        ...(type === 'cursor' && { cursorLog: data.cursorLog })
      }));
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/25 border border-green-500/20">
            <svg width="48" height="48" viewBox="0 0 120 120" className="text-green-400">
              {/* Hand */}
              <path
                d="M40 30 C40 25 42 20 47 20 C52 20 55 25 55 30 L55 50 L60 50 L60 25 C60 20 62 15 67 15 C72 15 75 20 75 25 L75 50 L80 50 L80 30 C80 25 82 20 87 20 C92 20 95 25 95 30 L95 55 L85 55 L85 70 C85 75 82 80 77 80 L50 80 C45 80 40 75 40 70 L40 65 L35 65 C30 65 25 60 25 55 C25 50 30 45 35 45 L40 45 L40 30 Z"
                fill="currentColor"
              />
              
              {/* Orbital Ring 1 */}
              <ellipse
                cx="60"
                cy="60"
                rx="50"
                ry="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                opacity="0.7"
                transform="rotate(-25 60 60)"
              />
              
              {/* Orbital Ring 2 */}
              <ellipse
                cx="60"
                cy="60"
                rx="50"
                ry="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                opacity="0.5"
                transform="rotate(25 60 60)"
              />
              
              {/* Orbital Dots */}
              <circle cx="105" cy="45" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="15" cy="75" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="90" cy="85" r="3" fill="currentColor" opacity="0.7" />
              <circle cx="30" cy="35" r="3" fill="currentColor" opacity="0.7" />
            </svg>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8 max-w-4xl">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4 tracking-tight">
            Eliminate <span className="text-green-400">handoff friction</span> in seconds.
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            <span className="text-green-400 font-mono tracking-wider">Handoff.ai</span> is your superhuman development documentation assistant.
          </p>
        </div>

        {/* Main Upload Area */}
        <div className="w-full max-w-3xl mb-8">
          <div
            className={`relative bg-gray-800/50 backdrop-blur border rounded-2xl p-8 transition-all duration-300 ${
              isDragOver
                ? 'border-green-400 bg-green-900/20 shadow-2xl shadow-green-500/25'
                : 'border-gray-600 hover:border-green-500/50 hover:bg-gray-800/70'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".md,.txt,.js,.ts"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-2xl font-medium text-white">
                  Drop your chat history and code files here
                </span>
              </div>
              <p className="text-gray-400 text-lg">
                Supports .md, .txt (chat logs) and .js, .ts (code files)
              </p>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-2">
                {uploadedFiles.map((file, index) => {
                  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
                  const isChat = ['.md', '.txt'].includes(extension);
                  const isCode = ['.js', '.ts'].includes(extension);
                  
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          isChat ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' :
                          isCode ? 'bg-green-600/20 text-green-300 border border-green-500/30' :
                          'bg-gray-600/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {isChat ? 'CHAT' : isCode ? 'CODE' : 'FILE'}
                        </span>
                        <span className="text-white font-medium">{file.name}</span>
                        <span className="text-gray-400 text-sm">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-500/10"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Requirements Status */}
            <div className="mt-6 flex items-center justify-center space-x-8 text-sm">
              <div className={`flex items-center space-x-2 ${
                uploadedFiles.some(f => ['.md', '.txt'].includes('.' + f.name.split('.').pop()?.toLowerCase()))
                  ? 'text-green-400' : 'text-gray-500'
              }`}>
                <span>📝</span>
                <span>Chat file</span>
                {uploadedFiles.some(f => ['.md', '.txt'].includes('.' + f.name.split('.').pop()?.toLowerCase())) && <span>✓</span>}
              </div>
              <div className={`flex items-center space-x-2 ${
                uploadedFiles.some(f => ['.js', '.ts'].includes('.' + f.name.split('.').pop()?.toLowerCase()))
                  ? 'text-green-400' : 'text-gray-500'
              }`}>
                <span>💻</span>
                <span>Code file</span>
                {uploadedFiles.some(f => ['.js', '.ts'].includes('.' + f.name.split('.').pop()?.toLowerCase())) && <span>✓</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <button
            onClick={() => generateContent('summary')}
            disabled={isLoading || !hasRequiredFiles()}
            className="bg-gray-800/80 hover:bg-gray-700/80 disabled:bg-gray-800/40 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 border border-gray-600/50 hover:border-green-500/50 backdrop-blur"
          >
            {isLoading && loadingType === 'summary' ? (
              <React.Fragment>
                <svg className="animate-spin h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{getLoadingText('summary')}</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span>📊</span>
                <span>Summarize</span>
              </React.Fragment>
            )}
          </button>
          
          <button
            onClick={() => generateContent('cursor')}
            disabled={isLoading || !hasRequiredFiles()}
            className="bg-gray-800/80 hover:bg-gray-700/80 disabled:bg-gray-800/40 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 border border-gray-600/50 hover:border-green-500/50 backdrop-blur"
          >
            {isLoading && loadingType === 'cursor' ? (
              <React.Fragment>
                <svg className="animate-spin h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{getLoadingText('cursor')}</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span>🔄</span>
                <span>Cursor Context</span>
              </React.Fragment>
            )}
          </button>
          
          <button
            onClick={() => generateContent('readme')}
            disabled={isLoading || !hasRequiredFiles()}
            className="bg-gray-800/80 hover:bg-gray-700/80 disabled:bg-gray-800/40 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 border border-gray-600/50 hover:border-green-500/50 backdrop-blur"
          >
            {isLoading && loadingType === 'readme' ? (
              <React.Fragment>
                <svg className="animate-spin h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{getLoadingText('readme')}</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span>📄</span>
                <span>README</span>
              </React.Fragment>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 max-w-2xl w-full">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 backdrop-blur">
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Display */}
      {(results.readme || results.cursorLog || results.summary) && (
        <div className="px-4 pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Summary Section */}
            {results.summary && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center space-x-3">
                    <span>📊</span>
                    <span className="text-green-400">Summary</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(results.summary!)}
                    className="text-sm bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-200 px-4 py-2 rounded-lg transition-colors backdrop-blur"
                  >
                    📋 Copy
                  </button>
                </h2>
                <div className="bg-black/50 border border-gray-600/50 rounded-xl p-4 max-h-96 overflow-y-auto backdrop-blur">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                    {results.summary}
                  </pre>
                </div>
              </div>
            )}

            {/* README Section */}
            {results.readme && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center space-x-3">
                    <span>📄</span>
                    <span className="text-blue-400">README.md</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(results.readme!)}
                    className="text-sm bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-200 px-4 py-2 rounded-lg transition-colors backdrop-blur"
                  >
                    📋 Copy
                  </button>
                </h2>
                <div className="bg-black/50 border border-gray-600/50 rounded-xl p-4 max-h-96 overflow-y-auto backdrop-blur">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                    {results.readme}
                  </pre>
                </div>
              </div>
            )}

            {/* Cursor Log Section */}
            {results.cursorLog && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center space-x-3">
                    <span>🔄</span>
                    <span className="text-purple-400">Cursor Context</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(results.cursorLog!)}
                    className="text-sm bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-200 px-4 py-2 rounded-lg transition-colors backdrop-blur"
                  >
                    📋 Copy
                  </button>
                </h2>
                <div className="bg-black/50 border border-gray-600/50 rounded-xl p-4 max-h-96 overflow-y-auto backdrop-blur">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                    {results.cursorLog}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-6">
        <p>Built with Next.js, TailwindCSS, and <span className="text-green-400 font-medium">NVIDIA NIM</span> • Powered by AI</p>
      </footer>
    </div>
  );
}
