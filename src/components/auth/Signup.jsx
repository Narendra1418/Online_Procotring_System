import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { sendOTP, verifyOTP, signUpCompany } from "../service/authService";

import {
  FaBuilding,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaGlobe,
  FaUser,
  FaIdCard,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { MdSecurity, MdBusiness, MdVerifiedUser } from "react-icons/md";
import ThreeBackground from "../common/ThreeBackground";

const CompanyRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Organization Info
    organizationName: "",
    organizationType: "",
    establishmentDate: "",
    industrySector: "",
    websiteUrl: "",

    // Step 2: Contact & Location
    registeredAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    officialEmailDomain: "",
    primaryContactEmail: "",
    officialPhone: "",

    // Step 3: Authorized Representative
    representative: {
      fullName: "",
      designation: "",
      officialEmail: "",
      password: "",
      confirmPassword: "",
      contactNumber: "",
      idProof: null,
    },

    // Step 4: Review & Verification
    confirmationAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Timer countdown
  React.useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, otpSent]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = async () => {
    if (
      !formData.officialEmailDomain ||
      !validateEmail(formData.officialEmailDomain)
    ) {
      setErrors({
        ...errors,
        officialEmailDomain: "Please enter a valid email address",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendOTP(formData.officialEmailDomain);
      if (response.STS === "200") {
        setOtpSent(true);
        setTimeLeft(300);
        setCanResend(false);
        alert("OTP sent successfully!");
      } else {
        alert(response.MSG || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      alert("Error sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error when user starts typing
    if (errors.otp) {
      setErrors({ ...errors, otp: "" });
    }

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData
        .split("")
        .concat(Array(4 - pastedData.length).fill(""));
      setOtp(newOtp.slice(0, 4));

      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 4) {
      setErrors({ ...errors, otp: "Please enter the complete 4-digit OTP" });
      return;
    }

    if (!/^\d+$/.test(otpCode)) {
      setErrors({ ...errors, otp: "OTP should contain only numbers" });
      return;
    }

    try {
      setIsLoading(true);
      const response = await verifyOTP(formData.officialEmailDomain, otpCode);
      if (response.STS === "200") {
        alert("Email verified successfully!");
        setEmailVerified(true);
        setOtpSent(false);
        setOtp(["", "", "", ""]);
      } else {
        setErrors({ ...errors, otp: response.MSG || "Invalid OTP" });
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      alert("Error verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await sendOTP(formData.officialEmailDomain);
      if (response.STS === "200") {
        setTimeLeft(300);
        setCanResend(false);
        setOtp(["", "", "", ""]);
        setErrors({});
        alert("New OTP sent to your email!");
      } else {
        alert(response.MSG || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      alert("Something went wrong while resending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const organizationTypes = [
    "University",
    "College",
    "Corporate",
    "Training Institute",
    "Government Body",
    "NGO",
    "Research Institution",
    "Healthcare",
    "Other",
  ];

  const industrySectors = [
    "Education",
    "Information Technology",
    "Healthcare",
    "Finance",
    "Manufacturing",
    "Government",
    "Non-Profit",
    "Research & Development",
    "Other",
  ];

  const designations = [
    "Exam Head",
    "HR Manager",
    "Training Head",
    "Director",
    "CEO",
    "Academic Dean",
    "Principal",
    "Vice President",
    "Other",
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    );
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validateWebsite = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateDomainMatch = (website, email) => {
    try {
      const websiteDomain = new URL(website).hostname.replace("www.", "");
      const emailDomain = email.split("@")[1];
      return (
        websiteDomain.includes(emailDomain) ||
        emailDomain.includes(websiteDomain)
      );
    } catch {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 1:
        if (!formData.organizationName.trim())
          newErrors.organizationName = "Organization name is required";
        if (!formData.organizationType)
          newErrors.organizationType = "Organization type is required";
        if (!formData.establishmentDate)
          newErrors.establishmentDate = "Establishment date is required";
        if (!formData.industrySector)
          newErrors.industrySector = "Industry sector is required";
        if (!formData.websiteUrl) {
          newErrors.websiteUrl = "Website URL is required";
        } else if (!validateWebsite(formData.websiteUrl)) {
          newErrors.websiteUrl = "Please enter a valid website URL";
        }
        break;

      case 2:
        if (!formData.registeredAddress.street.trim())
          newErrors["registeredAddress.street"] = "Street address is required";
        if (!formData.registeredAddress.city.trim())
          newErrors["registeredAddress.city"] = "City is required";
        if (!formData.registeredAddress.state.trim())
          newErrors["registeredAddress.state"] = "State is required";
        if (!formData.registeredAddress.zip.trim())
          newErrors["registeredAddress.zip"] = "ZIP code is required";
        if (!formData.registeredAddress.country.trim())
          newErrors["registeredAddress.country"] = "Country is required";
        if (!formData.officialEmailDomain) {
          newErrors.officialEmailDomain = "Official email domain is required";
        } else if (!validateEmail(formData.officialEmailDomain)) {
          newErrors.officialEmailDomain = "Please enter a valid email address";
        }
        if (!emailVerified) {
          newErrors.emailVerification = "Please verify your email address";
        }
        if (!formData.primaryContactEmail) {
          newErrors.primaryContactEmail = "Primary contact email is required";
        } else if (!validateEmail(formData.primaryContactEmail)) {
          newErrors.primaryContactEmail = "Please enter a valid email address";
        }
        if (!formData.officialPhone) {
          newErrors.officialPhone = "Official phone number is required";
        } else if (!validatePhone(formData.officialPhone)) {
          newErrors.officialPhone = "Please enter a valid phone number";
        }
        break;

      case 3:
        if (!formData.representative.fullName.trim())
          newErrors["representative.fullName"] = "Full name is required";
        if (!formData.representative.designation)
          newErrors["representative.designation"] = "Designation is required";
        if (!formData.representative.officialEmail) {
          newErrors["representative.officialEmail"] =
            "Official email is required";
        } else if (!validateEmail(formData.representative.officialEmail)) {
          newErrors["representative.officialEmail"] =
            "Please enter a valid email address";
        } else if (
          formData.websiteUrl &&
          !validateDomainMatch(
            formData.websiteUrl,
            formData.representative.officialEmail
          )
        ) {
          newErrors["representative.officialEmail"] =
            "Email domain should match organization domain";
        }
        if (!formData.representative.password) {
          newErrors["representative.password"] = "Password is required";
        } else if (!validatePassword(formData.representative.password)) {
          newErrors["representative.password"] =
            "Password must be 8+ chars with uppercase, lowercase, and number";
        }
        if (
          formData.representative.password !==
          formData.representative.confirmPassword
        ) {
          newErrors["representative.confirmPassword"] =
            "Passwords do not match";
        }
        if (!formData.representative.contactNumber) {
          newErrors["representative.contactNumber"] =
            "Contact number is required";
        } else if (!validatePhone(formData.representative.contactNumber)) {
          newErrors["representative.contactNumber"] =
            "Please enter a valid contact number";
        }
        break;

      case 4:
        if (!formData.confirmationAccepted) {
          newErrors.confirmationAccepted =
            "You must confirm that all information is true and valid";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 4 && validateCurrentStep()) {
      setIsLoading(true);

      const address =
        formData.registeredAddress.street +
        formData.registeredAddress.country +
        formData.registeredAddress.state +
        formData.registeredAddress.city;

      const data = await signUpCompany(
        formData.organizationName,
        formData.organizationType,
        formData.establishmentDate,
        formData.industrySector,
        formData.websiteUrl,
        address,
        "",
        formData.officialEmailDomain,
        formData.primaryContactEmail,
        formData.officialPhone,
        formData.representative.fullName,
        formData.representative.designation,
        formData.representative.contactNumber,
        formData.representative.contactNumber,
        formData.representative.officialEmail,
        formData.representative.confirmPassword
      );

      try {
        if (data.STS === "200") {
          setIsLoading(false);
          alert(
            "Company registration submitted successfully! You will receive a verification email shortly."
          );
        } else {
          setIsLoading(false);
          setErrors(data.MSG || "Some thing went wrong");
        }
      } catch (error) {
        setIsLoading(false);
        setErrors({ general: error.message });
      }
    }
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 1:
        return <MdBusiness className="text-xl" />;
      case 2:
        return <FaMapMarkerAlt className="text-xl" />;
      case 3:
        return <MdVerifiedUser className="text-xl" />;
      case 4:
        return <FaCheck className="text-xl" />;
      default:
        return <FaCheck className="text-xl" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Three.js Background */}
      <ThreeBackground />

      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}>
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-sky-300/20 to-sky-400/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-r from-sky-400/20 to-sky-500/20 rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Company Registration Card */}
      <div
        className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-4xl border border-white/20"
        style={{ zIndex: 3 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-3 rounded-2xl">
              <FaBuilding className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-sky-600 bg-clip-text text-transparent">
            Company Registration
          </h1>
          <p className="text-gray-600 mt-2">
            Register your organization for online proctoring services
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-sky-500 to-sky-600 -translate-y-1/2 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>

            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="relative flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-sky-500 to-sky-600 border-sky-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {getStepIcon(step)}
                </div>
                <div
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= step ? "text-sky-600" : "text-gray-400"
                  }`}
                >
                  {step === 1 && "Organization"}
                  {step === 2 && "Contact"}
                  {step === 3 && "Representative"}
                  {step === 4 && "Review"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Organization Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Basic Organization Information
                </h2>
                <p className="text-gray-600">Tell us about your organization</p>
              </div>

              {/* Organization Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Organization Name (Legal Name)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaBuilding
                      className={`text-lg ${
                        errors.organizationName
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      errors.organizationName
                        ? "border-red-400 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                    }`}
                    placeholder="Enter organization legal name"
                  />
                </div>
                {errors.organizationName && (
                  <p className="text-red-500 text-sm">
                    {errors.organizationName}
                  </p>
                )}
              </div>

              {/* Organization Type and Industry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Organization Type
                  </label>
                  <select
                    name="organizationType"
                    value={formData.organizationType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      errors.organizationType
                        ? "border-red-400 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                    }`}
                  >
                    <option value="">Select organization type</option>
                    {organizationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.organizationType && (
                    <p className="text-red-500 text-sm">
                      {errors.organizationType}
                    </p>
                  )}
                </div>

                {/* Industry Sector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Industry Sector
                  </label>
                  <select
                    name="industrySector"
                    value={formData.industrySector}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      errors.industrySector
                        ? "border-red-400 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                    }`}
                  >
                    <option value="">Select industry sector</option>
                    {industrySectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                  {errors.industrySector && (
                    <p className="text-red-500 text-sm">
                      {errors.industrySector}
                    </p>
                  )}
                </div>
              </div>

              {/* Establishment Date and Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Establishment Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Date of Establishment
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaCalendarAlt
                        className={`text-lg ${
                          errors.establishmentDate
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="date"
                      name="establishmentDate"
                      value={formData.establishmentDate}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.establishmentDate
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.establishmentDate && (
                    <p className="text-red-500 text-sm">
                      {errors.establishmentDate}
                    </p>
                  )}
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Organization Website URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaGlobe
                        className={`text-lg ${
                          errors.websiteUrl ? "text-red-400" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="url"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.websiteUrl
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="https://www.example.com"
                    />
                  </div>
                  {errors.websiteUrl && (
                    <p className="text-red-500 text-sm">{errors.websiteUrl}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Contact & Location Information
                </h2>
                <p className="text-gray-600">
                  Provide your official contact details
                </p>
              </div>

              {/* Registered Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Registered Office Address
                </h3>

                {/* Street Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaMapMarkerAlt
                        className={`text-lg ${
                          errors["registeredAddress.street"]
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      name="registeredAddress.street"
                      value={formData.registeredAddress.street}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["registeredAddress.street"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="Enter street address"
                    />
                  </div>
                  {errors["registeredAddress.street"] && (
                    <p className="text-red-500 text-sm">
                      {errors["registeredAddress.street"]}
                    </p>
                  )}
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="registeredAddress.city"
                      value={formData.registeredAddress.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["registeredAddress.city"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="City"
                    />
                    {errors["registeredAddress.city"] && (
                      <p className="text-red-500 text-sm">
                        {errors["registeredAddress.city"]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      State
                    </label>
                    <select
                      name="registeredAddress.state"
                      value={formData.registeredAddress.state}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["registeredAddress.state"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                    >
                      <option value="">Select State</option>
                      {[
                        "Andhra Pradesh",
                        "Arunachal Pradesh",
                        "Assam",
                        "Bihar",
                        "Chhattisgarh",
                        "Goa",
                        "Gujarat",
                        "Haryana",
                        "Himachal Pradesh",
                        "Jharkhand",
                        "Karnataka",
                        "Kerala",
                        "Madhya Pradesh",
                        "Maharashtra",
                        "Manipur",
                        "Meghalaya",
                        "Mizoram",
                        "Nagaland",
                        "Odisha",
                        "Punjab",
                        "Rajasthan",
                        "Sikkim",
                        "Tamil Nadu",
                        "Telangana",
                        "Tripura",
                        "Uttar Pradesh",
                        "Uttarakhand",
                        "West Bengal",
                        "Andaman and Nicobar Islands",
                        "Chandigarh",
                        "Dadra and Nagar Haveli and Daman and Diu",
                        "Delhi",
                        "Jammu and Kashmir",
                        "Ladakh",
                        "Lakshadweep",
                        "Puducherry",
                      ].map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors["registeredAddress.state"] && (
                      <p className="text-red-500 text-sm">
                        {errors["registeredAddress.state"]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="registeredAddress.zip"
                      value={formData.registeredAddress.zip}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["registeredAddress.zip"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="ZIP"
                    />
                    {errors["registeredAddress.zip"] && (
                      <p className="text-red-500 text-sm">
                        {errors["registeredAddress.zip"]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    name="registeredAddress.country"
                    value={formData.registeredAddress.country}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      errors["registeredAddress.country"]
                        ? "border-red-400 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                    }`}
                    placeholder="India"
                  />
                  {errors["registeredAddress.country"] && (
                    <p className="text-red-500 text-sm">
                      {errors["registeredAddress.country"]}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Official Contact Information
                </h3>

                {/* Official Email Domain */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Official Email Domain
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope
                        className={`text-lg ${
                          errors.officialEmailDomain
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="email"
                      name="officialEmailDomain"
                      value={formData.officialEmailDomain}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.officialEmailDomain
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="admin@company.com"
                    />
                  </div>
                  {errors.officialEmailDomain && (
                    <p className="text-red-500 text-sm">
                      {errors.officialEmailDomain}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Use your organization's domain email only
                  </p>
                </div>

                {/* Primary Contact Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Primary Contact Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaEnvelope
                          className={`text-lg ${
                            errors.primaryContactEmail
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <input
                        type="email"
                        name="primaryContactEmail"
                        value={formData.primaryContactEmail}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                          errors.primaryContactEmail
                            ? "border-red-400 focus:border-red-500 bg-red-50"
                            : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                        }`}
                        placeholder="contact@company.com"
                      />
                    </div>
                    {errors.primaryContactEmail && (
                      <p className="text-red-500 text-sm">
                        {errors.primaryContactEmail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Official Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaPhone
                          className={`text-lg ${
                            errors.officialPhone
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <input
                        type="tel"
                        name="officialPhone"
                        value={formData.officialPhone}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                          errors.officialPhone
                            ? "border-red-400 focus:border-red-500 bg-red-50"
                            : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                        }`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.officialPhone && (
                      <p className="text-red-500 text-sm">
                        {errors.officialPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Verification */}
                <div className="mt-4 p-6 bg-sky-50 border-2 border-sky-200 rounded-xl">
                  <div className="flex items-center justify-center mb-3">
                    <MdSecurity className="text-sky-600 text-2xl mr-2" />
                    <p className="text-sm font-semibold text-sky-800">
                      Email Verification Required
                    </p>
                  </div>

                  {!emailVerified ? (
                    <>
                      {!otpSent ? (
                        <div className="space-y-3">
                          <p className="text-xs text-gray-600 text-center">
                            Click below to send a verification code to your
                            email
                          </p>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={
                              !formData.officialEmailDomain || isLoading
                            }
                            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold py-3 rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Sending...
                              </div>
                            ) : (
                              "Send Verification Code"
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-600 text-center">
                            Enter the 4-digit code sent to{" "}
                            <span className="font-medium text-sky-700">
                              {formData.officialEmailDomain}
                            </span>
                          </p>

                          {/* OTP Input */}
                          <div className="flex justify-center space-x-2">
                            {otp.map((digit, index) => (
                              <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                value={digit}
                                onChange={(e) =>
                                  handleOtpChange(index, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                                  errors.otp
                                    ? "border-red-400 focus:border-red-500 bg-red-50"
                                    : "border-gray-300 focus:border-sky-500 hover:border-gray-400 bg-white"
                                }`}
                                maxLength={1}
                              />
                            ))}
                          </div>

                          {errors.otp && (
                            <p className="text-red-500 text-sm text-center">
                              {errors.otp}
                            </p>
                          )}

                          {/* Timer */}
                          <div className="text-center">
                            {!canResend ? (
                              <p className="text-gray-600 text-xs">
                                Code expires in{" "}
                                <span className="font-mono text-sky-600 font-medium">
                                  {formatTime(timeLeft)}
                                </span>
                              </p>
                            ) : (
                              <p className="text-red-500 text-xs">
                                Code has expired
                              </p>
                            )}
                          </div>

                          {/* Verify Button */}
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={isLoading || otp.join("").length !== 4}
                            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold py-3 rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Verifying...
                              </div>
                            ) : (
                              "Verify Code"
                            )}
                          </button>

                          {/* Resend Button */}
                          {canResend && (
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={isLoading}
                              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <div className="flex items-center justify-center text-green-600 font-semibold">
                        <FaCheck className="mr-2" />
                        Email Verified Successfully!
                      </div>
                    </div>
                  )}
                </div>
                {errors.emailVerification && (
                  <p className="text-red-500 text-sm text-center mt-2">
                    {errors.emailVerification}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Authorized Representative */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Authorized Representative
                </h2>
                <p className="text-gray-600">
                  Assign someone accountable for your organization
                </p>
              </div>

              {/* Representative Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaUser
                        className={`text-lg ${
                          errors["representative.fullName"]
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      name="representative.fullName"
                      value={formData.representative.fullName}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["representative.fullName"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors["representative.fullName"] && (
                    <p className="text-red-500 text-sm">
                      {errors["representative.fullName"]}
                    </p>
                  )}
                </div>

                {/* Designation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <select
                    name="representative.designation"
                    value={formData.representative.designation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      errors["representative.designation"]
                        ? "border-red-400 focus:border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                    }`}
                  >
                    <option value="">Select designation</option>
                    {designations.map((designation) => (
                      <option key={designation} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                  {errors["representative.designation"] && (
                    <p className="text-red-500 text-sm">
                      {errors["representative.designation"]}
                    </p>
                  )}
                </div>
              </div>

              {/* Official Email and Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Official Email ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope
                        className={`text-lg ${
                          errors["representative.officialEmail"]
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="email"
                      name="representative.officialEmail"
                      value={formData.representative.officialEmail}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["representative.officialEmail"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  {errors["representative.officialEmail"] && (
                    <p className="text-red-500 text-sm">
                      {errors["representative.officialEmail"]}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Must match organization domain
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Contact Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaPhone
                        className={`text-lg ${
                          errors["representative.contactNumber"]
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type="tel"
                      name="representative.contactNumber"
                      value={formData.representative.contactNumber}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["representative.contactNumber"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors["representative.contactNumber"] && (
                    <p className="text-red-500 text-sm">
                      {errors["representative.contactNumber"]}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaLock
                        className={`text-lg ${
                          errors["representative.password"]
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="representative.password"
                      value={formData.representative.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["representative.password"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-sky-600 transition-colors"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-lg" />
                      ) : (
                        <FaEye className="text-lg" />
                      )}
                    </button>
                  </div>
                  {errors["representative.password"] && (
                    <p className="text-red-500 text-sm">
                      {errors["representative.password"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaLock
                        className={`text-lg ${
                          errors["representative.confirmPassword"]
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="representative.confirmPassword"
                      value={formData.representative.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors["representative.confirmPassword"]
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-gray-200 focus:border-sky-500 hover:border-gray-300"
                      }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-sky-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="text-lg" />
                      ) : (
                        <FaEye className="text-lg" />
                      )}
                    </button>
                  </div>
                  {errors["representative.confirmPassword"] && (
                    <p className="text-red-500 text-sm">
                      {errors["representative.confirmPassword"]}
                    </p>
                  )}
                </div>
              </div>

              {/* ID Proof Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ID Proof (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaIdCard className="text-lg text-gray-400" />
                  </div>
                  <input
                    type="file"
                    name="representative.idProof"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        representative: {
                          ...prev.representative,
                          idProof: e.target.files[0],
                        },
                      }));
                    }}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 hover:border-gray-300 transition-all duration-300"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Government ID or Company ID (PDF, JPG, PNG - Max 5MB)
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review & Verification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Review & Verification
                </h2>
                <p className="text-gray-600">
                  Please review all information before submitting
                </p>
              </div>

              {/* Summary Cards */}
              <div className="space-y-4">
                {/* Organization Info */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <MdBusiness className="mr-2" />
                    Organization Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {formData.organizationName}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {formData.organizationType}
                    </div>
                    <div>
                      <span className="font-medium">Industry:</span>{" "}
                      {formData.industrySector}
                    </div>
                    <div>
                      <span className="font-medium">Established:</span>{" "}
                      {formData.establishmentDate}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Website:</span>{" "}
                      {formData.websiteUrl}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    Contact Information
                  </h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Address:</span>{" "}
                      {formData.registeredAddress.street},{" "}
                      {formData.registeredAddress.city},{" "}
                      {formData.registeredAddress.state}{" "}
                      {formData.registeredAddress.zip},{" "}
                      {formData.registeredAddress.country}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {formData.officialEmailDomain}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {formData.officialPhone}
                    </div>
                  </div>
                </div>

                {/* Representative Info */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <MdVerifiedUser className="mr-2" />
                    Authorized Representative
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {formData.representative.fullName}
                    </div>
                    <div>
                      <span className="font-medium">Designation:</span>{" "}
                      {formData.representative.designation}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {formData.representative.officialEmail}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span>{" "}
                      {formData.representative.contactNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="confirmationAccepted"
                    checked={formData.confirmationAccepted}
                    onChange={handleChange}
                    className="w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 mt-1"
                  />
                  <span className="text-sm text-gray-600">
                    I confirm that all information provided is true and
                    accurate. All documents are valid and I have the authority
                    to register this organization for online proctoring
                    services.
                  </span>
                </label>
                {errors.confirmationAccepted && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmationAccepted}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                <FaChevronLeft className="mr-2" />
                Previous
              </button>
            )}

            <div className="flex-1"></div>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all"
              >
                Next
                <FaChevronRight className="ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !formData.confirmationAccepted}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Registration"
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-sky-600 hover:text-sky-800 font-medium"
            >
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistration;
