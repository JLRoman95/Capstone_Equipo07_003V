import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import Login from './Login/Login';
import Register from './Login/Register';

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

  // agrega esta función (por ejemplo, después de los useEffect)
  const login = async (email, password) => {
    if (!auth) throw new Error('Auth no inicializado');
    // Reemplaza <URL_LOGIN> y los campos del body según W1/W2
    const res = await fetch('<URL_LOGIN>', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Login failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    // Ajusta estas claves según W3
    const token = data.token || data.accessToken || data.authToken;
    const role = data.role || data.userRole || data.user?.role;

    if (!token) throw new Error('No se recibió token del servidor');

    // Iniciar sesión en Firebase con el token devuelto por el backend
    await signInWithCustomToken(auth, token);

    // Guardar rol/token según prefieras (ej. localStorage)
    if (role) localStorage.setItem('role', role);
    localStorage.setItem('token', token);
    // guardar también en estado local para UI
    setAuthInfo({ token, role, data });
    // Actualizar userId desde el auth actual
    setUserId(auth.currentUser?.uid || null);
    return { token, role, data };
  };

  // Frontend-only register: guarda usuarios en localStorage con hash SHA-256 y crea token simulado
  const register = async ({ email, password, role = 'user' }) => {
    // simple duplication check
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error('Email ya registrado');
    }
    // hash password cliente (SHA-256)
    const pwHash = await (async (pw) => {
      const enc = new TextEncoder().encode(pw);
      const digest = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    })(password);

    const user = { id: Date.now(), email, passwordHash: pwHash, role, createdAt: new Date().toISOString() };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    // token simulado
    const token = btoa(`${email}:${user.id}:${Math.random().toString(36).slice(2)}`);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setAuthInfo({ token, role, user });
    return { token, role, user };
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
