'use client'

import { useState } from 'react'
import AssessmentForm from '@/components/AssessmentForm'
import ChecklistAssessment from '@/components/ChecklistAssessment'
import ResultsDisplay from '@/components/ResultsDisplay'

export default function Home() {
  const [currentStep, setCurrentStep] = useState('form') // 'form', 'checklist', 'results'
  const [formData, setFormData] = useState(null)
  const [assessmentResult, setAssessmentResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFormComplete = (result: any) => {
    if (result.showChecklist) {
      setFormData(result.formData)
      setCurrentStep('checklist')
    } else {
      setAssessmentResult(result)
      setCurrentStep('results')
    }
  }

  const handleChecklistComplete = (result: any) => {
    setAssessmentResult(result)
    setCurrentStep('results')
  }

  const handleBackToForm = () => {
    setCurrentStep('form')
  }

  const handleReset = () => {
    setCurrentStep('form')
    setFormData(null)
    setAssessmentResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🛡️</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">FinAIReadiness</h1>
                <p className="text-sm text-gray-600">Enterprise AI Risk Assessment</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
              <span>Framework v2.0</span>
              <span>•</span>
              <span>Industry Standard</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {currentStep === 'form' && (
            <div>
              {/* Hero Section */}
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  FinAIReadiness Assessment
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Evaluate your AI system's compliance with industry-standard framework.<br/>
                  Get intelligent analysis and actionable recommendations.
                </p>
              </div>

              {/* Assessment Form */}
              <AssessmentForm 
                onComplete={handleFormComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          )}
          
          {currentStep === 'checklist' && (
            <ChecklistAssessment
              formData={formData}
              onComplete={handleChecklistComplete}
              onBack={handleBackToForm}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
          
          {currentStep === 'results' && (
            <div>
              <ResultsDisplay 
                result={assessmentResult} 
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span>© 2025 FinAIReadiness Assessment</span>
              <span>•</span>
              <span>Built for AI Governance Hackathon</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="hover:text-gray-700 transition-colors">Documentation</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Framework</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
