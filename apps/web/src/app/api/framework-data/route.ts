import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data') // Changed from '../../data' to 'data'
    
    // Load all framework files to extract URLs and mitigation links
    const frameworkData: any = {}
    
    try {
      const hallucinationData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'Hallucination_and_Inaccurate_Outputs.json'), 'utf8')
      )
      frameworkData.hallucination = {
        id: hallucinationData.id,
        title: hallucinationData.title,
        url: hallucinationData.url,
        key_mitigations: hallucinationData.key_mitigations
      }
    } catch (error) {
      console.log('Could not load hallucination data:', error)
    }

    try {
      const promptInjectionData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'Prompt_Injection.json'), 'utf8')
      )
      frameworkData.promptInjection = {
        id: promptInjectionData.id,
        title: promptInjectionData.title,
        url: promptInjectionData.url,
        key_mitigations: promptInjectionData.key_mitigations
      }
    } catch (error) {
      console.log('Could not load prompt injection data:', error)
    }

    try {
      const dataLeakageData = JSON.parse(
        fs.readFileSync(path.join(dataDir, 'Information_Leaked_To_Hosted_Model.json'), 'utf8')
      )
      frameworkData.dataLeakage = {
        id: dataLeakageData.id,
        title: dataLeakageData.title,
        url: dataLeakageData.url,
        key_mitigations: dataLeakageData.key_mitigations
      }
    } catch (error) {
      console.log('Could not load data leakage data:', error)
    }

    // Extract mitigation URLs from all loaded data
    const mitigationUrls: any = {}
    
    Object.values(frameworkData).forEach((risk: any) => {
      if (risk.key_mitigations) {
        risk.key_mitigations.forEach((mitigation: any) => {
          if (mitigation.id && mitigation.link) {
            mitigationUrls[mitigation.id] = mitigation.link
          }
        })
      }
    })

    // Add mitigation URLs to response
    frameworkData.mitigationUrls = mitigationUrls

    return NextResponse.json(frameworkData)
    
  } catch (error) {
    console.error('Framework data loading error:', error)
    return NextResponse.json(
      { error: 'Failed to load framework data' },
      { status: 500 }
    )
  }
}
