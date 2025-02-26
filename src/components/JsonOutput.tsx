import React from 'react';

interface JsonOutputProps {
  jsonOutput: string;
}

function JsonOutput({ jsonOutput }: JsonOutputProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonOutput);
    alert('JSON copied to clipboard!');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">JSON Output</h2>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
        >
          Copy
        </button>
      </div>
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-sm text-gray-800 dark:text-gray-300 max-h-[600px]">
        {jsonOutput || '{}'}
      </pre>
    </div>
  );
}

export default JsonOutput; 
