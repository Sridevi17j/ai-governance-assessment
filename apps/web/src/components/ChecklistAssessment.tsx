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
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            📋 Current Implementation Assessment
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-6">
            Help us understand what controls you've already implemented
          </p>
          
          {/* Progress Indicator */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{answeredQuestions}/{totalQuestions} questions</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gray-400 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 mt-1">{completionPercentage}% complete</div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Categories */}
          {Object.entries(questionsByCategory).map(([categoryKey, questions]) => {
            const category = categoryInfo[categoryKey as keyof typeof categoryInfo]
            const categoryResponses = questions.filter(q => responses[q.id] !== undefined).length
            
            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center text-xl mr-4 shadow-sm">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{category.description}</p>
                    <div className={`text-sm ${
                      categoryResponses === questions.length 
                        ? 'text-gray-600 font-medium' 
                        : 'text-gray-500'
                    }`}>
                      {categoryResponses}/{questions.length} questions answered
                      {categoryResponses === questions.length && ' ✓'}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            responses[question.id] !== undefined
                              ? 'bg-gray-400 text-white shadow-sm'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {responses[question.id] !== undefined ? '✓' : index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {question.question}
                          </h4>
                          <p className="text-gray-600 text-sm mb-4">
                            Purpose: {question.purpose}
                          </p>
                          
                          {/* Radio button options */}
                          <div className="flex flex-wrap gap-4">
                            {(['yes', 'no', 'na'] as ChecklistAnswer[]).map((option) => (
                              <label
                                key={option}
                                className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-lg transition-all border-2 ${
                                  responses[question.id] === option
                                    ? 'bg-gray-100 border-gray-400 text-gray-900 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
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
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <span className="mr-2">←</span>
                Back to Form
              </button>
              
              <button
                onClick={submitChecklist}
                disabled={isLoading || !isFormComplete()}
                className={`px-8 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md ${
                  isLoading || !isFormComplete()
                    ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
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
              <p className="text-center text-gray-600 text-sm mt-4">
                Please answer all {totalQuestions} questions to proceed with assessment
              </p>
            )}
            
            {isFormComplete() && (
              <p className="text-center text-gray-700 text-sm mt-4">
                ✅ All questions answered! Ready for AI analysis
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
