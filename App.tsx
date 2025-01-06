import React, { useRef, useState } from 'react';
import { StyleSheet, BackHandler, Alert, StatusBar, ActivityIndicator, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewUrl = process.env.EXPO_PUBLIC_URL_WEBVIEW || 'https://crm.casaverdecoop.com.br';
  const allowedDomains = ['crm.casaverdecoop.com.br'];

  const handleBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    Alert.alert('Sair do Aplicativo', 'Deseja realmente sair?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  };

  const handleFileUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão Necessária', 'Este app precisa de acesso à galeria para fazer uploads.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Arquivo selecionado:', result.assets[0].uri);
    } else {
      console.log('Seleção de arquivo cancelada.');
    }
  };

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        setError(true);
        Alert.alert('Sem conexão', 'Verifique sua conexão com a internet e tente novamente.');
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={error ? 'light-content' : 'dark-content'} backgroundColor={error ? 'red' : 'transparent'} translucent />
      {loading && !error && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text>Carregando...</Text>
        </View>
      )}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar a página.</Text>
          <Text style={styles.errorText}>Verifique sua conexão ou tente novamente.</Text>
          <Text
            style={styles.retryButton}
            onPress={() => {
              setError(false);
              setLoading(true);
              webViewRef.current?.reload();
            }}
          >
            Tentar novamente
          </Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onLoad={() => setLoading(false)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
            Alert.alert('Erro', nativeEvent.description);
            setLoading(false);
            setError(true);
          }}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          overScrollMode="never"
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;
            const isAllowed = allowedDomains.some((domain) => url.includes(domain));
            if (!isAllowed) {
              Alert.alert('Navegação bloqueada', 'Você tentou acessar um domínio não permitido.');
            }
            return isAllowed;
          }}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'uploadFile') {
              handleFileUpload();
            }
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('HTTP error:', nativeEvent);
            Alert.alert('Erro HTTP', `Código: ${nativeEvent.statusCode}`);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    fontSize: 16,
    color: 'blue',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
