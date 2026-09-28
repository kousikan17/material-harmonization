import * as React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/services/api";
import { GovLogos } from "@/components/GovLogos";
import { GovernmentFooter } from "@/components/GovernmentFooter";

const DEMO_ACCOUNTS = [{ role: "Admin", username: "admin", password: "Admin@123" }];

const BACKGROUND_IMAGES = [
  "https://images.livemint.com/rf/Image-621x414/LiveMint/Period2/2017/02/16/Photos/Processed/paradip-k2gH--621x414%40LiveMint.jpg",
  "https://cdn.vev.design/cdn-cgi/image/f=auto,q=82/private/VaZSgK1lv7hXvpRFhrSBNrO9aeI3/image/q8E8ScCKKN.jpeg",
  "https://www.tataworld.com/upload/OpenData/images/TSK-BF2-Group-Pic-02.JPG",
  "https://etimg.etb2bimg.com/photo/124618550.cms"
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password: password.trim() });
      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid User ID or Password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col relative bg-slate-950">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {BACKGROUND_IMAGES.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-slate-950/60" />
      </div>

      <div className="relative z-10 bg-brand-900 h-[3px] w-full" />
      <div className="relative z-10 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="bg-white/90 rounded p-2 shadow-sm">
          <GovLogos />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-lg">National Unified Material Master</h1>
            <p className="mt-2 text-sm text-slate-300 font-medium drop-shadow-md">One Nation - One Common Material Code</p>
          </div>

          <Card className="border-t-4 border-t-[#f58220] shadow-2xl rounded-lg overflow-hidden bg-white border-slate-200">
            <CardContent className="p-8">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-900">Authorized Sign In</h2>
                <p className="mt-1 text-sm text-slate-500">Access restricted to CPSE personnel only</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="username" className="text-slate-700 font-semibold">User ID</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your User ID"
                    required
                    autoFocus
                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#f58220]"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#f58220]"
                  />
                </div>
                {error && <p className="text-sm text-danger-400 font-medium">{error}</p>}
                
                <div className="pt-2">
                  <Button type="submit" className="w-full bg-[#2a7a38] hover:bg-[#1e5a26] text-white font-bold py-2.5 h-auto text-sm uppercase tracking-widest rounded border border-[#3b9c4c] shadow-[0_0_15px_rgba(42,122,56,0.3)] transition-all" disabled={isSubmitting}>
                    {isSubmitting ? "Authenticating..." : "Login Securely"}
                  </Button>
                </div>
                
                <div className="text-center pt-2">
                  <button type="button" className="text-sm text-[#f58220] hover:text-[#d36912] hover:underline font-medium transition-colors">
                    Forgot Password?
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-md">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#f58220] border-b border-slate-200 pb-2">
              System Prototype Access
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.username} className="flex justify-between items-center">
                  <span className="font-medium text-slate-900">{acc.role}</span>
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200 text-slate-700 shadow-sm">
                    {acc.username} / {acc.password}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
        </div>
      </div>

      {/* Platform Footer */}
      <div className="relative z-10 w-full">
        <GovernmentFooter />
      </div>
    </div>
  );
}
