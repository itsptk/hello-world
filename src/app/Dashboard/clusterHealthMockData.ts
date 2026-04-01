/** Synthetic data for the cluster health prototype — replace with API integration for production. */

export type ClusterStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface ClusterIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  clusterIds: string[];
  detectedAt: string;
}

export interface ClusterComponent {
  id: string;
  name: string;
  status: ClusterStatus;
  message?: string;
  anomaly?: string;
}

export interface Cluster {
  id: string;
  name: string;
  region: string;
  status: ClusterStatus;
  version: string;
  nodesReady: string;
  cpuPct: number;
  memoryPct: number;
  podRestarts24h: number;
  components: ClusterComponent[];
}

export const clusters: Cluster[] = [
  {
    id: 'c-prod-east',
    name: 'prod-us-east-1',
    region: 'US East (N. Virginia)',
    status: 'healthy',
    version: '4.18.2',
    nodesReady: '12/12',
    cpuPct: 62,
    memoryPct: 71,
    podRestarts24h: 3,
    components: [
      { id: 'api', name: 'kube-apiserver', status: 'healthy' },
      { id: 'etcd', name: 'etcd', status: 'healthy' },
      { id: 'sched', name: 'kube-scheduler', status: 'healthy' },
      { id: 'ccm', name: 'cloud-controller-manager', status: 'healthy' },
    ],
  },
  {
    id: 'c-prod-west',
    name: 'prod-us-west-2',
    region: 'US West (Oregon)',
    status: 'degraded',
    version: '4.18.2',
    nodesReady: '9/10',
    cpuPct: 84,
    memoryPct: 88,
    podRestarts24h: 47,
    components: [
      { id: 'api', name: 'kube-apiserver', status: 'healthy' },
      {
        id: 'etcd',
        name: 'etcd',
        status: 'degraded',
        message: 'Member latency above SLO',
        anomaly: 'p99 write latency 2.4× baseline (last 1h)',
      },
      { id: 'sched', name: 'kube-scheduler', status: 'healthy' },
      {
        id: 'net',
        name: 'networking (CNI)',
        status: 'degraded',
        message: 'Packet loss on 2 nodes',
      },
    ],
  },
  {
    id: 'c-staging',
    name: 'staging-eu-central-1',
    region: 'EU (Frankfurt)',
    status: 'healthy',
    version: '4.17.8',
    nodesReady: '6/6',
    cpuPct: 41,
    memoryPct: 55,
    podRestarts24h: 1,
    components: [
      { id: 'api', name: 'kube-apiserver', status: 'healthy' },
      { id: 'etcd', name: 'etcd', status: 'healthy' },
      { id: 'sched', name: 'kube-scheduler', status: 'healthy' },
    ],
  },
  {
    id: 'c-dr',
    name: 'dr-ap-southeast-1',
    region: 'Asia Pacific (Singapore)',
    status: 'critical',
    version: '4.16.4',
    nodesReady: '4/8',
    cpuPct: 93,
    memoryPct: 91,
    podRestarts24h: 312,
    components: [
      {
        id: 'api',
        name: 'kube-apiserver',
        status: 'critical',
        message: 'Readiness probe failures',
      },
      { id: 'etcd', name: 'etcd', status: 'degraded', message: 'Raft election instability' },
      { id: 'sched', name: 'kube-scheduler', status: 'healthy' },
      { id: 'stor', name: 'storage (CSI)', status: 'critical', message: 'Volume attach timeouts' },
    ],
  },
];

export const fleetIssues: ClusterIssue[] = [
  {
    id: 'i1',
    severity: 'critical',
    title: 'Node NotReady surge in dr-ap-southeast-1',
    description: '4 nodes reported NotReady in the last 30 minutes. Storage CSI errors correlated.',
    clusterIds: ['c-dr'],
    detectedAt: '12 min ago',
  },
  {
    id: 'i2',
    severity: 'warning',
    title: 'etcd latency SLO breach',
    description: 'prod-us-west-2: etcd p99 write latency elevated. Investigate disk and leader elections.',
    clusterIds: ['c-prod-west'],
    detectedAt: '28 min ago',
  },
  {
    id: 'i3',
    severity: 'warning',
    title: 'Pod restart anomaly',
    description: 'prod-us-west-2: restart count 3σ above 7-day baseline for namespace openshift-monitoring.',
    clusterIds: ['c-prod-west'],
    detectedAt: '1 hr ago',
  },
  {
    id: 'i4',
    severity: 'info',
    title: 'Upgrade available',
    description: 'staging-eu-central-1 can patch to 4.18.3 (security advisory RHSA-2026:0000).',
    clusterIds: ['c-staging'],
    detectedAt: '3 hr ago',
  },
];

export function getClusterById(id: string): Cluster | undefined {
  return clusters.find((c) => c.id === id);
}

export function getComponent(cluster: Cluster, componentId: string): ClusterComponent | undefined {
  return cluster.components.find((c) => c.id === componentId);
}

const logSamples: Record<string, string[]> = {
  default: [
    '2026-04-01T14:22:01Z E0421 14:22:01.123456       1 reflector.go:125] Failed to list *v1.Pod: connection reset',
    '2026-04-01T14:22:02Z I0421 14:22:02.004521       1 leaderelection.go:250] successfully acquired lease kube-system/kube-controller-manager',
    '2026-04-01T14:22:05Z W0421 14:22:05.881102       1 handler.go:189] Request latency exceeded threshold: 1.2s',
  ],
  etcd: [
    '2026-04-01T14:21:58Z I0421 14:21:58.100001       1 etcdserver/server.go:520] etcdserver: published {Name:etcd-a ClientURLs:[https://10.0.1.5:2379]}',
    '2026-04-01T14:22:00Z W0421 14:22:00.440112       1 wal/wal.go:801] slow fsync: 847ms (threshold 500ms)',
    '2026-04-01T14:22:03Z E0421 14:22:03.002891       1 etcdserver/v3_server.go:752] request timed out: txn compare failed',
  ],
  api: [
    '2026-04-01T14:22:00Z I0421 14:22:00.000001       1 httplog.go:103] "HTTP" verb=GET URI=/api/v1/nodes latency=45ms',
    '2026-04-01T14:22:01Z W0421 14:22:01.112233       1 handler.go:401] timeout waiting for condition: endpoints not ready',
  ],
};

export function getSampleLogs(clusterId: string, componentId?: string): string[] {
  const key = componentId && logSamples[componentId] ? componentId : 'default';
  return logSamples[key].map((line) => `[${clusterId}] ${line}`);
}
