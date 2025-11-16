import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import React from 'react';
import { View, Text, Button } from 'react-native';

export function initMonitoring() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: 'beta',
    enableNative: true,
    // RN does not have a document object
    ignoreErrors: ['document is not defined'],
    //
    integrations: [
      new Sentry.ReactNativeTracing({
        // Pass instrumentation to be used as `render` props
        // routingInstrumentation: new Sentry.ReactNavigationV5Instrumentation(),
      }),
    ],
    beforeSend(event) {
      // Modify or drop the event here
      if (event.level === 'info') {
        return null;
      }
      return event;
    },
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

export const captureException = (error: Error, context?: any) => {
  Sentry.captureException(error, { extra: context });
};

export const addBreadcrumb = (category: string, message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
  });
};


interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<any, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, }}>
          <Text style={{ fontSize: 24, marginBottom: 16 }}>Oops, something went wrong.</Text>
          <Text style={{ fontSize: 16, color: 'gray', textAlign: 'center', marginBottom: 24 }}>
            We've been notified of the issue and are working to fix it. Please restart the app.
          </Text>
          <Button title="Restart App" onPress={() => {
            // You might need a library like 'react-native-restart' for a full restart.
            // For now, we'll just reset the error boundary's state.
            this.setState({ hasError: false });
          }} />
        </View>
      );
    }

    return this.props.children;
  }
}
