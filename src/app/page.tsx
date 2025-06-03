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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            🤝 <span className="text-green-500 font-mono tracking-wider">Handoff.ai</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Generate human-readable summaries and Cursor-style replay logs from your AI-assisted development sessions.
            <br />
            <span className="text-green-500 font-medium">Perfect for handing off work to other engineers.</span>
          </p>
        </div>

        {/* Main Form */}
        <div className="max-w-4xl mx-auto">
          {/* File Upload Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 mb-6">
            <label className="block text-sm font-medium text-green-500 mb-4">
              📁 Upload your chat history and final code
            </label>
            
            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                isDragOver
                  ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-500/20'
                  : 'border-gray-600 hover:border-green-600 hover:bg-gray-700/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <svg className="h-12 w-12 text-green-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-lg font-medium text-white">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports .md, .txt (chat logs) and .js, .ts (code files)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".md,.txt,.js,.ts"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-md transition-colors font-medium shadow-lg hover:shadow-green-600/25"
                >
                  Choose Files
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-green-500">Uploaded Files:</h4>
                {uploadedFiles.map((file, index) => {
                  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
                  const isChat = ['.md', '.txt'].includes(extension);
                  const isCode = ['.js', '.ts'].includes(extension);
                  
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-700 border border-gray-600 rounded-md p-3">
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          isChat ? 'bg-blue-600 text-blue-100' :
                          isCode ? 'bg-green-700 text-green-100' :
                          'bg-gray-600 text-gray-100'
                        }`}>
                          {isChat ? 'CHAT' : isCode ? 'CODE' : 'FILE'}
                        </span>
                        <span className="text-sm text-white font-medium">{file.name}</span>
                        <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
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
            <div className="mt-4 p-3 bg-gray-700 border border-gray-600 rounded-md">
              <div className="flex items-center space-x-4 text-sm">
                <div className={`flex items-center space-x-2 ${
                  uploadedFiles.some(f => ['.md', '.txt'].includes('.' + f.name.split('.').pop()?.toLowerCase()))
                    ? 'text-green-500' : 'text-gray-400'
                }`}>
                  <span>📝</span>
                  <span>Chat file (.md/.txt)</span>
                  {uploadedFiles.some(f => ['.md', '.txt'].includes('.' + f.name.split('.').pop()?.toLowerCase())) && <span>✓</span>}
                </div>
                <div className={`flex items-center space-x-2 ${
                  uploadedFiles.some(f => ['.js', '.ts'].includes('.' + f.name.split('.').pop()?.toLowerCase()))
                    ? 'text-green-500' : 'text-gray-400'
                }`}>
                  <span>💻</span>
                  <span>Code file (.js/.ts)</span>
                  {uploadedFiles.some(f => ['.js', '.ts'].includes('.' + f.name.split('.').pop()?.toLowerCase())) && <span>✓</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => generateContent('summary')}
              disabled={isLoading || !hasRequiredFiles()}
              className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-green-600/25 border border-green-600/50"
            >
              {isLoading && loadingType === 'summary' ? (
                <React.Fragment>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getLoadingText('summary')}
                </React.Fragment>
              ) : (
                '📊 Summarize'
              )}
            </button>
            
            <button
              onClick={() => generateContent('cursor')}
              disabled={isLoading || !hasRequiredFiles()}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-purple-500/25 border border-purple-500/50"
            >
              {isLoading && loadingType === 'cursor' ? (
                <React.Fragment>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getLoadingText('cursor')}
                </React.Fragment>
              ) : (
                '🔄 Cursor Context'
              )}
            </button>
            
            <button
              onClick={() => generateContent('readme')}
              disabled={isLoading || !hasRequiredFiles()}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-blue-500/25 border border-blue-500/50"
            >
              {isLoading && loadingType === 'readme' ? (
                <React.Fragment>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getLoadingText('readme')}
                </React.Fragment>
              ) : (
                '📄 README'
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-200">Error</h3>
                  <p className="mt-1 text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {(results.readme || results.cursorLog || results.summary) && (
            <div className="space-y-6">
              {/* Summary Section */}
              {results.summary && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    📊 <span className="text-green-500">Summary</span>
                    <button
                      onClick={() => copyToClipboard(results.summary!)}
                      className="ml-auto text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 px-3 py-1 rounded transition-colors"
                    >
                      📋 Copy
                    </button>
                  </h2>
                  <div className="bg-black border border-gray-600 rounded-md p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                      {results.summary}
                    </pre>
                  </div>
                </div>
              )}

              {/* README Section */}
              {results.readme && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    📄 <span className="text-blue-500">README.md</span>
                    <button
                      onClick={() => copyToClipboard(results.readme!)}
                      className="ml-auto text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 px-3 py-1 rounded transition-colors"
                    >
                      📋 Copy
                    </button>
                  </h2>
                  <div className="bg-black border border-gray-600 rounded-md p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                      {results.readme}
                    </pre>
                  </div>
                </div>
              )}

              {/* Cursor Log Section */}
              {results.cursorLog && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    🔄 <span className="text-purple-500">Cursor Context</span>
                    <button
                      onClick={() => copyToClipboard(results.cursorLog!)}
                      className="ml-auto text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 px-3 py-1 rounded transition-colors"
                    >
                      📋 Copy
                    </button>
                  </h2>
                  <div className="bg-black border border-gray-600 rounded-md p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                      {results.cursorLog}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>Built with Next.js, TailwindCSS, and <span className="text-green-500 font-medium">NVIDIA NIM</span> • Powered by AI</p>
        </footer>
      </div>
    </div>
  );
}
