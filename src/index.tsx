import './index.css';
import 'react-day-picker/lib/style.css';

import * as Sentry from '@sentry/browser';
import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './App';
import * as serviceWorker from './serviceWorker';

Sentry.init({
  dsn: 'https://563bcac3488649bf9d5bee18dd6a4e98@sentry.io/1757838',
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
