'use client'

import { useState } from 'react'
import { CreateSecretRequest, CreateSecretResponse } from '@/types/api'

export default function HomePage() {
  const [secret, setSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [ttl, setTtl] = useState(86400) // 24 hours default
  const [maxViews, setMaxViews] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CreateSecretResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const payload: CreateSecretRequest = {
        secret,
        passphrase: passphrase || undefined,
        ttl,
        maxViews,
      }

      const response = await fetch('/api/secrets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data: CreateSecretResponse = await response.json()
      setResult(data)

      if (data.success) {
        setSecret('')
        setPassphrase('')
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to create secret. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (result?.url) {
      navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getTTLLabel = (seconds: number) => {
    if (seconds === 3600) return '1 hour'
    if (seconds === 86400) return '1 day'
    if (seconds === 604800) return '7 days'
    return `${seconds} seconds`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔐 OneTimeSecret
            </h1>
            <nav className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition">
                About
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition">
                API
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Share secrets <span className="text-blue-600">securely</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Keep sensitive information out of your email and chat logs.
            Share a secret link that automatically expires.
          </p>
        </div>

        {/* Secret Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          {!result?.success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Secret Input */}
              <div>
                <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Secret
                </label>
                <textarea
                  id="secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter your password, API key, or sensitive message..."
                  className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  required
                  maxLength={10000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {secret.length} / 10,000 characters
                </p>
              </div>

              {/* Passphrase */}
              <div>
                <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-2">
                  Passphrase (Optional)
                </label>
                <input
                  type="password"
                  id="passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Add extra protection with a passphrase"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recipients will need this passphrase to view the secret
                </p>
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  <span>{showAdvanced ? '▼' : '▶'}</span>
                  Advanced Options
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 pl-6 border-l-2 border-blue-200">
                    {/* TTL */}
                    <div>
                      <label htmlFor="ttl" className="block text-sm font-medium text-gray-700 mb-2">
                        Expires In: <span className="text-blue-600">{getTTLLabel(ttl)}</span>
                      </label>
                      <input
                        type="range"
                        id="ttl"
                        value={ttl}
                        onChange={(e) => setTtl(Number(e.target.value))}
                        min="3600"
                        max="604800"
                        step="3600"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 hour</span>
                        <span>7 days</span>
                      </div>
                    </div>

                    {/* Max Views */}
                    <div>
                      <label htmlFor="maxViews" className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Views: <span className="text-blue-600">{maxViews}</span>
                      </label>
                      <input
                        type="range"
                        id="maxViews"
                        value={maxViews}
                        onChange={(e) => setMaxViews(Number(e.target.value))}
                        min="1"
                        max="10"
                        step="1"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 view</span>
                        <span>10 views</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !secret}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Secret...
                  </span>
                ) : (
                  '🔒 Create Secret Link'
                )}
              </button>
            </form>
          ) : (
            /* Success Message */
            <div className="text-center animate-fade-in">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Secret Created Successfully!
                </h3>
                <p className="text-gray-600">
                  Share this link with your recipient. It will self-destruct after being viewed.
                </p>
              </div>

              {/* Secret Link */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-2">Your secret link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={result.url}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="text-sm text-gray-600 mb-6">
                <p>Expires: {new Date(result.expiresAt!).toLocaleString()}</p>
                {passphrase && <p className="text-orange-600 font-medium">⚠️ Don't forget to share the passphrase separately!</p>}
              </div>

              {/* Create Another */}
              <button
                onClick={() => setResult(null)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create Another Secret →
              </button>
            </div>
          )}

          {/* Error Message */}
          {result?.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{result.error}</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">End-to-End Encrypted</h3>
            <p className="text-sm text-gray-600">
              Your secrets are encrypted with AES-256 before storage
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Auto-Expire</h3>
            <p className="text-sm text-gray-600">
              Secrets automatically delete after viewing or expiration
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Zero Knowledge</h3>
            <p className="text-sm text-gray-600">
              We can't see your secrets. Only you and your recipient can.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2024 OneTimeSecret. Built with security and privacy in mind.</p>
            <p className="mt-2">
              <a href="#" className="hover:text-gray-900 transition">Privacy Policy</a>
              {' · '}
              <a href="#" className="hover:text-gray-900 transition">Terms of Service</a>
              {' · '}
              <a href="#" className="hover:text-gray-900 transition">API Documentation</a>
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
