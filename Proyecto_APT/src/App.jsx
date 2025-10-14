import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import Login from './Login/Login';
import Register from './Login/Register';
import { API_BASE } from './api';

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
  const [authInfo, setAuthInfo] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

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

  // login -> llama al backend
  const login = async (email, password) => {
    if (!email || !password) throw new Error('Email y contraseña requeridos');
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const txt = await res.text().catch(()=>null);
      throw new Error(txt || `Login failed: ${res.status}`);
    }
    const data = await res.json();
    // guarda token/role en frontend
    if (data.token) localStorage.setItem('token', data.token);
    if (data.role) localStorage.setItem('role', data.role);
    setAuthInfo({ token: data.token, role: data.role, user: data.user });
    return data;
  };

  // register -> llama al backend y opcionalmente hace auto-login
  const register = async ({ email, password, role = 'user' }) => {
    if (!email || !password) throw new Error('Email y contraseña requeridos');
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    if (!res.ok) {
      const payload = await res.json().catch(()=>null);
      throw new Error(payload?.message || `Registro fallido: ${res.status}`);
    }
    const payload = await res.json();
    // opcional: auto-login si el backend devuelve token
    if (payload.token) {
      localStorage.setItem('token', payload.token);
      localStorage.setItem('role', payload.role || role);
      setAuthInfo({ token: payload.token, role: payload.role || role, user: payload.user });
    }
    return payload;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div style={{ width: '100%', maxWidth: 560, padding: '1rem', boxSizing: 'border-box' }}>
        <div className="login-card" style={{ margin: 0, maxWidth: 520 }}>
          {showRegister ? (
            <Register onRegister={register} onSuccess={() => setShowRegister(false)} />
          ) : (
            <>
              <Login onLogin={login} onSuccess={(res) => { setAuthInfo(res); }} />
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button onClick={() => setShowRegister(true)} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
                  ¿No tienes cuenta? Crear una
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
