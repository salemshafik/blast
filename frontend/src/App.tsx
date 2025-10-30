import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Marketing SaaS Application
        </h1>
        <p className="text-gray-600 mb-6">
          AI-Powered Marketing Content Generator
        </p>
        <div className="space-y-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCount((count) => count + 1)}
          >
            Count: {count}
          </button>
          <div className="text-sm text-gray-500">
            <p>Backend API: Ready to connect</p>
            <p>Google Cloud AI: Ready to integrate</p>
            <p>Campaign Management: Available</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
