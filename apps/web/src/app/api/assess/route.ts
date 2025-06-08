import { NextRequest, NextResponse } from 'next/server'
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
  
  // Remove duplicates
  return [...new Set(applicableRisks)]
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
  const prompt = `You are an AI governance expert using the official FINOS AI Governance Framework. You must first verify the user's AI system against the applicable FINOS framework criteria, then provide a comprehensive assessment based on that verification.

FINOS FRAMEWORK DATA:
${JSON.stringify(frameworks, null, 2)}

USER'S AI SYSTEM:
- Model Type: ${userInputs.aiModel}
- Use Case: ${userInputs.useCase}
- Data Sensitivity: ${userInputs.dataSensitivity}
- Industry: ${userInputs.industry}
- Accuracy Requirements: ${userInputs.accuracyReq || 'Not specified'}

VERIFICATION & ASSESSMENT PROCESS:
1. VERIFY: Cross-reference the user's AI system configuration against the FINOS framework definitions and criteria
2. VALIDATE: Confirm which contributing factors from the framework actually apply to this specific system
3. ASSESS: Evaluate risk levels based on verified matches between user system and framework examples
4. SCORE: Provide accurate scores that reflect the verified alignment (or misalignment) with framework standards

REQUIREMENTS:
1. Provide overall compliance score (0-100) where HIGHER = BETTER compliance based on verified framework alignment
2. For each APPLICABLE risk category, provide RISK scores (0-100) where HIGHER = HIGHER RISK: ${applicableRisks.map(risk => {
    const riskNames = {
      hallucination: 'Hallucination',
      promptInjection: 'Prompt Injection', 
      dataLeakage: 'Data Leakage'
    }
    return riskNames[risk as keyof typeof riskNames] || risk
  }).join(', ')}
3. Provide detailed 4-5 sentence analysis focusing on:
   - Which contributing factors from the framework have been verified to apply to this system
   - Industry-specific risks that match framework definitions
   - System configuration vulnerabilities confirmed through framework verification
4. For each applicable risk, recommend the most relevant FINOS mitigations from the framework data after verifying system-framework alignment.
   For each mitigation, read the provided description and create a 1-line concise summary (10-15 words max).
5. Identify relevant examples from the framework that have been verified to match the user's system configuration

IMPORTANT VERIFICATION NOTES:
- Only score risks where the user's system genuinely matches the framework's risk criteria
- Ensure contributing factors are actually relevant to the described system configuration
- Base recommendations on verified alignment between user inputs and framework standards
- Reference specific FINOS risk IDs and mitigation IDs only after verification

Note: Focus on risks applicable to this system configuration through thorough verification against framework definitions.
IMPORTANT: For riskScores, higher numbers mean HIGHER RISK (bad), for overallScore, higher numbers mean BETTER COMPLIANCE (good).

CRITICAL: You must respond with ONLY valid JSON. Do not include markdown code blocks, backticks, explanatory text, or any characters outside the JSON object.

Respond with this exact JSON structure:
{
  "overallScore": number, // 0-100 where HIGHER = BETTER compliance
  "riskScores": {
    ${applicableRisks.map(risk => `"${risk}": number // 0-100 where HIGHER = HIGHER RISK`).join(',\n    ')}
  },
  "analysis": "Detailed 4-5 sentence analysis with specific contributing factors and industry considerations",
  "riskMitigations": [
    {
      "riskId": "AIR-OP-004", // Risk ID this mitigation addresses
      "riskName": "Hallucination and Inaccurate Outputs", // Risk name
      "mitigationId": "AIR-PREV-005",
      "mitigationName": "System Acceptance Testing",
      "priority": "High|Medium|Low",
      "summary": "Concise 1-line summary based on the mitigation description (10-15 words max)"
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
    
    if (!assessmentResult.overallScore || !assessmentResult.riskScores) {
      throw new Error('Missing required fields in response')
    }
    
  } catch (parseError) {
    console.error('JSON parsing error:', parseError)
    
    // Enhanced fallback with risk-based scoring
    const fallbackComplianceScore = userInputs.dataSensitivity === 'restricted' ? 45 : 
                                   userInputs.dataSensitivity === 'confidential' ? 55 : 
                                   userInputs.aiModel === 'thirdParty' || userInputs.aiModel === 'apiBased' ? 60 : 70
    
    assessmentResult = {
      overallScore: fallbackComplianceScore,
      riskScores: Object.fromEntries(
        applicableRisks.map(risk => {
          if (risk === 'dataLeakage' && (userInputs.aiModel === 'thirdParty' || userInputs.aiModel === 'apiBased')) return [risk, 75]
          if (risk === 'hallucination' && userInputs.accuracyReq === 'critical') return [risk, 80]
          if (risk === 'promptInjection' && userInputs.useCase === 'customerService') return [risk, 70]
          return [risk, 60]
        })
      ),
      analysis: "Assessment completed for your " + (userInputs.industry || "industry") + " AI system using " + (userInputs.aiModel || "AI model") + " for " + (userInputs.useCase || "use case") + ". The system requires attention in the assessed risk areas based on data sensitivity level (" + (userInputs.dataSensitivity || "not specified") + ") and accuracy requirements (" + (userInputs.accuracyReq || "not specified") + "). Review the FINOS framework recommendations for " + applicableRisks.join(", ") + " risks.",
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
      }
    },
    tokensUsed: completion.usage?.total_tokens || 0,
    assessedRisks: applicableRisks,
    frameworksLoaded: Object.keys(frameworks)
  })
}

// Handle checklist-based assessment for users who have conducted risk assessment
async function handleChecklistAssessment(userInputs: any, applicableRisks: string[], frameworks: any, checklistData: ChecklistData) {
  console.log('Processing checklist assessment...')
  
  // First, get base risk scores using standard assessment (without AI call for efficiency)
  const baseRiskScores: Record<string, number> = {}
  applicableRisks.forEach(risk => {
    // Assign base risk scores based on system configuration
    if (risk === 'dataLeakage' && (userInputs.aiModel === 'thirdParty' || userInputs.aiModel === 'apiBased')) {
      baseRiskScores[risk] = 80
    } else if (risk === 'hallucination' && userInputs.accuracyReq === 'critical') {
      baseRiskScores[risk] = 85
    } else if (risk === 'promptInjection' && userInputs.useCase === 'customerService') {
      baseRiskScores[risk] = 75
    } else {
      baseRiskScores[risk] = 70 // Default medium-high risk
    }
  })
  
  // Apply gap analysis to adjust scores based on implementations
  const { adjustedRiskScores, gapAnalysis } = calculateRiskScoresWithGaps(baseRiskScores, checklistData)
  
  // Generate recommendations for missing implementations
  const gapRecommendations = generateGapRecommendations(gapAnalysis)
  
  // Calculate overall compliance score based on adjusted risks
  const maxRiskScore = Math.max(...Object.values(adjustedRiskScores))
  const avgRiskScore = Object.values(adjustedRiskScores).reduce((a, b) => a + b, 0) / Object.values(adjustedRiskScores).length
  const overallScore = Math.max(10, Math.min(100, 100 - avgRiskScore + (gapAnalysis.totalRiskReduction / 2)))

  // Create summary of implemented and missing controls for LLM analysis
  const implementedControls = []
  const missingControls = []
  
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
    aiGeneratedAnalysis = `Based on your inputs and current implementations, it is analyzed that you have implemented ${implementedControls.length} out of ${implementedControls.length + missingControls.length} critical controls for your ${userInputs.industry || "industry"} AI system. Your implemented controls have achieved ${gapAnalysis.totalRiskReduction} points of risk reduction. However, you still have ${Object.entries(adjustedRiskScores).filter(([_, score]) => score >= 60).length} risk areas that can affect your system and require attention. The related mitigations for possible risks are provided below.`
  }

  // Get FINOS mitigations for risks that still need attention (only show mitigations for high-risk areas)
  const finosRiskMitigations = []
  const contributingFactors = []
  const relevantExamples = []
  
  // Only show mitigations for risks that are still high after gap analysis
  Object.entries(adjustedRiskScores).forEach(([riskKey, score]) => {
    if (score >= 50) { // Only show mitigations for risks that are still medium-high
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
              priority: score >= 70 ? 'High' : score >= 60 ? 'Medium' : 'Low',
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
              relevance: score >= 70 ? 'High' : score >= 60 ? 'Medium' : 'Low',
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
    overallScore: Math.round(overallScore),
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
      }
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
