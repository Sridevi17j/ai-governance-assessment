// gapAnalysis.ts - Logic for calculating risk scores based on checklist responses

import { ChecklistData, ChecklistAnswer, checklistQuestions } from '../components/checklistData'

export interface GapAnalysisResult {
  categoryScores: {
    hallucination: number
    promptInjection: number  
    dataLeakage: number
  }
  implementationStatus: {
    [questionId: number]: {
      implemented: boolean
      weight: number
      riskReduction: number
    }
  }
  totalRiskReduction: number
  gapPercentage: number
}

export function calculateRiskScoresWithGaps(
  baseRiskScores: Record<string, number>,
  checklistData: ChecklistData
): { adjustedRiskScores: Record<string, number>, gapAnalysis: GapAnalysisResult } {

  const implementationStatus: GapAnalysisResult['implementationStatus'] = {}
  let totalPossibleReduction = 0
  let totalActualReduction = 0

  // Calculate implementation status for each question
  const allResponses = [
    ...checklistData.hallucination,
    ...checklistData.promptInjection, 
    ...checklistData.dataLeakage
  ]

  allResponses.forEach(response => {
    const question = checklistQuestions.find(q => q.id === response.questionId)
    if (!question) return

    const isImplemented = response.answer === 'yes'
    const riskReduction = isImplemented ? question.weight * 2 : 0 // Each weight point = 2 risk score points

    implementationStatus[response.questionId] = {
      implemented: isImplemented,
      weight: question.weight,
      riskReduction
    }

    totalPossibleReduction += question.weight * 2
    totalActualReduction += riskReduction
  })

  // Calculate category-specific reductions
  const categoryReductions = {
    hallucination: 0,
    promptInjection: 0,
    dataLeakage: 0
  }

  Object.entries(checklistData).forEach(([category, responses]) => {
    responses.forEach(response => {
      const question = checklistQuestions.find(q => q.id === response.questionId)
      if (question && response.answer === 'yes') {
        categoryReductions[category as keyof typeof categoryReductions] += question.weight * 2
      }
    })
  })

  // Adjust base risk scores based on implementations
  const adjustedRiskScores: Record<string, number> = {}
  
  Object.entries(baseRiskScores).forEach(([riskKey, baseScore]) => {
    const categoryKey = riskKey as keyof typeof categoryReductions
    const reduction = categoryReductions[categoryKey] || 0
    
    // Risk scores: higher = worse, so we subtract the reduction
    const adjustedScore = Math.max(20, baseScore - reduction) // Ensure minimum 20
    adjustedRiskScores[riskKey] = Math.min(80, adjustedScore) // Ensure maximum 80
  })

  // Calculate gap analysis
  const gapPercentage = totalPossibleReduction > 0 
    ? Math.round(((totalPossibleReduction - totalActualReduction) / totalPossibleReduction) * 100)
    : 0

  const gapAnalysis: GapAnalysisResult = {
    categoryScores: {
      hallucination: adjustedRiskScores.hallucination || 0,
      promptInjection: adjustedRiskScores.promptInjection || 0,
      dataLeakage: adjustedRiskScores.dataLeakage || 0
    },
    implementationStatus,
    totalRiskReduction: totalActualReduction,
    gapPercentage
  }

  return { adjustedRiskScores, gapAnalysis }
}

export function generateGapRecommendations(gapAnalysis: GapAnalysisResult): Array<{
  questionId: number
  question: string
  category: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  weight: number
  finosMapping: string
  reason: string
}> {
  const recommendations: any[] = []

  Object.entries(gapAnalysis.implementationStatus).forEach(([questionId, status]) => {
    if (!status.implemented) {
      const question = checklistQuestions.find(q => q.id === parseInt(questionId))
      if (!question) return

      let priority: 'Critical' | 'High' | 'Medium' | 'Low'
      if (question.weight >= 9) priority = 'Critical'
      else if (question.weight >= 7) priority = 'High' 
      else if (question.weight >= 5) priority = 'Medium'
      else priority = 'Low'

      recommendations.push({
        questionId: question.id,
        question: question.question,
        category: question.category,
        priority,
        weight: question.weight,
        finosMapping: question.finosMapping,
        reason: `Missing implementation with ${question.weight}/10 risk impact. ${question.purpose}`
      })
    }
  })

  // Sort by priority and weight
  const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
  recommendations.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.weight - a.weight
  })

  return recommendations
}
