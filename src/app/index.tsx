import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import '@app/app.css';

const routerBasename = process.env.BASE_PATH || undefined;

const App: React.FunctionComponent = () => (
  <Router basename={routerBasename}>
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  </Router>
);

export default App;
