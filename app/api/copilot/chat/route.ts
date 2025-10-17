import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// This endpoint provides AI-powered assistance for the ATS system
// In production, you would integrate with OpenAI, Anthropic, or another LLM provider
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    
    // Get context from the database for more intelligent responses
    let contextData = '';
    
    try {
      // Get recent predictions for context
      const recentPredictions = await prisma.interviewPrediction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      // Get recent bias events
      const recentBiasEvents = await prisma.biasEvent.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        where: { adjudicated: false },
      });

      // Get latest fairness gate run
      const latestFairnessRun = await prisma.fairnessGateRun.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      contextData = `
System Context:
- Recent Predictions: ${recentPredictions.length} predictions made
- Average Success Rate: ${recentPredictions.length > 0 ? (recentPredictions.reduce((sum, p) => sum + p.pSuccess, 0) / recentPredictions.length).toFixed(2) : 'N/A'}
- Pending Bias Events: ${recentBiasEvents.length}
- Latest Fairness Status: ${latestFairnessRun?.status || 'No data'}
`;
    } catch (dbError) {
      console.error('Error fetching context:', dbError);
      // Continue without context if DB is not available
    }

    // Generate intelligent response based on the query
    const response = generateATSResponse(lastMessage.content, contextData);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

function generateATSResponse(userQuery: string, context: string): string {
  const query = userQuery.toLowerCase();

  // Candidate Analysis
  if (query.includes('analyze') || query.includes('resume') || query.includes('candidate')) {
    return `🔍 **Candidate Analysis**

Based on our ATS system, here's how I can help analyze candidates:

**Key Analysis Areas:**
1. **Resume Parsing** - Extract skills, experience, and education
2. **Keyword Matching** - Compare against job requirements
3. **Experience Validation** - Verify work history and tenure
4. **Skill Assessment** - Match technical and soft skills
5. **Cultural Fit Indicators** - Analyze communication style and values

**Fairness Checks:**
- Automatic bias detection in screening
- Demographic parity monitoring
- Equal opportunity compliance
${context}

Would you like me to analyze a specific candidate or provide detailed insights on any of these areas?`;
  }

  // Success Prediction
  if (query.includes('predict') || query.includes('success') || query.includes('probability')) {
    return `📊 **Success Prediction Analytics**

Our ML model provides interview success predictions with:

**Model Features:**
- Historical performance data
- Technical skill alignment
- Interview stage progression
- Confidence scoring (0-1 scale)
${context}

**Fairness Guarantees:**
- Adverse Impact Ratio ≥ 0.80 (EEOC compliant)
- TPR Gap ≤ 0.05
- FPR Gap ≤ 0.05
- Calibration monitoring

The system continuously monitors for bias and fairness across all protected groups. Would you like to see predictions for a specific candidate?`;
  }

  // Interview Questions
  if (query.includes('interview') || query.includes('question')) {
    return `💬 **Interview Question Generator**

I can help you create tailored interview questions:

**Question Categories:**
1. **Technical Skills** - Role-specific technical assessment
2. **Behavioral** - STAR method questions
3. **Cultural Fit** - Values and team dynamics
4. **Problem Solving** - Critical thinking scenarios
5. **Leadership** - Management and influence questions

**Best Practices:**
- Structured interviews reduce bias
- Consistent questions across candidates
- Objective scoring rubrics
- Legal compliance checks

Would you like me to generate questions for a specific role or candidate?`;
  }

  // Scheduling
  if (query.includes('schedule') || query.includes('calendar') || query.includes('time')) {
    return `📅 **Smart Scheduling Assistant**

I can help optimize interview scheduling:

**Features:**
- Conflict-free slot reservation
- Alternative time suggestions
- Timezone coordination
- Interviewer availability matching
- Automated reminders

**Our Redis-based system ensures:**
- Real-time availability
- No double-booking
- TTL-based slot expiry
- Fair slot allocation

Would you like help scheduling an interview or checking availability?`;
  }

  // Bias and Fairness
  if (query.includes('bias') || query.includes('fairness') || query.includes('discrimination')) {
    return `⚖️ **Bias Detection & Fairness Monitoring**

Our system implements comprehensive fairness safeguards:

**Active Monitoring:**
- Real-time bias event detection (Severity 1-5)
- Demographic parity analysis
- Calibration checks across groups
- Statistical significance testing
${context}

**Escalation Process:**
- Automated flagging of concerning patterns
- Human review for high-severity events
- Documented resolution tracking
- Audit trail maintenance

**Compliance:**
- EEOC 4/5ths rule enforcement
- GDPR privacy protections
- 7-year audit retention

All fairness metrics are calculated with Bonferroni correction for statistical rigor.`;
  }

  // Analytics and Reporting
  if (query.includes('analytic') || query.includes('report') || query.includes('metric')) {
    return `📈 **Analytics & Reporting**

Access comprehensive hiring metrics:

**Available Reports:**
1. **Calibration Plots** - Model accuracy visualization
2. **Lift Charts** - Prediction value analysis
3. **Fairness Metrics** - Group parity measurements
4. **Quality of Hire** - Long-term outcome tracking
5. **Pipeline Analytics** - Stage conversion rates
${context}

**Key Metrics:**
- Model AUC score
- Prediction confidence
- Retention rates (12-month)
- Performance scores
- Time-to-hire

Would you like to see specific metrics or generate a custom report?`;
  }

  // Default helpful response
  return `👋 **ATS AI Copilot - Here to Help!**

I can assist you with:

🔍 **Candidate Management**
- Resume analysis and parsing
- Skill matching and assessment
- Experience verification

📊 **Predictive Analytics**
- Success probability scoring
- Interview outcome predictions
- Quality of hire forecasting

💬 **Interview Support**
- Custom question generation
- Structured interview guides
- Scoring rubric creation

📅 **Scheduling & Coordination**
- Smart slot recommendations
- Conflict resolution
- Calendar integration

⚖️ **Fairness & Compliance**
- Bias detection and reporting
- EEOC compliance monitoring
- Audit trail management

${context}

What specific area would you like help with? Just ask naturally, and I'll provide detailed guidance!`;
}
