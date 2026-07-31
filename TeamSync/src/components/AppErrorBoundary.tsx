import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";

const APP_BACKGROUND_COLOR = "#0f172a";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

// Catches render errors anywhere below it in the tree so a crash shows a
// recoverable screen instead of a blank/broken one, and logs to the console
// so the failure is visible somewhere rather than silently disappearing.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled render error caught by AppErrorBoundary:", error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error === null) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <Text style={styles.logo}>MaviTeam</Text>
        <Text style={styles.title}>Bir şeyler ters gitti</Text>
        <Text style={styles.subtitle}>
          Beklenmeyen bir hata oluştu. Tekrar dene butonuna basarak devam edebilirsin.
        </Text>
        <AppButton title="Tekrar dene" onPress={this.handleRetry} style={styles.button} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_BACKGROUND_COLOR, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  logo: { color: "white", fontSize: 20, fontWeight: "900" },
  title: { color: "white", fontSize: 22, fontWeight: "900", textAlign: "center" },
  subtitle: { color: "#cbd5e1", fontSize: 15, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  button: { minWidth: 160 },
});
