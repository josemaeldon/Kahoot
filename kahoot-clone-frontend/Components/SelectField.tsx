import type { SelectHTMLAttributes } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "@styles/SelectField.module.css";

interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
  density?: "default" | "compact";
}

function SelectField({
  children,
  className = "",
  containerClassName = "",
  density = "default",
  ...props
}: SelectFieldProps) {
  return (
    <span
      className={`${styles.control} ${
        density === "compact" ? styles.compact : ""
      } ${containerClassName}`}
    >
      <select className={className} {...props}>
        {children}
      </select>
      <FiChevronDown aria-hidden="true" />
    </span>
  );
}

export default SelectField;
