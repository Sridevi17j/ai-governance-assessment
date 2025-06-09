// Calculate base risk score based on system configuration (20-80 range)
function calculateBaseRiskScore(userInputs: any, applicableRisks: string[]): number {
  let baseRisk = 30 // Start with low-medium risk
  
  // AI Model Type Risk
  if (userInputs.aiModel === 'thirdParty' || userInputs.aiModel === 'apiBased') {
    baseRisk += 15 // External APIs have higher risk
  } else if (userInputs.aiModel === 'selfHosted') {
    baseRisk += 5 // Self-hosted has some risk but more control
  }
  
  // Data Sensitivity Risk
  if (userInputs.dataSensitivity === 'restricted') {
    baseRisk += 20 // Highest risk with regulated data
  } else if (userInputs.dataSensitivity === 'confidential') {
    baseRisk += 15 // High risk with sensitive data
  } else if (userInputs.dataSensitivity === 'internal') {
    baseRisk += 8 // Medium risk with internal data
  } else if (userInputs.dataSensitivity === 'public') {
    baseRisk += 2 // Low additional risk with public data
  }
  
  // Accuracy Requirements Risk
  if (userInputs.accuracyReq === 'critical') {
    baseRisk += 15 // Critical accuracy = high risk if wrong
  } else if (userInputs.accuracyReq === 'high') {
    baseRisk += 10 // High accuracy needs careful monitoring
  } else if (userInputs.accuracyReq === 'moderate') {
    baseRisk += 5 // Moderate accuracy has some risk
  }
  
  // Use Case Risk
  if (userInputs.useCase === 'customerService' || userInputs.useCase === 'decisionSupport') {
    baseRisk += 10 // Customer-facing and decision systems have higher risk
  } else if (userInputs.useCase === 'documentAnalysis' || userInputs.useCase === 'dataAnalysis') {
    baseRisk += 8 // Analysis systems have medium-high risk
  } else if (userInputs.useCase === 'codeGeneration') {
    baseRisk += 6 // Code generation has medium risk
  } else if (userInputs.useCase === 'contentGeneration') {
    baseRisk += 4 // Content generation has lower risk
  }
  
  // Industry Risk
  if (userInputs.industry === 'financial' || userInputs.industry === 'healthcare') {
    baseRisk += 10 // Regulated industries have higher risk
  } else if (userInputs.industry === 'government') {
    baseRisk += 8 // Government has high risk
  }
  
  // Ensure risk is within 20-80 range
  return Math.max(20, Math.min(80, baseRisk))
}import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { calculateRiskScoresWithGaps, generateGapRecommendations } from '../../../utils/gapAnalysis'
import { ChecklistData, checklistQuestions } from '../../../components/checklistData'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to extract JSON from potentially malformed responses
function extractJsonFromResponse(text: string): string {
  if (!text) return '{}'
  
  // Try to find JSON within the text
  // Look for content between { and } that might be our JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  
  // If no JSON structure found, return empty object
  return '{}'
}

// Determine which risks are applicable based on user inputs
function determineApplicableRisks(userInputs: any) {
  let applicableRisks = []
  
  // Hallucination Risk - High accuracy requirements or critical industries
  if (userInputs.accuracyReq === 'critical' || 
      userInputs.accuracyReq === 'high' ||
      userInputs.industry === 'financial' || 
      userInputs.industry === 'healthcare' ||
      userInputs.useCase === 'decisionSupport' ||
      userInputs.useCase === 'dataAnalysis') {
    applicableRisks.push('hallucination')
  }
  
  // Prompt Injection Risk - User-facing or third-party systems
  if (userInputs.useCase === 'customerService' ||
      userInputs.useCase === 'documentAnalysis' ||
      userInputs.aiModel === 'thirdParty' ||
      userInputs.aiModel === 'apiBased' ||
      userInputs.dataSensitivity === 'confidential' ||
      userInputs.dataSensitivity === 'restricted') {
    applicableRisks.push('promptInjection')
  }
  
  // Data Leakage Risk - Third-party models or sensitive data
  if (userInputs.aiModel === 'thirdParty' ||
      userInputs.aiModel === 'apiBased' ||
      userInputs.dataSensitivity === 'confidential' ||
      userInputs.dataSensitivity === 'restricted' ||
      userInputs.industry === 'financial' ||
      userInputs.industry === 'healthcare') {
    applicableRisks.push('dataLeakage')
  }
  
  // Ensure at least one risk is always assessed (default to prompt injection)
  if (applicableRisks.length === 0) {
    applicableRisks.push('promptInjection')
  }
  
  // Remove duplicates using Array.from instead of spread operator
  return Array.from(new Set(applicableRisks))
}

// Load only relevant framework data based on applicable risks
function loadRelevantFrameworkData(applicableRisks: string[]) {
  const dataDir = path.join(process.cwd(), 'data') // Changed from '../../data' to 'data'
  const selectedFrameworks: any = {}
  
  if (applicableRisks.includes('hallucination')) {
    selectedFrameworks.hallucination = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'Hallucination_and_Inaccurate_Outputs.json'), 'utf8')
    )
  }
  
  if (applicableRisks.includes('promptInjection')) {
    selectedFrameworks.promptInjection = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'Prompt_Injection.json'), 'utf8')
    )
  }
  
  if (applicableRisks.includes('dataLeakage')) {
    selectedFrameworks.dataLeakage = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'Information_Leaked_To_Hosted_Model.json'), 'utf8')
    )
  }
  
  return selectedFrameworks
}

// Helper functions
function getRiskIdForCategory(category: string): string {
  const mapping = {
    'hallucination': 'AIR-OP-004',
    'promptInjection': 'AIR-SEC-010', 
    'dataLeakage': 'AIR-RC-001'
  }
  return mapping[category as keyof typeof mapping] || 'AIR-UNKNOWN'
}

function getCategoryDisplayName(category: string): string {
  const mapping = {
    'hallucination': 'Hallucination and Inaccurate Outputs',
    'promptInjection': 'Prompt Injection',
    'dataLeakage': 'Information Leaked to Hosted Model'
  }
  return mapping[category as keyof typeof mapping] || category
}

// Handle standard assessment for users who haven't conducted risk assessment
async function handleStandardAssessment(userInputs: any, applicableRisks: string[], frameworks: any) {
  // Calculate individual risk scores first
  const individualRiskScores: Record<string, number> = {}
  
  applicableRisks.forEach(risk => {
    const baseScore = calculateBaseRiskScore(userInputs, [risk])
    
    // Adjust base score for specific risk categories
    if (risk === 'dataLeakage' && (userInputs.aiModel === 'thirdParty' || userInputs.aiModel === 'apiBased')) {
      individualRiskScores[risk] = Math.min(75, baseScore + 15)
    } else if (risk === 'hallucination' && userInputs.accuracyReq === 'critical') {
      individualRiskScores[risk] = Math.min(80, baseScore + 20)
    } else if (risk === 'promptInjection' && userInputs.useCase === 'customerService') {
      individualRiskScores[risk] = Math.min(70, baseScore + 10)
    } else {
      individualRiskScores[risk] = baseScore
    }
    
    // Ensure within 20-80 range
    individualRiskScores[risk] = Math.max(20, Math.min(80, individualRiskScores[risk]))
  })
  
  // Calculate overall risk score as average of individual scores
  const avgRiskScore = Object.values(individualRiskScores).reduce((a, b) => a + b, 0) / Object.values(individualRiskScores).length
  const overallRiskScore = Math.max(20, Math.min(80, Math.round(avgRiskScore)))
  
  const prompt = `You are an AI governance expert using the official FINOS AI Governance Framework. You must verify the user's AI system against the applicable FINOS framework criteria and provide a risk assessment.

FINOS FRAMEWORK DATA:
${JSON.stringify(frameworks, null, 2)}

USER'S AI SYSTEM:
- Model Type: ${userInputs.aiModel}
- Use Case: ${userInputs.useCase}
- Data Sensitivity: ${userInputs.dataSensitivity}
- Industry: ${userInputs.industry}
- Accuracy Requirements: ${userInputs.accuracyReq || 'Not specified'}

VERIFICATION & ASSESSMENT PROCESS:
1. VERIFY: Cross-reference the user's AI system configuration against the FINOS framework definitions
2. VALIDATE: Confirm which contributing factors from the framework actually apply
3. ASSESS: Evaluate risk levels based on verified matches
4. SCORE: Provide accurate scores within realistic ranges

REQUIREMENTS:
1. Provide overall risk score (20-80) where HIGHER = HIGHER RISK. Calculated score: ${overallRiskScore}
2. For each APPLICABLE risk category, provide RISK scores (20-80) where HIGHER = HIGHER RISK: ${Object.entries(individualRiskScores).map(([risk, score]) => {
    const riskNames = {
      hallucination: 'Hallucination',
      promptInjection: 'Prompt Injection', 
      dataLeakage: 'Data Leakage'
    }
    return `${riskNames[risk as keyof typeof riskNames] || risk}: ${score}`
  }).join(', ')}
3. Provide detailed 4-5 sentence analysis focusing on verified framework alignment (DO NOT mention specific scores, points, or numbers)
4. Recommend relevant FINOS mitigations after verifying system-framework alignment
5. Reference specific examples that match the user's system configuration

IMPORTANT: In your analysis, DO NOT mention specific risk scores, percentages, or point values. Use qualitative terms like "higher risk", "moderate risk", "lower risk", "significant concerns", "some level", etc.

IMPORTANT: Risk scores should be realistic (20-80 range). No system has 0% or 100% risk.
Score ranges: 20-35 (Lower Risk), 35-55 (Moderate Risk), 55-80 (Higher Risk)

CRITICAL: You must respond with ONLY valid JSON. Do not include markdown code blocks or explanatory text.

Respond with this exact JSON structure:
{
  "overallRiskScore": ${overallRiskScore}, // 20-80 where HIGHER = HIGHER RISK
  "riskScores": {
    ${Object.entries(individualRiskScores).map(([risk, score]) => `"${risk}": ${score} // 20-80 where HIGHER = HIGHER RISK`).join(',\n    ')}
  },
  "analysis": "Detailed 4-5 sentence analysis with specific contributing factors",
  "riskMitigations": [
    {
      "riskId": "AIR-OP-004",
      "riskName": "Hallucination and Inaccurate Outputs",
      "mitigationId": "AIR-PREV-005",
      "mitigationName": "System Acceptance Testing",
      "priority": "High|Medium|Low",
      "summary": "Concise 1-line summary (10-15 words max)"
    }
  ],
  "contributingFactors": [
    {
      "riskId": "AIR-OP-004",
      "factor": "Contributing factor name",
      "relevance": "High|Medium|Low",
      "explanation": "Why this factor applies to the user's system"
    }
  ],
  "relevantExamples": [
    {
      "riskId": "AIR-SEC-010",
      "exampleTitle": "Example from JSON",
      "relevanceToSystem": "Why this example is relevant"
    }
  ],
  "assessedRisks": [${applicableRisks.map(risk => `"${risk}"`).join(', ')}]
}`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert AI governance consultant specializing in the FINOS framework. Provide concise, actionable assessments. CRITICAL: Your response must be valid JSON format only. No markdown formatting, no code blocks, no backticks, no explanatory text before or after the JSON."
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    max_tokens: 1200,
    temperature: 0.1,
    response_format: { type: "json_object" },
  })

  const responseText = completion.choices[0].message.content
  
  // Parse the JSON response with better error handling
  let assessmentResult
  try {
    console.log('Raw response from OpenAI:', responseText)
    
    let cleanedResponse = extractJsonFromResponse(responseText || '{}')
    assessmentResult = JSON.parse(cleanedResponse)
    
    if (!assessmentResult.overallRiskScore || !assessmentResult.riskScores) {
      throw new Error('Missing required fields in response')
    }
    
  } catch (parseError) {
    console.error('JSON parsing error:', parseError)
    
    // Enhanced fallback with realistic risk scoring (20-80 range)
    assessmentResult = {
      overallRiskScore: overallRiskScore,
      riskScores: individualRiskScores,
      analysis: `Risk assessment completed for your ${userInputs.industry || "industry"} AI system using ${userInputs.aiModel || "AI model"} for ${userInputs.useCase || "use case"}. The system presents ${overallRiskScore >= 55 ? 'higher' : overallRiskScore >= 35 ? 'moderate' : 'lower'} risk levels based on data sensitivity (${userInputs.dataSensitivity || "not specified"}) and accuracy requirements (${userInputs.accuracyReq || "not specified"}). Framework validation shows risks in ${applicableRisks.join(", ")} categories require attention. The assessment follows industry governance standards for realistic risk evaluation.`,
      riskMitigations: [
        {
          riskId: "AIR-PREV-005",
          riskName: "System Acceptance Testing",
          mitigationId: "AIR-PREV-005",
          mitigationName: "System Acceptance Testing",
          priority: "High",
          summary: "Essential for validating system behavior before deployment"
        }
      ],
      contributingFactors: [],
      relevantExamples: [],
      assessedRisks: applicableRisks
    }
  }

  return NextResponse.json({ 
    success: true, 
    assessment: {
      ...assessmentResult,
      productInfo: {
        productName: userInputs.productName,
        productManagerName: userInputs.productManagerName,
        productManagerEmail: userInputs.productManagerEmail
      },
      userInputs: userInputs
    },
    tokensUsed: completion.usage?.total_tokens || 0,
    assessedRisks: applicableRisks,
    frameworksLoaded: Object.keys(frameworks)
  })
}

// Handle checklist-based assessment for users who have conducted risk assessment
async function handleChecklistAssessment(userInputs: any, applicableRisks: string[], frameworks: any, checklistData: ChecklistData) {
  console.log('Processing checklist assessment...')
  
  // Calculate base risk scores using new 20-80 scale
  const baseRiskScores: Record<string, number> = {}
  applicableRisks.forEach(risk => {
    const baseScore = calculateBaseRiskScore(userInputs, [risk])
    
    // Adjust base score for specific risk categories
    if (risk === 'dataLeakage' && (userInputs.aiModel === 'thirdParty' || userInputs.aiModel === 'apiBased')) {
      baseRiskScores[risk] = Math.min(75, baseScore + 15)
    } else if (risk === 'hallucination' && userInputs.accuracyReq === 'critical') {
      baseRiskScores[risk] = Math.min(80, baseScore + 20)
    } else if (risk === 'promptInjection' && userInputs.useCase === 'customerService') {
      baseRiskScores[risk] = Math.min(70, baseScore + 10)
    } else {
      baseRiskScores[risk] = baseScore
    }
    
    // Ensure within 20-80 range
    baseRiskScores[risk] = Math.max(20, Math.min(80, baseRiskScores[risk]))
  })
  
  // Apply gap analysis to adjust scores based on implementations
  const { adjustedRiskScores, gapAnalysis } = calculateRiskScoresWithGaps(baseRiskScores, checklistData)
  
  // Generate recommendations for missing implementations
  const gapRecommendations = generateGapRecommendations(gapAnalysis)
  
  // Calculate overall risk score based on adjusted individual risks
  const avgRiskScore = Object.values(adjustedRiskScores).reduce((a, b) => a + b, 0) / Object.values(adjustedRiskScores).length
  const overallRiskScore = Math.max(20, Math.min(80, Math.round(avgRiskScore)))

  // Create summary of implemented and missing controls for LLM analysis
  const implementedControls: string[] = []
  const missingControls: string[] = []
  
  Object.entries(gapAnalysis.implementationStatus).forEach(([questionId, status]) => {
    const question = checklistQuestions.find(q => q.id === parseInt(questionId))
    if (question) {
      if (status.implemented) {
        implementedControls.push(`${question.question} (${question.purpose})`)
      } else {
        missingControls.push(`${question.question} (${question.purpose})`)
      }
    }
  })

  // Generate AI analysis based on gap assessment
  const analysisPrompt = `You are an AI governance expert analyzing a gap assessment for an AI system. Provide a comprehensive analysis based on the implemented and missing controls.

SYSTEM INFORMATION:
- Product: ${userInputs.productName}
- AI Model Type: ${userInputs.aiModel}
- Use Case: ${userInputs.useCase}
- Data Sensitivity: ${userInputs.dataSensitivity}
- Industry: ${userInputs.industry}
- Accuracy Requirements: ${userInputs.accuracyReq}

IMPLEMENTED CONTROLS (${implementedControls.length} out of ${implementedControls.length + missingControls.length}):
${implementedControls.map((control, i) => `${i + 1}. ${control}`).join('\n')}

MISSING CONTROLS (${missingControls.length} remaining):
${missingControls.map((control, i) => `${i + 1}. ${control}`).join('\n')}

ADJUSTED RISK SCORES:
${Object.entries(adjustedRiskScores).map(([risk, score]) => `- ${risk}: ${score}/100`).join('\n')}

RISK REDUCTION ACHIEVED: ${gapAnalysis.totalRiskReduction} points

Please provide a 4-5 sentence analysis that:
1. Acknowledges what they have implemented well
2. Identifies the remaining risks that can affect their system
3. Explains how the implemented controls have improved their security posture
4. Highlights priority areas for improvement

IMPORTANT: DO NOT mention specific risk scores, percentages, point values, or numbers in your analysis. Use qualitative terms like "higher risk", "moderate risk", "significant concerns", "some level", "substantial improvement", etc.

Start with: "Based on your inputs and current implementations, it is analyzed that you have implemented..."

Provide only the analysis text, no additional formatting.`

  let aiGeneratedAnalysis = ''
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert AI governance consultant. Provide clear, professional analysis based on the gap assessment data. Be specific about implemented vs missing controls."
        },
        {
          role: "user", 
          content: analysisPrompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    })
    
    aiGeneratedAnalysis = completion.choices[0].message.content || ''
  } catch (error) {
    console.error('AI analysis generation failed:', error)
    // Fallback analysis
    aiGeneratedAnalysis = `Based on your inputs and current implementations, it is analyzed that you have implemented ${implementedControls.length} out of ${implementedControls.length + missingControls.length} critical controls for your ${userInputs.industry || "industry"} AI system. Your implemented controls have achieved substantial risk reduction. However, you still have ${Object.entries(adjustedRiskScores).filter(([_, score]) => score >= 60).length} risk areas that can affect your system and require attention. The related mitigations for possible risks are provided below.`
  }

  // Get FINOS mitigations for risks that still need attention (only show mitigations for high-risk areas)
  const finosRiskMitigations: Array<{
    riskId: string
    riskName: string
    mitigationId: string
    mitigationName: string
    priority: string
    summary: string
  }> = []
  const contributingFactors: Array<{
    riskId: string
    factor: string
    relevance: string
    explanation: string
  }> = []
  const relevantExamples: Array<{
    riskId: string
    exampleTitle: string
    relevanceToSystem: string
  }> = []
  
  // Only show mitigations for risks that are still high after gap analysis
  Object.entries(adjustedRiskScores).forEach(([riskKey, score]) => {
  if (score >= 40) { // Only show mitigations for risks that are still medium-high (adjusted threshold for 20-80 scale)
      const frameworkKey = riskKey === 'hallucination' ? 'hallucination' : 
                          riskKey === 'promptInjection' ? 'promptInjection' : 
                          riskKey === 'dataLeakage' ? 'dataLeakage' : null
      
      if (frameworkKey && frameworks[frameworkKey]) {
        const framework = frameworks[frameworkKey]
        
        // Add FINOS mitigations
        if (framework.key_mitigations) {
          framework.key_mitigations.forEach((mitigation: any) => {
            finosRiskMitigations.push({
              riskId: framework.id,
              riskName: framework.title,
              mitigationId: mitigation.id,
              mitigationName: mitigation.name,
              priority: score >= 60 ? 'High' : score >= 45 ? 'Medium' : 'Low',
              summary: mitigation.description // Complete description, not truncated
            })
          })
        }
        
        // Add contributing factors
        if (framework.contributing_factors) {
          framework.contributing_factors.slice(0, 2).forEach((factor: any) => {
            contributingFactors.push({
              riskId: framework.id,
              factor: factor.factor,
              relevance: score >= 60 ? 'High' : score >= 45 ? 'Medium' : 'Low',
              explanation: factor.description
            })
          })
        }
        
        // Add relevant examples
        if (framework.examples) {
          framework.examples.slice(0, 1).forEach((example: any) => {
            relevantExamples.push({
              riskId: framework.id,
              exampleTitle: example.title,
              relevanceToSystem: `This example applies to your ${userInputs.useCase} system: ${example.description.substring(0, 150)}...`
            })
          })
        }
      }
    }
  })

  // Create assessment result with gap analysis
  const implementedCount = Object.values(gapAnalysis.implementationStatus).filter(s => s.implemented).length
  const totalCount = Object.keys(gapAnalysis.implementationStatus).length
  
  const assessmentResult = {
    overallRiskScore: overallRiskScore,
    riskScores: adjustedRiskScores,
    analysis: aiGeneratedAnalysis, // AI-generated analysis based on their specific inputs and implementations
    riskMitigations: finosRiskMitigations, // Only FINOS mitigations for remaining high risks
    contributingFactors: contributingFactors, // From FINOS framework
    relevantExamples: relevantExamples, // From FINOS framework
    assessedRisks: applicableRisks,
    gapAnalysis: {
      implementedControls: implementedCount,
      totalControls: totalCount,
      gapPercentage: gapAnalysis.gapPercentage,
      riskReduction: gapAnalysis.totalRiskReduction
    }
  }

  return NextResponse.json({ 
    success: true, 
    assessment: {
      ...assessmentResult,
      productInfo: {
        productName: userInputs.productName,
        productManagerName: userInputs.productManagerName,
        productManagerEmail: userInputs.productManagerEmail
      },
      userInputs: userInputs,
      checklistData: checklistData
    },
    tokensUsed: 0, // Minimal tokens used for analysis generation
    assessedRisks: applicableRisks,
    frameworksLoaded: Object.keys(frameworks),
    assessmentType: 'gap_analysis'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userInputs, hasRiskAssessment, checklistData } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Determine applicable risks and load only relevant framework data
    const applicableRisks = determineApplicableRisks(userInputs)
    const frameworks = loadRelevantFrameworkData(applicableRisks)
    
    console.log(`Assessment for risks: ${applicableRisks.join(', ')}`) // Debug log

    // Handle two different assessment paths
    if (hasRiskAssessment && checklistData) {
      // Path 1: User has conducted risk assessment - use checklist for gap analysis
      return await handleChecklistAssessment(userInputs, applicableRisks, frameworks, checklistData as ChecklistData)
    } else {
      // Path 2: User hasn't conducted assessment - standard flow
      return await handleStandardAssessment(userInputs, applicableRisks, frameworks)
    }

  } catch (error) {
    console.error('Assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to perform assessment' },
      { status: 500 }
    )
  }
}
