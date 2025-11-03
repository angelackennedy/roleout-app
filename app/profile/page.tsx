'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        setError('Failed to load profile');
      } else if (data) {
        setProfile(data);
        setFormData({
          username: data.username,
          display_name: data.display_name || '',
          bio: data.bio || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : null);
      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username.trim(),
          display_name: formData.display_name.trim() || null,
          bio: formData.bio.trim() || null,
        })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23505') {
          setError('Username already taken');
        } else {
          throw updateError;
        }
      } else {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchProfile();
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
        color: 'white',
        padding: '40px 20px',
      }}>
        <div style={{
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <div style={{ marginBottom: 30 }}>
            <Link href="/" style={{
              color: 'rgba(212,175,55,0.8)',
              fontSize: 14,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(212,175,55,0.3)',
            }}>
              ← Back to Home
            </Link>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>⏳</div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Setting up your profile...</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              {error || 'Your profile is being created. This should only take a moment.'}
            </p>
            <button
              onClick={fetchProfile}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.4) 100%)',
                border: '1px solid rgba(212,175,55,0.5)',
                borderRadius: 6,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
      }}>
        <div style={{ marginBottom: 30 }}>
          <Link href="/" style={{
            color: 'rgba(212,175,55,0.8)',
            fontSize: 14,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
          }}>
            ← Back to Home
          </Link>
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 10,
          background: 'linear-gradient(135deg, #fff 0%, rgba(212,175,55,0.8) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Your Profile
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 30,
          fontSize: 14,
        }}>
          View at <Link href={`/u/${profile.username}`} style={{ color: 'rgba(212,175,55,0.8)' }}>/u/{profile.username}</Link>
        </p>

        {error && (
          <div style={{
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            color: '#ff6b6b',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(0,255,0,0.1)',
            border: '1px solid rgba(0,255,0,0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            color: '#51cf66',
            fontSize: 14,
          }}>
            {success}
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 30,
          marginBottom: 20,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 30,
          }}>
            <div
              onClick={handleAvatarClick}
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: profile.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              {!profile.avatar_url && (profile.username?.slice(0, 2).toUpperCase() || 'U')}
            </div>

            <div style={{ flex: 1 }}>
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                style={{
                  background: uploading ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.2)',
                  border: '1px solid rgba(212,175,55,0.5)',
                  borderRadius: 6,
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.background = 'rgba(212,175,55,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.background = 'rgba(212,175,55,0.2)';
                  }
                }}
              >
                {uploading ? 'Uploading...' : 'Change Avatar'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <p style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 8,
              }}>
                JPG, PNG or GIF • Max 5MB
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: 'rgba(255,255,255,0.9)',
              }}>
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                pattern="[a-zA-Z0-9_-]+"
                minLength={3}
                maxLength={30}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
              />
              <p style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 4,
              }}>
                3-30 characters, letters, numbers, dash, underscore only
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: 'rgba(255,255,255,0.9)',
              }}>
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: 'rgba(255,255,255,0.9)',
              }}>
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={200}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
              />
              <p style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 4,
              }}>
                {formData.bio.length}/200
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                background: saving
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(135deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.4) 100%)',
                border: '1px solid rgba(212,175,55,0.5)',
                borderRadius: 6,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.7) 0%, rgba(212,175,55,0.5) 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.4) 100%)';
                }
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
