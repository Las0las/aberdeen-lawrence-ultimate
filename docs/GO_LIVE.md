# Go-Live Checklist

## Pre-Launch Requirements

### Infrastructure
- [ ] Database migrations completed successfully
- [ ] Redis cluster provisioned and tested
- [ ] Prometheus monitoring configured
- [ ] Log aggregation setup (e.g., CloudWatch, Datadog)
- [ ] Backup and disaster recovery procedures in place

### Security
- [ ] All environment variables secured (DATABASE_URL, REDIS_PASSWORD, etc.)
- [ ] HMAC secret keys rotated and secured
- [ ] API rate limiting configured
- [ ] CORS policies reviewed and configured
- [ ] PII redaction verified in logs

### Compliance
- [ ] Fairness gate thresholds validated
- [ ] Statistical testing parameters reviewed
- [ ] Protected group definitions approved by legal
- [ ] Audit logging enabled for all critical operations
- [ ] Data retention policies implemented

### Model Validation
- [ ] Model performance meets minimum thresholds (AUC > 0.70)
- [ ] Calibration verified (ECE < 0.10)
- [ ] Fairness metrics pass gates (AIR ≥ 0.80, gaps ≤ 0.05)
- [ ] Sample size requirements met for all evaluations

### Testing
- [ ] Load testing completed (target: 1000 req/s)
- [ ] Failover testing completed
- [ ] Data migration validated
- [ ] End-to-end integration tests passing
- [ ] Bias detection system tested with known scenarios

### Documentation
- [ ] API documentation published
- [ ] Runbooks created for common operations
- [ ] Escalation procedures documented
- [ ] Model card published (see MODEL_CARD.md)
- [ ] Fairness policy reviewed (see FAIRNESS_POLICY.md)

### Team Readiness
- [ ] On-call rotation established
- [ ] Training completed for fairness review team
- [ ] Escalation contacts configured
- [ ] Communication plan for stakeholders

## Launch Day

1. **Monitor key metrics**
   - API latency (p95 < 500ms)
   - Reservation conflict rate (< 5%)
   - Telemetry ingestion success rate (> 99.9%)
   - Error rates (< 0.1%)

2. **Gradual rollout**
   - Start with 10% traffic
   - Monitor for 2 hours
   - Increase to 50% if metrics stable
   - Monitor for 4 hours
   - Full rollout if all green

3. **Emergency procedures**
   - Rollback plan ready
   - Feature flags configured
   - Database snapshot taken
   - Support team on standby

## Post-Launch

- [ ] First fairness gate evaluation completed (week 1)
- [ ] Weekly evaluation job running successfully
- [ ] Cleanup job verified (expired reservations)
- [ ] First quality of hire calculations complete
- [ ] Stakeholder report generated
