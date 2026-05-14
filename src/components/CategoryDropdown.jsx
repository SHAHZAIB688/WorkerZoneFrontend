import React from "react";
import Dropdown from "./Dropdown";
import { DOCTOR_SIGNUP_SPECIALIZATIONS } from "../pages/home/components/HomeConstants";

const DEFAULT_TRADE_OPTIONS = ["All", ...DOCTOR_SIGNUP_SPECIALIZATIONS];

const CategoryDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "All trades",
  className = "",
  ...props
}) => {
  const dropdownOptions = options.length > 0 ? options : DEFAULT_TRADE_OPTIONS;

  return (
    <Dropdown
      options={dropdownOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-4 py-2 text-sm font-medium outline-none transition-all duration-200 ${className}`}
      {...props}
    />
  );
};

export default CategoryDropdown;
