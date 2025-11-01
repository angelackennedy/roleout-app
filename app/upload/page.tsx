"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/") && !selectedFile.type.startsWith("image/")) {
      setError("Please select a valid video or image file");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError("");
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
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));

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
    if (!user) {
      setError("You must be signed in to upload.");
      return;
    }
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      await uploadWithProgress(fileName, file);

      const { data } = supabase.storage.from("media").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const { error: dbError } = await supabase.from("posts").insert({
        user_id: user.id,
        video_url: isVideo ? publicUrl : null,
        image_url: isImage ? publicUrl : null,
        caption: caption.trim() || null,
        like_count: 0,
        comment_count: 0,
      });

      if (dbError) throw dbError;

      router.push("/feed");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const isVideo = file?.type.startsWith("video/");
  const isImage = file?.type.startsWith("image/");

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 20 }}>
        <h1>Upload</h1>
        <p>Share a video or image (max 60s for video)</p>
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
            />
          </div>

          {previewUrl && (
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
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "inherit",
                fontFamily: "inherit",
              }}
            />
          </div>

          {uploading && (
            <div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: 6,
                fontSize: 14,
                color: "rgba(255,255,255,0.7)"
              }}>
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div style={{
                width: "100%",
                height: 6,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 3,
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "var(--accent-gold)",
                  transition: "width 0.3s ease",
                  borderRadius: 3
                }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              padding: 12, 
              borderRadius: 6, 
              backgroundColor: "rgba(255,0,0,0.1)",
              color: "#ff6b6b",
              border: "1px solid rgba(255,0,0,0.2)"
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="nav-btn"
            style={{
              width: "100%",
              padding: "12px 20px",
              opacity: !file || uploading ? 0.5 : 1,
              cursor: !file || uploading ? "not-allowed" : "pointer"
            }}
          >
            {uploading ? `Uploading... ${progress}%` : "Upload"}
          </button>
        </div>
      </div>
    </main>
  );
}
