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
    <div className="min-h-screen modern-gradient relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-xl"></div>
        <div className="floating-element absolute top-40 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-2xl" style={{animationDelay: '2s'}}></div>
        <div className="floating-element absolute bottom-20 left-1/3 w-80 h-80 bg-blue-300/15 rounded-full blur-xl" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🛡️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">FINOS AI Governance</h1>
                  <p className="text-white/70 text-sm">Enterprise AI Risk Assessment</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-white/80 text-sm">
                <span>Framework v2.0</span>
                <span>•</span>
                <span>Industry Standard</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {currentStep === 'form' && (
              <div className="fade-in">
                {/* Hero Section */}
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                    AI Risk Assessment
                  </h2>
                  <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                    Evaluate your AI system's compliance with industry-standard FINOS framework. 
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
              <div className="fade-in">
                <ResultsDisplay 
                  result={assessmentResult} 
                  onReset={handleReset}
                />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between text-white/60 text-sm">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <span>© 2025 FINOS AI Governance Assessment</span>
                <span>•</span>
                <span>Built for AI Governance Hackathon</span>
              </div>
              <div className="flex items-center space-x-6">
                <a href="#" className="hover:text-white transition-colors">Documentation</a>
                <a href="#" className="hover:text-white transition-colors">Framework</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
