import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ArrowRight, Wine } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, complete ambos campos.');
      return;
    }
    const { error } = await signIn(email, password);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Credenciales incorrectas. Verifique su email y contraseña.');
      } else {
        setError('Error al iniciar sesión. Intente nuevamente más tarde.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex font-sans">
      {/* Panel Izquierdo - Visual */}
      <div className="w-1/3 bg-black hidden lg:flex flex-col justify-between p-12 bg-cover bg-center"
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1584916201218-6e313ce5a914?q=80&w=1974&auto=format&fit=crop')" }}>
        <div className="z-10">
          <h1 className="text-white text-4xl font-serif tracking-widest" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
            BODEGA
          </h1>
          <h2 className="text-white text-4xl font-serif tracking-widest" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
            PREMIUM
          </h2>
        </div>
        <p className="text-white/50 text-xs z-10" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.8)'}}>
          Descubra la excelencia en cada botella. Una tradición de calidad y pasión por el vino.
        </p>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-8 lg:p-12 relative">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-12 text-center lg:text-left">
            <h3 className="text-4xl font-light text-white mb-2">Bienvenido</h3>
            <p className="text-white/40">Inicie sesión para gestionar su bodega.</p>
            <div className="lg:hidden mt-8">
                <Wine className="text-amber-700/50 w-16 h-16 mx-auto"/>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative border-b border-white/20 focus-within:border-amber-600 transition-colors duration-300">
              <label htmlFor="email" className="absolute -top-3.5 text-xs text-white/50">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-white text-lg py-2 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div className="relative border-b border-white/20 focus-within:border-amber-600 transition-colors duration-300">
              <label htmlFor="password" className="absolute -top-3.5 text-xs text-white/50">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-white text-lg py-2 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-amber-700 text-white font-bold text-lg rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">Iniciar Sesión</span>
                    <ArrowRight className="w-6 h-6 ml-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs text-white/30">
              © 2025 Bodega Premium. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
