'use client'

import { useState } from 'react'
import { checklistQuestions, categoryInfo, ChecklistData, ChecklistResponse, ChecklistAnswer } from './checklistData'

interface ChecklistAssessmentProps {
  formData: any
  onComplete: (result: any) => void
  onBack: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function ChecklistAssessment({ 
  formData, 
  onComplete, 
  onBack, 
  isLoading, 
  setIsLoading 
}: ChecklistAssessmentProps) {
  const [responses, setResponses] = useState<Record<number, ChecklistAnswer>>({})

  const handleResponseChange = (questionId: number, answer: ChecklistAnswer) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }))
  }

  const getCompletionStats = () => {
    const totalQuestions = checklistQuestions.length
    const answeredQuestions = Object.keys(responses).length
    const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100)
    
    return { totalQuestions, answeredQuestions, completionPercentage }
  }

  const isFormComplete = () => {
    return checklistQuestions.every(q => responses[q.id] !== undefined)
  }

  const submitChecklist = async () => {
    if (!isFormComplete()) {
      alert('Please answer all questions before submitting')
      return
    }

    // Organize responses by category
    const checklistData: ChecklistData = {
      hallucination: [],
      promptInjection: [],
      dataLeakage: []
    }

    checklistQuestions.forEach(question => {
      const response: ChecklistResponse = {
        questionId: question.id,
        answer: responses[question.id]
      }
      checklistData[question.category].push(response)
    })

    setIsLoading(true)
    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userInputs: formData,
          hasRiskAssessment: true,
          checklistData 
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
  }

  const { totalQuestions, answeredQuestions, completionPercentage } = getCompletionStats()

  // Group questions by category
  const questionsByCategory = {
    hallucination: checklistQuestions.filter(q => q.category === 'hallucination'),
    promptInjection: checklistQuestions.filter(q => q.category === 'promptInjection'),
    dataLeakage: checklistQuestions.filter(q => q.category === 'dataLeakage')
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
            📋 Current Implementation Assessment
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-6">
            Help us understand what controls you've already implemented
          </p>
          
          {/* Progress Indicator */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex justify-between text-sm text-white/70 mb-2">
              <span>Progress</span>
              <span>{answeredQuestions}/{totalQuestions} questions</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-white/60 mt-1">{completionPercentage}% complete</div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Categories */}
          {Object.entries(questionsByCategory).map(([categoryKey, questions]) => {
            const category = categoryInfo[categoryKey as keyof typeof categoryInfo]
            const categoryResponses = questions.filter(q => responses[q.id] !== undefined).length
            
            return (
              <div key={categoryKey} className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-2xl mr-4 shadow-lg">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2">{category.title}</h3>
                    <p className="text-white/70 text-sm mb-2">{category.description}</p>
                    <div className={`text-sm ${
                      categoryResponses === questions.length 
                        ? 'text-cyan-300 font-medium' 
                        : 'text-white/60'
                    }`}>
                      {categoryResponses}/{questions.length} questions answered
                      {categoryResponses === questions.length && ' ✓'}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            responses[question.id] !== undefined
                              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg'
                              : 'bg-white/30'
                          }`}>
                            {responses[question.id] !== undefined ? '✓' : index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {question.question}
                          </h4>
                          <p className="text-white/60 text-sm mb-4">
                            Purpose: {question.purpose}
                          </p>
                          
                          {/* Radio button options */}
                          <div className="flex flex-wrap gap-4">
                            {(['yes', 'no', 'na'] as ChecklistAnswer[]).map((option) => (
                              <label
                                key={option}
                                className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-lg transition-all ${
                                  responses[question.id] === option
                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option}
                                  checked={responses[question.id] === option}
                                  onChange={() => handleResponseChange(question.id, option)}
                                  className="sr-only"
                                />
                                <span className="capitalize">
                                  {option === 'na' ? 'N/A' : option}
                                </span>
                                {responses[question.id] === option && (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Action Buttons */}
          <div className="backdrop-blur-md bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl p-8 border border-white/20">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="mr-2">←</span>
                Back to Form
              </button>
              
              <button
                onClick={submitChecklist}
                disabled={isLoading || !isFormComplete()}
                className={`px-8 py-3 rounded-lg transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isLoading || !isFormComplete()
                    ? 'bg-gray-500 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">🧠</span>
                    <span>Complete Assessment</span>
                  </>
                )}
              </button>
            </div>
            
            {!isFormComplete() && (
              <p className="text-center text-yellow-300 text-sm mt-4">
                Please answer all {totalQuestions} questions to proceed with assessment
              </p>
            )}
            
            {isFormComplete() && (
              <p className="text-center text-green-300 text-sm mt-4">
                ✅ All questions answered! Ready for AI analysis
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
