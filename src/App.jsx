import { useState, useEffect, useRef } from 'react'

// Función simple para generar un ID aleatorio para la sesión
const generateThreadId = () => {
  return 'user-' + Math.random().toString(36).substr(2, 9);
}

function App() {
  // Estados
  const [messages, setMessages] = useState([
    { role: 'ai', content: '¡Hola! Soy tu asistente de viajes. ¿A dónde quieres ir?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState('');
  
  // Referencia para el scroll automático
  const messagesEndRef = useRef(null);

  // Al cargar la página, recuperamos o creamos un ID de sesión
  useEffect(() => {
    const storedThreadId = localStorage.getItem('thread_id');
    if (storedThreadId) {
      setThreadId(storedThreadId);
    } else {
      const newId = generateThreadId();
      setThreadId(newId);
      localStorage.setItem('thread_id', newId);
    }
  }, []);

  // Auto-scroll al final cada vez que hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Función para enviar mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput(''); // Limpiar input
    
    // 1. Añadir mensaje del usuario a la lista visual
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // 2. Enviar al Backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          thread_id: threadId
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor');

      const data = await response.json();

      // 3. Añadir respuesta de la IA a la lista
      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: '❌ Lo siento, hubo un error conectando con el servidor.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white shadow-md">
        <h1 className="text-xl font-bold">✈️ Flight Assistant AI</h1>
        <p className="text-xs opacity-80">Session ID: {threadId}</p>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
              }`}
            >
              {/* Renderizamos saltos de línea */}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {/* Indicador de escribiendo */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg rounded-bl-none animate-pulse">
              Pensando... ✈️
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Busca vuelos a París..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
