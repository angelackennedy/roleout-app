"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MODE } from "@/lib/config";
import { initLocalDB, savePost } from "@/lib/localdb";
import { useAuth } from "@/lib/auth-context";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let supabase: any = null;
if (MODE === "supabase") {
  const supabaseModule = require("@/lib/supabase");
  supabase = supabaseModule.supabase;
}

function canBrowserPlay(file: File): boolean {
  if (!file.type.startsWith("video/")) return true;
  
  const video = document.createElement("video");
  const canPlay = video.canPlayType(file.type);
  return canPlay === "probably" || canPlay === "maybe";
}

async function convertToMp4IfNeeded(
  file: File,
  onProgress?: (p: number) => void
): Promise<File> {
  const ffmpeg = new FFmpeg();
  
  await ffmpeg.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
  });

  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const inputName = "input." + (file.name.split(".").pop() || "mov");
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  await ffmpeg.exec([
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName) as Uint8Array;
  // @ts-expect-error - Uint8Array type mismatch between ffmpeg.wasm and DOM API
  const blob = new Blob([data], { type: "video/mp4" });
  
  const originalName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${originalName}.mp4`, { type: "video/mp4" });
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [safeFile, setSafeFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertProgress, setConvertProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formatNote, setFormatNote] = useState("");
  const [testResult, setTestResult] = useState<string>("");
  const [testing, setTesting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (MODE === "supabase" && !user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  const resetForm = () => {
    setFile(null);
    setSafeFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setCaption("");
    setProgress(0);
    setConvertProgress(0);
    setError("");
    setFormatNote("");
    setTestResult("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/") && !selectedFile.type.startsWith("image/")) {
      setError("Please select a valid video or image file");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError("");
    setUploadSuccess(false);
    setFormatNote("");
    setConvertProgress(0);

    if (selectedFile.type.startsWith("image/")) {
      setSafeFile(selectedFile);
      return;
    }

    if (canBrowserPlay(selectedFile)) {
      setSafeFile(selectedFile);
      return;
    }

    try {
      setConverting(true);
      setFormatNote("Converting to web-safe MP4…");
      
      const converted = await convertToMp4IfNeeded(
        selectedFile,
        setConvertProgress
      );

      setSafeFile(converted);
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(converted));
      
      setFormatNote("");
      setConvertProgress(0);
    } catch (err: any) {
      console.error("Conversion error:", err);
      setError(`Conversion failed: ${err.message || "Unknown error"}`);
      setFormatNote("");
      setSafeFile(null);
    } finally {
      setConverting(false);
    }
  };

  const uploadWithProgress = async (
    fileName: string,
    file: File
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setProgress(percentage);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          let errorMsg = xhr.statusText || "Upload failed";
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMsg = errorResponse.message || errorResponse.error || errorMsg;
          } catch (e) {
            if (xhr.responseText) {
              errorMsg = xhr.responseText;
            }
          }
          console.error("Upload XHR error:", {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            response: xhr.response,
          });
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener("error", () => {
        console.error("Upload XHR network error:", {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText,
        });
        reject(new Error("Network error occurred"));
      });

      xhr.open(
        "POST",
        `${supabaseUrl}/storage/v1/object/media/${fileName}`
      );
      xhr.setRequestHeader("Authorization", `Bearer ${supabaseKey}`);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.setRequestHeader("x-upsert", "true");

      xhr.send(file);
    });
  };

  const handleUpload = async () => {
    if (MODE === "supabase" && !user) {
      setError("You must be signed in to upload.");
      return;
    }
    if (!safeFile) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setUploadSuccess(false);

    try {
      if (MODE === "local") {
        await initLocalDB();
        
        setProgress(50);
        await savePost(safeFile, caption);
        
        setProgress(100);
        setUploadSuccess(true);

        setTimeout(() => {
          resetForm();
          setUploadSuccess(false);
          router.push("/feed");
        }, 1500);
      } else if (MODE === "supabase") {
        const fileExt = safeFile.name.split(".").pop();
        const isImage = safeFile.type.startsWith("image/");
        
        const folder = isImage ? "images" : "videos";
        const fileName = `${folder}/${user!.id}/${Date.now()}.${fileExt}`;

        await uploadWithProgress(fileName, safeFile);

        const { data } = supabase.storage.from("media").getPublicUrl(fileName);
        const publicUrl = data.publicUrl;

        const { error: dbError } = await supabase.from("posts").insert({
          user_id: user!.id,
          video_url: publicUrl,
          caption: caption,
          like_count: 0,
          comment_count: 0,
        });

        if (dbError) {
          console.error("Database insert error:", dbError);
          setError(dbError.message);
          setProgress(0);
          setUploadSuccess(false);
          return;
        }

        setUploadSuccess(true);
        setProgress(100);

        setTimeout(() => {
          resetForm();
          setUploadSuccess(false);
          router.push("/feed");
        }, 1500);
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      setError(e.message || "Upload failed");
      setProgress(0);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  const testStorageAccess = async () => {
    if (MODE === "local") {
      setTestResult("✅ Local mode: Using IndexedDB storage");
      return;
    }

    setTesting(true);
    setTestResult("");
    try {
      const { data, error } = await supabase.storage.from("media").list();
      
      if (error) {
        console.error("Storage test error:", error);
        setTestResult(`❌ Error: ${error.message}`);
      } else {
        console.log("Storage test success:", data);
        setTestResult(`✅ Success! Found ${data?.length || 0} items in "media" bucket`);
      }
    } catch (e: any) {
      console.error("Storage test exception:", e);
      setTestResult(`❌ Exception: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (MODE === "supabase" && !user) return null;

  const isVideo = safeFile?.type.startsWith("video/");
  const isImage = safeFile?.type.startsWith("image/");

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 20 }}>
        <h1>Upload</h1>
        <p>Share a video or image (max 60s for video)</p>
        {MODE === "local" && (
          <p style={{ fontSize: 14, color: "var(--accent-gold)", marginTop: 8 }}>
            📦 Local Mode: Data stored in browser (IndexedDB)
          </p>
        )}
      </section>

      <div className="card" style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Select File
            </label>
            <input
              type="file"
              accept="video/*,image/*"
              onChange={handleFileChange}
              className="nav-btn"
              style={{ width: "100%" }}
              disabled={uploading || converting}
            />
          </div>

          {converting && formatNote && (
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                backgroundColor: "rgba(197,164,109,0.1)",
                border: "1px solid rgba(197,164,109,0.3)",
                color: "var(--accent-gold)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                <span>{formatNote}</span>
                <span>{convertProgress}%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 6,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${convertProgress}%`,
                    height: "100%",
                    backgroundColor: "var(--accent-gold)",
                    transition: "width 0.3s ease",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          )}

          {previewUrl && !converting && (
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Preview
              </label>
              {isVideo && (
                <video
                  src={previewUrl}
                  controls
                  style={{ width: "100%", borderRadius: 10, backgroundColor: "#000" }}
                />
              )}
              {isImage && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: "100%", borderRadius: 10 }}
                />
              )}
            </div>
          )}

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Add a caption..."
              disabled={uploading || converting}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "inherit",
                fontFamily: "inherit",
                opacity: uploading || converting ? 0.6 : 1,
              }}
            />
          </div>

          {uploading && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 14,
                  color: uploadSuccess ? "var(--accent-gold)" : "rgba(255,255,255,0.7)",
                }}
              >
                <span>
                  {uploadSuccess ? "✅ Uploaded successfully" : "Uploading..."}
                </span>
                <span>{progress}%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: "var(--accent-gold)",
                    transition: "width 0.3s ease",
                    borderRadius: 4,
                    boxShadow: uploadSuccess
                      ? "0 0 12px var(--accent-gold)"
                      : "none",
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                backgroundColor: "rgba(255,0,0,0.1)",
                color: "#ff6b6b",
                border: "1px solid rgba(255,0,0,0.2)",
                fontSize: 14,
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {testResult && (
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                backgroundColor: testResult.startsWith("✅") 
                  ? "rgba(0,255,0,0.1)" 
                  : "rgba(255,0,0,0.1)",
                color: testResult.startsWith("✅") 
                  ? "#6bff6b" 
                  : "#ff6b6b",
                border: testResult.startsWith("✅") 
                  ? "1px solid rgba(0,255,0,0.2)" 
                  : "1px solid rgba(255,0,0,0.2)",
                fontSize: 14,
              }}
            >
              <strong>Storage Test:</strong> {testResult}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleUpload}
              disabled={!safeFile || uploading || converting}
              className="nav-btn"
              style={{
                flex: 1,
                padding: "12px 20px",
                opacity: !safeFile || uploading || converting ? 0.5 : 1,
                cursor: !safeFile || uploading || converting ? "not-allowed" : "pointer",
              }}
            >
              {uploadSuccess
                ? "✅ Upload Complete"
                : uploading
                  ? `Uploading... ${progress}%`
                  : converting
                    ? "Converting..."
                    : "Upload"}
            </button>

            <button
              onClick={testStorageAccess}
              disabled={testing}
              className="nav-btn"
              style={{
                padding: "12px 20px",
                opacity: testing ? 0.5 : 1,
                cursor: testing ? "not-allowed" : "pointer",
                backgroundColor: "rgba(197,164,109,0.15)",
                border: "1px solid rgba(197,164,109,0.3)",
              }}
              title={MODE === "local" ? "Local IndexedDB storage" : "Test access to 'media' storage bucket"}
            >
              {testing ? "Testing..." : "🔍 Test Storage"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
