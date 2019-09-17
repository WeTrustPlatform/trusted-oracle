import { LayoutProvider, ThemeProvider, ToastProvider } from 'paramount-ui';
import React from 'react';
import { Route, RouteChildrenProps } from 'react-router';
import { HashRouter } from 'react-router-dom';

import { CustomDialog } from './components/CustomDialog';
import { MyAccount } from './components/MyAccount';
import { NavigationBar } from './components/NavigationBar';
import { Notifications } from './components/Notifications';
import { CurrencyProvider } from './ethereum/CurrencyProvider';
import { Web3DialogsProvider } from './ethereum/Web3DialogsProvider';
import { Web3Provider } from './ethereum/Web3Provider';
import { OracleProvider } from './oracle/OracleProvider';
import { QuestionDetails } from './oracle/QuestionDetails';
import { StoreProvider } from './oracle/StoreProvider';
import { Home } from './pages/Home';

const MyAccountDialog = (props: RouteChildrenProps<{ questionId: string }>) => {
  const { history } = props;

  return (
    <CustomDialog history={history}>
      <MyAccount />
    </CustomDialog>
  );
};

const QuestionDetailsDialog = (
  props: RouteChildrenProps<{ questionId: string }>,
) => {
  const { history, match } = props;

  if (!match) return null;

  return (
    <CustomDialog history={history}>
      <QuestionDetails questionId={match.params.questionId} />
    </CustomDialog>
  );
};

const NotificationsDialog = (
  props: RouteChildrenProps<{ questionId: string }>,
) => {
  const { history, match } = props;

  if (!match) return null;

  return (
    <CustomDialog history={history}>
      <Notifications />
    </CustomDialog>
  );
};

export const App = () => {
  return (
    <HashRouter>
      <ThemeProvider
        value={{
          colors: {
            button: {
              primary: '#e98100',
            },
            text: {
              default: '#7e7e7e',
              primary: '#2985cf',
              secondary: '#39a296',
              link: '#259083',
            },
          },
          fontFamilies: {
            heading: 'MicrobrewSoftOneHatch',
          },
          headingSizes: {
            xxxlarge: {
              fontSize: 60,
              lineHeight: 66,
              marginBottom: 16,
            },
            xxlarge: {
              fontSize: 40,
            },
          },
          textSizes: {
            medium: {
              fontSize: 18,
              lineHeight: 24,
            },
            large: {
              fontSize: 20,
            },
          },
        }}
      >
        <LayoutProvider
          value={{
            containerSizes: {
              small: 540,
              medium: 720,
              large: 960,
              xlarge: 1280,
            },
          }}
        >
          <ToastProvider>
            <Web3Provider>
              <Web3DialogsProvider>
                <CurrencyProvider initialCurrency="TRST">
                  <OracleProvider>
                    <StoreProvider>
                      <NavigationBar />
                      <Route path="/" component={Home} />
                      <Route path="/my-account" component={MyAccountDialog} />
                      <Route
                        path="/notifications"
                        component={NotificationsDialog}
                      />
                      <Route
                        path="/question/:questionId"
                        component={QuestionDetailsDialog}
                      />
                    </StoreProvider>
                  </OracleProvider>
                </CurrencyProvider>
              </Web3DialogsProvider>
            </Web3Provider>
          </ToastProvider>
        </LayoutProvider>
      </ThemeProvider>
    </HashRouter>
  );
};
