import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [message, setMessage] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  useEffect(() => {
    try {
      if (Object.keys(firebaseConfig).length > 0) {
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            const anonymousUser = await signInAnonymously(firebaseAuth);
            setUserId(anonymousUser.user.uid);
          }
          setIsAuthReady(true);
        });

        if (initialAuthToken) {
          signInWithCustomToken(firebaseAuth, initialAuthToken).catch(error => {
            console.error("Error signing in with custom token:", error);
          });
        }
      }
    } catch (error) {
      console.error("Error al inicializar Firebase:", error);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady && userId && db) {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/data/initial-message`);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setMessage(docSnap.data().content);
        } else {
          setMessage("No hay mensaje guardado.");
        }
      });
      return () => unsubscribe();
    }
  }, [db, userId, isAuthReady]);

  const saveMessage = async () => {
    if (!userId || !db) {
      console.error("Usuario o base de datos no están listos.");
      return;
    }
    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/data/initial-message`);
      await setDoc(docRef, { content: inputValue });
      console.log("Mensaje guardado con éxito.");
    } catch (e) {
      console.error("Error al guardar el mensaje:", e);
    }
  };

  const generateAudio = async () => {
    if (!inputValue) {
      alert("Por favor, ingrese un texto para generar audio.");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);

    const payload = {
      contents: [{
        parts: [{ text: inputValue }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }
          }
        }
      },
      model: "gemini-2.5-flash-preview-tts"
    };

    // IMPORTANTE: Reemplaza "" con tu clave de API de Google AI Studio.
    const apiKey = "AIzaSyARwwuVliwaUMLrywuQZsemO-dfJRvMBrA"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType?.startsWith("audio/")) {
        // La API devuelve el audio directamente, no es necesario convertir de PCM.
        const audioBlob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      } else {
        console.error("Datos de audio no encontrados en la respuesta de la API.");
      }

    } catch (error) {
      console.error("Error al generar el audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
          Proyecto Frontend - React
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Tu ID de usuario es: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{userId}</span>
        </p>

        <div className="flex flex-col space-y-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            rows="4"
            placeholder="Escribe un mensaje para guardar en Firestore o para convertir a audio..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          ></textarea>
          <div className="flex space-x-4">
            <button
              onClick={saveMessage}
              className="flex-1 bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg shadow hover:bg-blue-600 transition-colors"
            >
              Guardar Mensaje en Firestore
            </button>
            <button
              onClick={generateAudio}
              className="flex-1 bg-green-500 text-white font-semibold py-3 px-6 rounded-lg shadow hover:bg-green-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Generando...' : 'Generar Audio'}
            </button>
          </div>
        </div>

        {audioUrl && (
          <div className="mt-6 text-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Audio Generado</h3>
            <audio controls src={audioUrl} className="w-full"></audio>
          </div>
        )}

        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Mensaje de Firestore</h3>
          <p className="text-gray-800 break-words">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
