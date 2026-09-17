import { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './ui';
import { space } from '../theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button
            label="Restart the app"
            onPress={() => {
              this.setState({ hasError: false, error: undefined });
            }}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C0E',
    padding: space.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8E6E1',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8B8E93',
    textAlign: 'center',
  },
});
