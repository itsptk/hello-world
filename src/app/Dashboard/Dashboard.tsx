import * as React from 'react';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  AlertGroup,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Gallery,
  Label,
  LabelGroup,
  PageSection,
  PageSectionVariants,
  Progress,
  ProgressMeasureLocation,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ClusterIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
  HistoryIcon,
  ModuleIcon,
  SearchIcon,
  TopologyIcon,
} from '@patternfly/react-icons';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';
import {
  type Cluster,
  type ClusterComponent,
  type ClusterIssue,
  type ClusterStatus,
  clusters,
  fleetIssues,
  getClusterById,
  getComponent,
  getSampleLogs,
} from './clusterHealthMockData';

type DrillView = 'fleet' | 'cluster' | 'component' | 'logs';

function statusLabel(status: ClusterStatus): React.ReactNode {
  switch (status) {
    case 'healthy':
      return (
        <Label icon={<CheckCircleIcon />} color="green" isCompact>
          Healthy
        </Label>
      );
    case 'degraded':
      return (
        <Label icon={<ExclamationTriangleIcon />} color="orange" isCompact>
          Degraded
        </Label>
      );
    case 'critical':
      return (
        <Label icon={<ExclamationCircleIcon />} color="red" isCompact>
          Critical
        </Label>
      );
    default:
      return (
        <Label color="grey" isCompact>
          Unknown
        </Label>
      );
  }
}

function issueAlertVariant(sev: ClusterIssue['severity']): 'danger' | 'warning' | 'info' {
  if (sev === 'critical') {
    return 'danger';
  }
  if (sev === 'warning') {
    return 'warning';
  }
  return 'info';
}

const Dashboard: React.FunctionComponent = () => {
  const [view, setView] = React.useState<DrillView>('fleet');
  const [clusterId, setClusterId] = React.useState<string | null>(null);
  const [componentId, setComponentId] = React.useState<string | null>(null);

  const cluster = clusterId ? getClusterById(clusterId) : undefined;
  const component = cluster && componentId ? getComponent(cluster, componentId) : undefined;

  const pageTitle =
    view === 'fleet'
      ? 'Cluster health | Overview'
      : view === 'cluster' && cluster
        ? `Cluster health | ${cluster.name}`
        : view === 'component' && cluster && component
          ? `Cluster health | ${cluster.name} · ${component.name}`
          : view === 'logs' && cluster
            ? `Cluster health | Logs · ${cluster.name}`
            : 'Cluster health';

  useDocumentTitle(pageTitle);

  const goFleet = () => {
    setView('fleet');
    setClusterId(null);
    setComponentId(null);
  };

  const openCluster = (id: string) => {
    setClusterId(id);
    setComponentId(null);
    setView('cluster');
  };

  const openComponent = (cId: string) => {
    setComponentId(cId);
    setView('component');
  };

  const openLogs = () => {
    setView('logs');
  };

  const fromComponentToLogs = () => {
    setView('logs');
  };

  const healthyCount = clusters.filter((c) => c.status === 'healthy').length;
  const degradedCount = clusters.filter((c) => c.status === 'degraded').length;
  const criticalCount = clusters.filter((c) => c.status === 'critical').length;
  const avgCpu = Math.round(clusters.reduce((s, c) => s + c.cpuPct, 0) / clusters.length);
  const avgMem = Math.round(clusters.reduce((s, c) => s + c.memoryPct, 0) / clusters.length);

  const breadcrumbs = (
    <Breadcrumb>
      <BreadcrumbItem
        to="#"
        onClick={(e) => {
          e.preventDefault();
          goFleet();
        }}
      >
        All clusters
      </BreadcrumbItem>
      {cluster && (
        <BreadcrumbItem
          to="#"
          onClick={(e) => {
            e.preventDefault();
            setView('cluster');
            setComponentId(null);
          }}
        >
          {cluster.name}
        </BreadcrumbItem>
      )}
      {cluster && component && view !== 'cluster' && (
        <BreadcrumbItem
          to="#"
          onClick={(e) => {
            e.preventDefault();
            setView('component');
          }}
        >
          {component.name}
        </BreadcrumbItem>
      )}
      {view === 'logs' && <BreadcrumbItem isActive>Logs</BreadcrumbItem>}
    </Breadcrumb>
  );

  const troubleshootActions = (ctx: { cluster?: Cluster; component?: ClusterComponent }) => (
    <Card isCompact>
      <CardHeader>
        <CardTitle>
          <ModuleIcon /> Troubleshoot
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <ActionList isIconList>
              <ActionListGroup>
                <ActionListItem>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<SearchIcon />}
                    onClick={() => ctx.cluster && openLogs()}
                    isDisabled={!ctx.cluster}
                  >
                    Live log tail
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button variant="secondary" size="sm" icon={<TopologyIcon />} component="a" href="#">
                    Resource topology
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button variant="secondary" size="sm" icon={<HistoryIcon />} component="a" href="#">
                    Recent changes
                  </Button>
                </ActionListItem>
                <ActionListItem>
                  <Button variant="link" size="sm" icon={<ExternalLinkAltIcon />} component="a" href="#">
                    Open support case
                  </Button>
                </ActionListItem>
              </ActionListGroup>
            </ActionList>
          </StackItem>
          {ctx.component?.anomaly && (
            <StackItem>
              <Alert variant="warning" isInline title="Anomaly detected">
                {ctx.component.anomaly}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );

  const fleetSection = (
    <>
      <PageSection variant={PageSectionVariants.secondary}>
        <Content>
          <Title headingLevel="h1" size="2xl">
            Cluster health
          </Title>
          <p>
            One place to visualize fleet status, spot problems, drill into clusters and components, and jump into
            troubleshooting workflows.
          </p>
        </Content>
      </PageSection>

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="xl">
              Visualize
            </Title>
            <p className="pf-v6-u-color-text-subtle">Key metrics across all clusters</p>
          </StackItem>
          <StackItem>
            <Gallery hasGutter minWidths={{ default: '280px' }}>
              <Card>
                <CardHeader>
                  <CardTitle>Clusters</CardTitle>
                </CardHeader>
                <CardBody>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>
                      <Title headingLevel="h3" size="4xl">
                        {clusters.length}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <ClusterIcon style={{ fontSize: '2rem', opacity: 0.6 }} />
                    </FlexItem>
                  </Flex>
                  <LabelGroup categoryName="Status" numLabels={5}>
                    <Label color="green" isCompact>
                      {healthyCount} healthy
                    </Label>
                    <Label color="orange" isCompact>
                      {degradedCount} degraded
                    </Label>
                    <Label color="red" isCompact>
                      {criticalCount} critical
                    </Label>
                  </LabelGroup>
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Fleet CPU (avg)</CardTitle>
                </CardHeader>
                <CardBody>
                  <Progress value={avgCpu} title={`${avgCpu}%`} measureLocation={ProgressMeasureLocation.outside} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Fleet memory (avg)</CardTitle>
                </CardHeader>
                <CardBody>
                  <Progress value={avgMem} title={`${avgMem}%`} measureLocation={ProgressMeasureLocation.outside} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>OpenShift / Kubernetes</CardTitle>
                </CardHeader>
                <CardBody>
                  <Content>
                    <p className="pf-v6-u-font-size-sm pf-v6-u-mb-md">Version spread across fleet</p>
                    <LabelGroup numLabels={4}>
                      <Label color="blue" isCompact>
                        4.18.x — 3
                      </Label>
                      <Label color="purple" isCompact>
                        4.17.x — 1
                      </Label>
                    </LabelGroup>
                  </Content>
                </CardBody>
              </Card>
            </Gallery>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection variant={PageSectionVariants.default}>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="xl">
              Identify
            </Title>
            <p className="pf-v6-u-color-text-subtle">Priority issues and anomalies ranked across the fleet</p>
          </StackItem>
          <StackItem>
            <AlertGroup isToast={false}>
              {fleetIssues.map((issue) => (
                <Alert
                  key={issue.id}
                  variant={issueAlertVariant(issue.severity)}
                  isInline
                  title={issue.title}
                  actionLinks={[
                    <Button
                      key="go"
                      variant="link"
                      isInline
                      onClick={() => openCluster(issue.clusterIds[0])}
                    >
                      View cluster
                    </Button>,
                  ]}
                >
                  {issue.description}
                  <span className="pf-v6-u-display-block pf-v6-u-font-size-sm pf-v6-u-mt-sm pf-v6-u-color-text-subtle">
                    {issue.detectedAt}
                  </span>
                </Alert>
              ))}
            </AlertGroup>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Split hasGutter>
              <SplitItem isFilled>
                <Title headingLevel="h2" size="xl">
                  Isolate
                </Title>
                <p className="pf-v6-u-color-text-subtle">Select a cluster to drill into components and logs</p>
              </SplitItem>
              <SplitItem>
                <Toolbar id="fleet-toolbar" ouiaId="fleet-toolbar">
                  <ToolbarContent>
                    <ToolbarGroup variant="filter-group">
                      <ToolbarItem>
                        <Button variant="control" icon={<SearchIcon />} aria-label="Filter clusters (prototype)">
                          Filter
                        </Button>
                      </ToolbarItem>
                    </ToolbarGroup>
                  </ToolbarContent>
                </Toolbar>
              </SplitItem>
            </Split>
          </StackItem>
          <StackItem>
            <DataList aria-label="Clusters" isCompact>
              {clusters.map((c) => (
                <DataListItem key={c.id} aria-labelledby={`cluster-${c.id}`}>
                  <DataListItemRow>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key="name" width={2} id={`cluster-${c.id}`}>
                          <Stack>
                            <StackItem>
                              <Button variant="link" isInline onClick={() => openCluster(c.id)}>
                                {c.name}
                              </Button>
                            </StackItem>
                            <StackItem>
                              <span className="pf-v6-u-font-size-sm pf-v6-u-color-text-subtle">{c.region}</span>
                            </StackItem>
                          </Stack>
                        </DataListCell>,
                        <DataListCell key="status">{statusLabel(c.status)}</DataListCell>,
                        <DataListCell key="nodes">
                          <span className="pf-v6-u-font-size-sm">Nodes {c.nodesReady}</span>
                        </DataListCell>,
                        <DataListCell key="load">
                          <span className="pf-v6-u-font-size-sm">
                            CPU {c.cpuPct}% · Mem {c.memoryPct}%
                          </span>
                        </DataListCell>,
                        <DataListCell key="restarts" alignRight>
                          <span className="pf-v6-u-font-size-sm">Restarts (24h): {c.podRestarts24h}</span>
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              ))}
            </DataList>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection variant={PageSectionVariants.secondary}>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="xl">
              Troubleshoot
            </Title>
            <p className="pf-v6-u-color-text-subtle">Common workflows (prototype actions)</p>
          </StackItem>
          <StackItem>{troubleshootActions({})}</StackItem>
        </Stack>
      </PageSection>
    </>
  );

  if (view === 'fleet') {
    return <>{fleetSection}</>;
  }

  if (!cluster) {
    return (
      <PageSection>
        <EmptyState headingLevel="h2" titleText="Cluster not found" icon={ExclamationCircleIcon}>
          <EmptyStateBody>Use the navigation to return to the fleet overview.</EmptyStateBody>
          <EmptyStateFooter>
            <Button variant="primary" onClick={goFleet}>
              All clusters
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </PageSection>
    );
  }

  if (view === 'cluster') {
    return (
      <>
        <PageSection type="breadcrumb" variant={PageSectionVariants.secondary} padding={{ default: 'padding' }}>
          {breadcrumbs}
        </PageSection>
        <PageSection>
          <Stack hasGutter>
            <StackItem>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                <FlexItem grow={{ default: 'grow' }}>
                  <Title headingLevel="h1" size="2xl">
                    {cluster.name}
                  </Title>
                  <Content>
                    <p className="pf-v6-u-color-text-subtle">
                      {cluster.region} · Version {cluster.version}
                    </p>
                  </Content>
                </FlexItem>
                <FlexItem>{statusLabel(cluster.status)}</FlexItem>
              </Flex>
            </StackItem>
            <StackItem>
              <Gallery hasGutter minWidths={{ default: '240px' }}>
                <Card isCompact>
                  <CardHeader>
                    <CardTitle>Nodes ready</CardTitle>
                  </CardHeader>
                  <CardBody>{cluster.nodesReady}</CardBody>
                </Card>
                <Card isCompact>
                  <CardHeader>
                    <CardTitle>CPU</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Progress value={cluster.cpuPct} measureLocation={ProgressMeasureLocation.outside} />
                  </CardBody>
                </Card>
                <Card isCompact>
                  <CardHeader>
                    <CardTitle>Memory</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Progress value={cluster.memoryPct} measureLocation={ProgressMeasureLocation.outside} />
                  </CardBody>
                </Card>
                <Card isCompact>
                  <CardHeader>
                    <CardTitle>Pod restarts (24h)</CardTitle>
                  </CardHeader>
                  <CardBody>{cluster.podRestarts24h}</CardBody>
                </Card>
              </Gallery>
            </StackItem>
            <StackItem>
              <Title headingLevel="h2" size="lg">
                Components
              </Title>
              <Divider className="pf-v6-u-my-md" />
              <DataList aria-label="Cluster components" isCompact>
                {cluster.components.map((comp) => (
                  <DataListItem key={comp.id} aria-labelledby={`comp-${comp.id}`}>
                    <DataListItemRow>
                      <DataListItemCells
                        dataListCells={[
                          <DataListCell key="n" id={`comp-${comp.id}`}>
                            <Button variant="link" isInline onClick={() => openComponent(comp.id)}>
                              {comp.name}
                            </Button>
                          </DataListCell>,
                          <DataListCell key="s">{statusLabel(comp.status)}</DataListCell>,
                          <DataListCell key="m">
                            {comp.message ? (
                              <span className="pf-v6-u-font-size-sm">{comp.message}</span>
                            ) : (
                              <span className="pf-v6-u-font-size-sm pf-v6-u-color-text-subtle">—</span>
                            )}
                          </DataListCell>,
                          <DataListCell key="logs" alignRight>
                            <Button size="sm" variant="secondary" onClick={() => openComponent(comp.id)}>
                              Details
                            </Button>
                          </DataListCell>,
                        ]}
                      />
                    </DataListItemRow>
                  </DataListItem>
                ))}
              </DataList>
            </StackItem>
            <StackItem>{troubleshootActions({ cluster })}</StackItem>
          </Stack>
        </PageSection>
      </>
    );
  }

  if (view === 'component' && component) {
    return (
      <>
        <PageSection type="breadcrumb" variant={PageSectionVariants.secondary} padding={{ default: 'padding' }}>
          {breadcrumbs}
        </PageSection>
        <PageSection>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h1" size="2xl">
                {component.name}
              </Title>
              <Content>
                <p className="pf-v6-u-color-text-subtle">Cluster {cluster.name}</p>
              </Content>
            </StackItem>
            <StackItem>{statusLabel(component.status)}</StackItem>
            {component.message && (
              <StackItem>
                <Alert variant="warning" isInline title="Signal">
                  {component.message}
                </Alert>
              </StackItem>
            )}
            {component.anomaly && (
              <StackItem>
                <Alert variant="danger" isInline title="Anomaly">
                  {component.anomaly}
                </Alert>
              </StackItem>
            )}
            <StackItem>
              <Button variant="primary" onClick={fromComponentToLogs}>
                View logs
              </Button>
            </StackItem>
            <StackItem>{troubleshootActions({ cluster, component })}</StackItem>
          </Stack>
        </PageSection>
      </>
    );
  }

  if (view === 'logs') {
    const lines = getSampleLogs(cluster.id, componentId ?? undefined);
    return (
      <>
        <PageSection type="breadcrumb" variant={PageSectionVariants.secondary} padding={{ default: 'padding' }}>
          {breadcrumbs}
        </PageSection>
        <PageSection>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h1" size="2xl">
                Logs
              </Title>
              <Content>
                <p className="pf-v6-u-color-text-subtle">
                  {cluster.name}
                  {componentId ? ` · filtered to component context` : ''}
                </p>
              </Content>
            </StackItem>
            <StackItem>
              <Card isCompact>
                <CardHeader>
                  <CardTitle>Recent lines (sample)</CardTitle>
                </CardHeader>
                <CardBody>
                  <pre
                    style={{
                      margin: 0,
                      maxHeight: '320px',
                      overflow: 'auto',
                      fontSize: 'var(--pf-t--global--font--size--body--sm)',
                      lineHeight: 1.45,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {lines.join('\n')}
                  </pre>
                </CardBody>
              </Card>
            </StackItem>
            <StackItem>{troubleshootActions({ cluster, component: component ?? undefined })}</StackItem>
          </Stack>
        </PageSection>
      </>
    );
  }

  return (
    <PageSection>
      <EmptyState headingLevel="h2" titleText="Something went wrong" icon={ExclamationTriangleIcon}>
        <EmptyStateBody>Reset to the fleet overview.</EmptyStateBody>
        <EmptyStateFooter>
          <Button variant="primary" onClick={goFleet}>
            All clusters
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    </PageSection>
  );
};

export { Dashboard };
