import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * @interface SearchBarProps
 * @description The props for the SearchBar component.
 * @property {string} value - The value of the search bar.
 * @property {(value: string) => void} onChange - The function to call when the value changes.
 * @property {string} [placeholder] - The placeholder for the search bar.
 * @property {string} [className] - The class name for the component.
 */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * @name SearchBar
 * @description A component for a search bar.
 * @param {SearchBarProps} props - The props for the component.
 * @returns {JSX.Element} - The JSX element for the component.
 */
export const SearchBar = ({ value, onChange, placeholder = "Search...", className = "" }: SearchBarProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
