import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

interface HeaderProps {
  metric?: boolean;
  onToggleMetric?: () => void;
}

export function Header({ metric, onToggleMetric }: HeaderProps) {
  return (
    <header className="relative overflow-hidden text-primary-foreground"
      style={{ background: "linear-gradient(135deg, hsl(280, 70%, 45%), hsl(210, 85%, 50%), hsl(160, 75%, 38%))" }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />
      </div>
      <div className="relative flex items-center gap-4 px-5 py-3">
        <motion.img
          src={logo}
          alt="Happy Navigator"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-10 w-10 shrink-0 rounded-xl object-contain drop-shadow-lg"
        />
        <div className="min-w-0">
          <motion.h1
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg font-bold tracking-tight"
          >
            Happy Navigator
          </motion.h1>
          <motion.p
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hidden text-sm text-white/75 md:block"
          >
            Discover calmer, greener, more enjoyable drives
          </motion.p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {onToggleMetric && (
            <button
              onClick={onToggleMetric}
              className="hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-all"
            >
              <span className={metric ? "text-white font-bold" : ""}>km</span>
              <span className="text-white/50">/</span>
              <span className={!metric ? "text-white font-bold" : ""}>mi</span>
            </button>
          )}
          <div className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm md:flex">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Google Maps
          </div>
        </div>
      </div>
    </header>
  );
}
