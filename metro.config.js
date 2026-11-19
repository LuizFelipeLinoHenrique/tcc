const {
    getDefaultConfig
} = require('expo/metro-config');
const {
    withNativeWind
} = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// Use the browser build for PDF downloads, including Expo Router's web SSR.
// jsPDF's default Node entry contains AMD requires that Metro cannot bundle.
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'jspdf' && platform === 'web') {
        return context.resolveRequest(
            context,
            require.resolve('jspdf/dist/jspdf.es.min.js'),
            platform
        );
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
    input: './global.css',
});
