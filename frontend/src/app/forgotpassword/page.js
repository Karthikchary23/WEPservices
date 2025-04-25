"use client";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ForgotPassword = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [recievedOtp, setRecievedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email");

    try {
      await axios.post("http://localhost:4000/otp/forgot-password/send-otp", { email })
      .then((response) => {
        if (response.status === 200) {
            alert("OTP sent to your email!");
            setRecievedOtp(response.data.otp); // Store the received OTP
            setStep(2);
        } else {
            alert("Failed to send OTP. Please try again.");
        }
      });
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return alert("Enter the OTP");

    try {
      if(otp !== recievedOtp) {
        alert("Invalid OTP. Please try again.");
        return;
      } else {
        alert("OTP verified successfully!");
        setStep(3);
        }
    } catch (err) {
      console.error(err);
      alert("Invalid OTP");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return alert("Fill all fields");
    if (newPassword !== confirmPassword) return alert("Passwords do not match");

    try {
      await axios.post("http://localhost:4000/otp/password/reset-password", {
        email,
        newPassword,
      }).then((response) => {
        if (response.status === 200) {
            alert("Password updated successfully!");
        } else {
            alert("Failed to reset password. Please try again.");
        }
      });
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Password reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 transition-all duration-300">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
          Reset Your Password
        </h1>
        <p className="text-gray-600 text-center mb-8">
          {step === 1 && "Enter your email to receive an OTP."}
          {step === 2 && "Enter the OTP sent to your email."}
          {step === 3 && "Set a new password for your account."}
        </p>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 cursor-pointer text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            >
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full cursor-pointer bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200"
            >
              Verify OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full cursor-pointer bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
              onClick={handleResetPassword}           
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;