export const fetchCurrentNowcast = () => fetch(`/api/nowcast/current`).then(r => r.json())
export const fetchAlerts = () => fetch(`/api/alerts/`).then(r => r.json())
export const fetchMetrics = () => fetch(`/api/metrics`).then(r => r.json())
