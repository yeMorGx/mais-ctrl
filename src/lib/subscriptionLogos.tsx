import { Music, Tv, Gamepad2, Cloud, Dumbbell, Film, Package, Wifi, ShoppingBag, Book, Headphones, Code, CreditCard } from "lucide-react";

export const subscriptionLogos: Record<string, { icon: any; color: string; bgColor: string }> = {
  // Streaming de Música
  "spotify": { icon: Music, color: "#1DB954", bgColor: "bg-[#1DB954]/10" },
  "apple music": { icon: Music, color: "#FA243C", bgColor: "bg-red-500/10" },
  "youtube music": { icon: Music, color: "#FF0000", bgColor: "bg-red-600/10" },
  "deezer": { icon: Music, color: "#FF0000", bgColor: "bg-red-600/10" },
  "tidal": { icon: Music, color: "#000000", bgColor: "bg-gray-900/10" },
  
  // Streaming de Vídeo
  "netflix": { icon: Tv, color: "#E50914", bgColor: "bg-red-600/10" },
  "prime video": { icon: Tv, color: "#00A8E1", bgColor: "bg-blue-500/10" },
  "disney+": { icon: Film, color: "#113CCF", bgColor: "bg-blue-700/10" },
  "hbo max": { icon: Tv, color: "#B200ED", bgColor: "bg-purple-600/10" },
  "paramount+": { icon: Tv, color: "#0064FF", bgColor: "bg-blue-600/10" },
  "star+": { icon: Film, color: "#FFEB3B", bgColor: "bg-yellow-400/10" },
  "globoplay": { icon: Tv, color: "#FF6600", bgColor: "bg-orange-500/10" },
  "crunchyroll": { icon: Film, color: "#F47521", bgColor: "bg-orange-500/10" },
  
  // Gaming
  "ps plus": { icon: Gamepad2, color: "#003791", bgColor: "bg-blue-900/10" },
  "playstation": { icon: Gamepad2, color: "#003791", bgColor: "bg-blue-900/10" },
  "xbox game pass": { icon: Gamepad2, color: "#107C10", bgColor: "bg-green-600/10" },
  "nintendo online": { icon: Gamepad2, color: "#E60012", bgColor: "bg-red-600/10" },
  "steam": { icon: Gamepad2, color: "#171A21", bgColor: "bg-gray-900/10" },
  
  // Cloud Storage
  "google drive": { icon: Cloud, color: "#4285F4", bgColor: "bg-blue-500/10" },
  "google one": { icon: Cloud, color: "#4285F4", bgColor: "bg-blue-500/10" },
  "dropbox": { icon: Cloud, color: "#0061FF", bgColor: "bg-blue-600/10" },
  "icloud": { icon: Cloud, color: "#3693F3", bgColor: "bg-blue-500/10" },
  "onedrive": { icon: Cloud, color: "#0078D4", bgColor: "bg-blue-600/10" },
  
  // Fitness & Saúde
  "academia": { icon: Dumbbell, color: "#FF6B6B", bgColor: "bg-red-400/10" },
  "smart fit": { icon: Dumbbell, color: "#FFD700", bgColor: "bg-yellow-500/10" },
  "gympass": { icon: Dumbbell, color: "#FF6900", bgColor: "bg-orange-500/10" },
  
  // Audiobooks & Podcasts
  "audible": { icon: Headphones, color: "#FF9900", bgColor: "bg-orange-500/10" },
  
  // Educação
  "duolingo": { icon: Book, color: "#58CC02", bgColor: "bg-green-500/10" },
  "coursera": { icon: Book, color: "#0056D2", bgColor: "bg-blue-600/10" },
  "udemy": { icon: Book, color: "#A435F0", bgColor: "bg-purple-500/10" },
  
  // Desenvolvimento
  "github": { icon: Code, color: "#181717", bgColor: "bg-gray-900/10" },
  "gitlab": { icon: Code, color: "#FC6D26", bgColor: "bg-orange-500/10" },
  
  // Internet & Telefonia
  "internet": { icon: Wifi, color: "#4A90E2", bgColor: "bg-blue-500/10" },
  "telefone": { icon: Wifi, color: "#34D399", bgColor: "bg-green-400/10" },
  
  // E-commerce
  "mercado livre": { icon: ShoppingBag, color: "#FFE600", bgColor: "bg-yellow-400/10" },
  
  // Default
  "default": { icon: CreditCard, color: "#8B5CF6", bgColor: "bg-purple-500/10" }
};

export const getSubscriptionLogo = (name: string) => {
  const normalizedName = name.toLowerCase().trim();
  
  // Procura por correspondência exata
  if (subscriptionLogos[normalizedName]) {
    return subscriptionLogos[normalizedName];
  }
  
  // Procura por correspondência parcial
  const partialMatch = Object.keys(subscriptionLogos).find(key => 
    normalizedName.includes(key) || key.includes(normalizedName)
  );
  
  if (partialMatch) {
    return subscriptionLogos[partialMatch];
  }
  
  // Retorna o padrão se não encontrar
  return subscriptionLogos.default;
};
