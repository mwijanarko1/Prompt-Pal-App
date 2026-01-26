import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.errorText}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
            {this.state.error?.stack && (
              <Text style={styles.stackText}>{this.state.error.stack}</Text>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#CF6679',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  stackText: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
