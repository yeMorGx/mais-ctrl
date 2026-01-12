import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, CheckCircle2 } from "lucide-react";

const countryCodes = [
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brasil" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "+351", country: "PT", flag: "🇵🇹", name: "Portugal" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Espanha" },
  { code: "+44", country: "UK", flag: "🇬🇧", name: "Reino Unido" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "França" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Alemanha" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Itália" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japão" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "Índia" },
  { code: "+54", country: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "+56", country: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "México" },
  { code: "+57", country: "CO", flag: "🇨🇴", name: "Colômbia" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  isVerified?: boolean;
  className?: string;
  disabled?: boolean;
}

const formatPhoneNumber = (value: string, countryCode: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");
  
  if (countryCode === "+55") {
    // Formato brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length <= 2) {
      return numbers.length ? `(${numbers}` : "";
    }
    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
  
  if (countryCode === "+1") {
    // Formato americano: (XXX) XXX-XXXX
    if (numbers.length <= 3) {
      return numbers.length ? `(${numbers}` : "";
    }
    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    }
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
  
  // Formato genérico para outros países
  if (numbers.length <= 4) {
    return numbers;
  }
  if (numbers.length <= 8) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  }
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8, 12)}`;
};

const extractCountryCode = (phone: string): { code: string; number: string } => {
  for (const country of countryCodes) {
    if (phone.startsWith(country.code)) {
      return {
        code: country.code,
        number: phone.slice(country.code.length).trim(),
      };
    }
  }
  // Default to Brazil
  return { code: "+55", number: phone.replace(/^\+/, "") };
};

export function PhoneInput({
  value,
  onChange,
  isVerified = false,
  className,
  disabled = false,
}: PhoneInputProps) {
  const { code: initialCode, number: initialNumber } = extractCountryCode(value);
  const [countryCode, setCountryCode] = React.useState(initialCode);
  const [phoneNumber, setPhoneNumber] = React.useState(
    initialNumber ? formatPhoneNumber(initialNumber.replace(/\D/g, ""), initialCode) : ""
  );

  React.useEffect(() => {
    if (value) {
      const { code, number } = extractCountryCode(value);
      setCountryCode(code);
      const cleanNumber = number.replace(/\D/g, "");
      setPhoneNumber(formatPhoneNumber(cleanNumber, code));
    }
  }, [value]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue, countryCode);
    setPhoneNumber(formatted);
    
    // Combine country code and number for the onChange callback
    const cleanNumber = formatted.replace(/\D/g, "");
    if (cleanNumber) {
      onChange(`${countryCode} ${formatted}`);
    } else {
      onChange("");
    }
  };

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const reformatted = formatPhoneNumber(cleanNumber, newCode);
    setPhoneNumber(reformatted);
    if (cleanNumber) {
      onChange(`${newCode} ${reformatted}`);
    }
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
        <SelectTrigger className="w-[120px] flex-shrink-0">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.code}</span>
                <span className="text-muted-foreground text-xs">{country.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="relative flex-1">
        <Input
          type="tel"
          placeholder={countryCode === "+55" ? "(11) 99999-9999" : countryCode === "+1" ? "(555) 123-4567" : "Número"}
          value={phoneNumber}
          onChange={handlePhoneChange}
          disabled={disabled}
          className={cn(
            "pr-10",
            isVerified && "border-green-500 focus-visible:ring-green-500"
          )}
        />
        {isVerified && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
      </div>
    </div>
  );
}
