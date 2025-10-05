# Hiring Prediction System

A comprehensive, fair, and compliant AI-powered interview prediction system built with Next.js, Prisma, and Redis.

## System Overview

This system provides interview success predictions with rigorous fairness guarantees, statistical monitoring, and comprehensive audit capabilities.

### Key Features

- **Interview Success Prediction**: ML-powered predictions for candidate interview success
- **Fairness Gates**: Automated fairness monitoring with statistical corrections
- **Bias Detection**: Real-time bias event detection and escalation
- **Quality of Hire Tracking**: Long-term outcome measurement across role families
- **Scheduling System**: Redis-based slot reservation with conflict resolution
- **Audit Trail**: Cryptographically signed logs for compliance
- **Dashboard**: Real-time monitoring and analytics

## Architecture

```
├── app/
│   ├── (dashboard)/          # Dashboard pages
│   │   ├── page.tsx          # Main dashboard with calibration plots
│   │   ├── interviews/[id]/  # Interview prediction details
│   │   ├── escalations/      # Bias event management
│   │   └── analytics/        # Fairness metrics and model performance
│   └── api/                  # API routes
│       ├── telemetry/        # Prediction and outcome ingestion
│       ├── scheduling/       # Interview slot reservations
│       ├── escalations/      # Bias event reporting
│       ├── fairness/         # Fairness gate results
│       └── eval/             # Evaluation triggers
├── components/               # React components
│   ├── metrics/             # CalibrationPlot, LiftChart
│   ├── scheduling/          # SlotPicker
│   └── hilo/                # AssistControls for bias reporting
├── jobs/                    # Background jobs
│   ├── eval/                # Weekly fairness evaluations
│   └── cleanup/             # Expired reservation cleanup
├── lib/
│   ├── db.ts                # Prisma client
│   ├── metrics/prom.ts      # Prometheus metrics
│   ├── redis/               # Redis client and Lua scripts
│   └── security/            # Redaction and crypto utilities
├── prisma/
│   └── schema.prisma        # Database schema
├── config/
│   ├── fairness/gates.yml   # Fairness thresholds
│   └── qoh/qoh@2025.10.yml  # Quality of Hire formulas
└── docs/
    ├── GO_LIVE.md           # Launch checklist
    ├── MODEL_CARD.md        # Model documentation
    └── FAIRNESS_POLICY.md   # Fairness policy and procedures
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aberdeen-lawrence-ultimate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

Visit http://localhost:3000 to access the dashboard.

## API Routes

### Telemetry

**POST /api/telemetry/interview** - Submit interview predictions
```json
{
  "candidateId": "cand_123",
  "reqId": "req_456",
  "stage": "loop",
  "pSuccess": 0.75,
  "confidence": 0.85,
  "topFactors": ["technical_skills", "communication"],
  "groupKey": "protected_group_1",
  "modelVersion": "v1.0"
}
```

**POST /api/telemetry/outcomes** - Submit hire outcomes
```json
{
  "personId": "cand_123",
  "roleFamily": "eng",
  "startDate": "2025-01-15",
  "retained12m": true,
  "perfScore": 0.82,
  "qohVersion": "2025.10"
}
```

### Scheduling

**POST /api/scheduling/reserve** - Reserve interview slot
```json
{
  "slotId": "slot_789",
  "candidateId": "cand_123",
  "alternatives": ["slot_790", "slot_791"]
}
```

### Escalations

**POST /api/escalations/create** - Report bias event
```json
{
  "sessionId": "session_xyz",
  "severity": 4,
  "eventType": "demographic_bias",
  "details": {
    "description": "Potential demographic bias detected",
    "timestamp": "2025-10-05T10:30:00Z"
  }
}
```

### Fairness

**GET /api/fairness/gates?window=2025-W40** - Get fairness gate results

## Fairness Monitoring

The system implements multiple fairness metrics with statistical rigor:

- **Adverse Impact Ratio (AIR)**: ≥ 0.80 (EEOC 4/5ths rule)
- **True Positive Rate Gap**: ≤ 0.05
- **False Positive Rate Gap**: ≤ 0.05
- **Calibration Parity**: ≤ 0.05

All metrics use Bonferroni correction for multiple testing and require minimum sample sizes.

### Running Evaluations

Weekly fairness evaluations run automatically via the jobs system:

```bash
# Manual trigger
npm run eval:weekly
```

## Metrics

Prometheus metrics are exposed at `/api/agents/metrics`:

- `api_request_duration_seconds` - API latency
- `reservations_created_total` - Successful reservations
- `reservation_conflicts_total` - Reservation conflicts
- `telemetry_events_ingested_total` - Telemetry events
- `bias_events_detected_total` - Bias events by severity
- `fairness_gate_runs_total` - Fairness evaluations
- `model_auc_score` - Current model performance

## Database Models

### InterviewPrediction
Stores ML model predictions for candidate interview success.

### HireOutcome
Tracks actual hiring outcomes and quality of hire metrics.

### BiasEvent
Records detected bias events for review and escalation.

### FairnessGateRun
Stores fairness evaluation results with statistical tests.

### Reservation
Manages interview slot reservations with TTL.

### AuditLog
Immutable audit trail with HMAC signatures.

## Security

- **PII Redaction**: Automatic redaction of sensitive data in logs
- **Audit Signatures**: HMAC-signed audit logs for tamper detection
- **Secure Tokens**: Cryptographically secure token generation
- **Environment Variables**: Secrets managed via environment

## Compliance

See [FAIRNESS_POLICY.md](docs/FAIRNESS_POLICY.md) for detailed compliance requirements and procedures.

Key compliance features:
- Regular fairness audits
- Human-in-the-loop review
- Bias escalation process
- Audit trail retention (7 years)
- EEOC and GDPR compliance

## Documentation

- [Go-Live Checklist](docs/GO_LIVE.md)
- [Model Card](docs/MODEL_CARD.md)
- [Fairness Policy](docs/FAIRNESS_POLICY.md)

## License

[Your License Here]

## Contact

- **Engineering**: [engineering@company.com]
- **Fairness Team**: [fairness-review@company.com]
- **Report Bias**: [bias-hotline@company.com]
