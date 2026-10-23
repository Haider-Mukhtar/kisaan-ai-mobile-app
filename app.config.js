module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!googleMapsApiKey) {
    return config;
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: config.plugins?.map((plugin) =>
      plugin === "react-native-maps"
        ? ["react-native-maps", { androidGoogleMapsApiKey: googleMapsApiKey }]
        : plugin,
    ),
  };
};
