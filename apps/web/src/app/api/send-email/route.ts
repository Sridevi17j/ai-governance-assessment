import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

interface EmailRequest {
  pdfData: string // base64 PDF data
  productInfo: {
    productName: string
    productManagerName: string
    productManagerEmail: string
  }
  assessmentSummary: {
    overallScore: number
    riskScores: Record<string, number>
    assessedRisks: string[]
  }
}

// Function to load token.json or token.pickle
function loadTokenFile() {
  try {
    // In production (Vercel), try environment variables first
    if (process.env.GMAIL_ACCESS_TOKEN && process.env.GMAIL_REFRESH_TOKEN) {
      console.log('✅ Using Gmail credentials from environment variables')
      return {
        access_token: process.env.GMAIL_ACCESS_TOKEN,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        token_uri: 'https://oauth2.googleapis.com/token',
        client_id: process.env.GMAIL_CLIENT_ID || 'your-client-id',
        client_secret: process.env.GMAIL_CLIENT_SECRET || 'your-client-secret',
        scopes: ['https://www.googleapis.com/auth/gmail.send']
      }
    }
    
    const currentDir = process.cwd()
    console.log('🔍 Current working directory:', currentDir)
    
    // Try both the current directory and the project root
    const possiblePaths = [
      path.join(process.cwd(), 'token.json'),
      path.join(process.cwd(), '../../token.json'), // Project root
      path.join(process.cwd(), '../../../token.json') // One level up
    ]
    
    const possiblePicklePaths = [
      path.join(process.cwd(), 'token.pickle'),
      path.join(process.cwd(), '../../token.pickle'),
      path.join(process.cwd(), '../../../token.pickle')
    ]
    
    console.log('🔍 Checking possible paths:')
    possiblePaths.forEach((p, i) => {
      console.log(`🔍 Path ${i + 1}:`, p, '- exists:', fs.existsSync(p))
    })
    
    // Try JSON first (preferred format)
    for (const tokenPath of possiblePaths) {
      if (fs.existsSync(tokenPath)) {
        console.log('✅ Found token.json at:', tokenPath)
        const tokenData = fs.readFileSync(tokenPath, 'utf8')
        return JSON.parse(tokenData)
      }
    }
    
    // Fallback to pickle file (needs conversion)
    for (const picklePath of possiblePicklePaths) {
      if (fs.existsSync(picklePath)) {
        throw new Error(`Found token.pickle at ${picklePath} but need token.json. Please convert using TOKEN-SETUP.md instructions.`)
      }
    }
    
    throw new Error(`No token file found. For production deployment, set GMAIL_ACCESS_TOKEN and GMAIL_REFRESH_TOKEN environment variables. For local development, place token.json in one of these locations: ${possiblePaths.join(', ')}`)
    
  } catch (error) {
    console.error('Error loading token:', error)
    throw error
  }
}

// Create Gmail service
async function createGmailService() {
  try {
    // OAuth2 credentials from environment variables
    const credentials = {
      client_id: process.env.GMAIL_CLIENT_ID || "your-client-id",
      client_secret: process.env.GMAIL_CLIENT_SECRET || "your-client-secret",
      redirect_uris: ["http://localhost"]
    }
    
    const { client_id, client_secret, redirect_uris } = credentials
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    
    // Load token from file
    const tokens = loadTokenFile()
    oAuth2Client.setCredentials(tokens)
    
    // Create Gmail service
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })
    return gmail
  } catch (error) {
    console.error('Error creating Gmail service:', error)
    throw error
  }
}

// Create email message with PDF attachment
function createEmailMessage(emailData: EmailRequest) {
  const { pdfData, productInfo, assessmentSummary } = emailData
  const { productName, productManagerName, productManagerEmail } = productInfo
  const { overallScore, assessedRisks } = assessmentSummary
  
  const boundary = '=_boundary_' + Math.random().toString(36).substr(2, 9)
  
  // Email subject
  const subject = `FINOS AI Governance Assessment Report - ${productName}`
  
  // Email body (plain text)
  const emailBody = `Dear ${productManagerName},

Your FINOS AI Governance Assessment for "${productName}" has been completed.

Assessment Summary:
• Overall Compliance Score: ${overallScore}/100
• Assessment Date: ${new Date().toLocaleDateString()}
• Risks Evaluated: ${assessedRisks.map(risk => {
    const riskNames: Record<string, string> = {
      hallucination: 'Hallucination Risk',
      promptInjection: 'Prompt Injection Risk', 
      dataLeakage: 'Data Leakage Risk'
    }
    return riskNames[risk] || risk
  }).join(', ')}

Please find the detailed report attached as a PDF.

This assessment was conducted using the industry-standard FINOS AI Governance Framework.

Best regards,
AI Governance Assessment System`

  // Convert base64 PDF to proper format
  const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64')
  const pdfBase64 = pdfBuffer.toString('base64')
  
  // Create multipart email with attachment
  const email = [
    `To: ${productManagerEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    emailBody,
    '',
    `--${boundary}`,
    'Content-Type: application/pdf',
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="FINOS-AI-Assessment-${productName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf"`,
    '',
    pdfBase64,
    '',
    `--${boundary}--`
  ].join('\n')
  
  // Encode for Gmail API
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    
    console.log('Sending email to:', body.productInfo.productManagerEmail)
    
    // Create Gmail service
    const gmail = await createGmailService()
    
    // Create email message
    const encodedMessage = createEmailMessage(body)
    
    // Send email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })
    
    console.log('Email sent successfully:', result.data.id)
    
    return NextResponse.json({ 
      success: true, 
      message: `Email sent successfully to ${body.productInfo.productManagerName}!`,
      messageId: result.data.id
    })
    
  } catch (error) {
    console.error('Email sending error:', error)
    
    let errorMessage = 'Failed to send email'
    
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        errorMessage = 'Gmail authentication failed. Please check token.json file and TOKEN-SETUP.md instructions.'
      } else if (error.message.includes('invalid_grant')) {
        errorMessage = 'Gmail token expired. Please refresh your authentication.'
      } else if (error.message.includes('insufficient permissions')) {
        errorMessage = 'Insufficient Gmail permissions. Please check OAuth scopes.'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}
