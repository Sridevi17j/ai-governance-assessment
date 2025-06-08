// checklistData.ts - Configuration for the 21 risk assessment questions

export interface ChecklistQuestion {
  id: number
  question: string
  purpose: string
  category: 'hallucination' | 'promptInjection' | 'dataLeakage'
  weight: number // Risk reduction weight (1-10, higher = more important)
  finosMapping: string // Maps to FINOS mitigation ID
}

export const checklistQuestions: ChecklistQuestion[] = [
  // Hallucination Risk Questions (7 questions)
  {
    id: 1,
    question: "Have you implemented human-in-the-loop review for critical AI outputs?",
    purpose: "Control hallucination in high-stakes flows.",
    category: "hallucination",
    weight: 9,
    finosMapping: "AIR-PREV-005"
  },
  {
    id: 2,
    question: "Are output accuracy checks part of your test suite or QA process?",
    purpose: "Ensure systematic validation.",
    category: "hallucination",
    weight: 8,
    finosMapping: "AIR-PREV-005"
  },
  {
    id: 3,
    question: "Is the model's training data documented and verified for relevance?",
    purpose: "Reduce hallucinations from poor data.",
    category: "hallucination",
    weight: 7,
    finosMapping: "AIR-PREV-006"
  },
  {
    id: 4,
    question: "Are prompts tested for deterministic output where applicable?",
    purpose: "Control variability in generations.",
    category: "hallucination",
    weight: 6,
    finosMapping: "AIR-PREV-005"
  },
  {
    id: 5,
    question: "Do you use grounding techniques (e.g., RAG with verified sources)?",
    purpose: "Tie output to known truth sources.",
    category: "hallucination",
    weight: 8,
    finosMapping: "AIR-PREV-006"
  },
  {
    id: 6,
    question: "Are users warned when outputs may be speculative or unsupported?",
    purpose: "Transparency control.",
    category: "hallucination",
    weight: 5,
    finosMapping: "AIR-PREV-005"
  },
  {
    id: 7,
    question: "Have you run hallucination benchmark tests (e.g., TruthfulQA)?",
    purpose: "Quantify the risk systematically.",
    category: "hallucination",
    weight: 7,
    finosMapping: "AIR-PREV-005"
  },

  // Prompt Injection Risk Questions (7 questions)
  {
    id: 8,
    question: "Are prompts and user inputs sanitized before being passed to the LLM?",
    purpose: "Prevent prompt injection.",
    category: "promptInjection",
    weight: 9,
    finosMapping: "AIR-PREV-003"
  },
  {
    id: 9,
    question: "Have you tested your prompts for jailbreak and override vulnerabilities?",
    purpose: "Defensive testing.",
    category: "promptInjection",
    weight: 8,
    finosMapping: "AIR-PREV-005"
  },
  {
    id: 10,
    question: "Do you use a 'system prompt' guardrail that is regenerated or isolated per session?",
    purpose: "Prevent user override.",
    category: "promptInjection",
    weight: 7,
    finosMapping: "AIR-PREV-003"
  },
  {
    id: 11,
    question: "Are model inputs monitored/logged for suspicious tokens or patterns?",
    purpose: "Detection of attacks.",
    category: "promptInjection",
    weight: 8,
    finosMapping: "AIR-DET-004"
  },
  {
    id: 12,
    question: "Do you restrict user control over the structure of final prompts?",
    purpose: "Input shaping to avoid injection vectors.",
    category: "promptInjection",
    weight: 6,
    finosMapping: "AIR-PREV-003"
  },
  {
    id: 13,
    question: "Is the prompt-building logic abstracted and validated at build-time?",
    purpose: "Code hygiene and prevention.",
    category: "promptInjection",
    weight: 5,
    finosMapping: "AIR-PREV-005"
  },
  {
    id: 14,
    question: "Are there any third-party prompt injection detection tools integrated?",
    purpose: "Use of established tooling.",
    category: "promptInjection",
    weight: 7,
    finosMapping: "AIR-PREV-017"
  },

  // Data Leakage Risk Questions (7 questions)
  {
    id: 15,
    question: "Has data classification been performed on all inputs sent to hosted LLMs?",
    purpose: "Identify sensitive data before exposure.",
    category: "dataLeakage",
    weight: 9,
    finosMapping: "AIR-PREV-006"
  },
  {
    id: 16,
    question: "Do you mask or redact personal and confidential data before API calls?",
    purpose: "Reduce leakage risk.",
    category: "dataLeakage",
    weight: 8,
    finosMapping: "AIR-PREV-002"
  },
  {
    id: 17,
    question: "Are hosted model usage contracts reviewed for data retention and usage terms?",
    purpose: "Regulatory control.",
    category: "dataLeakage",
    weight: 7,
    finosMapping: "AIR-PREV-007"
  },
  {
    id: 18,
    question: "Are inference logs reviewed for accidental leaks (e.g., through debugging)?",
    purpose: "Post-use monitoring.",
    category: "dataLeakage",
    weight: 6,
    finosMapping: "AIR-DET-001"
  },
  {
    id: 19,
    question: "Do you use in-house models or proxies where hosted models aren't approved?",
    purpose: "Avoid regulated exposure.",
    category: "dataLeakage",
    weight: 8,
    finosMapping: "AIR-PREV-007"
  },
  {
    id: 20,
    question: "Is the vector store (if used) self-hosted or encrypted with RBAC?",
    purpose: "Prevent search leakage.",
    category: "dataLeakage",
    weight: 7,
    finosMapping: "AIR-PREV-006"
  },
  {
    id: 21,
    question: "Is your system able to route sensitive queries to a private LLM instead?",
    purpose: "Smart routing control.",
    category: "dataLeakage",
    weight: 6,
    finosMapping: "AIR-PREV-007"
  }
]

export const categoryInfo = {
  hallucination: {
    title: "Hallucination and Inaccurate Outputs",
    description: "Controls to prevent AI from generating false or misleading information",
    icon: "🧠",
    color: "from-purple-500 to-indigo-500"
  },
  promptInjection: {
    title: "Prompt Injection",
    description: "Security measures to prevent malicious input manipulation", 
    icon: "🛡️",
    color: "from-red-500 to-pink-500"
  },
  dataLeakage: {
    title: "Information Leaked to Hosted Models",
    description: "Privacy controls for sensitive data protection",
    icon: "☁️", 
    color: "from-blue-500 to-cyan-500"
  }
}

export type ChecklistAnswer = 'yes' | 'no' | 'na'

export interface ChecklistResponse {
  questionId: number
  answer: ChecklistAnswer
}

export interface ChecklistData {
  hallucination: ChecklistResponse[]
  promptInjection: ChecklistResponse[]
  dataLeakage: ChecklistResponse[]
}
