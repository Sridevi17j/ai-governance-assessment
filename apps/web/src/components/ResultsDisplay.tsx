'use client'

import { useState, useEffect } from 'react'
// Import PDF libraries dynamically to prevent SSR issues
import dynamic from 'next/dynamic'

// Dynamic imports for PDF generation
const importPDFLibraries = async () => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ])
  return { jsPDF, html2canvas }
}

interface ResultsDisplayProps {
  result: {
    overallRiskScore: number // Changed from overallScore to overallRiskScore
    riskScores: Record<string, number>
    analysis: string
    riskMitigations?: Array<{
      riskId: string
      riskName: string
      mitigationId: string
      mitigationName: string
      priority: string
      summary: string
    }>
    recommendations?: Array<{
      id: string
      name: string
      priority: string
      rationale: string
    }> | string[]  // Support both old and new format
    contributingFactors?: Array<{
      riskId: string
      factor: string
      relevance: string
      explanation: string
    }>
    relevantExamples?: Array<{
      riskId: string
      exampleTitle: string
      relevanceToSystem: string
    }>
    assessedRisks?: string[]
    productInfo?: {
      productName: string
      productManagerName: string
      productManagerEmail: string
    }
    userInputs?: {
      productName: string
      productManagerName: string
      productManagerEmail: string
      aiModel: string
      useCase: string
      dataSensitivity: string
      industry: string
      accuracyReq: string
      hasRiskAssessment: string
    }
    checklistData?: {
      hallucination: Array<{ questionId: number; answer: string }>
      promptInjection: Array<{ questionId: number; answer: string }>
      dataLeakage: Array<{ questionId: number; answer: string }>
    }
    gapAnalysis?: {
      implementedControls: number
      totalControls: number
      gapPercentage: number
      riskReduction: number
    }
  }
  onReset: () => void
}

export default function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  // Load framework data to get mitigation URLs
  const [frameworkData, setFrameworkData] = useState<any>(null)
  
  // Load framework data on component mount to get mitigation links
  useEffect(() => {
    const loadFrameworkData = async () => {
      try {
        // Load the actual framework data to get URLs
        const response = await fetch('/api/framework-data')
        if (response.ok) {
          const data = await response.json()
          setFrameworkData(data)
        } else {
          // Fallback URLs if API fails
          const mitigationUrls = {
            'AIR-PREV-005': 'https://air-governance-framework.finos.org/mitigations/mi-5_system-acceptance-testing.html',
            'AIR-PREV-017': 'https://air-governance-framework.finos.org/mitigations/mi-17_ai-firewall.html',
            'AIR-PREV-003': 'https://air-governance-framework.finos.org/mitigations/mi-3_user-app-model-firewalling-filtering.html',
            'AIR-DET-004': 'https://air-governance-framework.finos.org/mitigations/mi-4_system-observability.html',
            'AIR-DET-015': 'https://air-governance-framework.finos.org/mitigations/mi-15_llm-as-a-judge.html',
            'AIR-DET-001': 'https://air-governance-framework.finos.org/mitigations/mi-1_data-leakage-prevention-and-detection.html',
            'AIR-PREV-002': 'https://air-governance-framework.finos.org/mitigations/mi-2_data-filtering-from-confluence-into-the-samples.html',
            'AIR-PREV-006': 'https://air-governance-framework.finos.org/mitigations/mi-6_data-quality-classification-sensitivity.html',
            'AIR-PREV-007': 'https://air-governance-framework.finos.org/mitigations/mi-7_legal-contractual-agreements.html'
          }
          setFrameworkData({ mitigationUrls })
        }
      } catch (error) {
        console.error('Failed to load framework data:', error)
        // Fallback URLs
        const mitigationUrls = {
          'AIR-PREV-005': 'https://air-governance-framework.finos.org/mitigations/mi-5_system-acceptance-testing.html',
          'AIR-PREV-017': 'https://air-governance-framework.finos.org/mitigations/mi-17_ai-firewall.html',
          'AIR-PREV-003': 'https://air-governance-framework.finos.org/mitigations/mi-3_user-app-model-firewalling-filtering.html',
          'AIR-DET-004': 'https://air-governance-framework.finos.org/mitigations/mi-4_system-observability.html',
          'AIR-DET-015': 'https://air-governance-framework.finos.org/mitigations/mi-15_llm-as-a-judge.html',
          'AIR-DET-001': 'https://air-governance-framework.finos.org/mitigations/mi-1_data-leakage-prevention-and-detection.html',
          'AIR-PREV-002': 'https://air-governance-framework.finos.org/mitigations/mi-2_data-filtering-from-confluence-into-the-samples.html',
          'AIR-PREV-006': 'https://air-governance-framework.finos.org/mitigations/mi-6_data-quality-classification-sensitivity.html',
          'AIR-PREV-007': 'https://air-governance-framework.finos.org/mitigations/mi-7_legal-contractual-agreements.html'
        }
        setFrameworkData({ mitigationUrls })
      }
    }
    
    loadFrameworkData()
  }, [])

  // Extract framework references from assessed risks
  const getFrameworkReferences = () => {
    // This would ideally come from the assessment data
    // For now, we'll show the main framework links
    return {
      owasp: {
        name: "OWASP LLM Top 10",
        url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
        description: "LLM Application Security Standard"
      },
      ffiec: {
        name: "FFIEC Guidelines", 
        url: "https://www.ffiec.gov/",
        description: "Financial Institution IT Examination"
      },
      euAiAct: {
        name: "EU AI Act",
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
        description: "European AI Regulation Framework"
      },
      nist: {
        name: "NIST AI RMF",
        url: "https://www.nist.gov/itl/ai-risk-management-framework", 
        description: "AI Risk Management Framework"
      }
    }
  }

  const frameworkRefs = getFrameworkReferences()

  const getRiskLevel = (score: number) => {
    if (score >= 55) return { level: 'High Risk', color: 'text-white bg-gradient-to-r from-red-500 to-red-600' }
    if (score >= 40) return { level: 'Medium Risk', color: 'text-white bg-gradient-to-r from-amber-500 to-yellow-500' }
    return { level: 'Low Risk', color: 'text-white bg-gradient-to-r from-green-500 to-green-600' }
  }

  const getRiskScoreColor = (score: number) => {
    // Risk score: higher = worse (20-80 scale)
    if (score >= 55) return 'text-white bg-gradient-to-r from-red-500 to-red-600' // High risk
    if (score >= 40) return 'text-white bg-gradient-to-r from-amber-500 to-yellow-500' // Medium risk
    return 'text-white bg-gradient-to-r from-green-500 to-green-600' // Low risk
  }

  const getRiskScoreLabel = (score: number) => {
    // Risk score labels (20-80 scale)
    if (score >= 55) return 'High Risk'
    if (score >= 40) return 'Medium Risk' 
    return 'Low Risk'
  }

  const getRiskDisplayName = (riskKey: string) => {
    const riskNames: Record<string, string> = {
      hallucination: 'Hallucination Risk',
      promptInjection: 'Prompt Injection Risk',
      dataLeakage: 'Data Leakage Risk'
    }
    return riskNames[riskKey] || riskKey
  }
  
  const getRiskDescription = (riskKey: string) => {
    const descriptions: Record<string, string> = {
      hallucination: 'Accuracy and output reliability',
      promptInjection: 'Security and input validation',
      dataLeakage: 'Privacy and data protection'
    }
    return descriptions[riskKey] || 'Risk assessment'
  }

  const downloadReport = async () => {
    console.log('Starting comprehensive PDF download...')
    
    // Get user inputs from the result
    const userInputs = result.userInputs || {
      productName: 'Not specified',
      productManagerName: 'Not specified', 
      productManagerEmail: 'Not specified',
      aiModel: 'Not specified',
      useCase: 'Not specified',
      dataSensitivity: 'Not specified',
      industry: 'Not specified', 
      accuracyReq: 'Not specified',
      hasRiskAssessment: 'no'
    }
    
    // Helper function to convert form values to display names
    const getDisplayValue = (field: string, value: string) => {
      const mappings: Record<string, Record<string, string>> = {
        aiModel: {
          'selfHosted': 'Self-Hosted',
          'apiBased': 'API Based (OpenAI, Anthropic, etc.)',
          'thirdParty': 'Third-Party Cloud (AWS, Azure, GCP)'
        },
        useCase: {
          'customerService': 'Customer Service & Support',
          'documentAnalysis': 'Document Analysis & Processing',
          'codeGeneration': 'Code Generation & Development',
          'dataAnalysis': 'Data Analysis & Insights',
          'contentGeneration': 'Content Creation & Marketing',
          'decisionSupport': 'Decision Support Systems'
        },
        dataSensitivity: {
          'public': 'Public',
          'internal': 'Internal',
          'confidential': 'Confidential',
          'restricted': 'Restricted (PII, Financial, Regulated)'
        },
        accuracyReq: {
          'low': 'Low',
          'moderate': 'Moderate',
          'high': 'High',
          'critical': 'Critical'
        }
      }
      return mappings[field]?.[value] || value
    }
    
    try {
      let jsPDF
      
      // Try to load jsPDF
      try {
        console.log('Loading jsPDF...')
        const jsPDFModule = await import('jspdf')
        jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule
        console.log('jsPDF loaded successfully')
      } catch (importError) {
        console.log('NPM import failed, trying CDN...')
        if (typeof window !== 'undefined' && !(window as any).jsPDF) {
          await loadJsPDFFromCDN()
        }
        jsPDF = (window as any).jsPDF
      }
      
      if (!jsPDF) {
        throw new Error('Could not load jsPDF library')
      }
      
      console.log('Creating comprehensive PDF report...')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      let yPosition = 20
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Helper function to add new page if needed
      const checkAddPage = (requiredSpace = 30) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
          return true
        }
        return false
      }
      
      // Header with styling
      pdf.setFillColor(102, 126, 234) // Blue background
      pdf.rect(0, 0, pageWidth, 35, 'F')
      
      pdf.setFontSize(28)
      pdf.setTextColor(255, 255, 255) // White text
      pdf.setFont('helvetica', 'bold')
      const title = 'FinAIReadiness - Assessment Report'
      const titleWidth = pdf.getTextWidth(title)
      pdf.text(title, (pageWidth - titleWidth) / 2, 22)
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'normal')
      const subtitle = 'Based on Industry-Standard Framework'
      const subtitleWidth = pdf.getTextWidth(subtitle)
      pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 30)
      
      yPosition = 50
      
      // Product Information Section
      pdf.setFontSize(18)
      pdf.setTextColor(51, 65, 85) // Dark gray
      pdf.setFont('helvetica', 'bold')
      pdf.text('Product Information', 20, yPosition)
      
      yPosition += 12
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(71, 85, 105)
      
      const productInfo = [
        ['Product Name:', result.productInfo?.productName || 'Not specified'],
        ['Product Manager:', result.productInfo?.productManagerName || 'Not specified'],
        ['Manager Email:', result.productInfo?.productManagerEmail || 'Not specified'],
        ['Assessment Date:', new Date().toLocaleDateString()]
      ]
      
      productInfo.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold')
        pdf.text(label, 25, yPosition)
        pdf.setFont('helvetica', 'normal')
        pdf.text(value, 65, yPosition)
        yPosition += 6
      })
      
      yPosition += 12
      
      // System Configuration Section
      checkAddPage(40)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85)
      pdf.text('System Configuration', 20, yPosition)
      
      yPosition += 12
      pdf.setFontSize(12)
      pdf.setTextColor(71, 85, 105)
      pdf.setFont('helvetica', 'normal')
      
      // Add user's system configuration based on form data
      const systemConfig = [
        ['AI Model Type:', getDisplayValue('aiModel', userInputs.aiModel) || 'Not specified'],
        ['Use Case:', getDisplayValue('useCase', userInputs.useCase) || 'Not specified'],
        ['Data Sensitivity:', getDisplayValue('dataSensitivity', userInputs.dataSensitivity) || 'Not specified'],
        ['Industry:', userInputs.industry || 'Not specified'],
        ['Accuracy Requirements:', getDisplayValue('accuracyReq', userInputs.accuracyReq) || 'Not specified'],
        ['Prior Risk Assessment:', userInputs.hasRiskAssessment === 'yes' ? 'Yes - Gap Analysis Conducted' : 'No - Standard Assessment']
      ]
      
      systemConfig.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold')
        pdf.text(label, 25, yPosition)
        pdf.setFont('helvetica', 'normal')
        // Handle long text wrapping
        const wrappedValue = pdf.splitTextToSize(value, pageWidth - 90)
        pdf.text(wrappedValue, 80, yPosition)
        yPosition += wrappedValue.length * 6
      })
      
      yPosition += 12
      
      // Overall Assessment Section
      checkAddPage(30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85)
      pdf.text('Overall Assessment', 20, yPosition)
      
      yPosition += 12
      pdf.setFontSize(14)
      pdf.setTextColor(51, 65, 85)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Risk Score: ${Math.round((result.overallRiskScore / 100) * 100)}%`, 25, yPosition)
      yPosition += 8
      pdf.text(`Risk Level: ${getRiskScoreLabel(result.overallRiskScore)}`, 25, yPosition)
      
      yPosition += 15
      
      // Risk Assessment Section
      checkAddPage(40)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85)
      pdf.text('Risk Assessment Breakdown', 20, yPosition)
      
      yPosition += 15
      
      Object.entries(result.riskScores).forEach(([riskKey, score]) => {
        checkAddPage(25)
        const riskLevel = getRiskLevel(score)
        
        // Risk box with subtle color coding
        let bgColor = [144, 238, 144] // Light green for low risk (much lighter)
        if (score >= 55) bgColor = [255, 182, 193] // Light pink for high risk (much lighter)
        else if (score >= 40) bgColor = [255, 218, 185] // Light peach for medium risk (much lighter)
        
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2])
        pdf.rect(20, yPosition - 3, pageWidth - 40, 20, 'F')
        
        pdf.setFontSize(14)
        pdf.setTextColor(60, 60, 60) // Dark gray text instead of white for better readability
        pdf.setFont('helvetica', 'bold')
        pdf.text(getRiskDisplayName(riskKey), 25, yPosition + 5)
        pdf.text(`${riskLevel.level}`, 25, yPosition + 12)
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(80, 80, 80) // Slightly lighter gray for description
        pdf.text(getRiskDescription(riskKey), 90, yPosition + 8)
        
        yPosition += 25
      })
      
      // Assessment Scope
      if (result.assessedRisks && result.assessedRisks.length > 0) {
        checkAddPage(25)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(51, 65, 85)
        pdf.text('Assessment Scope', 20, yPosition)
        
        yPosition += 12
        pdf.setFontSize(12)
        pdf.setTextColor(71, 85, 105)
        pdf.setFont('helvetica', 'normal')
        
        const scopeText = `This assessment focused on ${result.assessedRisks.length} applicable risk${result.assessedRisks.length > 1 ? 's' : ''}: ${result.assessedRisks.map(risk => getRiskDisplayName(risk)).join(', ')}`
        const scopeLines = pdf.splitTextToSize(scopeText, pageWidth - 50)
        pdf.text(scopeLines, 25, yPosition)
        yPosition += scopeLines.length * 6 + 10
      }
      
      // Implementation Status Section (for gap analysis)
      if (result.gapAnalysis) {
        checkAddPage(40)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(51, 65, 85)
        pdf.text('Implementation Status', 20, yPosition)
        
        yPosition += 12
        pdf.setFontSize(12)
        pdf.setTextColor(71, 85, 105)
        pdf.setFont('helvetica', 'normal')
        
        // Summary stats
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Controls Implemented: ${result.gapAnalysis.implementedControls}/${result.gapAnalysis.totalControls}`, 25, yPosition)
        yPosition += 8
        pdf.text(`Risk Reduction Achieved: ${result.gapAnalysis.riskReduction} points`, 25, yPosition)
        yPosition += 8
        pdf.text(`Implementation Gap: ${result.gapAnalysis.gapPercentage}%`, 25, yPosition)
        yPosition += 10
        
        pdf.setFont('helvetica', 'normal')
        pdf.text('This gap analysis shows your current implementation status against FINOS framework controls.', 25, yPosition)
        yPosition += 6
        pdf.text('Implemented controls have successfully reduced your risk scores from baseline levels.', 25, yPosition)
        yPosition += 10
      }
      
      // Risk Controls Already Implemented Section (only for gap analysis)
      if (result.checklistData && result.gapAnalysis) {
        checkAddPage(40)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(51, 65, 85)
        pdf.text('Risk Controls Already Implemented', 20, yPosition)
        
        yPosition += 12
        pdf.setFontSize(12)
        pdf.setTextColor(71, 85, 105)
        pdf.setFont('helvetica', 'normal')
        
        // Helper function to get short control name
        const getShortControlName = (questionId: number) => {
          const controlNames: Record<number, string> = {
            1: 'Human-in-the-loop review',
            2: 'Output accuracy testing',
            3: 'Training data verification',
            4: 'Deterministic prompt testing',
            5: 'RAG with verified sources',
            6: 'User warnings for speculation',
            7: 'Hallucination benchmark testing',
            8: 'Input sanitization',
            9: 'Jailbreak vulnerability testing',
            10: 'System prompt guardrails',
            11: 'Input monitoring and logging',
            12: 'Restricted prompt control',
            13: 'Validated prompt-building logic',
            14: 'Third-party injection detection',
            15: 'Data classification for LLM inputs',
            16: 'PII masking and redaction',
            17: 'Hosted model contract review',
            18: 'Inference log monitoring',
            19: 'In-house models for sensitive data',
            20: 'Encrypted vector store with RBAC',
            21: 'Smart routing to private LLMs'
          }
          return controlNames[questionId] || `Control ${questionId}`
        }
        
        // Get all "Yes" responses
        const implementedControls: string[] = []
        
        // Check each category for "yes" answers
        Object.entries(result.checklistData).forEach(([category, responses]) => {
          responses.forEach(response => {
            if (response.answer === 'yes') {
              implementedControls.push(getShortControlName(response.questionId))
            }
          })
        })
        
        if (implementedControls.length > 0) {
          pdf.text('The following risk controls have been successfully implemented:', 25, yPosition)
          yPosition += 10
          
          implementedControls.forEach((control, index) => {
            checkAddPage(10)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`${index + 1}. ${control}`, 30, yPosition)
            yPosition += 6
          })
          
          yPosition += 10
        } else {
          pdf.text('No controls have been implemented yet - this represents an opportunity for risk reduction.', 25, yPosition)
          yPosition += 10
        }
      }
      
      // Risk Analysis Section
      checkAddPage(30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85)
      pdf.text('Risk Analysis', 20, yPosition)
      
      yPosition += 12
      pdf.setFontSize(12)
      pdf.setTextColor(71, 85, 105)
      pdf.setFont('helvetica', 'normal')
      
      const analysisLines = pdf.splitTextToSize(result.analysis, pageWidth - 50)
      pdf.text(analysisLines, 25, yPosition)
      yPosition += analysisLines.length * 6 + 12
      
      // Risk Mitigations Section
      if (result.riskMitigations && result.riskMitigations.length > 0) {
        checkAddPage(40)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(51, 65, 85)
        pdf.text('Risk Mitigations & Recommendations', 20, yPosition)
        
        yPosition += 15
        
        result.riskMitigations.slice(0, 5).forEach((item, index) => {
          checkAddPage(30)
          
          // Mitigation box
          pdf.setFillColor(252, 252, 252) // Very light gray background (more subtle)
          pdf.rect(20, yPosition - 3, pageWidth - 40, 25, 'F')
          
          pdf.setFontSize(12)
          pdf.setTextColor(37, 99, 235) // Softer blue text
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${index + 1}. ${item.riskId} - ${item.riskName}`, 25, yPosition + 5)
          
          pdf.setFontSize(10)
          pdf.setTextColor(75, 85, 99) // Softer gray
          pdf.setFont('helvetica', 'normal')
          pdf.text(`Mitigation: ${item.mitigationName} (${item.mitigationId})`, 30, yPosition + 12)
          
          const summaryLines = pdf.splitTextToSize(`Summary: ${item.summary.substring(0, 200)}...`, pageWidth - 60)
          pdf.text(summaryLines, 30, yPosition + 18)
          
          yPosition += Math.max(25, summaryLines.length * 4 + 15)
        })
      }
      
      // Framework References
      checkAddPage(30)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85)
      pdf.text('FINOS Framework References', 20, yPosition)
      
      yPosition += 12
      pdf.setFontSize(12)
      pdf.setTextColor(71, 85, 105)
      pdf.setFont('helvetica', 'normal')
      
      const frameworkRefs = [
        'OWASP LLM Top 10 - LLM Application Security Standard',
        'FFIEC Guidelines - Financial Institution IT Examination',
        'EU AI Act - European AI Regulation Framework',
        'NIST AI RMF - AI Risk Management Framework'
      ]
      
      pdf.text('External Standards Referenced:', 25, yPosition)
      yPosition += 8
      frameworkRefs.forEach(ref => {
        pdf.text(`• ${ref}`, 30, yPosition)
        yPosition += 6
      })
      
      // Footer on all pages
      const pageCount = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(156, 163, 175) // Gray
        pdf.text(`Page ${i} of ${pageCount}`, 20, pageHeight - 10)
        pdf.text(`Generated on ${new Date().toLocaleDateString()} by FINOS AI Governance Tool`, pageWidth - 80, pageHeight - 10)
      }
      
      // Generate filename and save
      const filename = `FINOS-AI-Assessment-${result.productInfo?.productName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Report'}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(filename)
      
      console.log('Comprehensive styled PDF generated successfully!')
      
    } catch (error) {
      console.error('PDF Error:', error)
      alert(`PDF Error: ${error.message}\n\nPlease try refreshing the page or check console for details.`)
    }
  }
  
  // Helper function to load jsPDF from CDN
  const loadJsPDFFromCDN = () => {
    return new Promise((resolve, reject) => {
      if ((window as any).jsPDF) {
        resolve((window as any).jsPDF)
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = () => {
        console.log('jsPDF CDN loaded')
        resolve((window as any).jsPDF)
      }
      script.onerror = () => {
        console.error('Failed to load jsPDF from CDN')
        reject(new Error('CDN load failed'))
      }
      document.head.appendChild(script)
    })
  }

  const emailReport = async () => {
    console.log('Starting email report...')
    
    if (!result.productInfo?.productManagerEmail) {
      console.log('No manager email found')
      alert('Product manager email not available. Cannot send email.')
      return
    }

    setIsEmailSending(true)
    setEmailStatus(null)
    console.log('Email sending state set to true')

    try {
      console.log('Attempting to send email to:', result.productInfo.productManagerEmail)
      
      // Simple email data without PDF for testing
      const emailData = {
        pdfData: 'data:application/pdf;base64,test', // Dummy PDF data for testing
        productInfo: {
          productName: result.productInfo?.productName || '',
          productManagerName: result.productInfo?.productManagerName || '',
          productManagerEmail: result.productInfo?.productManagerEmail || ''
        },
        assessmentSummary: {
          overallScore: result.overallRiskScore,
          riskScores: result.riskScores,
          assessedRisks: result.assessedRisks || []
        }
      }
      
      console.log('Email data prepared:', emailData)
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      })
      
      console.log('Email API response status:', response.status)
      console.log('Email API response ok:', response.ok)
      
      const responseData = await response.json()
      console.log('Email API response data:', responseData)
      
      if (responseData.success) {
        setEmailStatus(`✅ ${responseData.message}`)
        console.log('Email sent successfully')
        setTimeout(() => setEmailStatus(null), 5000)
      } else {
        setEmailStatus(`❌ ${responseData.error}`)
        console.log('Email failed:', responseData.error)
        setTimeout(() => setEmailStatus(null), 8000)
      }
      
    } catch (error) {
      console.error('Email error details:', error)
      console.error('Email error message:', error.message)
      console.error('Email error stack:', error.stack)
      setEmailStatus('❌ Failed to send email. Please try again.')
      setTimeout(() => setEmailStatus(null), 8000)
    } finally {
      setIsEmailSending(false)
      console.log('Email sending state reset')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 p-8 text-center border-b border-gray-200">
              <h2 className="text-3xl font-bold mb-2">AI Risk Assessment Report</h2>
              <p className="text-gray-600">In alignment with Industry framework</p>
            </div>

            <div className="p-6">
              {/* Overall Risk Score */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${getRiskScoreColor(result.overallRiskScore)}`}>
                  {Math.round((result.overallRiskScore / 100) * 100)}%
                </div>
                <h3 className="text-2xl font-semibold mt-4 mb-2 text-gray-900">
                  {getRiskScoreLabel(result.overallRiskScore)}
                </h3>
                <p className="text-gray-600">Overall Risk Score</p>
              </div>

              {/* Assessment Info */}
              {result.assessedRisks && result.assessedRisks.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <h4 className="font-semibold text-blue-800 mb-2">Assessment Scope</h4>
                  <p className="text-blue-700 text-sm">
                    This assessment focused on {result.assessedRisks.length} applicable risk{result.assessedRisks.length > 1 ? 's' : ''}: {' '}
                    {result.assessedRisks.map(risk => getRiskDisplayName(risk)).join(', ')}
                  </p>
                </div>
              )}

              {/* Risk Breakdown - Show Risk Levels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(result.riskScores).map(([riskKey, score]) => {
                  const riskLevel = getRiskLevel(score)
                  return (
                    <div key={riskKey} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-lg font-bold mb-4 ${riskLevel.color}`}>
                        {Math.round((score / 100) * 100)}%
                      </div>
                      <h4 className="font-semibold mb-2 text-gray-900">{getRiskDisplayName(riskKey)}</h4>
                      <p className="text-sm text-gray-600">{getRiskDescription(riskKey)}</p>
                      <p className="text-xs text-gray-500 mt-1">{riskLevel.level}</p>
                    </div>
                  )
                })}
                
                {/* Show not applicable risks with specific names */}
                {(() => {
                  const allPossibleRisks = ['hallucination', 'promptInjection', 'dataLeakage']
                  const assessedRisks = Object.keys(result.riskScores)
                  const notApplicableRisks = allPossibleRisks.filter(risk => !assessedRisks.includes(risk))
                  
                  return notApplicableRisks.map((riskKey) => (
                    <div key={`na-${riskKey}`} className="bg-gray-100 rounded-lg p-4 text-center opacity-50 border border-gray-200">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold mb-4 bg-gray-300 text-gray-500">
                        N/A
                      </div>
                      <h4 className="font-semibold mb-2 text-gray-500">{getRiskDisplayName(riskKey)}</h4>
                      <p className="text-sm text-gray-400">Risk not assessed for this system</p>
                    </div>
                  ))
                })()}
              </div>

              {/* Analysis */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                  <span className="mr-2">🔍</span>
                  Risk Analysis
                </h4>
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg border border-gray-200">
                  <p className="text-gray-800 leading-relaxed">{result.analysis}</p>
                </div>
              </div>

              {/* Risk Assessment & Mitigations Table - Enhanced with Risk Factors */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                  <span className="mr-2">🎯</span>
                  Risk Assessment & Mitigations
                </h4>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="text-left p-4 text-gray-900 font-semibold">Risk</th>
                          <th className="text-left p-4 text-gray-900 font-semibold">Mitigation</th>
                          <th className="text-left p-4 text-gray-900 font-semibold">Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.riskMitigations || []).map((item, index) => {
                          // Find related contributing factors for this risk
                          const relatedFactors = (result.contributingFactors || []).filter(
                            factor => factor.riskId === item.riskId
                          )
                          
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="p-4">
                                <div className="mb-3">
                                  <div className="text-blue-600 font-medium text-sm">{item.riskId}</div>
                                  <div className="text-gray-900 font-semibold">{item.riskName}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div>
                                  <div className="text-blue-600 font-medium text-sm">{item.mitigationId}</div>
                                  {frameworkData?.mitigationUrls?.[item.mitigationId] ? (
                                    <a
                                      href={frameworkData.mitigationUrls[item.mitigationId]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-900 font-semibold hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                                      title={`View ${item.mitigationName} details on FINOS framework`}
                                    >
                                      {item.mitigationName}
                                    </a>
                                  ) : (
                                    <div className="text-gray-900 font-semibold">{item.mitigationName}</div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-gray-700">{item.summary}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* FINOS Framework References - Enhanced */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Referenced FINOS Framework</h4>
                
                {/* Show assessed FINOS risks */}
                {result.assessedRisks && result.assessedRisks.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-800 mb-3">Assessed Risk Categories:</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.assessedRisks.map(risk => {
                        const riskInfo = {
                          hallucination: { 
                            id: 'AIR-OP-004', 
                            name: 'Hallucination and Inaccurate Outputs',
                            url: frameworkData?.hallucination?.url || 'https://air-governance-framework.finos.org/risks/'
                          },
                          promptInjection: { 
                            id: 'AIR-SEC-010', 
                            name: 'Prompt Injection',
                            url: frameworkData?.promptInjection?.url || 'https://air-governance-framework.finos.org/risks/'
                          },
                          dataLeakage: { 
                            id: 'AIR-RC-001', 
                            name: 'Information Leaked To Hosted Model',
                            url: frameworkData?.dataLeakage?.url || 'https://air-governance-framework.finos.org/risks/'
                          }
                        }[risk as keyof typeof riskInfo] || { 
                          id: risk, 
                          name: risk, 
                          url: 'https://air-governance-framework.finos.org/risks/'
                        }
                        
                        return (
                          <a
                            key={risk}
                            href={riskInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                            title={riskInfo.name}
                          >
                            {riskInfo.id}: {riskInfo.name}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* External framework references */}
                <h5 className="font-medium text-gray-800 mb-3">External Standards:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <a 
                    href={frameworkRefs.owasp.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-gray-100 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.owasp.description}
                  >
                    <div className="text-2xl mb-1">📋</div>
                    <div className="font-medium text-gray-700 group-hover:text-gray-900">OWASP LLM</div>
                    <div className="text-gray-500">Referenced</div>
                  </a>
                  
                  <a 
                    href={frameworkRefs.ffiec.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-gray-100 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.ffiec.description}
                  >
                    <div className="text-2xl mb-1">🏛️</div>
                    <div className="font-medium text-gray-700 group-hover:text-gray-900">FFIEC</div>
                    <div className="text-gray-500">Aligned</div>
                  </a>
                  
                  <a 
                    href={frameworkRefs.euAiAct.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-gray-100 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.euAiAct.description}
                  >
                    <div className="text-2xl mb-1">🇪🇺</div>
                    <div className="font-medium text-gray-700 group-hover:text-gray-900">EU AI Act</div>
                    <div className="text-gray-500">Considered</div>
                  </a>
                  
                  <a 
                    href={frameworkRefs.nist.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-gray-100 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.nist.description}
                  >
                    <div className="text-2xl mb-1">🛡️</div>
                    <div className="font-medium text-gray-700 group-hover:text-gray-900">NIST AI RMF</div>
                    <div className="text-gray-500">Referenced</div>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                onClick={downloadReport}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                >
                <span className="mr-2">📄</span>
                Download PDF Report
                </button>
                
                <button
                  onClick={emailReport}
                  disabled={isEmailSending || !result.productInfo?.productManagerEmail}
                  className={`px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md ${
                    isEmailSending
                      ? 'bg-gray-400 cursor-not-allowed'
                      : !result.productInfo?.productManagerEmail
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isEmailSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📧</span>
                      Email to Manager
                    </>
                  )}
                </button>
                
                <button
                  onClick={onReset}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                >
                  <span className="mr-2">🔄</span>
                  New Assessment
                </button>
              </div>

              {/* Email Status Message */}
              {emailStatus && (
                <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
                  emailStatus.includes('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {emailStatus}
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Risk Assessment Report Generated on {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
