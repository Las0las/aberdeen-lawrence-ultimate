import { register, Counter, Histogram, Gauge } from 'prom-client';

// API Performance Metrics
export const api_latency = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['route', 'method', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

export const api_requests_total = new Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['route', 'method', 'status_code']
});

// Business Metrics
export const reservations_created = new Counter({
  name: 'reservations_created_total',
  help: 'Total number of successful reservations'
});

export const reservation_conflicts = new Counter({
  name: 'reservation_conflicts_total',
  help: 'Total number of reservation conflicts'
});

export const reservation_errors = new Counter({
  name: 'reservation_errors_total',
  help: 'Total number of reservation errors',
  labelNames: ['reason']
});

export const telemetry_ingested = new Counter({
  name: 'telemetry_events_ingested_total',
  help: 'Total number of telemetry events ingested',
  labelNames: ['type']
});

export const telemetry_errors = new Counter({
  name: 'telemetry_errors_total',
  help: 'Total number of telemetry ingestion errors',
  labelNames: ['type', 'reason']
});

// Fairness Metrics
export const bias_events_detected = new Counter({
  name: 'bias_events_detected_total',
  help: 'Total number of bias events detected',
  labelNames: ['severity', 'type']
});

export const fairness_gate_runs = new Counter({
  name: 'fairness_gate_runs_total',
  help: 'Total number of fairness gate evaluations',
  labelNames: ['status']
});

export const model_performance = new Gauge({
  name: 'model_auc_score',
  help: 'Current model AUC score',
  labelNames: ['model_version', 'evaluation_window']
});

// Register all metrics
register.registerMetric(api_latency);
register.registerMetric(api_requests_total);
register.registerMetric(reservations_created);
register.registerMetric(reservation_conflicts);
register.registerMetric(reservation_errors);
register.registerMetric(telemetry_ingested);
register.registerMetric(telemetry_errors);
register.registerMetric(bias_events_detected);
register.registerMetric(fairness_gate_runs);
register.registerMetric(model_performance);

export const metrics = {
  api_latency,
  api_requests_total,
  reservations_created,
  reservation_conflicts,
  reservation_errors,
  telemetry_ingested,
  telemetry_errors,
  bias_events_detected,
  fairness_gate_runs,
  model_performance
};

export { register };
