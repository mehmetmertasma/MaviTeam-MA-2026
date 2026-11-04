// Sentry's Metro config adds debug IDs to the JS bundles so uploaded source
// maps can be matched to crash reports (readable stack traces in Sentry).
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

module.exports = getSentryExpoConfig(__dirname);
