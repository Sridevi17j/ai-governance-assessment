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
    overallScore: number
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
    if (score >= 70) return { level: 'High Risk', color: 'text-white bg-gradient-to-r from-red-500/80 to-pink-500/80' }
    if (score >= 40) return { level: 'Medium Risk', color: 'text-white bg-gradient-to-r from-yellow-500/80 to-orange-500/80' }
    return { level: 'Low Risk', color: 'text-white bg-gradient-to-r from-green-500/80 to-emerald-500/80' }
  }

  const getScoreColor = (score: number) => {
    // Overall compliance score: lower is worse (inverse of risk scores)
    // Convert risk-based scores to compliance scores for display
    const maxRiskScore = Math.max(...Object.values(result.riskScores))
    const overallRiskLevel = maxRiskScore
    
    // If we have high risks (70+), compliance cannot be "good"
    if (overallRiskLevel >= 70) {
      return 'text-white bg-gradient-to-r from-red-500/80 to-pink-500/80' // Poor compliance
    }
    if (score >= 80) return 'text-white bg-gradient-to-r from-green-500/80 to-emerald-500/80'
    if (score >= 60) return 'text-white bg-gradient-to-r from-yellow-500/80 to-orange-500/80' // Moderate, not good
    if (score >= 40) return 'text-white bg-gradient-to-r from-orange-500/80 to-red-500/80'
    return 'text-white bg-gradient-to-r from-red-500/80 to-pink-500/80'
  }

  const getScoreLabel = (score: number) => {
    // Check if we have high risks first
    const maxRiskScore = Math.max(...Object.values(result.riskScores))
    
    // If any risk is high (70+), overall compliance cannot be excellent or good
    if (maxRiskScore >= 70) {
      return 'Needs Attention' // High risks require attention
    }
    if (maxRiskScore >= 40) {
      return 'Moderate Compliance' // Medium risks
    }
    
    // Only if risks are low, use the score-based labels
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Moderate'
    return 'Needs Improvement'
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
      const title = 'FINOS AI Governance Assessment Report'
      const titleWidth = pdf.getTextWidth(title)
      pdf.text(title, (pageWidth - titleWidth) / 2, 22)
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'normal')
      const subtitle = 'Based on Industry-Standard FINOS Framework'
      const subtitleWidth = pdf.getTextWidth(subtitle)
      pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 30)
      
      yPosition = 50
      
      // Product Information Section with styling
      pdf.setFillColor(240, 242, 247) // Light blue background
      pdf.rect(15, yPosition - 5, pageWidth - 30, 40, 'F') // Increased height from 35 to 40
      
      pdf.setFontSize(18)
      pdf.setTextColor(51, 65, 85) // Dark gray
      pdf.setFont('helvetica', 'bold')
      pdf.text('Product Information', 20, yPosition + 5)
      
      yPosition += 15
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
      
      yPosition += 10
      
      // Overall Assessment Section with styling
      checkAddPage(40)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85) // Dark grey text
      const overallAssessmentText = 'Overall Assessment'
      const overallAssessmentWidth = pdf.getTextWidth(overallAssessmentText)
      
      pdf.setFillColor(240, 242, 247) // Light grey background
      pdf.rect(15, yPosition - 3, overallAssessmentWidth + 20, 20, 'F') // Dynamic width + padding, proper height
      
      pdf.text(overallAssessmentText, 20, yPosition + 8)
      
      yPosition += 15
      pdf.setFontSize(14)
      pdf.setTextColor(51, 65, 85)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Compliance Score: ${result.overallScore}/100`, 25, yPosition)
      yPosition += 8
      pdf.text(`Compliance Level: ${getScoreLabel(result.overallScore)}`, 25, yPosition)
      
      yPosition += 20
      
      // Risk Assessment Section with styling
      checkAddPage(50)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85) // Dark grey text
      const riskAssessmentText = 'Risk Assessment Breakdown'
      const riskAssessmentWidth = pdf.getTextWidth(riskAssessmentText)
      
      pdf.setFillColor(240, 242, 247) // Light grey background
      pdf.rect(15, yPosition - 3, riskAssessmentWidth + 20, 18, 'F') // Dynamic width + padding, proper height
      
      pdf.text(riskAssessmentText, 20, yPosition + 8)
      
      yPosition += 25
      
      Object.entries(result.riskScores).forEach(([riskKey, score]) => {
        checkAddPage(25)
        const riskLevel = getRiskLevel(score)
        
        // Risk box with subtle color coding
        let bgColor = [144, 238, 144] // Light green for low risk (much lighter)
        if (score >= 70) bgColor = [255, 182, 193] // Light pink for high risk (much lighter)
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
      
      // Assessment Scope with styling
      if (result.assessedRisks && result.assessedRisks.length > 0) {
        checkAddPage(30)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(51, 65, 85) // Dark grey text
        const assessmentScopeText = 'Assessment Scope'
        const assessmentScopeWidth = pdf.getTextWidth(assessmentScopeText)
        
        pdf.setFillColor(240, 242, 247) // Light grey background
        pdf.rect(15, yPosition - 3, assessmentScopeWidth + 20, 18, 'F') // Dynamic width + padding, proper height
        
        pdf.text(assessmentScopeText, 20, yPosition + 8)
        
        yPosition += 20
        pdf.setFontSize(12)
        pdf.setTextColor(71, 85, 105)
        pdf.setFont('helvetica', 'normal')
        
        const scopeText = `This assessment focused on ${result.assessedRisks.length} applicable risk${result.assessedRisks.length > 1 ? 's' : ''}: ${result.assessedRisks.map(risk => getRiskDisplayName(risk)).join(', ')}`
        const scopeLines = pdf.splitTextToSize(scopeText, pageWidth - 50)
        pdf.text(scopeLines, 25, yPosition)
        yPosition += scopeLines.length * 6 + 15
      }
      
      // Risk Analysis Section with styling
      checkAddPage(40)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85) // Dark grey text
      const riskAnalysisText = 'Risk Analysis'
      const riskAnalysisWidth = pdf.getTextWidth(riskAnalysisText)
      
      pdf.setFillColor(240, 242, 247) // Light grey background
      pdf.rect(15, yPosition - 3, riskAnalysisWidth + 20, 18, 'F') // Dynamic width + padding, proper height
      
      pdf.text(riskAnalysisText, 20, yPosition + 8)
      
      yPosition += 25
      pdf.setFontSize(12)
      pdf.setTextColor(71, 85, 105)
      pdf.setFont('helvetica', 'normal')
      
      const analysisLines = pdf.splitTextToSize(result.analysis, pageWidth - 50)
      pdf.text(analysisLines, 25, yPosition)
      yPosition += analysisLines.length * 6 + 20
      
      // Risk Mitigations Section with styling
      if (result.riskMitigations && result.riskMitigations.length > 0) {
        checkAddPage(50)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(51, 65, 85) // Dark grey text
        const riskMitigationsText = 'Risk Mitigations & Recommendations'
        const riskMitigationsWidth = pdf.getTextWidth(riskMitigationsText)
        
        pdf.setFillColor(240, 242, 247) // Light grey background
        pdf.rect(15, yPosition - 3, riskMitigationsWidth + 20, 18, 'F') // Dynamic width + padding, proper height
        
        pdf.text(riskMitigationsText, 20, yPosition + 8)
        
        yPosition += 30
        
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
      
      // Framework References with styling
      checkAddPage(40)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(51, 65, 85) // Dark grey text
      const frameworkReferencesText = 'FINOS Framework References'
      const frameworkReferencesWidth = pdf.getTextWidth(frameworkReferencesText)
      
      pdf.setFillColor(240, 242, 247) // Light grey background
      pdf.rect(15, yPosition - 3, frameworkReferencesWidth + 20, 18, 'F') // Dynamic width + padding, proper height
      
      pdf.text(frameworkReferencesText, 20, yPosition + 8)
      
      yPosition += 30
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
          overallScore: result.overallScore,
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white p-8 text-center border-b border-white/20">
              <h2 className="text-3xl font-bold mb-2">Your AI Governance Assessment</h2>
              <p className="text-white/80">Based on FINOS Industry Framework</p>
            </div>

            <div className="p-8">
              {/* Overall Score */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </div>
                <h3 className="text-2xl font-semibold mt-4 mb-2 text-white">
                  {getScoreLabel(result.overallScore)}
                </h3>
                <p className="text-white/70">Overall FINOS Framework Score</p>
              </div>

              {/* Assessment Info */}
              {result.assessedRisks && result.assessedRisks.length > 0 && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-4 mb-8 backdrop-blur-sm">
                  <h4 className="font-semibold text-purple-200 mb-2">Assessment Scope</h4>
                  <p className="text-purple-100 text-sm">
                    This assessment focused on {result.assessedRisks.length} applicable risk{result.assessedRisks.length > 1 ? 's' : ''}: {' '}
                    {result.assessedRisks.map(risk => getRiskDisplayName(risk)).join(', ')}
                  </p>
                </div>
              )}

              {/* Risk Breakdown - Show Risk Levels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {Object.entries(result.riskScores).map(([riskKey, score]) => {
                  const riskLevel = getRiskLevel(score)
                  return (
                    <div key={riskKey} className="backdrop-blur-md bg-white/10 rounded-lg p-6 text-center border border-white/20">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-sm font-bold mb-4 ${riskLevel.color}`}>
                        {riskLevel.level}
                      </div>
                      <h4 className="font-semibold mb-2 text-white">{getRiskDisplayName(riskKey)}</h4>
                      <p className="text-sm text-white/70">{getRiskDescription(riskKey)}</p>
                    </div>
                  )
                })}
                
                {/* Fill remaining slots if less than 3 risks assessed */}
                {Object.keys(result.riskScores).length < 3 && 
                  Array(3 - Object.keys(result.riskScores).length).fill(null).map((_, index) => (
                    <div key={`placeholder-${index}`} className="backdrop-blur-md bg-white/5 rounded-lg p-6 text-center opacity-50 border border-white/10">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold mb-4 bg-white/20 text-white/40">
                        N/A
                      </div>
                      <h4 className="font-semibold mb-2 text-white/40">Not Applicable</h4>
                      <p className="text-sm text-white/30">Risk not assessed for this system</p>
                    </div>
                  ))
                }
              </div>

              {/* Analysis */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <span className="mr-2">🔍</span>
                  Risk Analysis
                </h4>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-l-4 border-purple-400 p-6 rounded-r-lg backdrop-blur-sm border border-purple-400/30">
                  <p className="text-white/90 leading-relaxed">{result.analysis}</p>
                </div>
              </div>

              {/* Risk Assessment & Mitigations Table - Enhanced with Risk Factors */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <span className="mr-2">🎯</span>
                  Risk Assessment & Mitigations
                </h4>
                <div className="backdrop-blur-md bg-white/10 rounded-lg border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-white/20">
                          <th className="text-left p-4 text-white font-semibold">Risk</th>
                          <th className="text-left p-4 text-white font-semibold">Mitigation</th>
                          <th className="text-left p-4 text-white font-semibold">Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.riskMitigations || []).map((item, index) => {
                          // Find related contributing factors for this risk
                          const relatedFactors = (result.contributingFactors || []).filter(
                            factor => factor.riskId === item.riskId
                          )
                          
                          return (
                            <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <div className="mb-3">
                                  <div className="text-cyan-300 font-medium text-sm">{item.riskId}</div>
                                  <div className="text-white/90 font-semibold">{item.riskName}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div>
                                  <div className="text-cyan-300 font-medium text-sm">{item.mitigationId}</div>
                                  {frameworkData?.mitigationUrls?.[item.mitigationId] ? (
                                    <a
                                      href={frameworkData.mitigationUrls[item.mitigationId]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-white/90 font-semibold hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                                      title={`View ${item.mitigationName} details on FINOS framework`}
                                    >
                                      {item.mitigationName}
                                    </a>
                                  ) : (
                                    <div className="text-white/90 font-semibold">{item.mitigationName}</div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-white/80">{item.summary}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* FINOS Framework References - Enhanced */}
              <div className="backdrop-blur-md bg-white/10 rounded-lg p-6 mb-8 border border-white/20">
                <h4 className="text-lg font-semibold mb-4 text-white">Referenced FINOS Framework</h4>
                
                {/* Show assessed FINOS risks */}
                {result.assessedRisks && result.assessedRisks.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-medium text-white/90 mb-3">Assessed Risk Categories:</h5>
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
                            className="inline-block bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 px-3 py-1 rounded-full text-sm font-medium hover:bg-gradient-to-r hover:from-purple-500/40 hover:to-pink-500/40 transition-colors"
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
                <h5 className="font-medium text-white/90 mb-3">External Standards:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <a 
                    href={frameworkRefs.owasp.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.owasp.description}
                  >
                    <div className="text-2xl mb-1">📋</div>
                    <div className="font-medium text-cyan-300 group-hover:text-cyan-100">OWASP LLM</div>
                    <div className="text-white/70">Referenced</div>
                  </a>
                  
                  <a 
                    href={frameworkRefs.ffiec.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.ffiec.description}
                  >
                    <div className="text-2xl mb-1">🏛️</div>
                    <div className="font-medium text-cyan-300 group-hover:text-cyan-100">FFIEC</div>
                    <div className="text-white/70">Aligned</div>
                  </a>
                  
                  <a 
                    href={frameworkRefs.euAiAct.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.euAiAct.description}
                  >
                    <div className="text-2xl mb-1">🇪🇺</div>
                    <div className="font-medium text-cyan-300 group-hover:text-cyan-100">EU AI Act</div>
                    <div className="text-white/70">Considered</div>
                  </a>
                  
                  <a 
                    href={frameworkRefs.nist.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors cursor-pointer group"
                    title={frameworkRefs.nist.description}
                  >
                    <div className="text-2xl mb-1">🛡️</div>
                    <div className="font-medium text-cyan-300 group-hover:text-cyan-100">NIST AI RMF</div>
                    <div className="text-white/70">Referenced</div>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                onClick={downloadReport}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                <span className="mr-2">📄</span>
                Download PDF Report
                </button>
                
                <button
                  onClick={emailReport}
                  disabled={isEmailSending || !result.productInfo?.productManagerEmail}
                  className={`px-6 py-3 rounded-lg transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isEmailSending
                      ? 'bg-gray-500 cursor-not-allowed'
                      : !result.productInfo?.productManagerEmail
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
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
                  className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="mr-2">🔄</span>
                  New Assessment
                </button>
              </div>

              {/* Email Status Message */}
              {emailStatus && (
                <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
                  emailStatus.includes('✅') 
                    ? 'bg-green-500/20 border border-green-400/50 text-green-100'
                    : 'bg-red-500/20 border border-red-400/50 text-red-100'
                }`}>
                  {emailStatus}
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-white/20">
                <p className="text-sm text-white/70">
                  Assessment powered by FINOS AI Governance Framework • 
                  <span className="ml-1">Generated on {new Date().toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
