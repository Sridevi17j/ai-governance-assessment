'use client'

import { useState } from 'react'

interface AssessmentFormProps {
  onComplete: (result: any) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function AssessmentForm({ onComplete, isLoading, setIsLoading }: AssessmentFormProps) {
  const [formData, setFormData] = useState({
    productName: '',
    productManagerName: '',
    productManagerEmail: '',
    aiModel: '',
    useCase: '',
    dataSensitivity: '',
    industry: '',
    accuracyReq: '',
    hasRiskAssessment: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    return formData.productName && formData.productManagerName && formData.productManagerEmail &&
           formData.aiModel && formData.useCase && 
           formData.dataSensitivity && formData.accuracyReq && formData.hasRiskAssessment
  }

  const submitAssessment = async () => {
    if (!isFormValid()) {
      alert('Please fill in all fields before submitting')
      return
    }
    
    // If user hasn't conducted risk assessment, proceed with normal flow
    if (formData.hasRiskAssessment === 'no') {
      setIsLoading(true)
      try {
        const response = await fetch('/api/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userInputs: formData,
            hasRiskAssessment: false 
          })
        })

        const result = await response.json()
        if (result.success) {
          onComplete(result.assessment)
        } else {
          alert('Assessment failed: ' + result.error)
        }
      } catch (error) {
        alert('Error performing assessment')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    } else if (formData.hasRiskAssessment === 'yes') {
      // Proceed to checklist page
      onComplete({ showChecklist: true, formData })
    } else {
      alert('Please select whether you have conducted AI Risk Assessment')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            FINAI Readiness Questionnaire
          </h2>
          <p className="text-lg md:text-xl text-gray-300">
            Complete your AI system assessment
          </p>
        </div>
        
        {/* Single Form with All Fields */}
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Product Information */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-3xl">📝</span>
              Product Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  placeholder="Enter your product name"
                  className={`w-full p-4 backdrop-blur-sm border rounded-2xl text-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all placeholder-white/50 ${
                    formData.productName 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-cyan-400 text-white shadow-xl' 
                      : 'bg-white/20 border-white/30 text-white'
                  }`}
                />
              </div>
              
              {/* Product Manager Name */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Product Manager Name
                </label>
                <input
                  type="text"
                  value={formData.productManagerName}
                  onChange={(e) => handleInputChange('productManagerName', e.target.value)}
                  placeholder="Enter product manager name"
                  className={`w-full p-4 backdrop-blur-sm border rounded-2xl text-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all placeholder-white/50 ${
                    formData.productManagerName 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-cyan-400 text-white shadow-xl' 
                      : 'bg-white/20 border-white/30 text-white'
                  }`}
                />
              </div>
              
              {/* Product Manager Email - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Product Manager Email
                </label>
                <input
                  type="email"
                  value={formData.productManagerEmail}
                  onChange={(e) => handleInputChange('productManagerEmail', e.target.value)}
                  placeholder="Enter product manager email"
                  className={`w-full p-4 backdrop-blur-sm border rounded-2xl text-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all placeholder-white/50 ${
                    formData.productManagerEmail 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-cyan-400 text-white shadow-xl' 
                      : 'bg-white/20 border-white/30 text-white'
                  }`}
                />
              </div>
            </div>
          </div>
          
          {/* AI Model Type */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-3xl">🤖</span>
              AI Model Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { value: 'selfHosted', label: 'Self-Hosted', desc: 'Own infrastructure, full control', icon: '🏠' },
                { value: 'apiBased', label: 'API Based', desc: 'OpenAI, Anthropic, APIs', icon: '🔌' },
                { value: 'thirdParty', label: 'Third-Party', desc: 'AWS, Azure, GCP Cloud hosted', icon: '☁️' }
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleInputChange('aiModel', option.value)}
                  className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    formData.aiModel === option.value 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-xl' 
                      : 'bg-white/20 hover:bg-white/30 border border-white/30'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl">{option.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-white mb-2">{option.label}</h4>
                      <p className="text-white/80 text-sm">{option.desc}</p>
                    </div>
                    {formData.aiModel === option.value && (
                      <div className="text-white">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Use Case */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-3xl">🎯</span>
              Primary Use Case
            </h3>
            <div className="relative">
              <select 
                value={formData.useCase}
                onChange={(e) => handleInputChange('useCase', e.target.value)}
                className={`w-full p-4 backdrop-blur-sm border rounded-2xl text-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all appearance-none cursor-pointer ${
                  formData.useCase 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-cyan-400 text-white shadow-xl' 
                    : 'bg-white/20 border-white/30 text-white'
                }`}
              >
                <option value="" className="bg-slate-700/90 text-slate-300">Select your primary use case</option>
                <option value="customerService" className="bg-slate-600/90 text-white">Customer Service & Support</option>
                <option value="documentAnalysis" className="bg-slate-600/90 text-white">Document Analysis & Processing</option>
                <option value="codeGeneration" className="bg-slate-600/90 text-white">Code Generation & Development</option>
                <option value="dataAnalysis" className="bg-slate-600/90 text-white">Data Analysis & Insights</option>
                <option value="contentGeneration" className="bg-slate-600/90 text-white">Content Creation & Marketing</option>
                <option value="decisionSupport" className="bg-slate-600/90 text-white">Decision Support Systems</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                {formData.useCase && (
                  <div className="text-white mr-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Data Sensitivity */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-3xl">🔒</span>
              Data Sensitivity Level
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { value: 'public', label: 'Public', desc: 'Publicly available information', icon: '🌐' },
                { value: 'internal', label: 'Internal', desc: 'Company internal data', icon: '🏢' },
                { value: 'confidential', label: 'Confidential', desc: 'Sensitive business data', icon: '🔐' },
                { value: 'restricted', label: 'Restricted', desc: 'PII, financial, regulated data', icon: '🚨' }
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleInputChange('dataSensitivity', option.value)}
                  className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    formData.dataSensitivity === option.value 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-xl' 
                      : 'bg-white/20 hover:bg-white/30 border border-white/30'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl">{option.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-white mb-2">{option.label}</h4>
                      <p className="text-white/80 text-sm">{option.desc}</p>
                    </div>
                    {formData.dataSensitivity === option.value && (
                      <div className="text-white">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accuracy Requirements */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-3xl">🎯</span>
              Accuracy Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { value: 'low', label: 'Low', desc: 'Creative or exploratory use', icon: '🎨' },
                { value: 'moderate', label: 'Moderate', desc: 'General guidance and support', icon: '📋' },
                { value: 'high', label: 'High', desc: 'Business-critical information', icon: '⚡' },
                { value: 'critical', label: 'Critical', desc: 'Regulatory compliance, financial decisions', icon: '🚨' }
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleInputChange('accuracyReq', option.value)}
                  className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    formData.accuracyReq === option.value 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-xl' 
                      : 'bg-white/20 hover:bg-white/30 border border-white/30'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl">{option.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-white mb-2">{option.label}</h4>
                      <p className="text-white/80 text-sm">{option.desc}</p>
                    </div>
                    {formData.accuracyReq === option.value && (
                      <div className="text-white">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Risk Assessment Question */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-3xl">📋</span>
              AI Risk Assessment Status
            </h3>
            <div className="mb-6">
              <p className="text-white/80 mb-6">
                Have you conducted AI Risk Assessment for this system before?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { value: 'yes', label: 'Yes', desc: 'I have implemented risk controls', icon: '✅' },
                  { value: 'no', label: 'No', desc: 'This is my first assessment', icon: '📝' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleInputChange('hasRiskAssessment', option.value)}
                    className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      formData.hasRiskAssessment === option.value 
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-xl' 
                        : 'bg-white/20 hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <span className="text-4xl">{option.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-white mb-2">{option.label}</h4>
                        <p className="text-white/80 text-sm">{option.desc}</p>
                      </div>
                      {formData.hasRiskAssessment === option.value && (
                        <div className="text-white">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="backdrop-blur-md bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl p-8 border border-white/20 text-center">
            <div className="mb-6">
              <span className="text-6xl">🚀</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              {formData.hasRiskAssessment === 'yes' ? 'Ready for Implementation Review' : 'Ready for AI Analysis'}
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {formData.hasRiskAssessment === 'yes' 
                ? 'We\'ll review your current implementations against the FINOS framework and identify any gaps or improvements.'
                : 'Our advanced AI will analyze your system against the FINOS framework and provide comprehensive risk assessment with actionable recommendations.'
              }
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { icon: '📈', label: 'Risk Scores' },
                { icon: '🎯', label: 'Recommendations' },
                { icon: '📋', label: 'Compliance Report' },
                { icon: '🔗', label: 'FINOS Links' }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-white/80 text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            
            {/* Submit Button */}
            <button
              onClick={submitAssessment}
              disabled={isLoading || !isFormValid()}
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 mx-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>🧠</span>
                  <span>Get AI Assessment</span>
                </>
              )}
            </button>
            
            {!isFormValid() && (
              <p className="text-yellow-300 text-sm mt-4">
                Please fill in all fields to enable assessment
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
