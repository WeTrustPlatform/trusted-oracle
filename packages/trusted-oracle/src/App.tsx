import { LayoutProvider, ThemeProvider, ToastProvider } from 'paramount-ui';
import React from 'react';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

import { NavigationBar } from './components/NavigationBar';
import { Home } from './pages/Home';

export const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LayoutProvider>
          <ToastProvider>
            <NavigationBar />
            <Switch>
              <Route exact path="/" component={Home} />
            </Switch>
          </ToastProvider>
        </LayoutProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
