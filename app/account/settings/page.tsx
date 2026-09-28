'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data, error: userError } = await supabase.auth.getUser()
      if (!mounted) return

      if (userError || !data.user) {
        setError('Please sign in to manage your account.')
        setLoading(false)
        return
      }

      const metadata = data.user.user_metadata ?? {}
      const name = typeof metadata.display_name === 'string'
        ? metadata.display_name
        : typeof metadata.full_name === 'string'
          ? metadata.full_name
          : data.user.email?.split('@')[0] ?? ''

      setUserEmail(data.user.email ?? '')
      setDisplayName(name)
      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const { error: updateError } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setMessage('Profile updated.')
    setSaving(false)
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      setSaving(false)
      return
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (passwordError) {
      setError(passwordError.message)
      setSaving(false)
      return
    }

    setNewPassword('')
    setMessage('Password updated.')
    setSaving(false)
  }

  if (loading) {
    return <main className="account-page"><div className="account-card">Loading account…</div></main>
  }

  return (
    <main className="account-page">
      <section className="account-card">
        <div className="account-card-top">
          <div>
            <div className="eyebrow">ACCOUNT</div>
            <h1>Profile & settings</h1>
            <p>Manage the information and security settings for your WFM account.</p>
          </div>
          <Link href="/scouting" className="outline">Back to workspace</Link>
        </div>

        {error && <div className="account-message account-error">{error}</div>}
        {message && <div className="account-message account-success">{message}</div>}

        <div className="account-settings-grid">
          <form onSubmit={saveProfile} className="settings-section">
            <div className="settings-section-heading">
              <span>PROFILE</span>
              <h2>Personal information</h2>
            </div>

            <label>
              Display name
              <input
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                placeholder="Your name"
                maxLength={80}
              />
            </label>

            <label>
              Email
              <input value={userEmail} readOnly />
              <small>Email changes may require confirmation and will be added separately.</small>
            </label>

            <button type="submit" className="settings-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>

          <form onSubmit={changePassword} className="settings-section">
            <div className="settings-section-heading">
              <span>SECURITY</span>
              <h2>Change password</h2>
            </div>

            <label>
              New password
              <input
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters"
              />
            </label>

            <button type="submit" className="settings-primary" disabled={saving || newPassword.length < 8}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
