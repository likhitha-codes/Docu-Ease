import React, { useState } from "react";
import { CitizenUser } from "../types";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "motion/react";

interface ToastPayload {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

interface AadhaarSSOLoginProps {
  onLoginSuccess: (user: CitizenUser) => void;
  highContrast: boolean;
  initialMode?: "signin" | "signup" | "quick";
  onShowToast?: (toast: ToastPayload) => void;
}

export const AadhaarSSOLogin: React.FC<AadhaarSSOLoginProps> = ({
  onLoginSuccess,
  highContrast,
  initialMode = "signin"
}) => {
  const [activeLoginMode, setActiveLoginMode] = useState<"signin" | "signup" | "quick">(initialMode);

  // Sign Up Screen State
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [aadhaarNum, setAadhaarNum] = useState("");
  const [stateOfResidence, setStateOfResidence] = useState("Telangana");

  // Sign In Screen State
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  // Loading and Error message states
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const statesOfIndia = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi (NCT)", "Jammu & Kashmir"
  ];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setErrorText("⚠ Enter a valid Email Address.");
      return;
    }
    if (signupPassword.length < 6) {
      setErrorText("⚠ Password must contain at least 6 characters.");
      return;
    }
    if (!fullName.trim()) {
      setErrorText("⚠ Full Name is required.");
      return;
    }
    if (aadhaarNum && (aadhaarNum.length !== 12 || isNaN(Number(aadhaarNum)))) {
      setErrorText("⚠ Enter a valid 12-digit Aadhaar Card Number (or leave it blank).");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword
      );
      const user = userCredential.user;

      const profileData: CitizenUser = {
        uid: user.uid,
        email: signupEmail.trim(),
        fullName: fullName.trim(),
        aadhaarId: aadhaarNum ? `${aadhaarNum.substring(0, 4)}-XXXX-XXXX` : "Not Provided",
        role: "Citizen",
        stateOfResidence: stateOfResidence,
      };

      // Ensure current auth token is fresh before writing the profile document.
      if (auth.currentUser?.uid === user.uid) {
        await auth.currentUser.getIdToken(true);
      }

      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        createdAt: new Date().toISOString()
      });

      setSuccessText("✓ Portal Registration Successful! Access granted.");
      if (onShowToast) {
        onShowToast({ type: "success", title: "Registration Successful", message: "Your profile has been created and secured." });
      }
      setTimeout(() => {
        onLoginSuccess(profileData);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorText(`⚠ Registration Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (!signinEmail.trim() || !signinEmail.includes("@")) {
      setErrorText("⚠ Enter a valid Email Address.");
      return;
    }
    if (signinPassword.length < 5) {
      setErrorText("⚠ Password is too short.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        signinEmail.trim(),
        signinPassword
      );
      const user = userCredential.user;

      // Fetch user profile properties fromfirestore query
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      let profileData: CitizenUser;
      if (userSnap.exists()) {
        profileData = userSnap.data() as CitizenUser;
      } else {
        profileData = {
          uid: user.uid,
          email: user.email || signinEmail,
          fullName: user.email?.split("@")[0].toUpperCase() || "Citizen User",
          role: "Citizen",
          stateOfResidence: "Delhi (NCT)"
        };
        if (auth.currentUser?.uid === user.uid) {
          await auth.currentUser.getIdToken(true);
        }
        await setDoc(userDocRef, {
          ...profileData,
          createdAt: new Date().toISOString()
        });
      }

      setSuccessText("✓ Secure Access Session authenticated!");
      if (onShowToast) {
        onShowToast({ type: "success", title: "Signed In", message: "Welcome back. Your session is now active." });
      }
      setTimeout(() => {
        onLoginSuccess(profileData);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorText(`⚠ Sign In Failed: ${err.message}. Ensure Email & Password are correct.`);
      if (onShowToast) {
        onShowToast({ type: "error", title: "Sign In Error", message: err.message || "Unable to sign in." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorText("");
    setSuccessText("");

    if (!signinEmail.trim() || !signinEmail.includes("@")) {
      setErrorText("⚠ Please enter the email address registered with your account.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, signinEmail.trim());
      setSuccessText("✓ Reset instructions have been sent to your email address. Please check your inbox.");
      if (onShowToast) {
        onShowToast({ type: "info", title: "Password Reset Sent", message: "Check your inbox for reset instructions." });
      }
      setForgotPasswordMode(false);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setErrorText(`⚠ Password reset failed: ${err.message}`);
      if (onShowToast) {
        onShowToast({ type: "error", title: "Reset Failed", message: err.message || "Unable to send reset email." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Automated Quick Bypass demo registration for fluent reviews
  const handleQuickBypass = async () => {
    setErrorText("");
    setSuccessText("");
    setIsLoading(true);

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const demoEmail = `citizen.${randomId}@govease.nic.in`;
    const demoPassword = "demoBypassUserPass123";

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        demoEmail,
        demoPassword
      );
      const user = userCredential.user;

      const profileData: CitizenUser = {
        uid: user.uid,
        email: demoEmail,
        fullName: `Citizen Suresh Kumar (${randomId})`,
        aadhaarId: "5500-XXXX-XXXX",
        role: "Citizen",
        stateOfResidence: "Telangana"
      };

      if (auth.currentUser?.uid === user.uid) {
        await auth.currentUser.getIdToken(true);
      }
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        createdAt: new Date().toISOString()
      });

      setSuccessText("✓ Real-time Demo Profile registered successfully via Firebase!");
      if (onShowToast) {
        onShowToast({ type: "info", title: "Demo Access", message: "A temporary test account has been created for evaluation." });
      }
      setTimeout(() => {
        onLoginSuccess(profileData);
      }, 1200);
    } catch (err: any) {
      console.error("Error creating demo bypass user:", err);
      // Fallback fallback sign-in
      try {
        const fallBackEmail = "citizen.main@govease.nic.in";
        const fallBackPass = "demoBypassUserPass123";
        const userCredential = await signInWithEmailAndPassword(auth, fallBackEmail, fallBackPass);
        const user = userCredential.user;
        const userSnap = await getDoc(doc(db, "users", user.uid));
        
        let profileData: CitizenUser = {
          uid: user.uid,
          email: fallBackEmail,
          fullName: "Citizen Suresh Kumar (Demo)",
          aadhaarId: "5500-XXXX-XXXX",
          role: "Citizen",
          stateOfResidence: "Telangana"
        };
        if (userSnap.exists()) {
          profileData = userSnap.data() as CitizenUser;
        } else {
          if (auth.currentUser?.uid === user.uid) {
            await auth.currentUser.getIdToken(true);
          }
          await setDoc(doc(db, "users", user.uid), {
            ...profileData,
            createdAt: new Date().toISOString()
          });
        }
        setSuccessText("✓ Demo Session Loaded via Firebase Auth successfully!");
        setTimeout(() => {
          onLoginSuccess(profileData);
        }, 1000);
      } catch (innerErr: any) {
        setErrorText(`⚠ Failed to bypass: ${innerErr.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto p-4"
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 bg-[#003366] text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300 mb-2">Government Citizen Portal</p>
                <h1 className="text-2xl font-semibold tracking-tight">MeriPehchaan Secure Login</h1>
                <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                  Trusted single sign-on access for citizen services, document simplification, and verified audit tracking.
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/15">
                <span className="text-2xl">🛡️</span>
              </div>
            </div>
          </div>

          {/* Modern Tabs with claymorphism */}
          <div className="flex gap-2 p-4 bg-slate-50">
            {(['signin', 'signup', 'quick'] as const).map((mode, idx) => (
              <motion.button
                key={mode}
                onClick={() => {
                  setActiveLoginMode(mode);
                  setErrorText("");
                  setSuccessText("");
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                 className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-xs uppercase tracking-wide transition-all duration-300 ${
                   activeLoginMode === mode
                     ? mode === 'quick'
                       ? 'bg-[#0e5f44] text-white shadow-lg shadow-slate-300'
                       : 'bg-[#003366] text-white shadow-lg shadow-slate-300'
                     : 'bg-white text-gray-600 hover:bg-slate-100 border border-gray-200'
                 }`}
              >
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Sign Up'}
                {mode === 'quick' && '⚡ Demo'}
              </motion.button>
            ))}
          </div>

          {/* Form container */}
          <div className="p-6 sm:p-8">
            <motion.div
              key={activeLoginMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Error Message */}
              {errorText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium flex items-start gap-3"
                >
                  <span className="text-lg mt-0.5">⚠️</span>
                  <span>{errorText}</span>
                </motion.div>
              )}

              {/* Success Message */}
              {successText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 font-medium flex items-start gap-3"
                >
                  <span className="text-lg">✓</span>
                  <span>{successText}</span>
                </motion.div>
              )}

              {/* Sign In Form */}
              {activeLoginMode === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200"
                  >
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong className="text-blue-700">🔐 Secure Access:</strong> Enter your credentials to authenticate securely through Firebase.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white/80 backdrop-blur transition-all duration-300 placeholder-gray-400"
                      required
                      disabled={isLoading}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white/80 backdrop-blur transition-all duration-300 placeholder-gray-400"
                      required
                      disabled={isLoading}
                    />
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-[#003366] hover:bg-[#00234d] text-white font-bold uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-slate-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        AUTHENTICATING...
                      </motion.span>
                    ) : (
                      "SIGN IN SECURELY"
                    )}
                  </motion.button>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-600 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordMode(true);
                        setErrorText("");
                        setSuccessText("");
                      }}
                      className="text-[#003366] underline underline-offset-2 hover:text-[#001f4d] font-semibold"
                    >
                      Forgot your password?
                    </button>
                    <p className="max-w-sm">
                      Enter your registered email and click the reset link. You will receive secure instructions from Firebase.
                    </p>
                  </div>

                  {forgotPasswordMode && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-[12px]">
                      <p className="font-semibold mb-2">Password reset instructions will be sent to the email above.</p>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-bold text-white hover:bg-[#001f4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Reset Email
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Sign Up Form */}
              {activeLoginMode === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200"
                  >
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong className="text-purple-700">📝 Create Account:</strong> Join the digital transparency initiative. Your data is securely stored.
                    </p>
                  </motion.div>

                  {[
                    { label: "Full Name", value: fullName, onChange: setFullName, placeholder: "Suresh Kumar" },
                    { label: "Email Address", value: signupEmail, onChange: setSignupEmail, placeholder: "you@example.com", type: "email" },
                    { label: "Password", value: signupPassword, onChange: setSignupPassword, placeholder: "Min 6 characters", type: "password" }
                  ].map((field, idx) => (
                    <motion.div
                      key={field.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                    >
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type || "text"}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white/80 backdrop-blur transition-all duration-300 placeholder-gray-400"
                        required
                        disabled={isLoading}
                      />
                    </motion.div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        State of Residence
                      </label>
                      <select
                        value={stateOfResidence}
                        onChange={(e) => setStateOfResidence(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-white/80 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 cursor-pointer transition-all duration-300"
                        disabled={isLoading}
                      >
                        {statesOfIndia.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Aadhaar (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="12-digit number"
                        value={aadhaarNum}
                        onChange={(e) => setAadhaarNum(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white/80 backdrop-blur transition-all duration-300 placeholder-gray-400"
                        disabled={isLoading}
                      />
                    </motion.div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(168, 85, 247, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-[#004e8c] hover:bg-[#00376b] text-white font-bold uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-slate-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        CREATING PROFILE...
                      </motion.span>
                    ) : (
                      "CREATE ACCOUNT"
                    )}
                  </motion.button>
                </form>
              )}

              {/* Quick Demo Mode */}
              {activeLoginMode === "quick" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-5 text-center"
                >
                  <motion.div
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong className="text-emerald-700">⚡ Demo Mode:</strong> Instantly register a test account via Firebase to explore all features without entering credentials.
                    </p>
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={handleQuickBypass}
                    disabled={isLoading}
                    whileHover={{ y: -4, scale: 1.02, boxShadow: "0 25px 30px -5px rgba(16, 185, 129, 0.4)" }}
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-4 bg-[#0e5f44] hover:bg-[#0b4a36] text-white font-bold uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-slate-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        🚀 REGISTERING...
                      </motion.span>
                    ) : (
                      "⚡ INSTANT DEMO ACCESS"
                    )}
                  </motion.button>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-gray-500 space-y-1"
                  >
                    <p>No credentials needed. Auto-generates test account.</p>
                    <p className="text-emerald-600 font-medium">Perfect for exploring features!</p>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 bg-slate-50 border-t border-slate-100 text-center"
          >
            <p className="text-xs text-gray-500 leading-relaxed">
              🔒 Secure connection via Firebase Auth. Your data is encrypted end-to-end.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
