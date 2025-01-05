import React, { useRef, useState } from 'react';
import { StyleSheet, BackHandler, Alert, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const webViewUrl = process.env.EXPO_PUBLIC_URL_WEBVIEW || null;
  const webViewDomain = process.env.EXPO_PUBLIC_URL_DOMAIN || null;
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack(); // Navegar para a página anterior
      return true; // Evita fechar o app
    }
    Alert.alert('Sair do Aplicativo', 'Deseja realmente sair?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  };

  // Solicita permissão para acessar a câmera ou galeria
  const handleFileUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permissão Necessária',
        'Este app precisa de acesso à galeria para fazer uploads.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    // Verifica se a seleção foi cancelada
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Arquivo selecionado:', result.assets[0].uri);
      // Aqui você pode enviar o arquivo selecionado para o servidor ou tratá-lo como necessário
    } else {
      console.log('Seleção de arquivo cancelada.');
    }
  };

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );
    return () => backHandler.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <WebView
        ref={webViewRef}
        source={{ uri: webViewUrl }}
        style={{ flex: 1, backgroundColor: '#ffffff' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onFileDownload={({ nativeEvent }) => {
          Alert.alert(
            'Download solicitado',
            'Deseja baixar o arquivo?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Baixar',
                onPress: () => {
                  // Lógica de download
                  console.log('Baixando arquivo:', nativeEvent.downloadUrl);
                },
              },
            ]
          );
        }}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        cacheEnabled={true}
        overScrollMode="never"
        onShouldStartLoadWithRequest={(request) => {
          // Permite navegação apenas em domínios autorizados
          const allowedDomains = [webViewDomain];
          const url = request.url;
          const isAllowed = allowedDomains.some((domain) =>
            url.includes(domain)
          );
          return isAllowed;
        }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'uploadFile') {
            handleFileUpload();
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
