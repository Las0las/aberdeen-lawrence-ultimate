# Model Card: Interview Success Prediction Model

## Model Details

**Model Name:** Interview Success Predictor v1.0  
**Model Type:** Binary Classification (Success/Failure Prediction)  
**Framework:** Proprietary ML Pipeline  
**Last Updated:** 2025-10-01  
**Maintained By:** ML Engineering Team

## Intended Use

### Primary Use Case
Predict the likelihood that a candidate will successfully complete the interview process and be hired with positive long-term outcomes (12-month retention and performance).

### Target Users
- Recruiting teams
- Hiring managers
- Talent acquisition leaders

### Out-of-Scope Uses
- Automated hiring decisions without human review
- Replacement for human judgment in final hiring decisions
- Use outside of the defined interview stages (screen, tech, loop)

## Training Data

### Source
- Historical interview data from 2022-2024
- N = 15,000 candidates across all role families
- Geographic coverage: US, UK, EU

### Features
- Resume/CV structured data
- Technical assessment scores
- Interview rubric scores
- Years of experience
- Education level
- Previous role titles
- Communication assessment

### Label Definition
Success = (Hired AND retained12m = true AND perfScore ≥ 0.60)

### Data Splits
- Training: 70% (10,500 samples)
- Validation: 15% (2,250 samples)
- Test: 15% (2,250 samples)

## Performance Metrics

### Overall Performance (Test Set)
- ROC-AUC: 0.75 ± 0.03
- PR-AUC: 0.70 ± 0.04
- Brier Score: 0.15
- Expected Calibration Error: 0.05
- Lift @ 10%: 1.8
- Lift @ 20%: 1.5

### Performance by Role Family
| Role Family | ROC-AUC | Sample Size |
|------------|---------|-------------|
| Engineering | 0.77 | 1,200 |
| Consulting | 0.74 | 750 |
| Operations | 0.73 | 300 |

## Fairness Analysis

### Protected Groups Analyzed
- Gender (Male, Female, Non-binary)
- Ethnicity (5 categories per EEOC)
- Age Group (<30, 30-40, 40-50, 50+)

### Fairness Metrics (Latest Evaluation)
- Adverse Impact Ratio: 0.85 (threshold: ≥0.80) ✓
- True Positive Rate Gap: 0.03 (threshold: ≤0.05) ✓
- False Positive Rate Gap: 0.02 (threshold: ≤0.05) ✓
- Calibration Parity: 0.04 (threshold: ≤0.05) ✓

### Statistical Testing
- Multiple testing correction: Bonferroni
- Alpha level: 0.05
- All comparisons: p > 0.05 (no significant bias detected)

## Limitations

1. **Temporal**: Model trained on pre-2025 data; may not capture recent market changes
2. **Sample Size**: Limited data for some role families (ops: n=300)
3. **Geography**: Primarily US-based data; international predictions less reliable
4. **Feedback Loop**: Model predictions may influence interview decisions, creating bias
5. **Long-term Outcomes**: 12-month retention may not capture all success dimensions

## Ethical Considerations

### Bias Mitigation
- Regular fairness gate evaluations (weekly)
- Human-in-the-loop review for high-impact decisions
- Bias event escalation system
- Mandatory fairness training for users

### Transparency
- Prediction factors shown to users
- Confidence scores provided
- Model limitations communicated

### Recourse
- Candidates can request human review
- Escalation process for bias concerns
- Audit trail for all predictions

## Monitoring & Maintenance

### Continuous Monitoring
- Weekly fairness gate evaluations
- Monthly performance review
- Quarterly model retraining evaluation

### Retraining Triggers
- Performance degradation >5%
- Fairness gate failures
- Significant distribution shift
- New protected group analysis required

### Sunset Criteria
- Consistent fairness gate failures
- Performance below acceptable threshold (AUC < 0.70)
- Better alternatives available
- Business requirements change

## Contact

**Model Owner:** ML Engineering Team (ml-team@company.com)  
**Fairness Review:** Fairness Team (fairness-review@company.com)  
**Escalations:** Legal/Ethics Committee (ethics@company.com)
