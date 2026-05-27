import React, { useState, useEffect, useRef } from "react";
import { CitizenUser, SimplifyResult, RecentTaskItem } from "./types";
import { Header } from "./components/Header";
import { AadhaarSSOLogin } from "./components/AadhaarSSOLogin";
import { HistoryLogs } from "./components/HistoryLogs";
import { HowItWorks } from "./components/HowItWorks";
import { AboutContact } from "./components/AboutContact";
import { Clipboard, Check, Download, AlertTriangle, FileText, CheckCircle2, Share2, Link, FileImage, Image as ImageIcon, Volume2, VolumeX, Clock, History, Play, Pause, Square } from "lucide-react";
import { motion } from "motion/react";

// Real client-side Firebase Auth and Firestore bindings
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, getDoc, doc, deleteDoc } from "firebase/firestore";

export default function App() {
  // Authentication session state
  const [user, setUser] = useState<CitizenUser | null>(null);

  // Portal view and personalization styling
  const [activeTab, setActiveTab] = useState("home");
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
  const [highContrast, setHighContrast] = useState(false);

  // Home input states
  const [inputTab, setInputTab] = useState<"upload-pdf" | "upload-txt" | "paste" | "upload-photo">("paste");
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedTxtFile, setSelectedTxtFile] = useState<File | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [txtContent, setTxtContent] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [photoMimeType, setPhotoMimeType] = useState("image/jpeg");

  // Share Configuration state
  const [shareConfig, setShareConfig] = useState<{
    visible: boolean;
    cardTitle: string;
    langName: string;
    content: string;
    copiedLink: boolean;
    copiedSnapshot: boolean;
  }>({
    visible: false,
    cardTitle: "",
    langName: "",
    content: "",
    copiedLink: false,
    copiedSnapshot: false,
  });

  // Options toggles
  const [includeEnglish, setIncludeEnglish] = useState(true);
  const [includeTelugu, setIncludeTelugu] = useState(true);
  const [includeHindi, setIncludeHindi] = useState(true);

  // Process indicators
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState("");
  const [result, setResult] = useState<SimplifyResult | null>(null);
  
  // Track copy-to-clipboard success per column
  const [copiedCol, setCopiedCol] = useState<"en" | "te" | "hi" | null>(null);

  // Recent History & Speech Synthesis state
  const [recentHistory, setRecentHistory] = useState<RecentTaskItem[]>([]);
  const [speechRate, setSpeechRate] = useState<number>(1.0); // Playback speed selector (0.5x, 1.0x, 1.5x)
  const [speakingCol, setSpeakingCol] = useState<"en" | "te" | "hi" | null>(null);
  const [speechState, setSpeechState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [speechChunks, setSpeechChunks] = useState<string[]>([]);

  // Web Speech queue tracking refs to bypass the 15-second Chrome TTS timeout and closure capture traps
  const speechQueueRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const speakingColRef = useRef<"en" | "te" | "hi" | null>(null);

  // Custom high-fidelity PDF print confirmation layout state
  const [printConfirm, setPrintConfirm] = useState<{
    visible: boolean;
    langName: string;
    originalType: string;
    text: string;
    reviewed: boolean;
    agreement: boolean;
  }>({
    visible: false,
    langName: "",
    originalType: "",
    text: "",
    reviewed: false,
    agreement: false
  });

  // Auth Modal trigger overlay state
  const [authModal, setAuthModal] = useState<{
    visible: boolean;
    defaultMode: "signin" | "signup" | "quick";
  }>({
    visible: false,
    defaultMode: "signin",
  });

  // Standard official document presets for rapid evaluation
  const presets = [
    {
      label: "Andhra Pradesh Land Seeding (G.O.Ms.No. 421) - [VALID]",
      text: `GOVERNMENT OF ANDHRA PRADESH\nREVENUE (LAND SECTIONS) DEPARTMENT\nG.O.Ms.No. 421 Dated: 12-05-2026\n\nSUBJECT: Land Administration - Mandatory Seeding of Aadhaar with Webland Pattadar Passbooks for online mutation approvals - Directives Issued.\n\nNow therefore, in exercise of the powers conferred by Section 12-A of the Land Rights Act 2023, the Governor of Andhra Pradesh hereby regulates and alerts all Tehsildars and Revenue Divisional Officers (RDOs) that henceforth, no online mutation or division application for agricultural patta passbooks will be authorized unless the Pattadar's 12-digit Aadhaar unique identifier number is securely linked and seed validated. All pending mutations must complete this e-KYC query within forty-five (45) business days of this circular publication. Non-compliance will automatically trigger query suspension.`
    },
    {
      label: "Ministry of Finance GST Relief (No. 12/2026) - [VALID]",
      text: `GOVERNMENT OF INDIA\nMINISTRY OF FINANCE (DEPARTMENT OF REVENUE)\nCENTRAL BOARD OF INDIRECT TAXES AND CUSTOMS\nNotification No. 12/2026-GST Dated: 04-03-2026\n\nIn exercise of the powers conferred by sub-section (1) of section 11 of the Central Goods and Services Tax Act, 2017 (12 of 2017), the Central Government, on being satisfied that it is necessary in the public interest so to do, on the recommendations of the Goods and Services Tax Council, hereby exempts all regional agricultural micro-irrigation equipment assemblies from custom excise levies. This includes drip chambers, online drippers, and lateral valves exceeding 16mm in diameter when imported or sold directly to certified smallholders possessing active Kisan Credit Cards (KCC). This notification shall come into physical administrative force starting June 1st, 2026.`
    },
    {
      label: "Hyderabadi Mutton Biryani Culinary Directive - [INVALID]",
      text: `AUTHENTIC HYDERABADI MUTTON BIRYANI CULINARY DIRECTIVE\nChef de Cuisine Culinary Guidelines\nRef: BIRYANI-KITCHEN-501\n\nIngredients for standard culinary execution include deep-fried brown onions (Birista), 1kg aged fragrant Basmati long-grain rice, 1kg tender goat meat shoulder-cuts, fresh handpicked garden mint leaves, full-fat creamy hung yogurt, high-grade organic Kashmiri red chili spice, and premium Kashmiri saffron filaments dissolved in lukewarm cow milk.\n\nInstructions: First marinate the mutton with the spices, ginger paste, and curds, letting it tenderize for 4 hours. Boil the basmati rice with whole cardamoms and cloves to exactly 70% level. Place raw parboiled rice on the raw marinated mutton in a heavy copper handi pot. Seal the rim with visual wheat dough paste (Dum style) and place on low heating coals for exactly forty-five minutes. serve hot with raita salad.`
    }
  ];

  // Fetch user's individual historical actions from Cloud Firestore securely
  const fetchUserHistoryFromFirestore = async (userId: string) => {
    try {
      const q = query(
        collection(db, "history"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const items: RecentTaskItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          timestamp: data.timestamp,
          fileName: data.fileName,
          detectedType: data.detectedType,
          result: data.result
        });
      });
      // Sort in-memory by sorting criteria: timestamp descending
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const limitedItems = items.slice(0, 10);
      setRecentHistory(limitedItems);
      localStorage.setItem("docuease_recent_history", JSON.stringify(limitedItems));
    } catch (error) {
      console.error("Error retrieving synced histories from Firestore:", error);
    }
  };

  // Method to clear user's historical records from Cloud Firestore securely
  const clearUserHistoryFromFirestore = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, "history"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];
      querySnapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, "history", docSnap.id)));
      });
      await Promise.all(deletePromises);
      console.log("Firestore history records successfully deleted.");
    } catch (error) {
      console.error("Error clearing synced histories from Firestore:", error);
    }
  };

  // Try to load user session on mount & check for shared link
  useEffect(() => {
    // 1. Check for shared link in query param
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get("share");
    if (shareParam) {
      try {
        const decodedString = decodeURIComponent(escape(atob(shareParam)));
        const decodedResult = JSON.parse(decodedString);
        setResult(decodedResult);
        
        // Auto sign-in as Viewer if no session exists to avoid login roadblock
        const guestUser: CitizenUser = {
          email: "share-viewer@nic.in",
          fullName: "Public Document Viewer",
          role: "Public Citizen",
          stateOfResidence: "National Digital Portal"
        };
        setUser(guestUser);
        setActiveTab("home");
      } catch (err) {
        console.error("Failed to decode shared document from URL:", err);
      }
    }

    // 2. Real-time Firebase Authentication State Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Query profile details from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as CitizenUser;
            setUser(userData);
            localStorage.setItem("govease_citizen", JSON.stringify(userData));
            fetchUserHistoryFromFirestore(firebaseUser.uid);
          } else {
            // Profile entry may not be created yet (Sign-up handle creates it first, but fallback just in case)
            const fallbackProfile: CitizenUser = {
              email: firebaseUser.email || "citizen@govease.nic.in",
              fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Citizen User",
              role: "Citizen",
              stateOfResidence: "Delhi (NCT)"
            };
            setUser(fallbackProfile);
            localStorage.setItem("govease_citizen", JSON.stringify(fallbackProfile));
          }
        } catch (err) {
          console.error("Failed to fetch user profile row from Firestore:", err);
        }
      } else {
        // No authenticated session active
        if (!shareParam) {
          setUser(null);
          localStorage.removeItem("govease_citizen");
          setRecentHistory([]);
        }
      }
    });

    // Cleanup active SpeechSynthesis if any
    return () => {
      unsubscribe();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleLogin = (newUser: CitizenUser) => {
    setUser(newUser);
    localStorage.setItem("govease_citizen", JSON.stringify(newUser));
    if (auth.currentUser) {
      fetchUserHistoryFromFirestore(auth.currentUser.uid);
    }
  };

  const handleLogout = async () => {
    handleStopSpeech();
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Signout failed:", err);
    }
    setUser(null);
    localStorage.removeItem("govease_citizen");
    setRecentHistory([]);
    setResult(null);
  };

  // Convert PDF files to base64 for Gemini ingestion
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select official .pdf files only.");
        return;
      }
      setSelectedPdfFile(file);
      setProcessError("");
      
      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result as string;
        // Strip data:application/pdf;base64, header prefix!
        const base64Str = raw.split(",")[1];
        setPdfBase64(base64Str);
      };
      reader.onerror = () => {
        setProcessError("Could not parse file bytes.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert TxT files to string
  const handleTxtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/plain") {
        alert("Please select .txt files only.");
        return;
      }
      setSelectedTxtFile(file);
      setProcessError("");

      const reader = new FileReader();
      reader.onload = () => {
        setTxtContent(reader.result as string);
      };
      reader.onerror = () => {
        setProcessError("Could not read text file.");
      };
      reader.readAsText(file);
    }
  };

  // Convert Photocopy image files to base64
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select official image/photo files (.png, .jpg, .jpeg, .webp) only.");
        return;
      }
      setSelectedPhotoFile(file);
      setPhotoMimeType(file.type);
      setProcessError("");

      const reader = new FileReader();
      reader.onload = () => {
        const raw = reader.result as string;
        // Strip data:image/...;base64, header prefix!
        const base64Str = raw.split(",")[1];
        setPhotoBase64(base64Str);
      };
      reader.onerror = () => {
        setProcessError("Could not read image file bytes.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimplifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModal({ visible: true, defaultMode: "signin" });
      return;
    }

    setProcessError("");
    setResult(null);

    let docText = "";
    let dataPayload: any = {
      userEmail: user.email,
      fileName: ""
    };

    if (inputTab === "paste") {
      if (!pastedText.trim()) {
        setProcessError("Please enter or paste legal document clauses first.");
        return;
      }
      docText = pastedText;
      dataPayload.documentText = docText;
      dataPayload.fileName = "Direct Input (" + docText.substring(0, 30) + "...)";
      dataPayload.fileType = "text";
    } else if (inputTab === "upload-txt") {
      if (!selectedTxtFile || !txtContent) {
        setProcessError("Please select a valid .txt document containing clauses.");
        return;
      }
      docText = txtContent;
      dataPayload.documentText = docText;
      dataPayload.fileName = selectedTxtFile.name;
      dataPayload.fileType = "txt";
    } else if (inputTab === "upload-pdf") {
      if (!selectedPdfFile || !pdfBase64) {
        setProcessError("Please select a valid .pdf document.");
        return;
      }
      dataPayload.fileBase64 = pdfBase64;
      dataPayload.fileName = selectedPdfFile.name;
      dataPayload.fileType = "pdf";
    } else if (inputTab === "upload-photo") {
      if (!selectedPhotoFile || !photoBase64) {
        setProcessError("Please select a valid photocopy image file.");
        return;
      }
      dataPayload.fileBase64 = photoBase64;
      dataPayload.fileName = selectedPhotoFile.name;
      dataPayload.fileType = photoMimeType;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Central translation router returned a critical error.");
      }

      const resJson = await response.json();
      if (resJson.status === "success" && resJson.data) {
        setResult(resJson.data);

        // Add to recent history if the document is successfully verified as government-related
        if (resJson.data.isGovernmentRelated) {
          const newTask: RecentTaskItem = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + ", " + new Date().toLocaleDateString("en-IN"),
            fileName: dataPayload.fileName || "Direct Input Document",
            detectedType: resJson.data.detectedType,
            result: resJson.data
          };

          // If a real Firebase user session is active, save this directly to Firestore!
          if (auth.currentUser) {
            try {
              const historyCollection = collection(db, "history");
              await addDoc(historyCollection, {
                userId: auth.currentUser.uid,
                timestamp: newTask.timestamp,
                fileName: newTask.fileName,
                detectedType: newTask.detectedType,
                isGovernmentRelated: resJson.data.isGovernmentRelated,
                result: resJson.data,
                createdAt: new Date().toISOString()
              });
              // Fetch updated list of histories from Firestore to synchronize
              fetchUserHistoryFromFirestore(auth.currentUser.uid);
            } catch (fsErr) {
              console.error("Firestore history logging failed:", fsErr);
            }
          } else {
            // Local fallback logic
            setRecentHistory(prev => {
              const filtered = prev.filter(item => item.fileName !== newTask.fileName);
              const updated = [newTask, ...filtered].slice(0, 5);
              localStorage.setItem("docuease_recent_history", JSON.stringify(updated));
              return updated;
            });
          }
        }
      } else {
        throw new Error(resJson.message || "Failed to process text properly.");
      }
    } catch (err: any) {
      console.error(err);
      setProcessError(err.message || "Failed to complete simplification.");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectPreset = (text: string) => {
    setPastedText(text);
    setInputTab("paste");
    setProcessError("");
  };

  const splitIntoSpeakingChunks = (text: string, lang: "en" | "te" | "hi"): string[] => {
    // Clean text by replacing bullets, dashes, markup to ensure flawless narration flow
    let cleanText = text
      .replace(/[*#`_\-–—]/g, " ")   // Remove markdown bold symbols, headings, and dashes
      .replace(/\[.*?\]/g, "")       // Strip square brackets
      .replace(/\s+/g, " ")          // Normalize white space
      .trim();

    // Split text into readable chunks by standard punctuation, Devanagari sentences (। = \u0964, ॥ = \u0965) or newline
    // This allows perfect structure-based segmentation of Hindi and Telugu scripts.
    const rawChunks = cleanText.split(/(?<=[.!?।॥\n])\s+/);
    const finalChunks: string[] = [];

    for (let chunk of rawChunks) {
      chunk = chunk.trim();
      if (!chunk) continue;

      // Divide ultra-long paragraphs at commas or semicolons to keep speech queues brief, bypassing Chrome constraints
      if (chunk.length > 160) {
        const subChunks = chunk.split(/(?<=[,;])\s+/);
        for (let sub of subChunks) {
          sub = sub.trim();
          if (sub) {
            if (sub.length > 160) {
              const words = sub.split(" ");
              let currentSub = "";
              for (const word of words) {
                if ((currentSub + " " + word).length > 160) {
                  finalChunks.push(currentSub.trim());
                  currentSub = word;
                } else {
                  currentSub += (currentSub ? " " : "") + word;
                }
              }
              if (currentSub.trim()) {
                finalChunks.push(currentSub.trim());
              }
            } else {
              finalChunks.push(sub);
            }
          }
        }
      } else {
        finalChunks.push(chunk);
      }
    }

    return finalChunks.filter(c => c.length > 0);
  };

  const startSpeakingQueue = (text: string, col: "en" | "te" | "hi") => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const chunks = splitIntoSpeakingChunks(text, col);
    setSpeechChunks(chunks);
    setCurrentChunkIndex(0);

    speechQueueRef.current = chunks;
    currentChunkIndexRef.current = 0;
    speakingColRef.current = col;
    setSpeakingCol(col);
    setSpeechState("playing");

    speakNextChunk();
  };

  const speakNextChunk = () => {
    if (!("speechSynthesis" in window)) return;

    if (currentChunkIndexRef.current >= speechQueueRef.current.length || speakingColRef.current === null) {
      handleStopSpeech();
      return;
    }

    const col = speakingColRef.current;
    const chunkText = speechQueueRef.current[currentChunkIndexRef.current];

    // Synergize the React state with the ref so the UI lights up instantly
    setCurrentChunkIndex(currentChunkIndexRef.current);

    if (!chunkText || chunkText.trim().length === 0) {
      currentChunkIndexRef.current += 1;
      speakNextChunk();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.rate = speechRate;
    
    // Explicitly configure correct ISO sub-tags for speech engines
    if (col === "en") {
      utterance.lang = "en-IN";
    } else if (col === "te") {
      utterance.lang = "te-IN";
    } else if (col === "hi") {
      utterance.lang = "hi-IN";
    }

    // Attempt to lock on to local regional language voice assets
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = null;
    if (col === "te") {
      bestVoice = voices.find(v => v.lang.toLowerCase().startsWith("te") || v.name.toLowerCase().includes("telugu") || v.lang.toLowerCase().includes("te-"));
    } else if (col === "hi") {
      bestVoice = voices.find(v => v.lang.toLowerCase().startsWith("hi") || v.name.toLowerCase().includes("hindi") || v.lang.toLowerCase().includes("hi-"));
    } else {
      bestVoice = voices.find(v => v.lang.toLowerCase().startsWith("en-in") || v.lang.toLowerCase().startsWith("en_in")) || voices.find(v => v.lang.toLowerCase().startsWith("en"));
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => {
      if (speakingColRef.current === col) {
        currentChunkIndexRef.current += 1;
        speakNextChunk();
      }
    };

    utterance.onerror = (e) => {
      console.warn("TTS token stream skipped a fragment:", e);
      if (speakingColRef.current === col) {
        currentChunkIndexRef.current += 1;
        speakNextChunk();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    currentChunkIndexRef.current = 0;
    speakingColRef.current = null;
    setSpeakingCol(null);
    setSpeechState("stopped");
    setSpeechChunks([]);
    setCurrentChunkIndex(0);
  };

  const handlePauseResumeSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (speechState === "playing") {
      window.speechSynthesis.pause();
      setSpeechState("paused");
    } else if (speechState === "paused") {
      window.speechSynthesis.resume();
      setSpeechState("playing");
    }
  };

  const handleListen = (text: string, col: "en" | "te" | "hi") => {
    if (!("speechSynthesis" in window)) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }

    if (speakingCol === col) {
      handlePauseResumeSpeech();
    } else {
      startSpeakingQueue(text, col);
    }
  };

  const renderHighlightedText = (text: string, col: "en" | "te" | "hi") => {
    if (speakingCol !== col || speechChunks.length === 0) {
      return <span>{text}</span>;
    }
    return (
      <span className="leading-relaxed transition-all duration-150">
        {speechChunks.map((chunk, index) => {
          const isCurrent = index === currentChunkIndex;
          return (
            <span
              key={index}
              className={
                isCurrent
                  ? "bg-amber-100 dark:bg-amber-200/40 text-[#003366] font-bold px-1.5 py-0.5 rounded border border-amber-300 shadow-sm inline transition-all duration-200 animate-pulse"
                  : "text-slate-700 dark:text-slate-350 transition-all duration-150 inline"
              }
            >
              {chunk}{" "}
            </span>
          );
        })}
      </span>
    );
  };

  const loadHistoryItem = (item: RecentTaskItem) => {
    handleStopSpeech();
    setResult(item.result);
    setIncludeEnglish(!!item.result.simplifiedEnglish);
    setIncludeTelugu(!!item.result.teluguTranslation);
    setIncludeHindi(!!item.result.hindiTranslation);
    setProcessError("");

    setTimeout(() => {
      const el = document.getElementById("results-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const triggerPrintConfirmation = (langName: string, originalType: string, text: string) => {
    setPrintConfirm({
      visible: true,
      langName,
      originalType,
      text,
      reviewed: false,
      agreement: false
    });
  };

  const executePrint = () => {
    setPrintConfirm(prev => ({ ...prev, visible: false }));
    printOfficialDocument(printConfirm.langName, printConfirm.originalType, printConfirm.text);
  };

  const copyToClipboard = (text: string, col: "en" | "te" | "hi") => {
    navigator.clipboard.writeText(text);
    setCopiedCol(col);
    setTimeout(() => setCopiedCol(null), 2500);
  };

  const generateShareLink = () => {
    if (!result) return "";
    const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(result))));
    return `${window.location.origin}${window.location.pathname}?share=${serialized}`;
  };

  const generateSnapshotText = (lang: string, content: string) => {
    return `--------------------------------------------------
🏛️ GOVSIMPLIFY (DOCUEASE) CITIZEN RELEASE 🏛️
--------------------------------------------------
Detected Document Class: ${result?.detectedType || "Government Document"}
Output Language: ${lang}
Verified Log Audit: ACTIVE

--- START SIMPLIFIED TEXT ---
${content}
--- END SIMPLIFIED TEXT ---

Simplified via DocuEase NLP translation services.
Direct Verification Link:
${generateShareLink()}
--------------------------------------------------`;
  };

  const triggerShareCard = (langName: string, content: string) => {
    setShareConfig({
      visible: true,
      cardTitle: result?.detectedType || "Government Document",
      langName,
      content,
      copiedLink: false,
      copiedSnapshot: false,
    });
  };

  const copyShareLinkToClipboard = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    setShareConfig(prev => ({ ...prev, copiedLink: true }));
    setTimeout(() => {
      setShareConfig(prev => ({ ...prev, copiedLink: false }));
    }, 2000);
  };

  const copySnapshotToClipboard = () => {
    const snapshot = generateSnapshotText(shareConfig.langName, shareConfig.content);
    navigator.clipboard.writeText(snapshot);
    setShareConfig(prev => ({ ...prev, copiedSnapshot: true }));
    setTimeout(() => {
      setShareConfig(prev => ({ ...prev, copiedSnapshot: false }));
    }, 2000);
  };

  const downloadTextFile = (title: string, content: string) => {
    const preface = `--------------------------------------------------\nDocuEase - Official Translation Release\nTitle: ${title}\nAudit ID reference log registered under citizen: ${user?.email || "anonymous"}\nDate: ${new Date().toLocaleString()}\n--------------------------------------------------\n\n`;
    const blob = new Blob([preface + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DocuEase_${title.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Launch browser printing engine to save beautiful vector high-fidelity PDF 
  const printOfficialDocument = (langName: string, originalType: string, text: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Failed to build printable page. Disable pop-up blocking software.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DocuEase Certificate - ${langName}</title>
        <style>
          body {
            font-family: 'Noto Sans', 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            color: #212529;
            line-height: 1.6;
            background: #fff;
          }
          .card {
            border: 4px double #003366;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
          }
          .emb-strip {
            height: 6px;
            background: linear-gradient(to right, #FF9933 33.3%, #fff 33.3%, #fff 66.6%, #138808 66.6%);
            background-size: 100% 100%;
            border-bottom: 1px solid #ddd;
            margin-bottom: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #003366;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            font-size: 24px;
            color: #003366;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header p {
            font-size: 11px;
            color: #555;
            margin: 0;
            text-transform: uppercase;
            font-weight: bold;
          }
          .meta {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            margin-bottom: 25px;
            font-size: 11px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .content-title {
            font-size: 14px;
            font-weight: bold;
            color: #FF6600;
            text-transform: uppercase;
            margin-top: 0;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .main-text {
            font-size: 13px;
            white-space: pre-wrap;
            color: #000;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
            font-size: 10px;
            color: #777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="emb-strip"></div>
          <div class="header">
            <h1>DocuEase Platform</h1>
            <p>National Informatics Centre style Simplified Release • भारत सरकार</p>
          </div>
          
          <div class="meta">
            <div><strong>Classification Class:</strong> ${originalType}</div>
            <div><strong>Language Translation:</strong> ${langName}</div>
            <div><strong>Citizen Auditor:</strong> ${user?.email || "anonymous"}</div>
            <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
          </div>

          <h3 class="content-title">Official Simplified Text Output:</h3>
          <div class="main-text">${text}</div>

          <div class="footer">
            Digital India Initiative • Certified digitally via DocuEase NLP translation services.<br>
            © 2024 DocuEase Portal. All rights reserved. Code NIC-Audit-OK.
          </div>
        </div>
        <script>
          window.focus();
          setTimeout(function() {
            window.print();
          }, 400);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        highContrast ? "bg-black text-white" : "bg-slate-50 text-slate-800"
      }`}
      style={{ fontSize: `${fontSizeMultiplier}rem` }}
    >
      <Header
        user={user}
        onLogout={handleLogout}
        onSignInClick={() => setAuthModal({ visible: true, defaultMode: "signin" })}
        onSignUpClick={() => setAuthModal({ visible: true, defaultMode: "signup" })}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fontSizeMultiplier={fontSizeMultiplier}
        setFontSizeMultiplier={setFontSizeMultiplier}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
      />

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Workspace Wrapper */}
        <div className="space-y-8 animate-fade-in">
            
            {/* Tab: HOME (DocuEase Main AI Processing Room) */}
            {activeTab === "home" && (
              <div className="space-y-8 grid grid-cols-1 select-none">
                
                {/* Citizen Welcomer Banner Strip */}
                <div className={`p-4 bg-white border-l-4 ${user ? "border-l-[#003366]" : "border-l-amber-500"} border-y border-r border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
                  {user ? (
                    <div>
                      <h2 className="text-sm font-extrabold text-[#003366] uppercase tracking-wider">
                        Empathetic AI Workspace Active
                      </h2>
                      <p className="text-xs text-slate-500">
                        Logged in: <strong>{user.fullName}</strong> ({user.role}). Audit logging for {user.stateOfResidence} state division is enabled.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-sm font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="inline-block w-2 STATE_ONLINE_NODE h-2 rounded-full bg-amber-500 mr-1 animate-pulse"></span>
                        Secure Workspace (Guest Mode)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Please <button type="button" onClick={() => setAuthModal({ visible: true, defaultMode: "signin" })} className="text-[#003366] hover:underline font-bold cursor-pointer">Sign In</button> or <button type="button" onClick={() => setAuthModal({ visible: true, defaultMode: "signup" })} className="text-[#FF6600] hover:underline font-bold cursor-pointer">Sign Up</button> to simplify documents and preserve secure translation history metrics.
                      </p>
                    </div>
                  )}
                  {/* Presets Button Links */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Evaluation Presets:</span>
                    {presets.map((pr, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectPreset(pr.text)}
                        className="px-2 py-1 bg-slate-100 hover:bg-[#FF6600] text-slate-700 hover:text-white border border-slate-300 text-[10px] uppercase font-bold cursor-pointer"
                        title={pr.label}
                      >
                        {idx + 1 === 1 ? "Land Seeding (GO)" : idx + 1 === 2 ? "GST Relief" : "Biryani (Invalid)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Upload Panel */}
                <div className="bg-white border border-slate-300">
                  <div className={`p-4 ${highContrast ? "bg-black" : "bg-slate-50"} border-b border-slate-200`}>
                    <h3 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">
                      Upload or Paste Government Document
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                      Accepts scanned/legal PDFs, Text files or raw regulatory legal codes
                    </p>
                  </div>

                  {/* Sub Input Tab Controller */}
                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => setInputTab("paste")}
                      className={`py-2 px-6 text-xs font-bold uppercase cursor-pointer ${
                        inputTab === "paste"
                          ? "bg-white text-[#003366] border-b-2 border-[#003366]"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Paste Code / Text
                    </button>
                    <button
                      onClick={() => setInputTab("upload-pdf")}
                      className={`py-2 px-6 text-xs font-bold uppercase cursor-pointer ${
                        inputTab === "upload-pdf"
                          ? "bg-white text-[#003366] border-b-2 border-[#003366]"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Upload PDF (.pdf only)
                    </button>
                    <button
                      onClick={() => setInputTab("upload-txt")}
                      className={`py-2 px-6 text-xs font-bold uppercase cursor-pointer ${
                        inputTab === "upload-txt"
                          ? "bg-white text-[#003366] border-b-2 border-[#003366]"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Upload Text File (.txt)
                    </button>
                    <button
                      onClick={() => setInputTab("upload-photo")}
                      className={`py-2 px-6 text-xs font-bold uppercase cursor-pointer ${
                        inputTab === "upload-photo"
                          ? "bg-white text-[#003366] border-b-2 border-[#003366]"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Photo Copy (Image)
                    </button>
                  </div>

                  <form onSubmit={handleSimplifySubmit} className="p-6 space-y-6">
                    {/* Content Input Fields */}
                    {inputTab === "paste" && (
                      <motion.div
                        key="paste"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="space-y-1.5 animate-none"
                      >
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Paste Regulatory Text Content Below *
                        </label>
                        <textarea
                          rows={12}
                          placeholder="Paste G.O.Ms.No, regulatory gazettes, notifications, bills or circular details here..."
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          className="w-full p-4 text-xs font-mono border border-slate-300 focus:outline-none focus:border-[#003366] bg-slate-50 rounded"
                        ></textarea>
                      </motion.div>
                    )}

                    {inputTab === "upload-pdf" && (
                      <motion.div
                        key="upload-pdf"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="border-2 border-dashed border-slate-300 p-8 rounded text-center bg-slate-50 hover:bg-slate-100 transition-all block"
                      >
                        <input
                          id="pdf-picker"
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfChange}
                          className="hidden"
                        />
                        <label htmlFor="pdf-picker" className="cursor-pointer space-y-2.5 block">
                          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                          <div>
                            <span className="px-3 py-1.5 bg-[#003366] text-white text-xs font-bold uppercase tracking-wider">
                              Select PDF Document
                            </span>
                          </div>
                          {selectedPdfFile ? (
                            <p className="text-xs text-emerald-700 font-bold mt-2">
                              ✓ Selected: {selectedPdfFile.name} ({(selectedPdfFile.size / 1024).toFixed(1)} KB)
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-2">
                              Accepts official Government PDFs only • System reads both text and images dynamically
                            </p>
                          )}
                        </label>
                      </motion.div>
                    )}

                    {inputTab === "upload-txt" && (
                      <motion.div
                        key="upload-txt"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="border-2 border-dashed border-slate-300 p-8 rounded text-center bg-slate-50 hover:bg-slate-100 transition-all block"
                      >
                        <input
                          id="txt-picker"
                          type="file"
                          accept=".txt"
                          onChange={handleTxtChange}
                          className="hidden"
                        />
                        <label htmlFor="txt-picker" className="cursor-pointer space-y-2.5 block">
                          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                          <div>
                            <span className="px-3 py-1.5 bg-[#003366] text-white text-xs font-bold uppercase tracking-wider">
                              Select Text Document
                            </span>
                          </div>
                          {selectedTxtFile ? (
                            <p className="text-xs text-emerald-700 font-bold mt-2">
                              ✓ Selected: {selectedTxtFile.name} ({(selectedTxtFile.size / 1024).toFixed(1)} KB)
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-2">
                              Accepts .txt format containing administrative directives
                            </p>
                          )}
                        </label>
                      </motion.div>
                    )}

                    {inputTab === "upload-photo" && (
                      <motion.div
                        key="upload-photo"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="border-2 border-dashed border-slate-300 p-8 rounded text-center bg-slate-50 hover:bg-slate-100 transition-all block"
                      >
                        <input
                          id="photo-picker"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <label htmlFor="photo-picker" className="cursor-pointer space-y-2.5 block">
                          <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
                          <div>
                            <span className="px-3 py-1.5 bg-[#003366] text-white text-xs font-bold uppercase tracking-wider">
                              Select Photo Copy / Image
                            </span>
                          </div>
                          {selectedPhotoFile ? (
                            <div className="space-y-4">
                              <p className="text-xs text-emerald-700 font-bold mt-2">
                                ✓ Selected: {selectedPhotoFile.name} ({(selectedPhotoFile.size / 1024).toFixed(1)} KB)
                              </p>
                              {photoBase64 && (
                                <div className="mt-2 border border-slate-250 p-2 bg-white inline-block rounded shadow-sm">
                                  <img
                                    src={`data:${photoMimeType};base64,${photoBase64}`}
                                    alt="Selected Photocopy Document"
                                    className="max-h-48 mx-auto object-contain rounded"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-2">
                              Accepts JPG, JPEG, PNG, WEBP files • Performs native AI OCR to parse regulatory layouts from photos
                            </p>
                          )}
                        </label>
                      </motion.div>
                    )}

                    {/* Regional Languages checkboxes */}
                    <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded">
                      <span className="block text-xs font-bold text-[#003366] uppercase tracking-wider mb-1">
                        Select Requested Simplification & Secondary Dialects:
                      </span>
                      <div className="flex flex-wrap gap-6 text-xs">
                        <label className="flex items-center gap-2 select-none font-bold">
                          <input
                            type="checkbox"
                            checked={includeEnglish}
                            onChange={(e) => setIncludeEnglish(e.target.checked)}
                            className="w-4 h-4 accent-[#FF6600]"
                          />
                          Simplified Legal English
                        </label>
                        <label className="flex items-center gap-2 select-none font-bold">
                          <input
                            type="checkbox"
                            checked={includeTelugu}
                            onChange={(e) => setIncludeTelugu(e.target.checked)}
                            className="w-4 h-4 accent-[#FF6600]"
                          />
                          Telugu Translation (తెలుగు)
                        </label>
                        <label className="flex items-center gap-2 select-none font-bold">
                          <input
                            type="checkbox"
                            checked={includeHindi}
                            onChange={(e) => setIncludeHindi(e.target.checked)}
                            className="w-4 h-4 accent-[#FF6600]"
                          />
                          Hindi Translation (हिंदी)
                        </label>
                      </div>
                    </div>

                    {/* Warning text */}
                    <div className="text-[11px] text-slate-500 leading-normal flex items-start gap-2 bg-slate-50 p-3 border-l-4 border-l-amber-600 rounded">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>NIC Advisory Note and Legal Mandate:</strong> Only official Indian central/state/municipal government documents are authorized. Content containing cooking recipes, general messages, or commercial advertisements will fail classification logic and be flagged in historical audits.
                      </div>
                    </div>

                    {/* Process error displays */}
                    {processError && (
                      <div className="p-3 bg-red-50 border-l-4 border-l-red-650 text-xs text-red-700 font-bold leading-normal">
                        {processError}
                      </div>
                    )}

                    {/* Saffron Action Button & Spinner */}
                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 bg-[#FF6600] hover:bg-[#e65c00] text-white text-xs font-extrabold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isProcessing ? "INITIALIZING SECURE TRANSLATOR..." : "SIMPLIFY & TRANSLATE DIRECTIVE"}
                      </button>

                      {isProcessing && (
                        <div className="w-full p-4 border border-[#FF6600] bg-amber-50 rounded flex flex-col items-center justify-center text-center space-y-2 select-none">
                          <div className="w-6 h-6 border-3 border-[#003366] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold text-[#003366] uppercase animate-pulse">
                            Processing your document...
                          </span>
                          <span className="text-[10px] text-slate-500">
                            The secure Gemini NLP engine is analyzing context, stripping complex legal clauses, and generating accurate regional translations. Wait for up to 15 seconds.
                          </span>
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* Recent History Section */}
                {recentHistory.length > 0 && (
                  <div className="bg-white border border-slate-300 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-[#003366] shrink-0" />
                        <div>
                          <h3 className="text-xs font-extrabold uppercase text-[#003366] tracking-wider">
                            Recent Simplification History
                          </h3>
                          <p className="text-[10px] text-slate-500 uppercase">
                            Instantly reload translations from your last 5 local sessions
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to clear your simplification history from both your local view and the cloud database?")) {
                            if (auth.currentUser) {
                              await clearUserHistoryFromFirestore();
                            }
                            localStorage.removeItem("docuease_recent_history");
                            setRecentHistory([]);
                          }
                        }}
                        className="text-[10px] text-rose-700 hover:underline uppercase font-bold tracking-tight cursor-pointer"
                      >
                        [ Clear History ]
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      {recentHistory.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => loadHistoryItem(item)}
                          className="group text-left border border-slate-200 hover:border-[#FF6600] p-3 rounded bg-slate-50 hover:bg-white transition-all cursor-pointer flex flex-col justify-between space-y-3 relative hover:shadow-md"
                        >
                          <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {item.timestamp.split(", ")[0]}
                              </span>
                              <span className="text-[8px] bg-[#003366] text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                {item.result.detectedType ? item.result.detectedType.split(" ")[0] : "GOVT"}
                              </span>
                            </div>
                            <h4 className="text-[11px] font-extrabold text-[#003366] group-hover:text-[#FF6600] line-clamp-2 uppercase tracking-tight mt-1 leading-snug">
                              {item.fileName}
                            </h4>
                          </div>
                          
                          <div className="w-full border-t border-slate-100 pt-1.5 flex justify-between items-center text-[8px] font-bold text-slate-500">
                            <span className="text-emerald-700 uppercase flex items-center gap-1">
                              ✓ {Object.keys(item.result).filter(k => k.endsWith("Translation") || k.includes("English")).filter(k => !!(item.result as any)[k]).length} Langs
                            </span>
                            <span className="text-[#FF6600] uppercase font-extrabold group-hover:translate-x-1 transition-transform inline-block">
                              Load →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Page 2: RESULTS SECTION (rendered below inputs on successful processing) */}
                {result && (
                  <div id="results-section" className="space-y-6">
                    {result.isGovernmentRelated ? (
                      <>
                        {/* 1. Green success banner */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded flex items-center gap-3 select-none"
                        >
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                          <div>
                            <h4 className="text-sm font-extrabold text-emerald-950 uppercase tracking-tight">
                              Document successfully simplified.
                            </h4>
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              Central logs updated. Transcripts are audit-ready and verified.
                            </p>
                          </div>
                        </motion.div>

                        {/* 2. Detected Document Category */}
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="p-3 bg-[#003366] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-sm"
                        >
                          <span>Detected: {result.detectedType} ✓</span>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-600 rounded text-white tracking-widest font-bold">
                            VERIFIED OFFICIAL
                          </span>
                        </motion.div>

                        {/* 3. Three-column grid layout with staggered slide-up animation */}
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                          
                          {/* Card 1: Simplified English */}
                          {includeEnglish && (
                            <div className="bg-white border-t-4 border-t-[#003366] border-x border-b border-rose-300 flex flex-col min-h-[380px]">
                              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center bg-slate-100 select-none">
                                <span className="text-xs font-extrabold text-[#003366] uppercase tracking-wider">
                                  Simplified English Breakdown
                                </span>
                                <span className="text-[10px] text-slate-505 font-bold uppercase">English</span>
                              </div>
                              <div className="p-4 flex-grow text-xs leading-relaxed overflow-y-auto whitespace-pre-wrap text-slate-700 select-text">
                                {renderHighlightedText(result.simplifiedEnglish, "en")}
                              </div>
                              
                              {/* Voice highlight and animated tracking bar for immersive reading assistance */}
                              {speakingCol === "en" && speechChunks.length > 0 && (
                                <div className="mx-3 my-2 p-3 bg-amber-50 border-l-4 border-l-amber-600 border border-amber-200 rounded select-none animate-fade-in shrink-0">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-amber-800 uppercase tracking-tight mb-1.5">
                                    <span className="flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                                      Narration Progress
                                    </span>
                                    <span>
                                      Segment {currentChunkIndex + 1} of {speechChunks.length} ({Math.round(((currentChunkIndex + 1) / speechChunks.length) * 105) > 100 ? 100 : Math.round(((currentChunkIndex + 1) / speechChunks.length) * 100)}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden mb-2">
                                    <div 
                                      className="h-full bg-amber-600 transition-all duration-300"
                                      style={{ width: `${((currentChunkIndex + 1) / speechChunks.length) * 100}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] font-semibold text-slate-800 leading-relaxed bg-[#FFFBEB] p-2 rounded border border-amber-100 max-h-[100px] overflow-y-auto scrollbar-thin">
                                    "{speechChunks[currentChunkIndex]}"
                                  </p>
                                </div>
                              )}
                              
                              {/* Bottom download / copy / audio controls panel */}
                              <div className="p-3 border-t border-slate-200 flex flex-wrap items-center gap-1 bg-slate-50">
                                <button
                                  onClick={() => copyToClipboard(result.simplifiedEnglish, "en")}
                                  className="flex-1 min-w-[60px] py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  {copiedCol === "en" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                                  {copiedCol === "en" ? "Copied" : "Copy"}
                                </button>
                                <button
                                  onClick={() => triggerPrintConfirmation("Simplified English", result.detectedType, result.simplifiedEnglish)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-[#003366] hover:bg-[#112233] text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  PDF
                                </button>
                                <button
                                  onClick={() => downloadTextFile("English_Simplified", result.simplifiedEnglish)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-[#FF6600] hover:bg-[#e05300] text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  TXT
                                </button>
                                <button
                                  onClick={() => triggerShareCard("Simplified English", result.simplifiedEnglish)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  Share
                                </button>
                                
                                {/* Refined dynamic speech control panel with Speed rate selector */}
                                {speakingCol === "en" ? (
                                  <div className="flex-1 min-w-[140px] bg-slate-150 p-1 px-2 rounded border border-slate-300 flex items-center justify-between gap-1.5 select-none text-[10px]">
                                    <div className="flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                      <span className="font-bold text-slate-600 uppercase tracking-tight text-[9px]">
                                        {speechState === "playing" ? "Speaking" : "Paused"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 bg-white px-1 py-0.5 rounded border border-slate-200">
                                      <span className="text-[7px] text-slate-400">Rate:</span>
                                      {[0.5, 1.0, 1.5].map(rate => (
                                        <button
                                          key={rate}
                                          type="button"
                                          onClick={() => setSpeechRate(rate)}
                                          className={`px-0.5 rounded text-[7px] transition-colors focus:outline-none ${speechRate === rate ? "bg-[#003366] text-white font-extrabold" : "text-slate-600 hover:bg-slate-100"}`}
                                        >
                                          {rate}x
                                        </button>
                                      ))}
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleListen(result.simplifiedEnglish, "en")}
                                        className="p-1 text-slate-700 hover:text-[#003366] cursor-pointer"
                                        title={speechState === "playing" ? "Pause" : "Play"}
                                      >
                                        {speechState === "playing" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                      </button>
                                      <button
                                        onClick={handleStopSpeech}
                                        className="p-1 text-red-650 hover:text-red-800 cursor-pointer"
                                        title="Stop"
                                      >
                                        <Square className="w-3.5 h-3.5 fill-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex gap-1 items-center">
                                    <div className="bg-slate-200 p-0.5 px-1.5 rounded flex items-center gap-1 text-[8px] font-bold h-7 shrink-0 text-slate-600 select-none">
                                      <span>Rate:</span>
                                      {[0.5, 1.0, 1.5].map(rate => (
                                        <button
                                          key={rate}
                                          type="button"
                                          onClick={() => setSpeechRate(rate)}
                                          className={`px-1 rounded text-[8px] transition-colors focus:outline-none ${speechRate === rate ? "bg-[#003366] text-white font-extrabold" : "text-slate-600 hover:bg-slate-150"}`}
                                        >
                                          {rate}x
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => handleListen(result.simplifiedEnglish, "en")}
                                      className="flex-grow py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded h-7"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                      Listen
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Card 2: Telugu translation (తెలుగు) */}
                          {includeTelugu && (
                            <div className="bg-white border-t-4 border-t-[#FF6600] border-x border-b border-rose-300 flex flex-col min-h-[380px]">
                              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center bg-slate-100 select-none">
                                <span className="text-xs font-extrabold text-[#003366] uppercase tracking-wider">
                                  Telugu Translation (తెలుగు)
                                </span>
                                <span className="text-[10px] text-slate-505 font-bold uppercase">TELUGU</span>
                              </div>
                              <div className="p-4 flex-grow text-xs leading-relaxed overflow-y-auto whitespace-pre-wrap text-[#002244] font-medium select-text animate-fade-in">
                                {renderHighlightedText(result.teluguTranslation, "te")}
                              </div>
                              
                              {/* Voice highlight and animated tracking bar for immersive reading assistance */}
                              {speakingCol === "te" && speechChunks.length > 0 && (
                                <div className="mx-3 my-2 p-3 bg-amber-50 border-l-4 border-l-amber-600 border border-amber-200 rounded select-none animate-fade-in shrink-0">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-amber-800 uppercase tracking-tight mb-1.5">
                                    <span className="flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                                      Narration Progress
                                    </span>
                                    <span>
                                      Segment {currentChunkIndex + 1} of {speechChunks.length} ({Math.round(((currentChunkIndex + 1) / speechChunks.length) * 100)}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden mb-2">
                                    <div 
                                      className="h-full bg-amber-600 transition-all duration-300"
                                      style={{ width: `${((currentChunkIndex + 1) / speechChunks.length) * 100}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] font-semibold text-slate-800 leading-relaxed bg-[#FFFBEB] p-2 rounded border border-amber-100 max-h-[100px] overflow-y-auto scrollbar-thin">
                                    "{speechChunks[currentChunkIndex]}"
                                  </p>
                                </div>
                              )}
                              
                              {/* Bottom controls panel */}
                              <div className="p-3 border-t border-slate-200 flex flex-wrap items-center gap-1 bg-slate-50">
                                <button
                                  onClick={() => copyToClipboard(result.teluguTranslation, "te")}
                                  className="flex-1 min-w-[60px] py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  {copiedCol === "te" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                                  {copiedCol === "te" ? "Copied" : "Copy"}
                                </button>
                                <button
                                  onClick={() => triggerPrintConfirmation("Telugu Translation", result.detectedType, result.teluguTranslation)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-[#003366] hover:bg-[#112233] text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  PDF
                                </button>
                                <button
                                  onClick={() => downloadTextFile("Telugu_Translation", result.teluguTranslation)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-[#FF6600] hover:bg-[#e05300] text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  TXT
                                </button>
                                <button
                                  onClick={() => triggerShareCard("Telugu Translation (తెలుగు)", result.teluguTranslation)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  Share
                                </button>
                                
                                {/* Refined dynamic speech control panel with Speed rate selector */}
                                {speakingCol === "te" ? (
                                  <div className="flex-1 min-w-[140px] bg-slate-150 p-1 px-2 rounded border border-slate-300 flex items-center justify-between gap-1.5 select-none text-[10px]">
                                    <div className="flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                      <span className="font-bold text-slate-600 uppercase tracking-tight text-[9px]">
                                        {speechState === "playing" ? "Speaking" : "Paused"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 bg-white px-1 py-0.5 rounded border border-slate-200">
                                      <span className="text-[7px] text-slate-400">Rate:</span>
                                      {[0.5, 1.0, 1.5].map(rate => (
                                        <button
                                          key={rate}
                                          type="button"
                                          onClick={() => setSpeechRate(rate)}
                                          className={`px-0.5 rounded text-[7px] transition-colors focus:outline-none ${speechRate === rate ? "bg-[#003366] text-white font-extrabold" : "text-slate-600 hover:bg-slate-100"}`}
                                        >
                                          {rate}x
                                        </button>
                                      ))}
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleListen(result.teluguTranslation, "te")}
                                        className="p-1 text-slate-700 hover:text-[#003366] cursor-pointer"
                                        title={speechState === "playing" ? "Pause" : "Play"}
                                      >
                                        {speechState === "playing" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                      </button>
                                      <button
                                        onClick={handleStopSpeech}
                                        className="p-1 text-red-655 hover:text-red-800 cursor-pointer"
                                        title="Stop"
                                      >
                                        <Square className="w-3.5 h-3.5 fill-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex gap-1 items-center">
                                    <div className="bg-slate-200 p-0.5 px-1.5 rounded flex items-center gap-1 text-[8px] font-bold h-7 shrink-0 text-slate-600 select-none">
                                      <span>Rate:</span>
                                      {[0.5, 1.0, 1.5].map(rate => (
                                        <button
                                          key={rate}
                                          type="button"
                                          onClick={() => setSpeechRate(rate)}
                                          className={`px-1 rounded text-[8px] transition-colors focus:outline-none ${speechRate === rate ? "bg-[#003366] text-white font-extrabold" : "text-slate-600 hover:bg-slate-150"}`}
                                        >
                                          {rate}x
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => handleListen(result.teluguTranslation, "te")}
                                      className="flex-grow py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded h-7"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                      Listen
                                    </button>
                                  </div>
                                )}

                                {/* User Assistive Instruction Tip */}
                                {speakingCol === "te" && (
                                  <div className="w-full mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[9px] text-[#003366] font-bold text-center leading-normal select-none">
                                    ⚠️ Help: If only digits are spoken, ensure a Kannada/Telugu/Indian Speech Engine voice pack is installed / turned on in your device language options.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Card 3: Hindi Translation (हिंदी) */}
                          {includeHindi && (
                            <div className="bg-white border-t-4 border-t-[#138808] border-x border-b border-rose-300 flex flex-col min-h-[380px]">
                              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center bg-slate-100 select-none">
                                <span className="text-xs font-extrabold text-[#003366] uppercase tracking-wider">
                                  Hindi Translation (हिंदी)
                                </span>
                                <span className="text-[10px] text-slate-550 font-bold uppercase">HINDI</span>
                              </div>
                              <div className="p-4 flex-grow text-xs leading-relaxed overflow-y-auto whitespace-pre-wrap text-[#2c3e50] font-medium select-text animate-fade-in">
                                {renderHighlightedText(result.hindiTranslation, "hi")}
                              </div>
                              
                              {/* Voice highlight and animated tracking bar for immersive reading assistance */}
                              {speakingCol === "hi" && speechChunks.length > 0 && (
                                <div className="mx-3 my-2 p-3 bg-amber-50 border-l-4 border-l-amber-600 border border-amber-200 rounded select-none animate-fade-in shrink-0">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-amber-800 uppercase tracking-tight mb-1.5">
                                    <span className="flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                                      Narration Progress
                                    </span>
                                    <span>
                                      Segment {currentChunkIndex + 1} of {speechChunks.length} ({Math.round(((currentChunkIndex + 1) / speechChunks.length) * 100)}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden mb-2">
                                    <div 
                                      className="h-full bg-amber-600 transition-all duration-300"
                                      style={{ width: `${((currentChunkIndex + 1) / speechChunks.length) * 100}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] font-semibold text-slate-800 leading-relaxed bg-[#FFFBEB] p-2 rounded border border-amber-100 max-h-[100px] overflow-y-auto scrollbar-thin">
                                    "{speechChunks[currentChunkIndex]}"
                                  </p>
                                </div>
                              )}
                              
                              {/* Bottom controls panel */}
                              <div className="p-3 border-t border-slate-200 flex flex-wrap items-center gap-1 bg-slate-50">
                                <button
                                  onClick={() => copyToClipboard(result.hindiTranslation, "hi")}
                                  className="flex-1 min-w-[60px] py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  {copiedCol === "hi" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                                  {copiedCol === "hi" ? "Copied" : "Copy"}
                                </button>
                                <button
                                  onClick={() => triggerPrintConfirmation("Hindi Translation", result.detectedType, result.hindiTranslation)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-[#003366] hover:bg-[#112233] text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  PDF
                                </button>
                                <button
                                  onClick={() => downloadTextFile("Hindi_Translation", result.hindiTranslation)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-[#FF6600] hover:bg-[#e05300] text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  TXT
                                </button>
                                <button
                                  onClick={() => triggerShareCard("Hindi Translation (हिंदी)", result.hindiTranslation)}
                                  className="flex-1 min-w-[60px] py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded"
                                >
                                   <Share2 className="w-3.5 h-3.5" />
                                   Share
                                 </button>
                                 
                                 {/* Refined dynamic speech control panel with Speed rate selector */}
                                {speakingCol === "hi" ? (
                                  <div className="flex-1 min-w-[140px] bg-slate-150 p-1 px-2 rounded border border-slate-300 flex items-center justify-between gap-1.5 select-none text-[10px]">
                                    <div className="flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                      <span className="font-bold text-slate-600 uppercase tracking-tight text-[9px]">
                                        {speechState === "playing" ? "Speaking" : "Paused"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 bg-white px-1 py-0.5 rounded border border-slate-200">
                                      <span className="text-[7px] text-slate-400">Rate:</span>
                                      {[0.5, 1.0, 1.5].map(rate => (
                                        <button
                                          key={rate}
                                          type="button"
                                          onClick={() => setSpeechRate(rate)}
                                          className={`px-0.5 rounded text-[7px] transition-colors focus:outline-none ${speechRate === rate ? "bg-[#003366] text-white font-extrabold" : "text-slate-600 hover:bg-slate-100"}`}
                                        >
                                          {rate}x
                                        </button>
                                      ))}
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleListen(result.hindiTranslation, "hi")}
                                        className="p-1 text-slate-700 hover:text-[#003366] cursor-pointer"
                                        title={speechState === "playing" ? "Pause" : "Play"}
                                      >
                                        {speechState === "playing" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                      </button>
                                      <button
                                        onClick={handleStopSpeech}
                                        className="p-1 text-red-655 hover:text-red-800 cursor-pointer"
                                        title="Stop"
                                      >
                                        <Square className="w-3.5 h-3.5 fill-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex gap-1 items-center">
                                    <div className="bg-slate-200 p-0.5 px-1.5 rounded flex items-center gap-1 text-[8px] font-bold h-7 shrink-0 text-slate-600 select-none">
                                      <span>Rate:</span>
                                      {[0.5, 1.0, 1.5].map(rate => (
                                        <button
                                          key={rate}
                                          type="button"
                                          onClick={() => setSpeechRate(rate)}
                                          className={`px-1 rounded text-[8px] transition-colors focus:outline-none ${speechRate === rate ? "bg-[#003366] text-white font-extrabold" : "text-slate-600 hover:bg-slate-150"}`}
                                        >
                                          {rate}x
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => handleListen(result.hindiTranslation, "hi")}
                                      className="flex-grow py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 rounded h-7"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                      Listen
                                    </button>
                                  </div>
                                )}

                                {/* User Assistive Instruction Tip */}
                                {speakingCol === "hi" && (
                                  <div className="w-full mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[9px] text-[#003366] font-bold text-center leading-normal select-none">
                                    ⚠️ Help: If only digits are spoken, ensure a Hindi/Google/Indian Speech Engine voice pack is installed / turned on in your device language options.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </motion.div>
                      </>
                    ) : (
                      /* Red rejection error block if document is not government related */
                      <div className="p-5 bg-red-50 border-2 border-red-400 text-red-800 rounded space-y-2 select-none">
                        <div className="flex items-center gap-2 font-bold text-sm text-red-950 uppercase">
                          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
                          Document Classification Check Failed
                        </div>
                        <p className="text-xs leading-normal">
                          ⚠ This document does not appear to be a government-related document. Please upload official government content only.
                        </p>
                        {result.rejectionReason && (
                          <div className="p-3 bg-red-100/50 border border-red-200 text-xs italic font-medium mt-2">
                            <strong>Reason:</strong> {result.rejectionReason}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 italic mt-1 font-bold">
                          * Transaction logged as invalid. All queries are audited by National Informatics Centre standard policies.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            )}

            {/* Tab: SECURITY AUDIT LOGS */}
            {activeTab === "logs" && (
              user ? (
                <HistoryLogs highContrast={highContrast} userEmail={user.email} />
              ) : (
                <div className="max-w-md mx-auto my-12 p-8 bg-white border-t-4 border-t-[#003366] border-x border-b border-slate-300 rounded shadow text-center space-y-4">
                  <div className="inline-block p-4 bg-slate-100 rounded-full text-[#003366]">
                    <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">
                    Secure History Log is Locked
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Secure document tracking, simplification indices under central audit mandates require profile binding. Register or Sign In to view your activity dashboard.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={() => setAuthModal({ visible: true, defaultMode: "signin" })}
                      className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase rounded cursor-pointer transition-colors"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => setAuthModal({ visible: true, defaultMode: "signup" })}
                      className="px-4.5 py-2 bg-[#FF6600] hover:bg-[#e05300] text-white text-[11px] font-bold uppercase rounded cursor-pointer transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Tab: HOW IT WORKS */}
            {activeTab === "works" && (
              <HowItWorks />
            )}

            {/* Tab: ABOUT GOVSIMPLIFY */}
            {activeTab === "about" && (
              <AboutContact />
            )}

            {/* Tab: CONTACT PUBLIC ENQUIRIES */}
            {activeTab === "contact" && (
              <AboutContact />
            )}

          </div>

      </main>

      {/* Footer (NIC Style Navy Footer #003366) */}
      <footer className={`w-full ${highContrast ? "bg-black" : "bg-[#003366]"} text-white border-t border-slate-300 py-8`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs select-none">
          <div className="space-y-2.5">
            <h4 className="font-extrabold uppercase tracking-widest text-[#FF6600]">
              DocuEase
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Simplifying administrative notifications, bills, legislative clauses, and public directives to bridge linguistics-based inclusion gaps across India. Powered by Gemini.
            </p>
          </div>
          <div className="space-y-3 font-medium">
            <h4 className="font-extrabold uppercase tracking-widest text-[#FF6600]">
              Regulatory Information
            </h4>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              <li>• Ministry of Electronics & Information Technology</li>
              <li>• National Informatics Centre (NIC) Portal Style Guidelines</li>
              <li>• Digital India Initiative Compliance</li>
              <li>• Secured Aadhaar MeriPehchaan e-KYC Sign-On</li>
            </ul>
          </div>
          <div className="space-y-3 font-medium">
            <h4 className="font-extrabold uppercase tracking-widest text-[#FF6600]">
              Developer & Citizen Audits
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every simplification is indexed in the secure session ledger database. Ensure copy-pasted details preserve strict chronological indices.
            </p>
            <div className="text-[10px] text-emerald-400 font-bold tracking-widest">
              SYSTEM LEVEL: AUDIT-OK (2026)
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 mt-6 border-t border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-slate-400 select-none">
          <p className="font-semibold text-slate-300">
            © 2024 DocuEase | National Informatics Centre (NIC) Style Footer
          </p>
          <div className="flex gap-4 font-bold text-[#FF6600]">
            <a href="#privacy" className="hover:underline">Privacy Policy</a>
            <span>|</span>
            <a href="#terms" className="hover:underline">Terms of Service</a>
            <span>|</span>
            <a href="#help" className="hover:underline">Technical Support Helpdesk</a>
          </div>
        </div>
      </footer>

      {/* Share Direct Link & Snapshot UI Modal */}
      {shareConfig.visible && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-[#003366] w-full max-w-xl shadow-2xl overflow-hidden rounded">
            {/* Header */}
            <div className="bg-[#003366] text-white px-5 py-4 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#FF6600]" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FF6600]">
                  Share Document Release Bulletin
                </h4>
              </div>
              <button
                onClick={() => setShareConfig(prev => ({ ...prev, visible: false }))}
                className="text-white hover:text-slate-200 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                [ Close ✕ ]
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider block">
                  Document Classification:
                </span>
                <p className="text-xs font-bold text-slate-800 uppercase bg-slate-100 px-2 py-1 inline-block border border-slate-300">
                  {shareConfig.cardTitle} • {shareConfig.langName}
                </p>
              </div>

              {/* Action 1: Direct Link */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#003366] uppercase tracking-wider flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-slate-500" />
                  1. Copy Direct Access Security Link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateShareLink()}
                    className="flex-grow p-2.5 bg-slate-50 border border-slate-300 rounded text-[10px] font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={copyShareLinkToClipboard}
                    className={`px-4 text-xs font-bold uppercase text-white cursor-pointer ${
                      shareConfig.copiedLink ? "bg-emerald-600" : "bg-[#003366] hover:bg-[#112233]"
                    } transition-all rounded shrink-0`}
                  >
                    {shareConfig.copiedLink ? "COPIED" : "COPY LINK"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Any citizen visiting this unique encrypted link will access this simplified release results panel instantly.
                </p>
              </div>

              <hr className="border-slate-200" />

              {/* Action 2: Bulletin Snapshot */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#003366] uppercase tracking-wider flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-slate-500" />
                  2. Generate Shareable Snapshot Bulletin:
                </label>
                <div className="border border-slate-300 bg-slate-50 font-mono text-[9px] p-4 rounded max-h-44 overflow-y-auto whitespace-pre leading-normal shadow-inner">
                  {generateSnapshotText(shareConfig.langName, shareConfig.content)}
                </div>
                <button
                  onClick={copySnapshotToClipboard}
                  className={`w-full py-2.5 text-xs font-bold uppercase text-white cursor-pointer ${
                    shareConfig.copiedSnapshot ? "bg-emerald-600" : "bg-[#FF6600] hover:bg-[#e65c00]"
                  } transition-all rounded`}
                >
                  {shareConfig.copiedSnapshot ? "✓ COPIED BULLETIN SNAPSHOT TO CLIPBOARD" : "COPY BULLETIN SNAPSHOT"}
                </button>
                <p className="text-[10px] text-slate-550 text-center">
                  Perfect formatting for copying directly into citizen notification boards, WhatsApp groups, or official mails.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Confirmation Safety Consent Check-off Modal */}
      {printConfirm.visible && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-red-600 w-full max-w-lg shadow-2xl overflow-hidden rounded">
            {/* Header Red/Amarant/Amber Danger banner icon */}
            <div className="bg-red-700 text-white px-5 py-4 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-300 animate-bounce animate-pulse" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
                  Official Print Confirmation Step
                </h4>
              </div>
              <button
                onClick={() => setPrintConfirm(prev => ({ ...prev, visible: false }))}
                className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                [ Cancel ✕ ]
              </button>
            </div>

            {/* Content Terms Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3 bg-red-50 p-3 border border-red-200 text-red-900 rounded select-none text-xs">
                <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold uppercase text-red-950">
                    Important Citizen Notice:
                  </span>
                  <p className="leading-relaxed font-semibold text-red-800">
                    You are preparing to generate an official print/PDF copy of this simplified document category ({printConfirm.originalType}). Please verify the generated content matches your records before continuing.
                  </p>
                </div>
              </div>

              {/* Informative summary */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider block border-b border-slate-200 pb-1">
                  Document Audit Parameters:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 p-3 border border-slate-200 rounded">
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase">Format Style:</span>
                    <span className="text-[#003366] block uppercase mt-0.5">{printConfirm.langName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase">Original Category:</span>
                    <span className="text-[#FF6600] block uppercase mt-0.5">{printConfirm.originalType}</span>
                  </div>
                </div>
              </div>

              {/* Checks */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider block">
                  Required Citizen Acknowledgements:
                </span>
                
                <label className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printConfirm.reviewed}
                    onChange={(e) => setPrintConfirm(prev => ({ ...prev, reviewed: e.target.checked }))}
                    className="w-4.5 h-4.5 mt-0.5 accent-[#003366] rounded cursor-pointer shrink-0"
                  />
                  <span>
                    I have carefully reviewed the generated translation text and confirm it is audit-ready.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printConfirm.agreement}
                    onChange={(e) => setPrintConfirm(prev => ({ ...prev, agreement: e.target.checked }))}
                    className="w-4.5 h-4.5 mt-0.5 accent-[#003366] rounded cursor-pointer shrink-0"
                  />
                  <span>
                    I understand that this is an AI-simplified translation hosted for accessibility purposes.
                  </span>
                </label>
              </div>

              {/* Print and cancel actions buttons group */}
              <div className="pt-3 border-t border-slate-250 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrintConfirm(prev => ({ ...prev, visible: false }))}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-extrabold uppercase rounded cursor-pointer transition-colors"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  disabled={!printConfirm.reviewed || !printConfirm.agreement}
                  onClick={executePrint}
                  className={`flex-1 py-2.5 text-xs font-extrabold uppercase rounded transition-colors flex items-center justify-center gap-1.5 ${
                    printConfirm.reviewed && printConfirm.agreement
                      ? "bg-red-700 hover:bg-red-800 text-white cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Print Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Popup View (Custom Sign In / Sign Up Wrapper overlay) */}
      {authModal.visible && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="relative w-full max-w-sm bg-white border border-slate-300 rounded shadow-2xl overflow-hidden animate-none">
            {/* Close button inside modal */}
            <button
              onClick={() => setAuthModal({ visible: false, defaultMode: "signin" })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer select-none z-10 transition-colors"
              title="Close Portal Authenticator"
            >
              ✕ Close
            </button>
            <div className="pt-2">
              <AadhaarSSOLogin
                onLoginSuccess={(authorizedUser) => {
                  handleLogin(authorizedUser);
                  setAuthModal({ visible: false, defaultMode: "signin" });
                }}
                highContrast={highContrast}
                initialMode={authModal.defaultMode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
