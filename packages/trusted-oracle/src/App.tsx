import {
  Web3DialogsProvider,
  Web3Provider,
} from '@wetrustplatform/paramount-ethereum';
import { LayoutProvider, ThemeProvider, ToastProvider } from 'paramount-ui';
import React from 'react';
import { Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';

import { NavigationBar } from './components/NavigationBar';
import { Home } from './pages/Home';
import { RealitioProvider } from './realitio/RealitioProvider';

export const App = () => {
  return (
    <BrowserRouter>
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
          },
          textSizes: {
            medium: {
              fontSize: 18,
              lineHeight: 24,
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
                <RealitioProvider>
                  <NavigationBar />
                  <Route path="/" component={Home} />
                </RealitioProvider>
              </Web3DialogsProvider>
            </Web3Provider>
          </ToastProvider>
        </LayoutProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
